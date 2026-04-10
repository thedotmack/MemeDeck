"use client";

import { GPU_OPTIMIZATIONS } from "@/lib/animations/config";
import { cn } from "@/lib/utils";
import { motion, MotionProps, MotionStyle, Transition } from "motion/react";
import { useMemo } from "react";

interface BorderBeamProps {
    size?: number;
    duration?: number;
    delay?: number;
    colorFrom?: string;
    colorTo?: string;
    transition?: Transition;
    className?: string;
    style?: React.CSSProperties;
    reverse?: boolean;
    initialOffset?: number;
    animationId?: string;
    priority?: 'critical' | 'high' | 'medium' | 'low';
    interruptible?: boolean;
}

export const BorderBeam = ({
  className,
  size = 50,
  delay = 0,
  duration = 6,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  transition,
  style,
  reverse = false,
  initialOffset = 0,
  animationId,
  priority = 'medium',
  interruptible = true,
}: BorderBeamProps) => {
  const UNBOUNDED_REPEAT = 1_000_000;
  
  const enhancedTransition = useMemo<Transition>(() => {
    const transitionAny = transition as Record<string, unknown> | undefined;
    const baseTransition: Transition = {
      repeat: transition?.repeat ?? UNBOUNDED_REPEAT,
      ease: (transitionAny?.ease as string) ?? "linear",
      duration,
      delay: transition?.delay ?? -delay,
      ...transition,
    };

    if (priority === 'critical') {
      return {
        ...baseTransition,
        type: "tween",
        ease: "linear",
      } satisfies Transition;
    }

    if (priority === 'low') {
      const repeatCount =
        typeof baseTransition.repeat === "number"
          ? baseTransition.repeat
          : UNBOUNDED_REPEAT;

      return {
        ...baseTransition,
        repeat:
          repeatCount === UNBOUNDED_REPEAT
            ? 3
            : repeatCount > 3
              ? 3
              : repeatCount,
      } satisfies Transition;
    }

    return baseTransition;
  }, [duration, delay, transition, priority]);

  const animate = useMemo<MotionProps["animate"]>(() => {
    const forward: string[] = [
      `${initialOffset}%`,
      `${100 + initialOffset}%`,
    ];
    const backward: string[] = [
      `${100 - initialOffset}%`,
      `${-initialOffset}%`,
    ];

    return {
      offsetDistance: reverse ? backward : forward,
    };
  }, [initialOffset, reverse]);

  
  const priorityClassName = cn(
    "absolute aspect-square",
    "bg-gradient-to-l from-[var(--color-from)] via-[var(--color-to)] to-transparent",
    priority === 'critical' && "z-10", 
    className,
  );

  return (
    <div 
      className="pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]"
      data-animation-id={animationId}
      data-priority={priority}
      data-interruptible={interruptible}
    >
      <motion.div
        className={priorityClassName}
        style={
          {
            width: size,
            offsetPath: `rect(0 auto auto 0 round ${size}px)`,
            "--color-from": colorFrom,
            "--color-to": colorTo,
            transform: GPU_OPTIMIZATIONS.TRANSFORM_3D,
            willChange: GPU_OPTIMIZATIONS.WILL_CHANGE_TRANSFORM,
            backfaceVisibility: 'hidden',
            ...style,
          } as MotionStyle
        }
        initial={{ offsetDistance: `${initialOffset}%` }}
        animate={animate}
        transition={enhancedTransition}
      />
    </div>
  );
};
