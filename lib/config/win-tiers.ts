
import type { WinTier, WinTierConfig } from '@/lib/types/celebrations';


export const WIN_TIERS: Record<WinTier, WinTierConfig> = {
  lil: {
    threshold: 0.1, 
    name: "Lil' Win",
    confetti: {
      particleCount: 15,
      spread: 20,
      colors: ['#86efac', '#bbf7d0'],
    },
    animation: {
      duration: 600,
      cardAnimation: 'subtlePulse',
    },
    audio: {
      melody: ['C4', 'E4'],
      percussive: false,
    },
  },
  small: {
    threshold: 1.0, 
    name: 'Small Win',
    confetti: {
      particleCount: 25,
      spread: 30,
      colors: ['#10b981', '#34d399'],
    },
    animation: {
      duration: 800,
      cardAnimation: 'gentleBounce',
    },
    audio: {
      melody: ['C5', 'E5'],
      percussive: false,
    },
  },
  decent: {
    threshold: 2, 
    name: 'Decent Win',
    confetti: {
      particleCount: 50,
      spread: 45,
      colors: ['#10b981', '#34d399', '#6ee7b7'],
    },
    animation: {
      duration: 1200,
      cardAnimation: 'cardFlip',
    },
    audio: {
      melody: ['C5', 'E5', 'G5'],
      percussive: true,
    },
    borderBeam: {
      duration: 2000,
      colors: ['#10b981'], 
    },
  },
  big: {
    threshold: 5, 
    name: 'Big Win',
    confetti: {
      particleCount: 100,
      spread: 60,
      colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
    },
    animation: {
      duration: 2000,
      cardAnimation: 'cardLevitate',
      screenEffect: 'shake',
      effectIntensity: 'light',
    },
    audio: {
      melody: ['C4', 'E4', 'G4', 'C5'],
      bassTones: ['C2'],
      percussive: true,
    },
    borderBeam: {
      duration: 4000,
      colors: [
        '#10b981', 
        '#3b82f6', 
      ],
      delay: 2000,
    },
  },
  huge: {
    threshold: 10, 
    name: 'Huge Win',
    confetti: {
      particleCount: 150,
      spread: 80,
      colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#fbbf24'],
    },
    animation: {
      duration: 3000,
      cardAnimation: 'goldExplosion',
      screenEffect: 'both',
      effectIntensity: 'medium',
    },
    audio: {
      melody: ['C4', 'D4', 'E4', 'G4', 'C5'],
      bassTones: ['C2', 'G2'],
      percussive: true,
    },
    borderBeam: {
      duration: 1000,
      colors: [
        '#eab308', 
        '#f97316', 
        '#ef4444', 
      ],
    },
  },
  legendary: {
    threshold: 20, 
    name: 'Legendary Win',
    confetti: {
      particleCount: 200,
      spread: 100,
      colors: ['#8b5cf6', '#ec4899', '#eab308', '#10b981'],
    },
    animation: {
      duration: 5000,
      cardAnimation: 'legendarySequence',
      screenEffect: 'both',
      effectIntensity: 'heavy',
    },
    audio: {
      melody: ['C3', 'E3', 'G3', 'C4', 'E4', 'G4', 'C5'],
      bassTones: ['C2', 'G1', 'C2'],
      percussive: true,
    },
    borderBeam: {
      duration: 800,
      colors: [
        '#8b5cf6', 
        '#ec4899', 
        '#eab308', 
        '#10b981', 
      ],
    },
  },
  epic: {
    threshold: 30, 
    name: 'Epic Win',
    confetti: {
      particleCount: 300,
      spread: 120,
      colors: ['#00ff00', '#ffff00', '#ff8000', '#ff0080', '#8000ff'],
    },
    animation: {
      duration: 6000,
      cardAnimation: 'epicSequence',
      screenEffect: 'both',
      effectIntensity: 'heavy',
    },
    audio: {
      melody: ['C3', 'E3', 'G3', 'C4', 'E4', 'G4', 'C5', 'E5'],
      bassTones: ['C1', 'G1', 'C2', 'G2'],
      percussive: true,
    },
    borderBeam: {
      duration: 1200,
      colors: [
        '#00ff00', 
        '#ffff00', 
        '#ff8000', 
        '#ff0080', 
        '#8000ff', 
      ],
    },
  },
  mythical: {
    threshold: 50, 
    name: 'Mythical Win',
    confetti: {
      particleCount: 400,
      spread: 140,
      colors: ['#ffffff', '#ffd700', '#ff6b35', '#f72585', '#7209b7', '#2d00f7'],
    },
    animation: {
      duration: 8000,
      cardAnimation: 'mythicalSequence',
      screenEffect: 'both',
      effectIntensity: 'heavy',
    },
    audio: {
      melody: ['C2', 'E2', 'G2', 'C3', 'E3', 'G3', 'C4', 'E4', 'G4', 'C5'],
      bassTones: ['C1', 'F1', 'G1', 'C2'],
      percussive: true,
    },
    borderBeam: {
      duration: 1500,
      colors: [
        '#ffffff', 
        '#ffd700', 
        '#ff6b35', 
        '#f72585', 
        '#7209b7', 
        '#2d00f7', 
      ],
    },
  },
  godlike: {
    threshold: 75, 
    name: 'Godlike Win',
    confetti: {
      particleCount: 500,
      spread: 160,
      colors: ['#ffffff', '#ffd700', '#ff0080', '#8000ff', '#00ffff', '#ff6600'],
    },
    animation: {
      duration: 10000,
      cardAnimation: 'godlikeSequence',
      screenEffect: 'both',
      effectIntensity: 'heavy',
    },
    audio: {
      melody: ['C1', 'E1', 'G1', 'C2', 'E2', 'G2', 'C3', 'E3', 'G3', 'C4', 'E4', 'G4', 'C5'],
      bassTones: ['C0', 'F0', 'G0', 'C1'],
      percussive: true,
    },
    borderBeam: {
      duration: 2000,
      colors: [
        '#ffeaa7', 
        '#fab1a0', 
        '#fd79a8', 
        '#fdcb6e', 
        '#6c5ce7', 
        '#74b9ff', 
      ],
    },
  },
  transcendent: {
    threshold: 100, 
    name: 'Transcendent Win',
    confetti: {
      particleCount: 1000,
      spread: 180,
      colors: ['#ffffff', '#ffd700', '#ff0080', '#8000ff', '#00ffff', '#ff6600', '#00ff00'],
    },
    animation: {
      duration: 15000,
      cardAnimation: 'transcendentSequence',
      screenEffect: 'both',
      effectIntensity: 'heavy',
    },
    audio: {
      melody: ['C0', 'E0', 'G0', 'C1', 'E1', 'G1', 'C2', 'E2', 'G2', 'C3', 'E3', 'G3', 'C4', 'E4', 'G4', 'C5', 'E5'],
      bassTones: ['C-1', 'F-1', 'G-1', 'C0'],
      percussive: true,
    },
    borderBeam: {
      duration: 3000,
      colors: [
        '#ff9ff3', 
        '#f368e0', 
        '#bf95f9', 
        '#ffa8a3', 
        '#feca57', 
        '#48dbfb', 
      ],
    },
  },
};


