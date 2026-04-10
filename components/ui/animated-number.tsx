"use client";

import NumberFlow, { type NumberFlowProps } from "@number-flow/react";
import { motion, MotionValue, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";

interface AnimatedNumberProps {
  value: number;
  useNumberFlow?: boolean;
  numberFlowProps?: Omit<NumberFlowProps, "value">;
  mass?: number;
  stiffness?: number;
  damping?: number;
  precision?: number;
  format?: (value: number) => string;
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
  
  
  animate?: boolean;
}


export function AnimatedNumber({ value, useNumberFlow = false, numberFlowProps, mass = 0.8, stiffness = 100, damping = 15, precision = 0, format = (num) => num.toLocaleString(), onAnimationStart, onAnimationComplete }: AnimatedNumberProps) {
  const spring = useSpring(value, { mass, stiffness, damping });
  const display: MotionValue<string> = useTransform(spring, (current) => format(parseFloat(current.toFixed(precision))));

  useEffect(() => {
    if (!useNumberFlow) {
      spring.set(value);
      if (onAnimationStart) onAnimationStart();
      const unsubscribe = spring.on("change", () => {
        if (spring.get() === value && onAnimationComplete) onAnimationComplete();
      });
      return () => unsubscribe();
    }
  }, [spring, value, onAnimationStart, onAnimationComplete, useNumberFlow]);

  if (useNumberFlow) {
    return <NumberFlow value={value} format={{ style: "currency", currency: "USD", trailingZeroDisplay: "auto" }} {...numberFlowProps} />;
  }

  return <motion.span>{display}</motion.span>;
}
