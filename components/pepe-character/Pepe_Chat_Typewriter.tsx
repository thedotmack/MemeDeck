'use client';

import { useEffect, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from "motion/react";

interface PepeTypewriterProps {
  text: string;
  duration: number; 
  onComplete?: () => void;
}

export function PepeTypewriter({ text, duration, onComplete }: PepeTypewriterProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const displayText = useTransform(rounded, (latest) => text.slice(0, latest));
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    
    
    const msPerChar = Math.max(20, duration / text.length);
    const animDuration = (msPerChar * text.length) / 1000; 

    const controls = animate(count, text.length, {
      type: 'tween',
      duration: animDuration,
      ease: 'linear',
      onComplete: () => {
        setShowCursor(false);
        onComplete?.();
      },
    });

    return () => {
      controls.stop && controls.stop();
    };
  }, [count, text.length, duration, onComplete]);

  return (
    <span className="inline-flex items-baseline">
      <motion.span>{displayText}</motion.span>
      {showCursor && <BlinkingCursor />}
    </span>
  );
}

function BlinkingCursor() {
  return (
    <motion.span
      className="inline-block w-0.5 h-4 bg-white ml-0.5"
      animate={{
        opacity: [0, 0, 1, 1],
      }}
      transition={{
        duration: 1,
        repeat: Infinity,
        repeatType: 'loop',
        times: [0, 0.5, 0.5, 1],
      }}
    />
  );
}