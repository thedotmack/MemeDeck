"use client";

import { MiniTokenCard } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import NumberFlowInput from "@/components/ui/number-flow-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFooterAmount } from "@/hooks/use-footer-amount";
import { useTransactionCoordinator } from "@/hooks/use-transaction-coordinator";
import type { ActivityToken } from "@/lib/jupiter/realtime/activity-websocket";
import { useActivityStore, useStore } from "@/lib/store";
import type { HotToken } from "@/lib/store/slices/activity-slice";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import {
    AlertCircle,
    Loader2,
    RefreshCw,
    TrendingUp,
    Wifi,
    WifiOff,
    X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { playSound } from "@/hooks/transactions/actions/audio";
import { PerformanceMonitor } from "./PerformanceMonitor";

interface HotTokensSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: React.MutableRefObject<(() => void) | null>;
}

type PreparedToken = {
  activity: ActivityToken;
  card: HotToken;
};

const DRAWER_WIDTH_CLASSES = "w-full sm:w-[320px] md:w-[360px] xl:w-[380px]";
const TOGGLE_BUTTON_SIZE_CLASSES = "h-14 w-14 min-h-[56px] min-w-[56px]";
const EMPTY_BLOCKED_TOKENS: string[] = [];

const formatAmount = (amount: number) => {
  if (!Number.isFinite(amount) || amount <= 0) {
    return "$0";
  }
  return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

const buildCardToken = (token: ActivityToken, lastUpdated: number): HotToken => ({
  id: token.tokenId,
  symbol: token.symbol ?? token.tokenId,
  name: token.name ?? token.symbol ?? token.tokenId,
  icon: token.icon,
  usdPrice: token.price ?? 0,
  oneMinGain: token.oneMinGain ?? null,
  twoMinGain: token.twoMinGain ?? null,
  threeMinGain: token.threeMinGain ?? null,
  fourMinGain: token.fourMinGain ?? null,
  fiveMinGain: token.fiveMinGain ?? null,
  buyPressure5m: token.buyPressure5m,
  volume24h: token.volume24h,
  liquidity: token.liquidity,
  mcap: undefined,
  lastUpdated,
});

const createPlaceholderHotToken = (index: number): HotToken => ({
  id: `placeholder-${index}`,
  symbol: "----",
  name: "Loading",
  icon: undefined,
  usdPrice: 0,
  oneMinGain: null,
  twoMinGain: null,
  threeMinGain: null,
  fourMinGain: null,
  fiveMinGain: null,
  buyPressure5m: undefined,
  volume24h: undefined,
  liquidity: undefined,
  mcap: undefined,
  lastUpdated: Date.now(),
});

/* ─── Extracted sub-components ─── */

function TokenListLoadingState() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={`token-loading-${index}`} className="space-y-3">
          <MiniTokenCard token={createPlaceholderHotToken(index)} isLoading />
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full border border-gray-800 bg-gray-900/60" />
            <div className="h-9 flex-1 rounded-full bg-gray-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface TokenListErrorStateProps {
  errorMessage: string;
  onRetry: () => void;
}

function TokenListErrorState({ errorMessage, onRetry }: TokenListErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
      <AlertCircle className="h-10 w-10 text-red-400" />
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white">Failed to load hot tokens</h3>
        <p className="text-xs text-gray-400">{errorMessage}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="border-gray-700 text-white hover:bg-gray-800"
        >
          Try again
        </Button>
      </div>
    </div>
  );
}

interface TokenListEmptyStateProps {
  onRefresh: () => void;
}

function TokenListEmptyState({ onRefresh }: TokenListEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
      <TrendingUp className="h-10 w-10 text-gray-500" />
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white">No hot tokens available</h3>
        <p className="text-xs text-gray-400">Blocked or owned tokens are hidden automatically.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="border-gray-700 text-white hover:bg-gray-800"
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}

interface TokenListContentProps {
  activity: { isLoading: boolean; tokens: ActivityToken[]; error: string | null; isConnected: boolean; lastUpdated: number };
  availableTokens: PreparedToken[];
  drawAmount: number;
  selectedCardCount: number;
  blockedSet: Set<string>;
  isTokenBlocked: (tokenId: string) => boolean;
  purchasedTokenIds: Set<string>;
  buyingTokenId: string | null;
  isDrawerBusy: boolean;
  onBuy: (token: ActivityToken) => void;
  onBlockToggle: (tokenId: string) => void;
  onRetry: () => void;
  onRefresh: () => void;
}

