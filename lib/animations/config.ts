






const DURATION = {
  INSTANT: 0,
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 800,
  PRICE_COUNTER: 3000,
  SHUFFLE: 800,
  CARD_FLIP: 600,
} as const;

const DELAY = {
  NONE: 0,
  SHORT: 50,
  STAGGER: 100,
  MEDIUM: 200,
  LONG: 500,
} as const;

const EASING = {
  LINEAR: 'linear',
  EASE_IN: 'easeIn',
  EASE_OUT: 'easeOut',
  EASE_IN_OUT: 'easeInOut',
  SMOOTH: 'cubic-bezier(0.4, 0, 0.2, 1)',
  BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  ELASTIC: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
  SWIFT: 'cubic-bezier(0.55, 0, 0.1, 1)',
  SPRING: { type: 'spring' },
} as const;

const SPRING = {
  STIFF: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
  },
  NORMAL: {
    type: 'spring' as const,
    stiffness: 260,
    damping: 20,
  },
  GENTLE: {
    type: 'spring' as const,
    stiffness: 120,
    damping: 14,
  },
  BOUNCY: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 10,
  },
  CARD_HOVER: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
    restDelta: 0.001,
  },
} as const;


export const GPU_OPTIMIZATIONS = {
  
  TRANSFORM_3D: 'translate3d(0, 0, 0)',
  WILL_CHANGE_TRANSFORM: 'transform',
  WILL_CHANGE_OPACITY: 'opacity',
  WILL_CHANGE_AUTO: 'auto',
  
  
  CONTAIN_LAYOUT: 'layout',
  CONTAIN_STYLE: 'style', 
  CONTAIN_PAINT: 'paint',
  CONTAIN_LAYOUT_STYLE_PAINT: 'layout style paint',
  
  
  FORCE_HARDWARE: {
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden',
    perspective: '1000px',
  },
} as const;