export const CONFETTI_CONFIGS = {
  lil: {
    duration: 2000, 
    fire: (origin: { x: number; y: number }) => ({
      particleCount: 15,
      spread: 40,
      origin,
      ticks: 40, 
      colors: ['#86efac', '#bbf7d0'], 
    }),
  },
  small: {
    duration: 3000, 
    fire: (origin: { x: number; y: number }) => ({
      particleCount: 25,
      spread: 60,
      origin,
      ticks: 60, 
      colors: ['#10b981', '#34d399'], 
    }),
  },
  decent: {
    duration: 3000,
    fire: (origin: { x: number; y: number }) => [
      {
        particleCount: 25,
        spread: 70,
        origin: { x: 0.1, y: 0.6 }, 
        ticks: 60,
        colors: ['#10b981', '#fbbf24'], 
      },
      {
        particleCount: 25,
        spread: 70,
        origin: { x: 0.9, y: 0.6 }, 
        ticks: 60,
        colors: ['#10b981', '#fbbf24'], 
      }
    ],
  },
  big: {
    duration: 3000,
    fire: (origin: { x: number; y: number }) => ({
      particleCount: 30,
      spread: 80,
      origin,
      ticks: 80,
      shapes: ['circle', 'square'], 
      colors: ['#fbbf24', '#f59e0b'], 
    }),
  },
  huge: {
    duration: 3000,
    fire: (origin: { x: number; y: number }) => ({
      particleCount: 30,
      spread: 90,
      origin,
      ticks: 80,
      shapes: ['circle', 'square'],
      colors: ['#f59e0b', '#ef4444', '#ec4899'], 
    }),
  },
  legendary: {
    duration: 3000,
    fire: (origin: { x: number; y: number }) => ({
      particleCount: 35,
      spread: 100,
      origin,
      ticks: 100,
      shapes: ['circle', 'square', 'star'],
      colors: ['#8b5cf6', '#ec4899', '#f59e0b'], 
    }),
  },
  epic: {
    duration: 3000,
    fire: (origin: { x: number; y: number }) => ({
      particleCount: 35,
      spread: 110,
      origin,
      ticks: 100,
      shapes: ['circle', 'square', 'star'],
      colors: ['#06b6d4', '#8b5cf6', '#ec4899'], 
    }),
  },
  mythical: {
    duration: 3000,
    fire: (origin: { x: number; y: number }) => ({
      particleCount: 40,
      spread: 120,
      origin,
      ticks: 120,
      shapes: ['circle', 'square', 'star'],
      colors: ['#ffffff', '#ffd700', '#ff6b35'], 
    }),
  },
  godlike: {
    duration: 3000,
    fire: (origin: { x: number; y: number }) => ({
      particleCount: 40,
      spread: 130,
      origin,
      ticks: 120,
      shapes: ['circle', 'square', 'star'],
      colors: ['#ffd700', '#ffffff', '#06b6d4'], 
    }),
  },
  transcendent: {
    duration: 3000,
    fire: (origin: { x: number; y: number }) => ({
      particleCount: 45,
      spread: 140,
      origin,
      ticks: 140,
      shapes: ['circle', 'square', 'star'],
      colors: ['#ffffff', '#ffd700', '#8b5cf6', '#ec4899'], 
    }),
  },
};