function TokenListContent({
  activity,
  availableTokens,
  drawAmount,
  selectedCardCount,
  blockedSet,
  isTokenBlocked,
  purchasedTokenIds,
  buyingTokenId,
  isDrawerBusy,
  onBuy,
  onBlockToggle,
  onRetry,
  onRefresh,
}: TokenListContentProps) {
  if (activity.isLoading && activity.tokens.length === 0) {
    return <TokenListLoadingState />;
  }

  if (activity.error) {
    return <TokenListErrorState errorMessage={activity.error} onRetry={onRetry} />;
  }

  if (availableTokens.length === 0) {
    return <TokenListEmptyState onRefresh={onRefresh} />;
  }

  const normalizedAmount = Number.isFinite(drawAmount) ? drawAmount : 0;
  const isAmountInvalid = normalizedAmount <= 0;
  const isCardSelectionInvalid = !Number.isFinite(selectedCardCount) || selectedCardCount <= 0;
  const buttonLabel = isAmountInvalid || isCardSelectionInvalid
    ? "Set amount"
    : `Buy ${formatAmount(normalizedAmount)}`;

  return (
    <div className="grid grid-cols-2 gap-4">
      <AnimatePresence>
      {availableTokens.map(({ activity: token, card }) => {
        const isBlocked = blockedSet.has(token.tokenId) || isTokenBlocked(token.tokenId);
        const isPurchased = purchasedTokenIds.has(token.tokenId);
        const isProcessing = buyingTokenId === token.tokenId;

        return (
          <motion.div
            key={token.tokenId}
            layout
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="rounded-2xl border border-gray-800 bg-gray-900/60 p-3 shadow-lg shadow-black/20 backdrop-blur-sm"
          >
            <div className="relative">
              <MiniTokenCard token={card} data-testid={`mini-token-${token.tokenId}`} />
              {(isBlocked || isPurchased) && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60">
                  <span className="text-xs font-semibold uppercase tracking-wide text-white">
                    {isBlocked ? "Blocked" : "Queued"}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => onBlockToggle(token.tokenId)}
                aria-label={`${isBlocked ? "Unblock" : "Block"} ${token.symbol}`}
                className={cn(
                  "h-9 w-9 rounded-full border border-gray-700 bg-black/40 text-lg text-white",
                  "hover:border-gray-500 hover:text-white",
                )}
              >
                {isBlocked ? "✅" : "🚫"}
              </Button>

              <Button
                size="sm"
                disabled={
                  isBlocked ||
                  isProcessing ||
                  isPurchased ||
                  isDrawerBusy ||
                  isAmountInvalid ||
                  isCardSelectionInvalid
                }
                onClick={() => onBuy(token)}
                className={cn(
                  "flex-1 rounded-full px-4 text-sm font-semibold",
                  "bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500 text-black shadow-lg",
                  "hover:from-orange-400 hover:to-amber-400 disabled:cursor-not-allowed",
                )}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isPurchased ? (
                  <span className="text-sm">Queued</span>
                ) : (
                  <span>{buttonLabel}</span>
                )}
              </Button>
            </div>
          </motion.div>
        );
      })}
      </AnimatePresence>

      {activity.isLoading && activity.tokens.length > 0 && (
        <div className="col-span-2 flex items-center justify-center gap-2 text-xs text-gray-400">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Updating prices…
        </div>
      )}
    </div>
  );
}

