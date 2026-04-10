import { confirmationService } from "@/lib/services/trading/confirmation-service";
import { usePrivy } from "@privy-io/react-auth";
import { useFundWallet, useWallets, useExportWallet } from "@privy-io/react-auth/solana";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  Check,
  Copy,
  Key,
  Lock,
  QrCode,
  WalletIcon
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PaymentIcon } from "react-svg-credit-card-payment-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useStore } from "@/lib/store";

interface FundingModalProps {
  isOpen: boolean;
  onClose: () => void;
}


const PaymentMethodIcons = () => (
  <div className="flex items-center space-x-1">
    <PaymentIcon type="Visa" format="flatRounded" width={24} />
    <PaymentIcon type="Mastercard" format="flatRounded" width={24} />
    <PaymentIcon type="Amex" format="flatRounded" width={24} />
  </div>
);

export default function FundingModal({ isOpen, onClose }: FundingModalProps) {
  const { user, authenticated } = usePrivy();
  const { fundWallet } = useFundWallet();
  const { wallets } = useWallets();
  const { exportWallet } = useExportWallet();
  const auth = useStore.use.auth() || {};
  const [isLoading, setIsLoading] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const copiedAddressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  
  const [amount, setAmount] = useState("100");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(50);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [provider, setProvider] = useState<"coinbase" | "wallet">("coinbase");
  const [selectedExternalWallet, setSelectedExternalWallet] =
    useState<any>(null);
  const [externalWalletBalances, setExternalWalletBalances] = useState<
    Record<string, { sol: number }>
  >({});

  const walletAddress = auth.user?.walletAddress;

  
  const presetAmounts = useMemo(() => 
    provider === "wallet" ? [0.1, 0.5, 1.0] : [20, 50, 100],
    [provider]
  );

  
  const externalWallets = useMemo(() => 
    wallets.filter((w) => w.standardWallet.name !== "Privy"),
    [wallets]
  );

  
  const showProviderToggle = externalWallets.length > 0;

  const copyWalletAddress = async () => {
    if (walletAddress) {
      try {
        await navigator.clipboard.writeText(walletAddress);
        setCopiedAddress(true);
        if (copiedAddressTimerRef.current) {
          clearTimeout(copiedAddressTimerRef.current);
        }
        copiedAddressTimerRef.current = setTimeout(() => setCopiedAddress(false), 2000);
      } catch (error) {
        console.error("Failed to copy wallet address:", error);
      }
    }
  };

  const handleExportKey = async () => {
    try {
      await exportWallet();
    } catch (error) {
      console.error("Failed to export wallet:", error);
    }
  };

  const handleShowQR = async () => {
    try {
      
      await fundWallet({
        address: walletAddress!,
        options: {
          defaultFundingMethod: "manual",
        },
      });
    } catch (error) {
      console.error("Failed to show QR:", error);
    }
  };

  const handleAmountSelect = (presetAmount: number | "custom") => {
    if (presetAmount === "custom") {
      setShowCustomInput(true);
      setSelectedAmount(null);
    } else {
      setAmount(presetAmount.toString());
      setSelectedAmount(presetAmount);
      setShowCustomInput(false);
    }
  };

  const handleCustomAmount = (value: string) => {
    setAmount(value);
    setSelectedAmount(null);
  };

  const handleFundingSuccess = () => {
    onClose();
    
  };

  const handleFundingError = (error: string) => {
    console.error("Funding error:", error);
    
  };

  
  const solPrice = useStore.use.funding().solPrice;
  const fetchSolPrice = useStore.use.fetchSolPrice();
  

  
  useEffect(() => {
    if (provider !== "wallet") return;
    
    const fetchBalances = async () => {
      if (externalWallets.length === 0) return;

      const connection = new Connection(
        process.env.NEXT_PUBLIC_RPC_URL || "https://api.mainnet-beta.solana.com"
      );
      const newBalances: Record<string, { sol: number }> = {};

      for (const wallet of externalWallets) {
        try {
          const pubkey = new PublicKey(wallet.address);

          
          const solBalance = await connection.getBalance(pubkey);

          newBalances[wallet.address] = {
            sol: solBalance / LAMPORTS_PER_SOL,
          };
        } catch (error) {
          console.error(`Error fetching balance for ${wallet.address}:`, error);
          newBalances[wallet.address] = { sol: 0 };
        }
      }

      setExternalWalletBalances(newBalances);

      
      if (!selectedExternalWallet && externalWallets.length > 0) {
        setSelectedExternalWallet(externalWallets[0]);
      }
    };

    fetchBalances();
  }, [provider, externalWallets, selectedExternalWallet]);

  const handleFundWallet = async () => {
    if (provider === "wallet") {
      return handleWalletTransfer();
    }

    const amountNum = parseFloat(amount);

    if (amountNum < 20) {
      handleFundingError("Minimum amount is $20");
      return;
    }

    if (amountNum > 1000) {
      handleFundingError("Maximum amount is $1000");
      return;
    }

    
    const embeddedWallet = wallets.find((w) => w.standardWallet.name === "Privy");
    if (!embeddedWallet?.address) {
      handleFundingError("No wallet address found");
      return;
    }

    setIsLoading(true);

    try {
      if (!solPrice) {
        throw new Error("SOL price not loaded");
      }

      
      const exactSolAmount = amountNum / solPrice;
      const roundedSolAmount = Math.floor(exactSolAmount * 1000) / 1000; 

      
      await fundWallet({
        address: embeddedWallet.address,
        options: {
          amount: roundedSolAmount.toString(),
          defaultFundingMethod: "card",
          card: {
            preferredProvider: "coinbase",
          },
        },
      });

      handleFundingSuccess();
    } catch (error) {
      handleFundingError(
        error instanceof Error ? error.message : "Funding failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletTransfer = async () => {
    if (!selectedExternalWallet || !amount || !walletAddress) {
      handleFundingError("Please select a wallet and enter an amount");
      return;
    }

    const transferAmount = parseFloat(amount);
    if (transferAmount <= 0) {
      handleFundingError("Please enter a valid amount");
      return;
    }

    const balance = externalWalletBalances[selectedExternalWallet.address];
    if (!balance) {
      handleFundingError("Could not fetch wallet balance");
      return;
    }

    if (transferAmount > balance.sol) {
      handleFundingError(
        `Insufficient balance. Available: ${balance.sol.toFixed(6)} SOL`
      );
      return;
    }

    setIsLoading(true);

    try {
      const connection = new Connection(
        process.env.NEXT_PUBLIC_RPC_URL || "https://api.mainnet-beta.solana.com"
      );
      const fromPubkey = new PublicKey(selectedExternalWallet.address);
      const toPubkey = new PublicKey(walletAddress);

      let transaction = new Transaction();

      const instruction = SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: transferAmount * LAMPORTS_PER_SOL,
      });
      transaction.add(instruction);

      
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubkey;

      
      const signedTx = await selectedExternalWallet.signTransaction(
        transaction
      );
      const txid = await connection.sendRawTransaction(signedTx.serialize());

      
      console.log("[Funding] Starting SOL transfer confirmation monitoring...");
      const confirmationResult = await confirmationService.confirmSOLIncrease(
        {
          transactionHash: txid,
          walletAddress: toPubkey.toString(),
          operation: "funding" as any, 
          expectedAmount: transferAmount,
        },
        {
          onConfirmed: (result) => {
            console.log("[Funding] ✅ Transfer confirmed:", result);
          },
          onFailed: (error) => {
            console.error("[Funding] ❌ Transfer confirmation failed:", error);
          },
        }
      );

      if (!confirmationResult.confirmed) {
        throw new Error(
          "Transfer confirmation failed: " +
            (confirmationResult.error || "Unknown error")
        );
      }

      console.log("[Funding] ✅ SOL transfer confirmed successfully");
      handleFundingSuccess();
    } catch (error) {
      handleFundingError(
        error instanceof Error ? error.message : "Transfer failed"
      );
    } finally {
      setIsLoading(false);
    }
  };


  const getWalletValidation = useCallback(() => {
    if (provider !== "wallet") {
      return {
        isValid: parseFloat(amount) >= 20 && parseFloat(amount) <= 1000,
        reason: "",
      };
    }

    const transferAmount = parseFloat(amount);
    if (transferAmount <= 0) {
      return { isValid: false, reason: "Enter a valid amount" };
    }

    
    const minSolRequired = 0.001; 
    const minUsdRequired = 5; 

    
    if (!solPrice) {
      return { isValid: false, reason: "Loading SOL price..." };
    }

    const minSolForPlaying = minUsdRequired / solPrice;
    const totalMinSol = minSolRequired + minSolForPlaying;

    if (transferAmount < totalMinSol) {
      const minUsdTotal = totalMinSol * solPrice;
      return {
        isValid: false,
        reason: `You need at least $${minUsdTotal.toFixed(2)} to play`,
      };
    }

    if (!selectedExternalWallet) {
      return { isValid: false, reason: "No wallet connected" };
    }

    const balance = externalWalletBalances[selectedExternalWallet.address];
    if (!balance) {
      return { isValid: false, reason: "Loading balance..." };
    }

    if (transferAmount > balance.sol) {
      return {
        isValid: false,
        reason: `Insufficient balance (${balance.sol.toFixed(
          4
        )} SOL available)`,
      };
    }

    return { isValid: true, reason: "" };
  }, [provider, amount, solPrice, selectedExternalWallet, externalWalletBalances]);

  const validation = useMemo(() => getWalletValidation(), [getWalletValidation]);
  const isValidAmount = validation.isValid;


  const getSolAmountForUSD = (usdAmount: number) => {
    if (!solPrice) return null;
    return Math.floor((usdAmount / solPrice) * 1000) / 1000;
  };

  const getExactUSDForSol = (solAmount: number) => {
    if (!solPrice) return null;
    return solAmount * solPrice;
  };

  if (!authenticated) {
    return null;
  }

  return (
    <Modal
      open={isOpen}
      onOpenChange={onClose}
      className="w-full max-w-3xl max-h-[90vh] rounded-4xl p-5 overflow-y-auto bg-slate-950/90 border border-slate-800 shadow-[0_30px_60px_rgba(0,0,0,1)]"
    >
      <div className="">
        {/* Provider Toggle - Only show if user has external wallets */}
        {showProviderToggle && (
          <div className="flex bg-slate-800 mb-4 -mx-5 -mt-5 rounded-3xl rounded-b-none">
            <button
              onClick={() => setProvider("coinbase")}
              className={`flex-1 p-3 pb-1 rounded-3xl rounded-b-none text-md font-medium transition-all ${
                provider === "coinbase"
                  ? "bg-slate-950 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Debit Card
            </button>
            <button
              onClick={() => setProvider("wallet")}
              className={`flex-1 py-2 px-3 rounded-3xl rounded-b-none text-md font-medium transition-all ${
                provider === "wallet"
                  ? "bg-blue-900 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Crypto Wallet
            </button>
          </div>
        )}

        {}
        <div className="relative">
          <div className="flex flex-col items-start justify-between">
            <div className="flex flex-col items-center w-full py-4">
              <div className="text-6xl md:text-7xl pb-2 font-number tracking-[-0.011em] text-blue-100">
                FUND WALLET
              </div>

              <div className="flex items-center gap-2 mb-4">
                <code className="text-sm text-green-400 bg-gray-800 px-2 py-1 rounded">
                  {walletAddress
                    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(
                        -4
                      )}`
                    : "Loading..."}
                </code>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyWalletAddress}
                    className="h-6 w-6 p-0 hover:bg-gray-700"
                    title="Copy Wallet Address"
                  >
                    {copiedAddress ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExportKey}
                    className="h-6 w-6 p-0 hover:bg-gray-700"
                    title="Export Private Key"
                  >
                    <Key className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShowQR}
                    className="h-6 w-6 p-0 hover:bg-gray-700"
                    title="Show QR Code"
                  >
                    <QrCode className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="space-y-4">
          {}
          <div className="space-y-3">
            {}
            <div className="grid gap-4 grid-cols-3 sm:grid-cols-4">
              {presetAmounts.map((presetAmount, index) => {
                
                const hiddenOnMobile = index === 2;
                const solAmount =
                  provider === "wallet"
                    ? null
                    : getSolAmountForUSD(presetAmount);
                const exactUSD =
                  provider === "wallet"
                    ? getExactUSDForSol(presetAmount)
                    : null;

                return (
                  <button
                    key={presetAmount}
                    onClick={() => handleAmountSelect(presetAmount)}
                    className={`flex-1 aspect-square rounded-full border transition-all flex flex-col items-center justify-center ${
                      selectedAmount === presetAmount && !showCustomInput
                        ? "border-blue-500 bg-blue-500/20 text-blue-400"
                        : "border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500"
                    } ${
                      hiddenOnMobile ? "hidden sm:flex" : ""
                    }`}
                  >
                    <span className="text-4xl font-bold">
                      {provider === "wallet"
                        ? `${presetAmount} SOL`
                        : `$${presetAmount}`}
                    </span>
                    {provider === "wallet" && exactUSD && (
                      <span className="text-sm text-slate-400 mt-1">
                        ${exactUSD.toFixed(2)}
                      </span>
                    )}
                    {provider === "coinbase" && solAmount && (
                      <span className="text-sm text-slate-400 mt-1">
                        {solAmount} SOL
                      </span>
                    )}
                  </button>
                );
              })}

              {}
              {showCustomInput ? (
                <div className="flex-1 aspect-square rounded-full border border-blue-500 bg-blue-500/20 transition-all flex flex-col items-center justify-center">
                  <div className="flex items-center justify-center">
                    {provider === "wallet" ? (
                      <>
                        <Input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={amount}
                          onChange={(e) => handleCustomAmount(e.target.value)}
                          placeholder="0.0"
                          autoFocus
                          className="bg-transparent border-0 text-center text-2xl font-bold leading-none text-blue-400 p-0 h-auto focus:ring-0 focus:outline-none placeholder:text-blue-400/60 w-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-4xl font-bold text-blue-400 ml-1">
                          SOL
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-blue-400 mr-1">
                          $
                        </span>
                        <Input
                          type="number"
                          step="1"
                          min="20"
                          max="1000"
                          value={amount}
                          onChange={(e) => handleCustomAmount(e.target.value)}
                          placeholder="0"
                          autoFocus
                          className="bg-transparent border-0 text-center text-4xl font-bold leading-none text-blue-400 p-0 h-auto focus:ring-0 focus:outline-none placeholder:text-blue-400/60 w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </>
                    )}
                  </div>
                  {}
                  {provider === "wallet" && solPrice && amount && (
                    <span className="text-sm text-slate-400 mt-1">
                      ${(parseFloat(amount) * solPrice).toFixed(2)}
                    </span>
                  )}
                  {provider === "coinbase" && solPrice && amount && (
                    <span className="text-sm text-slate-400 mt-1">
                      {(parseFloat(amount) / solPrice).toFixed(3)} SOL
                    </span>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleAmountSelect("custom")}
                  className="flex-1 aspect-square rounded-full border border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500 transition-all flex flex-col items-center justify-center"
                >
                  <span className="text-4xl font-bold">$</span>
                  <span className="text-sm text-slate-400 mt-1">
                    Enter amount
                  </span>
                </button>
              )}
            </div>
          </div>

          {}
          <div className="text-center pt-4">
            <Button
              onClick={handleFundWallet}
              disabled={!isValidAmount || isLoading}
              className="
                h-auto px-14 py-3 mx-auto mb-4 rounded-full 
                relative overflow-hidden border-t-4 ease-in-out
                transition-all
                bg-gradient-to-b from-blue-500 to-blue-700 
                hover:from-blue-400 border-blue-600 
                shadow-[0_10px_20px_rgba(0,0,0,0.5)] 
                hover:shadow-[0_20px_40px_rgba(0,0,0,0.9)] 
                active:from-blue-700 active:to-blue-900 
                text-white text-2xl font-semibold 
                disabled:bg-slate-600 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100 disabled:border-slate-500
              "
              title={!isValidAmount ? validation.reason : ""}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : !isValidAmount && validation.reason ? (
                <span className="text-sm">{validation.reason}</span>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-1">
                  {provider === "wallet" ? (
                    <>
                      <WalletIcon className="w-7 h-7" />
                      <span>Send Transfer</span>
                    </>
                  ) : (
                    <>
                      <div className="font-bold text-shadow-xs">
                        Fund with Debit Card
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-6">
                          <PaymentIcon
                            className="bg-blue-800 rounded-sm p-0.5 !w-full !h-auto"
                            type="Visa"
                            format="flatRounded"
                          />
                        </div>
                        <div className="w-6">
                          <PaymentIcon
                            className="bg-blue-800 rounded-sm p-0.5 !w-full !h-auto"
                            type="Mastercard"
                            format="flatRounded"
                          />
                        </div>
                        <div className="w-6">
                          <PaymentIcon
                            className="bg-blue-800 rounded-sm p-0.5 !w-full !h-auto"
                            type="Amex"
                            format="flatRounded"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </Button>

            {}
            <div className="text-base text-slate-500 text-center">
              {provider === "wallet" ? (
                <div className="flex flex-col items-center space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <WalletIcon className="w-3 h-3" />
                    <span>Transfer SOL from your connected wallet</span>
                  </div>
                  {selectedExternalWallet && (
                    <div className="text-sm text-slate-400">
                      Available:{" "}
                      <span className="text-purple-400 font-medium">
                        {externalWalletBalances[
                          selectedExternalWallet.address
                        ]?.sol?.toFixed(4) || "0.0000"}{" "}
                        SOL
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Lock className="w-3 h-3" />
                  <span>Powered by</span>
                  <Image
                    src="/coinbase-icon.webp"
                    alt="Coinbase"
                    width={16}
                    height={16}
                  />
                  <span>Coinbase</span>
                </div>
              )}
            </div>
          </div>

          {}
          <div className="mt-6 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              <a
                href="https://memedeck.win/learn/what-is-solana"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-slate-800/80 rounded-lg border border-slate-700/50 hover:bg-slate-800 transition-all text-center"
              >
                <span className="text-lg">🌐</span>
                <span className="text-xs sm:text-sm text-slate-300">
                  What is Solana?
                </span>
              </a>
              <a
                href="https://memedeck.win/learn/fees"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-slate-800/80 rounded-lg border border-slate-700/50 hover:bg-slate-800 transition-all text-center"
              >
                <span className="text-lg">💰</span>
                <span className="text-xs sm:text-sm text-slate-300">
                  How Fees Work
                </span>
              </a>
              <a
                href="https://memedeck.win/learn/security"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-slate-800/80 rounded-lg border border-slate-700/50 hover:bg-slate-800 transition-all text-center"
              >
                <span className="text-lg">🔒</span>
                <span className="text-xs sm:text-sm text-slate-300">
                  Wallet Security 101
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
