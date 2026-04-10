"use client";

import { GmgnIcon } from "@/components/icons/GmgnIcon";
import { JupiterIcon } from "@/components/icons/JupiterIcon";
import { BorderBeam } from "@/components/magicui/border-beam";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { GainBars } from "@/components/ui/gain-bars";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TooltipContent as RichTooltipContent } from "@/components/ui/tooltip-content";
import { useTransactionCoordinator } from "@/hooks/use-transaction-coordinator";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { createTokenExternalLinks } from "@/lib/utils/token-links";
import {
  createAgeTooltip,
  createLiquidityTooltip,
  createSignalTooltip,
  createSparklineTooltip,
  createUpdatesTooltip,
} from "@/lib/utils/tooltip-content";
import { motion } from "motion/react";
import Image from "next/image";
import type { CSSProperties } from "react";
import { memo, useMemo, useRef, useState } from "react";

interface MemeDeckCardProps {
  card: {
    id: string;
    symbol: string;
    name: string;
    icon: string;
    price?: number;
    priceChange24h: number;
    usdPrice: number;
    liquidity?: number;
    volume24h?: number;
    marketCapRank?: number;
    age?: number; 
    exchangeCount?: number;
    lastActivity?: string; 
    vsMarket?: number; 
    rawData?: any;
    faceUp?: boolean;
  };
  style?: CSSProperties;
  onMouseEnter?: () => void; 
  onMouseLeave?: () => void; 
  isSelected?: boolean; 
}

