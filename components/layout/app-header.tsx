"use client";

import { RENT_PER_TOKEN_ACCOUNT_SOL } from "@/lib/constants/solana";
import { tokenClosureService } from "@/lib/jupiter/accounts/token-accounts";
import { isCachedPriceFresh } from '@/lib/services/pyth-price-service';
import { usePrivy } from "@privy-io/react-auth";
import { useSignAndSendTransaction, useWallets, useExportWallet } from "@privy-io/react-auth/solana";
import { motion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";


import AudioControls from '@/components/audio/audio-controls';
import { PartnerDashboardTrigger } from "@/components/partner/partner-dashboard-trigger";
import { HotTokensSidebar } from "@/components/sidebar";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useActivityStore, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { globalToast } from "@/lib/utils/global-toast";
import { NumberFlowGroup } from "@number-flow/react";
import {
  Clock,
  Coins,
  Copy,
  ExternalLink,
  Flame,
  HelpCircle,
  Menu,
  MoreHorizontal,
  PlusCircle,
  Wallet
} from "lucide-react";

interface AppHeaderProps {
  pepeRef?: React.RefObject<{ slideIn: () => void }>;
  className?: string;
}

export default function AppHeader({ pepeRef, className }: AppHeaderProps) {
  const { authenticated, user, login, logout } = usePrivy();
  const { ready, wallets } = useWallets();
  const { exportWallet } = useExportWallet();
  const { signAndSendTransaction: sendTransaction } = useSignAndSendTransaction();

  const isDemoMode = useStore.use.isDemoMode() || false;
  const isLoading = useStore.use.isLoading() || false;
  const realizedPnl = useStore.use.realizedPnl() || 0;
  const positionsFromStore = useStore.use.positions();
  const positions = useMemo(() => positionsFromStore || {}, [positionsFromStore]);
  const walletBalance = useStore.use.walletBalance() || 0;
  const auth = useStore.use.auth() || {};
  const openFundingModal = useStore.use.openFundingModal();
  const getAccessToken = useStore.use.getAccessToken();
  const openTransactionModal = useStore.use.openTransactionModal();
  const hand = useStore.use.hand() || [];
  const solBalance = auth?.user?.solBalance || 0;


  const solPrice = useStore.use.funding()?.solPrice ?? null;
  const priceFresh = isCachedPriceFresh();


  const [reclaimableSOL, setReclaimableSOL] = useState<number>(0);
  const [isRefreshingReclaimable, setIsRefreshingReclaimable] = useState(false);


  const setWalletAddress = useStore.use.setWalletAddress();

  
  const activity = useActivityStore.use.activity();
  const sidebarOpen = activity?.sidebarOpen || false;
  const setSidebarOpen = useActivityStore.use.setSidebarOpen();
  const sidebarCloseRef = useRef<(() => void) | null>(null);
  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, [setSidebarOpen, sidebarOpen]);

  const positionsValue = useMemo(() => {
    
    return Object.values(positions || {}).reduce((total, position) => {
      return total + (position.value || 0);
    }, 0);
  }, [positions]);

  const unrealizedPnl = useMemo(() => {
    return Object.values(positions || {}).reduce((total, position) => {
      return total + (position.unrealizedPnl || 0);
    }, 0);
  }, [positions]);

  const totalPnl = realizedPnl + unrealizedPnl;

  const isInDemoMode = !authenticated && isDemoMode;

  
  const embeddedWallet = wallets.find(
    (wallet) => wallet.standardWallet.name === "Privy"
  );
  const embeddedWalletAddress = embeddedWallet?.address;
  const isTokenClosureInProgress = (embeddedWalletAddress
    ? tokenClosureService.isClosureActive(embeddedWalletAddress)
    : false) || isRefreshingReclaimable;
  const visibleReclaimableSOL = isRefreshingReclaimable ? 0 : (reclaimableSOL || 0);

  
  const updateWalletAddressRef = useRef(setWalletAddress);
  updateWalletAddressRef.current = setWalletAddress;

  useEffect(() => {
    if (authenticated && ready && embeddedWalletAddress) {
      updateWalletAddressRef.current(embeddedWalletAddress);
    }
  }, [authenticated, ready, embeddedWalletAddress]);




  // Keep reclaimable SOL in sync when wallet context or SOL balance changes
  useEffect(() => {
    let cancelled = false;

    const fetchReclaimable = async () => {
      if (!authenticated || !ready || !embeddedWalletAddress) {
        if (!cancelled) {
          setReclaimableSOL(0);
          setIsRefreshingReclaimable(false);
        }
        return;
      }

      if (!cancelled) {
        setIsRefreshingReclaimable(true);
      }

      try {
        const amount = await tokenClosureService.getReclaimableSOL(embeddedWalletAddress);
        if (!cancelled) {
          setReclaimableSOL(amount || 0);
        }
      } catch (error) {
        if (!cancelled) {
          setReclaimableSOL(0);
        }
      } finally {
        if (!cancelled) {
          setIsRefreshingReclaimable(false);
        }
      }
    };

    fetchReclaimable();

    return () => {
      cancelled = true;
    };
  }, [authenticated, ready, embeddedWalletAddress, solBalance, hand.length]);

  

  


  
  const shouldShowRefreshIndicator = authenticated && !isLoading;

  
  const truncateWalletAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const copyWalletAddress = async () => {
    if (embeddedWalletAddress) {
      try {
        await navigator.clipboard.writeText(embeddedWalletAddress);
        globalToast.success("Address Copied", "Wallet address copied to clipboard");
      } catch (error) {
        console.error("Failed to copy wallet address:", error);
        globalToast.error("Copy Failed", "Unable to copy wallet address");
      }
    }
  };

  
  const reclaimTokenAccountSOL = async () => {
    if (!authenticated || !embeddedWallet || !embeddedWalletAddress) {
      globalToast.error("Reclaim Error", "Must be authenticated with embedded wallet");
      return;
    }

    try {
      
      if (tokenClosureService.isClosureActive(embeddedWalletAddress)) {
        globalToast.info("Already Processing", "Token account closure already in progress...");
        console.log("[TokenReclaim] Closure already active for wallet:", embeddedWalletAddress);
        return;
      }

      globalToast.success("Reclaiming SOL", "Closing empty token accounts...");
      console.log("[TokenReclaim] 🚀 MANUAL RECLAIM: Starting token account closure for wallet:", embeddedWalletAddress);
      console.log("[TokenReclaim] 🔍 This should trigger polling for closeable accounts first, then closure confirmation");

      
      const getAccessTokenWrapper = async () => {
        const token = getAccessToken();
        if (!token) throw new Error('Access token not available');
        return token;
      };

      
      const sendTransactionWrapper = async (params: { transaction: any, connection: any }) => {
        const txBytes = params.transaction.serialize();
        const receipt = await sendTransaction({
          transaction: txBytes,
          wallet: embeddedWallet!,
          chain: 'solana:mainnet'
        });
        return { signature: Buffer.from(receipt.signature).toString('base64') };
      };

      const result = await tokenClosureService.closeEmptyTokenAccounts(
        embeddedWalletAddress,
        embeddedWallet,
        getAccessTokenWrapper,
        sendTransactionWrapper
      );

      console.log("[TokenReclaim] 🏁 MANUAL RECLAIM COMPLETED with result:", {
        success: result.success,
        closedAccounts: result.closedAccounts,
        signature: result.signature?.slice(-8)
      });

      if (result.success) {
        const closedAccounts = result.closedAccounts || 0;
        const reclaimedAmount = closedAccounts * RENT_PER_TOKEN_ACCOUNT_SOL;
        globalToast.success(
          "SOL Reclaimed", 
          `Closed ${closedAccounts} accounts and reclaimed ${reclaimedAmount.toFixed(3)} SOL`
        );
        console.log("[TokenReclaim] ✅ Token closure successful, accounts closed:", result.closedAccounts);
        setIsRefreshingReclaimable(true);
        setReclaimableSOL(0);

        try {
          const newAmount = await tokenClosureService.getReclaimableSOL(embeddedWalletAddress);
          setReclaimableSOL(newAmount || 0);
        } catch (error) {
          console.error('[TokenReclaim] Failed to refresh reclaimable SOL:', error);
        } finally {
          setIsRefreshingReclaimable(false);
        }
      } else {
        globalToast.error("Reclaim Failed", result.error || "Unknown error");
        console.error("[TokenReclaim] Token closure failed:", result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      globalToast.error("Reclaim Error", errorMessage);
      console.error("[TokenReclaim] Token closure error:", error);
    }
  };



  
  const getDisplayBalance = () => {
    
    if (isInDemoMode) {
      return walletBalance;
    }
    
    // Include recoverable rent from: active token accounts (cards in hand) + empty token accounts
  const activeRentSOL = (hand?.length || 0) * RENT_PER_TOKEN_ACCOUNT_SOL;
  const totalSolWithRent = Math.max(0, solBalance + activeRentSOL + visibleReclaimableSOL);

    if (solPrice && solPrice > 0 && totalSolWithRent > 0) {
      return totalSolWithRent * solPrice;
    }
    return 0;
  };

  const displayBalance = getDisplayBalance();
  const tradingCurrency = isInDemoMode ? 'USDC' : 'SOL';

  return (
    <div
      className={cn(
        "w-full text-right relative flex items-center justify-between px-2 py-2 sm:px-4 sm:py-3 lg:px-6 lg:py-4 bg-black/20 backdrop-brightness-[2.2] backdrop-blur-sm h-16 sm:h-20",
        className
      )}
    >
      {}
      <div className="flex relative items-center lg:mr-24">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/card-face-IfUoFstUaf97oc3Aqyg3c6JmQUSWlA.webp"
          alt="MemeDeck Logo"
          width={48}
          height={48}
          className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 object-contain"
        />
        <h1 className="hidden md:block text-2xl lg:text-3xl xl:text-4xl font-bold text-white tracking-normal text-retro-shadow">
          MEMEDECK
        </h1>

        {}
        {isInDemoMode && (
          <div className="absolute inline-block top-0 ml-2 sm:top-1/2 sm:-translate-y-1/2 sm:left-full bg-purple-500 text-white text-[8px] sm:text-xs px-1 sm:rounded-md">
            DEMO
          </div>
        )}
      </div>

      <NumberFlowGroup>
        {}
        <motion.div className="flex min-w-0 flex-1 gap-1 sm:gap-6 lg:gap-10 sm:mr-24 ml-1 sm:ml-8">
          {}
          <motion.div className="flex items-center gap-1 min-w-0">
            <Image
              src={isInDemoMode ? "/usdc.svg" : "/sol.svg"}
              alt={tradingCurrency}
              width={14}
              height={14}
              className="w-4 h-4"
            />
            {!isLoading && typeof displayBalance === "number" ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.span 
                    className="text-base sm:text-lg lg:text-xl font-bold text-green-400 cursor-help"
                  >
                    <AnimatedNumber
                      value={displayBalance}
                      useNumberFlow={true}
                      numberFlowProps={{ isolate: true }}
                    />
                  </motion.span>
                </TooltipTrigger>
                {!isInDemoMode && (
                  <TooltipContent side="top">
                    <div className="text-center">
                      <div className="text-sm font-medium">
                        {(solBalance + (hand.length * RENT_PER_TOKEN_ACCOUNT_SOL) + visibleReclaimableSOL).toFixed(4)} SOL
                      </div>
                      <div className="text-[10px] text-gray-400">
                        incl. rent: +{(hand.length * RENT_PER_TOKEN_ACCOUNT_SOL + visibleReclaimableSOL).toFixed(4)} SOL
                      </div>
                      {solPrice && (
                        <div className="text-xs text-gray-300 flex items-center gap-2">
                          <span>@ ${solPrice.toFixed(2)}</span>
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${priceFresh ? 'bg-green-500' : 'bg-yellow-500'}`} />
                            <span className="text-[10px]">
                              {priceFresh ? 'LIVE' : 'API'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            ) : (
              <Skeleton className="h-6 lg:h-7 w-20 lg:w-24 bg-green-400/20" />
            )}
          </motion.div>

          {}
          {positionsValue > 0 && (
            <motion.div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <span className="text-blue-300 text-sm sm:hidden">💰</span>
            <span className="text-gray-400 text-sm font-medium hidden sm:block">
              Portfolio:
            </span>
            {!isLoading && typeof positionsValue === "number" ? (
              <motion.span
                className={`text-base sm:text-2xl font-bold ${
                  positionsValue >= 1000 ? "text-green-400" : "text-white"
                }`}
              >
                <AnimatedNumber
                  value={positionsValue}
                  useNumberFlow={true}
                  numberFlowProps={{ isolate: true }}
                />
              </motion.span>
            ) : (
              <Skeleton className="h-5 sm:h-6 lg:h-7 w-16 sm:w-20 lg:w-24 bg-green-400/20" />
            )}
            </motion.div>
          )}

          {}
          <motion.div className="hidden sm:flex items-center gap-1">
            <span className="text-gray-400 text-sm font-medium hidden sm:block">
              PnL:
            </span>
            {!isLoading && typeof totalPnl === "number" ? (
              <motion.span
                className={`relative text-xl font-bold ${
                  totalPnl >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {totalPnl < 0 && (
                  <span className="mx-1 sm:hidden text-sm">
                    ‼️
                  </span>
                )}
                {totalPnl >= 0 && (
                  <span className="mx-1 sm:hidden text-sm">
                    🏆
                  </span>
                )}
                <AnimatedNumber
                  value={Math.abs(totalPnl)}
                  useNumberFlow={true}
                  numberFlowProps={{ isolate: true }}
                />
              </motion.span>
            ) : (
              <Skeleton className="h-5 w-16 bg-gray-400/20" />
            )}
          </motion.div>
        </motion.div>
      </NumberFlowGroup>

      <motion.div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Mobile: dropdown for Help & $MEMEDECK */}
        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "flex items-center gap-1 rounded-full border border-gray-500/50 bg-gray-500/15",
                  "text-gray-200 hover:bg-gray-500/25 hover:text-white transition-colors px-2 py-2",
                )}
              >
                <Menu className="h-4 w-4" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-gray-800 border-gray-700">
              <DropdownMenuItem asChild>
                <a
                  href="https://x.com/Claude_Memory/status/2025743847330902361?s=20"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 focus:bg-blue-700/20 py-3"
                >
                  <HelpCircle className="w-5 h-5 mr-3" />
                  <span className="text-base">Help</span>
                  <ExternalLink className="w-3 h-3 ml-auto text-gray-500" />
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href="https://bags.fm/2YiVBhymiHnPszmA9H1YPuSCpk88cV9F7m5cLjzJBAGS?ref=claudememory"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-300 focus:bg-green-700/20 py-3"
                >
                  <Coins className="w-5 h-5 mr-3" />
                  <span className="text-base">$MEMEDECK</span>
                  <ExternalLink className="w-3 h-3 ml-auto text-gray-500" />
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop: inline buttons for Help & $MEMEDECK */}
        <div className="hidden sm:flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href="https://x.com/Claude_Memory/status/2025743847330902361?s=20"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex items-center rounded-full border border-blue-500/50 bg-blue-500/15",
                    "text-blue-200 hover:bg-blue-500/25 hover:text-white transition-colors px-2.5 py-2",
                    "shadow-lg shadow-blue-500/20",
                  )}
                >
                  <HelpCircle className="h-4 w-4" aria-hidden />
                </Button>
              </a>
            </TooltipTrigger>
            <TooltipContent side="bottom">How to play</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href="https://bags.fm/2YiVBhymiHnPszmA9H1YPuSCpk88cV9F7m5cLjzJBAGS?ref=claudememory"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex items-center gap-1 rounded-full border border-green-500/50 bg-green-500/15",
                    "text-green-200 hover:bg-green-500/25 hover:text-white transition-colors px-3 py-2",
                    "shadow-lg shadow-green-500/20",
                  )}
                >
                  <span className="text-sm font-semibold">$</span>
                </Button>
              </a>
            </TooltipTrigger>
            <TooltipContent side="bottom">Buy $MEMEDECK</TooltipContent>
          </Tooltip>
        </div>

        {/* Hot Tokens button - always visible */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={sidebarOpen ? "secondary" : "outline"}
              size="sm"
              onClick={handleSidebarToggle}
              className={cn(
                "flex items-center gap-1 rounded-full border border-orange-500/50 bg-orange-500/15",
                "text-orange-200 hover:bg-orange-500/25 hover:text-white transition-colors px-3 py-2",
                "shadow-lg shadow-orange-500/20",
              )}
              aria-pressed={sidebarOpen}
            >
              <Flame className="h-4 w-4" aria-hidden />
              <span className="text-sm font-semibold hidden sm:inline">Hot</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Toggle hot tokens</TooltipContent>
        </Tooltip>

        <AudioControls />


        {}
        {authenticated && (
          <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-700 rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-600"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 bg-gray-800 border-gray-700 text-base"
            >


              {authenticated && (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      console.log('[AppHeader] Transaction History clicked!')
                      openTransactionModal()
                    }}
                    className="text-gray-300 focus:bg-gray-700 py-3"
                  >
                    <Clock className="w-5 h-5 mr-3" />
                    <span className="text-base">Transaction History</span>
                  </DropdownMenuItem>

                  <PartnerDashboardTrigger />

                  <DropdownMenuItem
                    onClick={openFundingModal}
                    className="text-gray-300 focus:bg-gray-700 py-3"
                  >
                    <PlusCircle className="w-5 h-5 mr-3" />
                    <span className="text-base">Fund Wallet</span>
                  </DropdownMenuItem>
                </>
              )}

              {}
              {authenticated &&
                embeddedWalletAddress &&
                visibleReclaimableSOL > 0 && (
                <DropdownMenuItem
                  onClick={reclaimTokenAccountSOL}
                  className="text-green-300 focus:bg-green-700/20 py-3"
                  disabled={isTokenClosureInProgress}
                >
                  <Coins className="w-5 h-5 mr-3" />
                  <span className="text-base">
                    Reclaim {visibleReclaimableSOL.toFixed(3)} SOL
                  </span>
                </DropdownMenuItem>
              )}


              {authenticated && embeddedWalletAddress && (
                <>
                  <DropdownMenuSeparator className="bg-gray-600" />
                  <DropdownMenuLabel className="text-gray-300 text-base font-semibold">
                    Wallet
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={copyWalletAddress}
                    className="text-gray-300 focus:bg-gray-700 py-3"
                  >
                    <Copy className="w-5 h-5 mr-3" />
                    <span className="text-base">Copy Address</span>
                    <span className="ml-auto text-gray-400 font-mono text-sm">
                      {truncateWalletAddress(embeddedWalletAddress || "")}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => exportWallet({ address: embeddedWalletAddress || '' })}
                    className="text-gray-300 focus:bg-gray-700 py-3"
                  >
                    <span className="w-5 h-5 mr-3 text-center text-lg">🔑</span>
                    <span className="text-base">Export Wallet</span>
                  </DropdownMenuItem>
                </>
              )}

              {authenticated && user && (
                <>
                  <DropdownMenuSeparator className="bg-gray-600" />
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                    }}
                    variant="destructive"
                    className="focus:bg-red-900/20 py-3"
                  >
                    <span className="text-base">Logout</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        )}

        {}
        {!authenticated && (
          <button
            data-testid="signup-area"
            onClick={login}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors"
          >
            Login
          </button>
        )}

        {}
        <div className="hidden items-center gap-2">
          {}
          <motion.button
            className="w-10 h-10 bg-purple-500 rounded-lg shadow-lg flex items-center justify-center hover:bg-purple-600 relative"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => openTransactionModal()}
            title="Transaction History"
          >
            <Clock className="w-5 h-5 text-white" />
          </motion.button>

          {}
          {authenticated && embeddedWalletAddress && (
            <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-700">
              {}
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300 font-mono">
                  {truncateWalletAddress(embeddedWalletAddress || "")}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyWalletAddress}
                  className="h-6 w-6 p-0 hover:bg-gray-700"
                >
                  <Copy className="w-3 h-3 text-gray-400" />
                </Button>
              </div>

              {}
              <div className="flex items-center gap-1 border-l border-gray-600 pl-2 ml-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => exportWallet({ address: embeddedWalletAddress || '' })}
                  className="h-6 px-2 text-md text-blue-400 hover:bg-blue-400/10"
                >
                  🔑
                </Button>
              </div>
            </div>
          )}

          {}
          {authenticated && user ? (
            <button
              onClick={() => {
                logout();
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xl font-medium transition-colors"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={login}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-xl font-medium transition-colors"
            >
              Login
            </button>
          )}
        </div>

        {}
        <HotTokensSidebar
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
          onClose={sidebarCloseRef}
        />
      </motion.div>


    </div>
  );
}
