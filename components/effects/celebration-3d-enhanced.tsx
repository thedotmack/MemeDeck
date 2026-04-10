'use client';

import { motion, AnimatePresence } from "motion/react";
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef, useMemo } from 'react';
import Text3D from './3d-text';
import { CELEBRATION_TEXT_MAP } from '@/lib/constants/celebration-texts'; 


const winVariants = [
  '3d-small', '3d-decent', '3d-big', '3d-huge', '3d-legendary', '3d-epic', '3d-mythical', '3d-godlike', '3d-transcendent', '3d-win', '3d-fire', '3d-mega'
];

interface Celebration3DEnhancedProps {
  isActive: boolean;
  variant: 
    
    | '3d-small' | '3d-decent' | '3d-big' | '3d-huge' | '3d-legendary' | '3d-epic' | '3d-mythical' | '3d-godlike' | '3d-transcendent'
    
    | '3d-ouch' | '3d-bruised' | '3d-wounded' | '3d-bleeding' | '3d-crushed' | '3d-shattered' | '3d-obliterated' | '3d-annihilated' | '3d-vaporized' | '3d-rug-burning'
    
    | '3d-win' | '3d-fire' | '3d-mega';
  percentChange?: number;
  dollarAmount?: number;
  intensity?: 'subtle' | 'normal' | 'massive' | 'extreme';
  className?: string;
}