export default function HotTokensSidebar({ open, onOpenChange, onClose }: HotTokensSidebarProps) {
  const activity = useActivityStore.use.activity();
  const toggleBlockedToken = useActivityStore.use.toggleBlockedToken();
  const blockedTokens = useActivityStore.use.blockedTokens() ?? EMPTY_BLOCKED_TOKENS;
  const isTokenBlocked = useActivityStore.use.isTokenBlocked();
  const fetchHotTokens = useActivityStore.use.fetchHotTokens();
  const clearActivityError = useActivityStore.use.clearActivityError();

  const drawAmount = useFooterAmount();
  const selectedCardCount = useStore((state) => state.ui?.selectedCardCount ?? 1);
  const setSelectedDrawAmount = useStore.use.setSelectedDrawAmount?.() ?? (() => {});
  const hand = useStore((state) => state.hand ?? []);
  const positions = useStore((state) => state.positions ?? {});
  const isDemoMode = useStore((state) => state.isDemoMode ?? false);
  const demoFromStore = useStore.use.demo();
  const openDemoPosition = demoFromStore?.openPosition;

  const { executeTransaction, isBuying, phase } = useTransactionCoordinator();

  const [buyingTokenId, setBuyingTokenId] = useState<string | null>(null);
  const [purchasedTokenIds, setPurchasedTokenIds] = useState<Set<string>>(new Set());
  const [hiddenTokenIds, setHiddenTokenIds] = useState<Set<string>>(new Set());

  const ownsTokenIds = useMemo(() => {
    const ids = new Set<string>();
    hand.forEach((card: any) => {
      if (card?.id) ids.add(card.id);
      if (card?.tokenId) ids.add(card.tokenId);
    });
    Object.keys(positions || {}).forEach((key) => ids.add(key));
    return ids;
  }, [hand, positions]);

  const blockedSet = useMemo(() => new Set(blockedTokens ?? []), [blockedTokens]);

  const availableTokens: PreparedToken[] = useMemo(() => {
    const hidden = hiddenTokenIds;
    const tokens: ActivityToken[] = activity?.tokens ?? [];
    const lastUpdated = activity?.lastUpdated ?? Date.now();

    return tokens
      .filter((token) => {
        if (!token?.tokenId) return false;
        if (ownsTokenIds.has(token.tokenId)) return false;
        if (hidden.has(token.tokenId)) return false;
        return true;
      })
      .slice(0, 20)
      .map((token): PreparedToken => ({
        activity: token,
        card: buildCardToken(token, lastUpdated),
      }));
  }, [activity?.tokens, activity?.lastUpdated, hiddenTokenIds, ownsTokenIds]);

  useEffect(() => {
    if (open && activity.tokens.length === 0 && !activity.isLoading && !activity.isConnected) {
      fetchHotTokens();
    }
  }, [open, activity.tokens.length, activity.isLoading, activity.isConnected, fetchHotTokens]);

  useEffect(() => {
    if (!onClose) return;
    onClose.current = () => onOpenChange(false);
  }, [onClose, onOpenChange]);

  const hideTokenWithDelay = useCallback((tokenId: string) => {
    setTimeout(() => {
      setHiddenTokenIds((prev) => {
        const next = new Set(prev);
        next.add(tokenId);
        return next;
      });
    }, 1200);
  }, []);

  const handleBuy = useCallback(
    async (token: ActivityToken) => {
      if (!token.tokenId || buyingTokenId) {
        return;
      }

      const normalizedAmount = Number.isFinite(drawAmount) ? drawAmount : 0;
      const isCardSelectionValid = Number.isFinite(selectedCardCount) && selectedCardCount > 0;

      if (normalizedAmount <= 0 || !isCardSelectionValid) {
        console.warn(
          "[HotTokensSidebar] Ignoring buy because footer controls are invalid",
          {
            amount: normalizedAmount,
            cardCount: selectedCardCount,
          },
        );
        return;
      }

      setBuyingTokenId(token.tokenId);
      try {
        if (isDemoMode) {
          if (!openDemoPosition) {
            throw new Error("Demo draw unavailable");
          }

          playSound("card_draw");
          await openDemoPosition({
            primaryToken: token,
            amountOverride: normalizedAmount,
            cardCountOverride: 1,
            tokenId: token.tokenId,
          });
        } else {
          await executeTransaction({
            type: "buy",
            amount: normalizedAmount,
            cardCount: 1,
            tokenIds: [token.tokenId],
          });
        }

        setPurchasedTokenIds((prev) => {
          const next = new Set(prev);
          next.add(token.tokenId);
          return next;
        });
        hideTokenWithDelay(token.tokenId);
      } catch (error) {
        console.error(`[HotTokensSidebar] Failed to buy ${token.symbol}`, error);
      } finally {
        setBuyingTokenId((current) => (current === token.tokenId ? null : current));
      }
    },
    [
      buyingTokenId,
      drawAmount,
      executeTransaction,
      hideTokenWithDelay,
      isDemoMode,
      openDemoPosition,
      selectedCardCount,
    ],
  );

  const handleBlockToggle = useCallback(
    (tokenId: string) => {
      toggleBlockedToken(tokenId);
      setHiddenTokenIds((prev: Set<string>) => {
        if (!prev.has(tokenId)) {
          return prev;
        }

        const next = new Set(prev);
        next.delete(tokenId);
        return next;
      });
    },
    [toggleBlockedToken],
  );

  useEffect(() => {
    if (blockedTokens.length === 0) {
      return;
    }

    setHiddenTokenIds((prev: Set<string>) => {
      let didChange = false;
      const next = new Set(prev);

      blockedTokens.forEach((tokenId: string) => {
        if (next.has(tokenId)) {
          next.delete(tokenId);
          didChange = true;
        }
      });

      return didChange ? next : prev;
    });
  }, [blockedTokens]);

  const isDrawerBusy = useMemo(() => isBuying && phase !== "idle", [isBuying, phase]);

  const handleRetry = useCallback(() => {
    clearActivityError();
    fetchHotTokens();
  }, [clearActivityError, fetchHotTokens]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.aside
            key="hot-tokens-drawer"
            className={cn(
              "fixed inset-y-0 right-0 z-50 flex h-full flex-col border-l border-gray-800 bg-[#0b0b0f]/95",
              "shadow-[0_0_48px_rgba(0,0,0,0.7)] backdrop-blur-xl",
              DRAWER_WIDTH_CLASSES,
            )}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="border-b border-gray-800 px-5 py-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10 text-2xl">
                    🔥
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Hot Tokens</h2>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {activity.isConnected ? (
                        <>
                          <Wifi className="h-3.5 w-3.5 text-green-400" aria-hidden />
                          <span>Live feed</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="h-3.5 w-3.5 text-gray-500" aria-hidden />
                          <span>Fallback data</span>
                        </>
                      )}
                      {activity.lastUpdated > 0 && (
                        <span>
                          • {new Date(activity.lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  aria-label="Close hot tokens"
                  className="h-10 w-10 rounded-full border border-gray-800 bg-gray-900/60 text-gray-300 hover:bg-gray-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-800 bg-black/40 px-4 py-3">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Amount</span>
                  <span className="text-sm text-gray-500">Applies to all buys</span>
                </div>
                <NumberFlowInput
                  value={Number.isFinite(drawAmount) ? drawAmount : 0}
                  onChange={setSelectedDrawAmount}
                  min={1}
                  max={10000}
                  step={1}
                  prefix="$"
                  format={{ minimumFractionDigits: 0, maximumFractionDigits: 0 }}
                  className="h-10 w-36"
                  useUSDDenominations={false}
                />
              </div>
            </div>

            <ScrollArea className="flex-1 px-5 py-4">
              <TokenListContent
                activity={activity}
                availableTokens={availableTokens}
                drawAmount={drawAmount}
                selectedCardCount={selectedCardCount}
                blockedSet={blockedSet}
                isTokenBlocked={isTokenBlocked}
                purchasedTokenIds={purchasedTokenIds}
                buyingTokenId={buyingTokenId}
                isDrawerBusy={isDrawerBusy}
                onBuy={handleBuy}
                onBlockToggle={handleBlockToggle}
                onRetry={handleRetry}
                onRefresh={fetchHotTokens}
              />
            </ScrollArea>
          </motion.aside>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => onOpenChange(!open)}
        className={cn(
          "group fixed bottom-20 right-4 z-50 flex items-center justify-center rounded-full border border-orange-500/60",
          "bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 text-2xl font-semibold text-black shadow-2xl",
          "hover:scale-105 hover:shadow-[0_0_32px_rgba(255,140,0,0.45)]",
          "sm:hidden",
          TOGGLE_BUTTON_SIZE_CLASSES,
        )}
        aria-label={open ? "Close hot tokens" : "Open hot tokens"}
      >
        <span className="group-active:scale-90">
          {open ? <X className="h-6 w-6" /> : "🔥"}
        </span>
      </motion.button>

      <PerformanceMonitor enabled={open} component="HotTokensSidebar" />
    </>
  );
}