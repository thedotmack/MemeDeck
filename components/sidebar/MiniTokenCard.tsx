"use client";

import { AnimatedNumber } from "@/components/ui/animated-number";
import { GainBars } from "@/components/ui/gain-bars";
import { Skeleton } from "@/components/ui/skeleton";
import { useStore } from "@/lib/store";
import type { HotToken } from "@/lib/store/slices/activity-slice";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import Image from "next/image";
import { memo, useMemo, useState } from "react";

interface MiniTokenCardProps {
  token: HotToken;
  isLoading?: boolean;
  'data-testid'?: string;
}

function MiniTokenCard({ token, isLoading = false, 'data-testid': testId }: MiniTokenCardProps) {
  const [backgroundError, setBackgroundError] = useState(false);
  

  
  
  const getTokenData = useStore.use.getTokenData();
  const tokenData = getTokenData(token.id);
  
  
  const tokenFirstSeen = tokenData?.firstSeen ?? 0;
  const liquidity = tokenData?.liquidity ?? 0;
  
  
  const tokenAge = useMemo(() => {
    if (!tokenFirstSeen || tokenFirstSeen === 0) return 0;
    return Date.now() - tokenFirstSeen;
  }, [tokenFirstSeen]);
  
  
  const getAgeEmoji = (ageMs: number): string => {
    const ageMinutes = ageMs / (1000 * 60);
    if (ageMinutes < 60) return "🥚"; 
    if (ageMinutes < 720) return "🐣"; 
    if (ageMinutes < 2880) return "🐥"; 
    if (ageMinutes < 10080) return "🐤"; 
    return "🐓"; 
  };
  
  
  const formatLiquidity = (liquidity: number | undefined): string => {
    if (typeof liquidity !== 'number' || isNaN(liquidity) || liquidity < 0) return '$0';
    if (liquidity >= 1000000) return `$${(liquidity / 1000000).toFixed(1)}M`;
    if (liquidity >= 1000) return `$${(liquidity / 1000).toFixed(0)}K`;
    return `$${liquidity.toFixed(0)}`;
  };
  
  
  const getLiquidityColor = (liquidity: number | undefined): string => {
    if (typeof liquidity !== 'number' || isNaN(liquidity)) return 'text-gray-400';
    if (liquidity >= 10000000) return "text-green-400"; 
    if (liquidity >= 1000000) return "text-blue-400"; 
    if (liquidity >= 100000) return "text-yellow-400"; 
    return "text-red-400"; 
  };
  
  
  
  
  
  
  
  
  
  
  
  
  

  if (isLoading) {
    return (
      <div className="aspect-[5/7] rounded-lg border border-gray-700 bg-gray-800 transition-colors p-3 flex flex-col">
        {}
        <div className="flex items-center justify-between gap-1 mb-2">
          <Skeleton className="h-3.5 w-12 bg-gray-700" />
          <Skeleton className="w-3.5 h-3.5 rounded-full bg-gray-700" />
        </div>
        {}
        <div className="flex-1 flex items-center justify-center mb-2">
          <div className="text-center">
            <Skeleton className="h-10 w-16 bg-gray-700 mx-auto mb-1" />
            <Skeleton className="h-3 w-6 bg-gray-700 mx-auto" />
          </div>
        </div>
        {}
        <div className="mb-2">
          <Skeleton className="h-3 w-12 bg-gray-700 mx-auto mb-1" />
          <Skeleton className="h-3.5 w-14 bg-gray-700 mx-auto" />
        </div>
        {}
        <div className="h-8">
          <Skeleton className="w-full h-8 bg-gray-700" />
        </div>
      </div>
    );
  }

  const oneMinGain = token.oneMinGain ?? 0;
  const isPositive = oneMinGain > 0;
  const isNegative = oneMinGain < 0;

  
  const gainBarsData = [
    { label: "1m", value: token.oneMinGain ?? 0 },
    { label: "2m", value: token.twoMinGain ?? 0 },
    { label: "3m", value: token.threeMinGain ?? 0 },
    { label: "4m", value: token.fourMinGain ?? 0 },
    { label: "5m", value: token.fiveMinGain ?? 0 }
  ];

  
  const backgroundImageUrl = token.icon && !backgroundError 
    ? `/api/image-proxy?url=${encodeURIComponent(token.icon)}&width=800&height=600`
    : null;


  return (
    <div
      className={cn(
        "aspect-[5/7] rounded-lg border border-gray-700 bg-gray-800 relative overflow-hidden cursor-pointer transition-all duration-300 ease-out transform-gpu",
        "hover:shadow-lg hover:scale-[1.02]" 
      )}
      style={{
        backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
      role="article"
      aria-label={`${token.symbol} token card with current price and gains`}
      tabIndex={0}
      data-testid={testId || `mini-token-card-${token.symbol}`}
    >
      {}
      <div className="absolute inset-0 bg-gradient-to-b via-black/40 from-black/90 to-black/90" />

      {}
      <div className="relative z-10 p-3 h-full flex flex-col">
        {}
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="flex-1 min-w-0">
            <span className="font-bold text-sm truncate text-white block" title={token.name} aria-label={`Token: ${token.symbol}`}>
              {token.symbol}
            </span>
          </div>
          
          {}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {tokenAge > 0 && (
              <span className="text-sm" title={`Token age: ${Math.floor(tokenAge / (1000 * 60))} minutes`} aria-label={`Token age: ${Math.floor(tokenAge / (1000 * 60))} minutes`}>
                {getAgeEmoji(tokenAge)}
              </span>
            )}
            
            {}
            {token.buyPressure5m && token.buyPressure5m > 60 && (
              <motion.div 
                className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" 
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
          </div>
        </div>

        {}
        <div className="flex-1 flex items-center justify-center mb-2">
          {oneMinGain !== null && oneMinGain !== 0 ? (
            <div
              className={cn(
                "text-center",
                isPositive && "text-green-400",
                isNegative && "text-red-400"
              )}
            >
              <div className="text-4xl leading-none tracking-tight text-shadow-black text-shadow-sm font-black font-number">
                <AnimatedNumber
                  value={oneMinGain}
                  useNumberFlow={true}
                  numberFlowProps={{
                    format: { minimumFractionDigits: 1, maximumFractionDigits: 1 },
                    suffix: '%'
                  }}
                />
              </div>
              <div className="text-xs text-gray-300 font-medium mt-0.5">1min</div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-2xl font-black text-gray-500">--</div>
              <div className="text-xs text-gray-400 font-medium">1min</div>
            </div>
          )}
        </div>

        {}
        <div className="mb-2">
          <div className="text-center">
            <div className="text-xs text-gray-400 font-medium mb-0.5">Liquidity</div>
            <span className={cn(
              "text-sm font-bold font-number",
              getLiquidityColor(liquidity)
            )} aria-label={`Liquidity: ${formatLiquidity(liquidity)}`}>
              {formatLiquidity(liquidity)}
            </span>
          </div>
        </div>
        
        {}
        <div className="h-8">
          <GainBars data={gainBarsData} className="h-full" />
        </div>
      </div>


      {}
      {backgroundError && (
        <Image
          src={`/api/image-proxy?url=${encodeURIComponent(token.icon || '')}&width=800&height=600`}
          alt=""
          fill
          sizes="200px"
          className="object-cover opacity-20"
          unoptimized
          onError={() => {}} 
        />
      )}
    </div>
  );
}

export default memo(MiniTokenCard);