export function Celebration3DEnhanced({
  isActive,
  variant,
  percentChange,
  dollarAmount,
  intensity = 'normal',
  className,
  duration = 2000,
}: Celebration3DEnhancedProps & { duration?: number }) {
  const animationRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const prevCelebration = useRef<string | null>(null);

  
  useEffect(() => {
    if (isActive) {
      setVisible(true);
      setFadingOut(false);
      prevCelebration.current = variant + String(percentChange) + String(dollarAmount);
      const fadeTimer = setTimeout(() => {
        setFadingOut(true);
      }, 1500); 
      const hideTimer = setTimeout(() => {
        setVisible(false);
        setFadingOut(false);
      }, 2500); 
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    } else {
      setVisible(false);
      setFadingOut(false);
    }
  }, [isActive, variant, percentChange, dollarAmount]);


  
  function getTierText(variant: string): string {
    return CELEBRATION_TEXT_MAP[variant] || 'BIG\nWIN!';
  }

  
  function getTierColor(variant: string): string {
    if (variant === '3d-small') return '#4ade80'; 
    if (variant === '3d-decent') return '#22c55e'; 
    if (variant === '3d-big') return '#facc15'; 
    if (variant === '3d-huge') return '#fb923c'; 
    if (variant === '3d-legendary') return '#a78bfa'; 
    if (variant === '3d-epic') return '#22d3ee'; 
    if (variant === '3d-mythical') return '#f472b6'; 
    if (variant === '3d-godlike') return '#fde047'; 
    if (variant === '3d-transcendent') return '#fff'; 
    if (variant === '3d-ouch') return '#f87171'; 
    if (variant === '3d-bruised') return '#ef4444'; 
    if (variant === '3d-wounded') return '#dc2626'; 
    if (variant === '3d-bleeding') return '#b91c1c'; 
    if (variant === '3d-crushed') return '#7f1d1d'; 
    if (variant === '3d-shattered') return '#450a0a'; 
    if (variant === '3d-obliterated') return '#1c1917'; 
    if (variant === '3d-annihilated') return '#111827'; 
    if (variant === '3d-vaporized') return '#000'; 
    if (variant === '3d-rug-burning') return '#ea580c'; 
    if (variant === '3d-fire') return '#fb923c'; 
    if (variant === '3d-mega') return '#fde047'; 
    return '#fff';
  }

  
  function getAnimationMode(variant: string): 'rotate' | 'pulse' | 'glow' | 'bounce' {
    if ([
      '3d-legendary', '3d-epic', '3d-mythical', '3d-godlike', '3d-transcendent'
    ].includes(variant)) return 'glow';
    if ([
      '3d-big', '3d-huge', '3d-mega'
    ].includes(variant)) return 'pulse';
    if ([
      '3d-ouch', '3d-bruised', '3d-wounded', '3d-bleeding', '3d-crushed', '3d-shattered', '3d-obliterated', '3d-annihilated', '3d-vaporized', '3d-rug-burning'
    ].includes(variant)) return 'bounce';
    return 'rotate';
  }

  
  function generateSubtitle(variant: string, percentChange?: number, dollarAmount?: number, customSubtitle?: string, tokenSymbol?: string): string {
    if (customSubtitle) return customSubtitle;
    if (typeof percentChange === 'number' && typeof dollarAmount === 'number') {
      const sign = percentChange > 0 ? '+' : '';
      return `${sign}${percentChange.toFixed(2)}%  (${sign}$${dollarAmount.toFixed(2)})`;
    }
    if (typeof percentChange === 'number') {
      const sign = percentChange > 0 ? '+' : '';
      return `${sign}${percentChange.toFixed(2)}%`;
    }
    if (typeof dollarAmount === 'number') {
      const sign = dollarAmount > 0 ? '+' : '';
      return `${sign}$${dollarAmount.toFixed(2)}`;
    }
    return '';
  }

  const displayText = getTierText(variant);
  const displaySubtitle = generateSubtitle(variant, percentChange, dollarAmount);


  const backgroundGlowClass = useMemo(() => cn(
    "absolute inset-0 blur-3xl opacity-30",
    variant === '3d-small' && "bg-green-400",
    variant === '3d-decent' && "bg-green-500",
    variant === '3d-big' && "bg-yellow-500",
    variant === '3d-huge' && "bg-orange-500",
    variant === '3d-legendary' && "bg-purple-500",
    variant === '3d-epic' && "bg-cyan-400",
    variant === '3d-mythical' && "bg-pink-400",
    variant === '3d-godlike' && "bg-yellow-300",
    variant === '3d-transcendent' && "bg-white",
    variant === '3d-ouch' && "bg-red-400",
    variant === '3d-bruised' && "bg-red-500",
    variant === '3d-wounded' && "bg-red-600",
    variant === '3d-bleeding' && "bg-red-700",
    variant === '3d-crushed' && "bg-red-800",
    variant === '3d-shattered' && "bg-red-900",
    variant === '3d-obliterated' && "bg-red-950",
    variant === '3d-annihilated' && "bg-gray-900",
    variant === '3d-vaporized' && "bg-black",
    variant === '3d-rug-burning' && "bg-gradient-to-t from-gray-900 via-red-900 to-orange-600",
    variant === '3d-fire' && "bg-orange-500",
    variant === '3d-mega' && "bg-yellow-400"
  ), [variant]);

  return (
    <motion.div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center pointer-events-none celebration-overlay",
        className
      )}
      style={{ 
        opacity: visible ? 1 : 0,
        pointerEvents: 'none'
      }}
      initial={false}
      animate={{ y: fadingOut ? (winVariants.includes(variant) ? '-100vh' : '100vh') : '0vh' }}
      transition={{ duration: fadingOut ? 0.3 : 0, ease: 'easeIn' }}
    >
      {}
      <motion.div
        className={cn(backgroundGlowClass, 'pointer-events-none')}
        initial={false}
        animate={{ scale: variant?.includes('phoenix') ? [0, 3, 2, 1.5] : [0, 2, 1.5] }}
        transition={{ duration: 0 }}
        style={{ opacity: visible && !fadingOut ? 0.3 : 0 }}
      />

      {}
      <div className="absolute w-full h-full flex items-center justify-center pointer-events-none">
        {}
        {(variant === '3d-epic' || variant === '3d-mega') && (
          <motion.span
            className="absolute w-full h-full"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)",
              backgroundSize: "50% 100%",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mixBlendMode: "screen"
            }}
            animate={{ backgroundPosition: ["-200% 0%", "200% 0%"] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
          />
        )}
        {}
        {variant === '3d-fire' && (
          <motion.span
            className="absolute w-full h-full"
            style={{ filter: "blur(0px)" }}
            animate={{ filter: ["blur(0px)", "blur(2px)", "blur(0px)"], scaleY: [1, 1.05, 1] }}
            transition={{ duration: 0.3, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        {}
        {variant === '3d-legendary' && (
          <>
            <motion.span
              className="absolute w-full h-full text-purple-300"
              style={{ zIndex: -1 }}
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              {displayText}
            </motion.span>
            <motion.span
              className="absolute w-full h-full text-pink-300"
              style={{ zIndex: -2 }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            >
              {displayText}
            </motion.span>
          </>
        )}
      </div>

      {}
      <motion.div
        initial={false}
        animate={{ y: 0 }}
        transition={{ duration: 0 }}
        className="w-full h-full flex flex-col items-center justify-center pointer-events-none"
        style={{ opacity: visible && !fadingOut ? 1 : 0 }}
      >
        {(() => {
          const lines = displayText.split('\n').filter(line => line.trim() !== '');
          const lineCount = lines.length;
          const lineHeight = lineCount > 1 ? 24 : 0;
          return lines.map((line, idx) => {

            const yOffset = (lineCount - 1) * lineHeight * 0.5 - idx * lineHeight;
            return (
              <Text3D
                key={`${line}-${idx}`}
                text={line || 'WIN'}
                isActive={true}
                color={getTierColor(variant)}
                size={lineCount > 1 ? 60 : 80}
                animationMode="all"
                yOffset={yOffset}
              />
            );
          });
        })()}
      </motion.div>

      {}
      {displaySubtitle && (
        <motion.div
          className="absolute bottom-24 left-0 w-full flex justify-center pointer-events-none"
          initial={false}
          animate={{ y: 0 }}
          transition={{ duration: 0 }}
          style={{ opacity: visible && !fadingOut ? 1 : 0 }}
        >
          <div className={cn(
            "text-4xl font-bold tracking-wide text-center",
            variant === '3d-small' && "text-green-300",
            variant === '3d-decent' && "text-green-400",
            variant === '3d-big' && "text-yellow-400",
            variant === '3d-huge' && "text-orange-400",
            variant === '3d-legendary' && "text-purple-400",
            variant === '3d-epic' && "text-cyan-300",
            variant === '3d-mythical' && "text-pink-300",
            variant === '3d-godlike' && "text-yellow-200",
            variant === '3d-transcendent' && "text-gray-200",
            variant === '3d-ouch' && "text-red-300",
            variant === '3d-bruised' && "text-red-400",
            variant === '3d-wounded' && "text-red-500",
            variant === '3d-bleeding' && "text-red-600",
            variant === '3d-crushed' && "text-red-700",
            variant === '3d-shattered' && "text-red-800",
            variant === '3d-obliterated' && "text-red-900",
            variant === '3d-annihilated' && "text-gray-700",
            variant === '3d-vaporized' && "text-gray-800",
            variant === '3d-rug-burning' && "text-orange-500",
            variant === '3d-win' && "text-gray-200",
            variant === '3d-fire' && "text-orange-400",
            variant === '3d-mega' && "text-yellow-300"
          )}
          style={{
            textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 255, 255, 0.2)"
          }}
          >
            {displaySubtitle}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}