function MemeDeckCard({
  card,
  style,
  onMouseEnter: externalOnMouseEnter,
  onMouseLeave: externalOnMouseLeave,
  isSelected = false,
}: MemeDeckCardProps) {
  const [signalPulse] = useState(false);
  const [arrowBounce] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const previousDirection = useRef<number>(0);

  
  const {
    executeTransaction,
    isSelling,
    isConfirming,
    isSettling,
    transactionHash,
    expectedReturn,
    phase,
  } = useTransactionCoordinator();

  const auth = useStore.use.auth();
  const isAuthenticated = auth.isAuthenticated;


  
  const displayPrice = 0;
  const isAnimating = false;
  const beamConfig: any = null; 
  const tickerConfig = useMemo(() => ({ startValue: 0, endValue: 0, duration: 1000 }), []);

  
  const positions = useStore.use.positions();
  const exitingPositions = useStore.use.exitingPositions();
  const getTokenData = useStore.use.getTokenData();

  const position = positions[card.id];
  const exitingPosition = exitingPositions?.[card.id];
  const tokenData = getTokenData(card.id);

  const externalLinks = useMemo(
    () => createTokenExternalLinks(card.id),
    [card.id]
  );

  
  const displayPosition = exitingPosition || position;

  
  const liveTokenPrice = tokenData?.usdPrice ?? card.usdPrice ?? card.price;
  const liveTokenIcon = tokenData?.icon
    ? `/api/image-proxy?url=${encodeURIComponent(
        tokenData.icon
      )}&width=512&height=512`
    : null;
  const poolLiquidity = tokenData?.liquidity;
  const tokenSignal = tokenData?.signal;
  const updatesPerMinute = tokenData?.updatesPerMinute;
  const buyPressure5m = tokenData?.buyPressure5m;
  const tokenFirstSeen = tokenData?.firstSeen ?? 0;
  const lastDirection = tokenData?.lastDirection ?? 0;

  
  const oneMinGain = tokenData?.oneMinGain ?? tokenData?.gains?.oneMin ?? null;
  const twoMinGain = tokenData?.twoMinGain ?? tokenData?.gains?.twoMin ?? null;
  const threeMinGain =
    tokenData?.threeMinGain ?? tokenData?.gains?.threeMin ?? null;
  const fourMinGain =
    tokenData?.fourMinGain ?? tokenData?.gains?.fourMin ?? null;
  const fiveMinGain =
    tokenData?.fiveMinGain ?? tokenData?.gains?.fiveMin ?? null;

  
  const triggerCelebration = useStore.use.triggerCelebration();
  const triggerLossAnimation = useStore.use.triggerLossAnimation();

  
  const tokenAge = useMemo(() => {
    if (!tokenFirstSeen || tokenFirstSeen === 0) return 0;
    return Date.now() - tokenFirstSeen;
  }, [tokenFirstSeen]);


  
  

  

  

  const tooltipContent = useMemo(
    () => ({
  updates: () => createUpdatesTooltip(updatesPerMinute ?? 0),
      signal: () =>
        createSignalTooltip(
          (tokenSignal as "STRONG" | "RISING" | "WATCH" | "FLAT") || "FLAT",
          0,
          []
        ),
  liquidity: () => createLiquidityTooltip(poolLiquidity ?? 0),
      age: () => createAgeTooltip(tokenAge, tokenFirstSeen),
      sparkline: () =>
        createSparklineTooltip(
          oneMinGain,
          twoMinGain,
          threeMinGain,
          fourMinGain,
          fiveMinGain,
          buyPressure5m
        ),
    }),
    [
      updatesPerMinute,
      tokenSignal,
      poolLiquidity,
      tokenAge,
      tokenFirstSeen,
      oneMinGain,
      twoMinGain,
      threeMinGain,
      fourMinGain,
      fiveMinGain,
      buyPressure5m,
    ]
  );

  
  const displayPnlPercent = useMemo(() => {
    if (displayPosition) {
      const percentChange =
        (displayPosition.unrealizedPnl / displayPosition.cost) * 100;
      return percentChange;
    }
    return 0;
  }, [displayPosition]);

  
  const performanceMetrics = useMemo(() => {
    const hasPosition = !!displayPosition;
    const positionValue = displayPosition?.value || 0;
    const pnl = displayPosition?.unrealizedPnl || 0;
    const isPositive = displayPnlPercent >= 0;

    
    const safeDisplayPrice = displayPrice || 0;

    
    if (!displayPrice) {
      const fallbackPrice = liveTokenPrice ?? card.price ?? card.usdPrice;
      return {
        hasPosition,
        positionValue: Number(positionValue.toFixed(2)),
        pnl,
        pnlPercent: Number(displayPnlPercent.toFixed(1)),
        displayPrice: fallbackPrice,
        startValue: fallbackPrice,
        endValue: fallbackPrice,
        isAnimating: false,
        isPositive: displayPnlPercent >= 0,
        displayValue: hasPosition
          ? Number(positionValue.toFixed(2))
          : fallbackPrice,
        energyColor: displayPnlPercent >= 0 ? "emerald" : "red",
      };
    }

    
    const roundedDisplayPrice = Number(safeDisplayPrice.toFixed(2));
    const roundedPositionValue = Number(positionValue.toFixed(2));
    const roundedPnlPercent = Number(displayPnlPercent.toFixed(1));

    const result = {
      hasPosition,
      positionValue: roundedPositionValue,
      pnl,
      pnlPercent: roundedPnlPercent,
      displayPrice: roundedDisplayPrice,
      
      startValue: Number(tickerConfig.startValue.toFixed(2)),
      endValue: Number(tickerConfig.endValue.toFixed(2)),
      isAnimating: isAnimating,
      isPositive,
      displayValue: hasPosition ? roundedPositionValue : roundedDisplayPrice,
      energyColor: isPositive ? "emerald" : "red",
    };

    return result;
  }, [
    displayPosition,
    displayPnlPercent,
    displayPrice,
    tickerConfig,
    isAnimating,
    liveTokenPrice,
    card.price,
    card.usdPrice,
  ]);

  
  const buttonState = useMemo(() => {
    if (phase === "settling") return "settling";
    if (phase === "confirming" || isConfirming) return "confirming";
    if (phase === "executing" || isSelling || transactionHash) return "selling";
    if (expectedReturn) return "expected";
    if (displayPosition && performanceMetrics.pnl >= 0) return "profitable";
    return "losing";
  }, [
    phase,
    isSelling,
    isConfirming,
    transactionHash,
    expectedReturn,
    displayPosition,
    performanceMetrics?.pnl,
  ]);

  
  const getUpdatesPerMinuteEmoji = (upm: number | undefined) => {
    if (upm == null) return "";
    if (upm <= 10) return "🐢";
    if (upm <= 20) return "🐇";
    if (upm <= 35) return "🏄‍♂️";
    return "🔥";
  };

  const getLiquidityEmoji = (liquidity: number | undefined) => {
    if (liquidity == null) return "";
    if (liquidity < 10000) return "🌵";
    if (liquidity < 100000) return "💧";
    if (liquidity < 1000000) return "💦";
    return "🌊";
  };

  const getAgeEmoji = (ageMs: number) => {
    const ageMinutes = ageMs / (1000 * 60);
    if (ageMinutes < 60) return "🥚";
    if (ageMinutes < 720) return "🐣";
    if (ageMinutes < 2880) return "🐥";
    if (ageMinutes < 10080) return "🐤";
    return "💀";
  };

  const formatAge = (ageMs: number) => {
    if (ageMs <= 0) return "0s";

    const seconds = Math.floor(ageMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  
  const gainBarsData = useMemo(() => {
    return [
      { label: "1m", value: oneMinGain },
      { label: "2m", value: twoMinGain },
      { label: "3m", value: threeMinGain },
      { label: "4m", value: fourMinGain },
      { label: "5m", value: fiveMinGain },
    ];
  }, [oneMinGain, twoMinGain, threeMinGain, fourMinGain, fiveMinGain]);

  
  const shareTradeResult = async (position: any, pnl: number) => {
    const shareText = `💎 Just ${pnl >= 0 ? "made" : "lost"} $${Math.abs(
      pnl
    ).toFixed(2)} trading ${position.tokenSymbol} on MemeDeck! 🚀 ${
      pnl >= 0 ? "📈" : "📉"
    } #MemeDeck #Trading #Crypto`;
    const shareUrl = window.location.origin;

    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, "_blank");
  };


  return (
    <div
      className={cn("absolute inset-0")}
      style={style}
      onMouseEnter={() => {
        setIsInteracting(true);
        if (externalOnMouseEnter) externalOnMouseEnter();
      }}
      onMouseLeave={() => {
        setIsInteracting(false);
        if (externalOnMouseLeave) externalOnMouseLeave();
      }}
    >
      <div className="absolute inset-1 border border-slate-600 z-50 rounded-lg pointer-events-none mask-linear-135 mask-linear-from-0% mask-linear-to-30%"></div>
      <div className="absolute inset-1 border border-slate-600 z-50 rounded-lg pointer-events-none -mask-linear-45 mask-linear-from-0% mask-linear-to-30%"></div>
      <div
        className={cn(
          "relative size-full rounded-xl overflow-hidden",
          "border-2 transition-all duration-300 group",
          performanceMetrics.isPositive
            ? "border-emerald-500/50"
            : "border-red-500/50"
        )}
      >
        {}
        <div className="absolute top-5 right-5 z-50 flex items-center justify-center rounded-full p-2 bg-slate-500">
          {}

          <span className="text-xl text-slate-900 tracking-tight font-money">
            ${Math.round(displayPosition?.cost || 0)}
          </span>
        </div>

        <div className="relative h-full flex flex-col justify-between">
          {}
          <div className="relative flex p-3 border-b border-gray-700/50 font-overpass">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  data-testid="card-updates-per-minute"
                  className={cn(
                    "rounded-md p-1 aspect-[10/12] w-1/7 mr-2 bg-slate-300 border-2 flex flex-col items-center justify-center cursor-help transition-all duration-300 relative z-10 shadow-lg",
                    lastDirection === 1
                      ? "border-green-300"
                      : lastDirection === -1
                      ? "border-red-300"
                      : previousDirection.current === 1
                      ? "border-green-300"
                      : previousDirection.current === -1
                      ? "border-red-300"
                      : "border-gray-800",
                    "active:scale-95 active:shadow-md"
                  )}
                >
                  <span className="text-3xl font-black tracking-tighter text-slate-900 leading-none">
                    <AnimatedNumber
                      value={updatesPerMinute ?? 0}
                      precision={0}
                      format={(num) => num.toFixed(0)}
                      animate={!isInteracting}
                    />
                  </span>
                  <span className="text-sm tracking-normal font-bold text-slate-900 leading-none">
                    MPH
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <RichTooltipContent data={tooltipContent.updates} />
              </TooltipContent>
            </Tooltip>

            <div className="text-left">
              <div className="text-3xl font-black tracking-tighter font-mono text-white mb-1">
                <span className="">{card.symbol}</span>
                <span className="text-xl relative bottom-1 left-2">
                  {getUpdatesPerMinuteEmoji(updatesPerMinute)}
                </span>
              </div>
              <div className="text-sm italic text-gray-300 truncate">
                {card.name}
              </div>
            </div>
          </div>

          {}
          <div className="relative flex w-full h-1/2 items-center justify-center overflow-hidden">
            <div
              className={cn(
                "absolute inset-0 overflow-hidden bg-black/90 rounded-lg"
              )}
            >
              <div className="absolute top-0 left-0 z-40 w-full h-20 bg-gradient-to-b from-black/50 to-transparent"></div>

              {liveTokenIcon && (
                <Image
                  src={liveTokenIcon}
                  alt={`${card.name} background`}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className={cn("object-cover w-full opacity-30 z-0 relative")}
                />
              )}
            </div>

            {}
            {liveTokenIcon && (
              <div className="absolute inset-0 z-50 flex items-center justify-center">
                <Image
                  src={liveTokenIcon}
                  alt="Token"
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className={cn(
                    "object-cover transition-all relative z-0",
                    isSelected ? "opacity-60" : "opacity-20 group-hover:opacity-40"
                  )}
                />
              </div>
            )}
          </div>

          {}
          <div className="relative p-4 pt-3 bg-gradient-to-br ">
            {}
            <div className="flex items-center justify-between gap-4 border-b border-slate-600 pb-2 mb-3">
              <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "flex items-center gap-1 transition-all duration-300 cursor-help",
                      signalPulse && "scale-110 animate-pulse",
                      "active:scale-95"
                    )}
                  >
                    <div
                      className={cn(
                        "text-lg transition-transform duration-300",
                        signalPulse && "animate-pulse"
                      )}
                    >
                      {(() => {
                        const cleanSignal = tokenSignal
                          ? tokenSignal
                              .replace(/\x1b\[[0-9;]*m/g, "")
                              .replace(
                                /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
                                ""
                              )
                              .trim()
                          : "FLAT";
                        switch (cleanSignal) {
                          case "STRONG":
                            return "🚀";
                          case "RISING":
                            return "📈";
                          case "WATCH":
                            return "👀";
                          case "AVOID":
                            return "📉";
                          default:
                            return "📊";
                        }
                      })()}
                    </div>
                    <div
                      className={cn(
                        "text-sm font-bold text-white bg-black/30 px-2 py-1 rounded transition-all duration-300",
                        signalPulse && "bg-blue-500/50 scale-105"
                      )}
                    >
                      {tokenSignal
                        ? tokenSignal
                            .replace(/\x1b\[[0-9;]*m/g, "")
                            .replace(
                              /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
                              ""
                            )
                            .trim() || "FLAT"
                        : "FLAT"}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <RichTooltipContent data={tooltipContent.signal} />
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-start gap-1 cursor-help transition-all duration-300 active:scale-95">
                    <div className="text-lg">
                      {getLiquidityEmoji(poolLiquidity)}
                    </div>
                    {poolLiquidity != null && (
                      <span className="text-base text-green-300 font-number leading-none">
                        {poolLiquidity > 1000000
                          ? (poolLiquidity / 1000000).toFixed(1) + "M"
                          : poolLiquidity > 1000
                          ? (poolLiquidity / 1000).toFixed(0) + "K"
                          : poolLiquidity.toFixed(0)}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <RichTooltipContent data={tooltipContent.liquidity} />
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-start gap-1 cursor-help transition-all duration-300 active:scale-95">
                    <div className="text-lg">{getAgeEmoji(tokenAge)}</div>
                    <span className="text-base text-purple-300 font-number leading-none">
                      {formatAge(tokenAge)}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <RichTooltipContent data={tooltipContent.age} />
                </TooltipContent>
              </Tooltip>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={externalLinks.jupiter}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${card.symbol} on Jupiter`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/30 shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white hover:bg-white/10"
                >
                  <JupiterIcon size={18} />
                </a>
                <a
                  href={externalLinks.gmgn}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${card.symbol} on GMGN`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/30 shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white hover:bg-white/10"
                >
                  <GmgnIcon size={18} />
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              {performanceMetrics.displayValue > 0 ? (
                <div className="flex items-center w-5/12" data-testid="card-position-stats">
                  <div className="flex flex-col items-center mr-2">
                    {performanceMetrics.displayValue > 0 && (
                      <div
                        className={cn(
                          "text-sm font-semibold font-number",
                          lastDirection === 1
                            ? "text-green-200"
                            : lastDirection === -1
                            ? "text-red-200"
                            : performanceMetrics.isPositive
                            ? "text-green-200"
                            : "text-red-200"
                        )}
                      >
                        {performanceMetrics.isPositive ? "+" : "-"}
                        <AnimatedNumber
                          value={Math.abs(performanceMetrics.pnlPercent)}
                          precision={1}
                          format={(num) => num.toFixed(1)}
                          />
                        %
                      </div>
                    )}
                    <div
                      className={cn(
                        "text-2xl",
                        performanceMetrics.isPositive
                          ? "text-green-200"
                          : "text-red-200"
                      )}
                    >
                      {performanceMetrics.isPositive ? "↑" : "↓"}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "text-5xl mb-1 font-bold font-number text-shadow-lg",
                      lastDirection === 1
                        ? "text-green-300"
                        : lastDirection === -1
                        ? "text-red-300"
                        : performanceMetrics.isPositive
                        ? "text-green-300"
                        : "text-red-300"
                    )}
                  >
                    <span className="text-4xl w-[1em] relative -top-1 -left-1">
                      $
                    </span>
                    <AnimatedNumber
                      value={performanceMetrics.displayValue}
                      precision={2}
                      format={(num) => num.toFixed(2)}
                      animate={!isInteracting}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-400 mr-1">
                    $
                  </span>
                  <Skeleton className="h-6 w-16 bg-gray-400/20" />
                </div>
              )}

              {(oneMinGain !== null ||
                twoMinGain !== null ||
                threeMinGain !== null ||
                fourMinGain !== null ||
                fiveMinGain !== null) && (
                <div className="h-14 w-[40%] relative pl-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        data-testid="card-trend-bars"
                        className="w-full h-full cursor-help active:scale-95 transition-transform"
                      >
                        <GainBars
                          data={gainBarsData}
                          className="w-full h-full"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <RichTooltipContent data={tooltipContent.sparkline} />
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-3">
              {}
              <button
                data-testid="card-sell-button"
                onClick={async (e) => {
                  if (isSelling) return;

                  await executeTransaction({
                    type: "sell",
                    cardId: card.id,
                  });
                }}
                disabled={isSelling}
                className={cn(
                  "flex-1 py-3 px-4 rounded-lg transition-all duration-300 relative overflow-hidden !border-t-3 scale-[1.02]",
                  isSelling && "cursor-not-allowed opacity-75",
                  {
                    selling:
                      "bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-500 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)] animate-pulse active:from-blue-600 active:to-blue-800 active:scale-[0.98]",
                    expected:
                      "bg-gradient-to-b from-cyan-500 to-cyan-700 hover:from-cyan-400 hover:to-cyan-500 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] animate-pulse active:from-cyan-600 active:to-cyan-800 active:scale-[0.98]",
                    confirming:
                      "bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-500 border-purple-400 shadow-[0_0_15px_rgba(147,51,234,0.4)] animate-pulse active:from-purple-600 active:to-purple-800 active:scale-[0.98]",
                    settling:
                      "bg-gradient-to-b from-indigo-500 to-indigo-700 hover:from-indigo-400 hover:to-indigo-500 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)] animate-pulse active:from-indigo-600 active:to-indigo-800 active:scale-[0.98]",
                    error:
                      "bg-gradient-to-b from-yellow-500 to-yellow-700 hover:from-yellow-400 hover:to-yellow-500 border-yellow-400 shadow-[0_0_15px_rgba(251,191,36,0.4)] animate-pulse active:from-yellow-600 active:to-yellow-800 active:scale-[0.98]",
                    profitable:
                      "bg-gradient-to-b from-green-500 to-green-700 hover:from-green-400 hover:to-green-500 border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)] animate-pulse active:from-green-600 active:to-green-800 active:scale-[0.98]",
                    losing:
                      "bg-gradient-to-b from-red-500 to-red-800 hover:from-red-400 hover:to-red-500 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse active:from-red-600 active:to-red-900 active:scale-[0.98]",
                  }[buttonState],
                  "border shadow-lg hover:shadow-xl active:shadow-md",
                  "text-white",
                  {
                    pending:
                      "shadow-[0_4px_8px_rgba(107,114,128,0.3)] hover:shadow-[0_6px_12px_rgba(107,114,128,0.4)] active:shadow-[0_2px_4px_rgba(107,114,128,0.2)]",
                    selling:
                      "shadow-[0_4px_8px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_12px_rgba(59,130,246,0.4)] active:shadow-[0_2px_4px_rgba(59,130,246,0.2)]",
                    expected:
                      "shadow-[0_4px_8px_rgba(6,182,212,0.3)] hover:shadow-[0_6px_12px_rgba(6,182,212,0.4)] active:shadow-[0_2px_4px_rgba(6,182,212,0.2)]",
                    confirming:
                      "shadow-[0_4px_8px_rgba(147,51,234,0.3)] hover:shadow-[0_6px_12px_rgba(147,51,234,0.4)] active:shadow-[0_2px_4px_rgba(147,51,234,0.2)]",
                    settling:
                      "shadow-[0_4px_8px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_12px_rgba(99,102,241,0.4)] active:shadow-[0_2px_4px_rgba(99,102,241,0.2)]",
                    error:
                      "shadow-[0_4px_8px_rgba(251,191,36,0.3)] hover:shadow-[0_6px_12px_rgba(251,191,36,0.4)] active:shadow-[0_2px_4px_rgba(251,191,36,0.2)]",
                    profitable:
                      "shadow-[0_4px_8px_rgba(34,197,94,0.3)] hover:shadow-[0_6px_12px_rgba(34,197,94,0.4)] active:shadow-[0_2px_4px_rgba(34,197,94,0.2)]",
                    losing:
                      "shadow-[0_4px_8px_rgba(239,68,68,0.3)] hover:shadow-[0_6px_12px_rgba(239,68,68,0.4)] active:shadow-[0_2px_4px_rgba(239,68,68,0.2)]",
                  }[buttonState],
                  "group transform-gpu"
                )}
              >
                <span className="flex items-center">
                  {buttonState === "selling" ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">
                          Selling...
                        </span>
                        {displayPosition && (
                          <span
                            className={cn(
                              "text-2xl font-number",
                              performanceMetrics.isPositive
                                ? "text-green-200"
                                : "text-red-200"
                            )}
                          >
                            {performanceMetrics.pnl >= 0 ? "+" : "-"}$
                            <AnimatedNumber
                              value={Math.abs(performanceMetrics.pnl)}
                              precision={2}
                              format={(num) => num.toFixed(2)}
                                  />
                          </span>
                        )}
                        <span className="text-xs text-blue-200">Live P&L</span>
                      </div>
                    </div>
                  ) : buttonState === "expected" ? (
                    <div className="flex items-center justify-center">
                      <motion.div className="w-4 h-4 bg-cyan-300 rounded-full mr-2" animate={{ y: [0, -10, 0] }} transition={{ duration: 0.6, repeat: Infinity }} />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">
                          Expected Return
                        </span>
                        {expectedReturn && (
                          <span
                            className={cn(
                              "text-2xl font-number",
                              expectedReturn.pnl >= 0
                                ? "text-green-200"
                                : "text-red-200"
                            )}
                          >
                            {expectedReturn.pnl >= 0 ? "+" : "-"}$
                            <AnimatedNumber
                              value={Math.abs(expectedReturn.pnl)}
                              precision={2}
                              format={(num) => num.toFixed(2)}
                                  />
                          </span>
                        )}
                        <span className="text-xs text-cyan-200">
                          Jupiter Quote
                        </span>
                      </div>
                    </div>
                  ) : buttonState === "confirming" ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-pulse w-4 h-4 bg-purple-300 rounded-full mr-2" />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">
                          Confirming...
                        </span>
                        {displayPosition && (
                          <span
                            className={cn(
                              "text-xl font-number opacity-80",
                              performanceMetrics.isPositive
                                ? "text-green-200"
                                : "text-red-200"
                            )}
                          >
                            {performanceMetrics.pnl >= 0 ? "+" : "-"}$
                            <AnimatedNumber
                              value={Math.abs(performanceMetrics.pnl)}
                              precision={2}
                              format={(num) => num.toFixed(2)}
                                  />
                          </span>
                        )}
                        <span className="text-xs text-purple-200">
                          On-chain confirm
                        </span>
                      </div>
                    </div>
                  ) : buttonState === "settling" ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">
                          Settling...
                        </span>
                        <span className="text-xs text-indigo-200">
                          Applying results
                        </span>
                      </div>
                    </div>
                  ) : displayPosition ? (
                    performanceMetrics.pnl >= 0 ? (
                      <>
                        <span className="">
                          <span className="text-3xl relative mr-2 text-shadow-xs">
                            🤑
                          </span>
                          <span className="text-4xl mr-4 font-number text-white text-shadow-lg">
                            $
                            <AnimatedNumber
                              value={Math.abs(performanceMetrics.pnl)}
                              precision={2}
                              format={(num) => num.toFixed(2)}
                                  />
                          </span>
                        </span>
                        <span className="text-green-950 text-sm tracking-wider uppercase">
                          Lock-in Win
                        </span>
                      </>
                    ) : (
                      <>
                        <span>
                          <span className="text-2xl relative -top-0.5 mr-2 text-shadow-xs">
                            💀
                          </span>
                          <span className="text-3xl mr-4 font-number text-red-200 text-shadow-lg">
                            -$
                            <AnimatedNumber
                              value={Math.abs(performanceMetrics.pnl)}
                              precision={2}
                              format={(num) => num.toFixed(2)}
                                  />
                          </span>
                        </span>
                        <span className="text-red-100 text-sm tracking-wider uppercase">
                          Cut Losses
                        </span>
                      </>
                    )
                  ) : (
                    "Sell"
                  )}
                </span>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute inset-0">
                  <BorderBeam
                    size={60}
                    duration={2}
                    colorFrom={
                      buttonState === "selling" ? "#3b82f6" :
                      buttonState === "expected" ? "#06b6d4" :
                      buttonState === "confirming" ? "#9333ea" :
                      buttonState === "settling" ? "#6366f1" :
                      buttonState === "profitable" ? "#22c55e" :
                      "#ff6b6b"
                    }
                    colorTo={
                      buttonState === "selling" ? "#1d4ed8" :
                      buttonState === "expected" ? "#0891b2" :
                      buttonState === "confirming" ? "#7c3aed" :
                      buttonState === "settling" ? "#4f46e5" :
                      buttonState === "profitable" ? "#16a34a" :
                      "#ff8e8e"
                    }
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
        {beamConfig && (
          <BorderBeam
            duration={beamConfig.duration}
            size={beamConfig.size}
            colorFrom={
              typeof beamConfig.colors === "object" &&
              "from" in beamConfig.colors
                ? beamConfig.colors.from
                : "#ffffff"
            }
            colorTo={
              typeof beamConfig.colors === "object" && "to" in beamConfig.colors
                ? beamConfig.colors.to
                : "#ffffff"
            }
            animationId={beamConfig.animationId}
          />
        )}
      </div>
    </div>
  );
}

export default memo(MemeDeckCard);
