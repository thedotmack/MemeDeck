
import confetti from 'canvas-confetti';
import { CONFETTI_CONFIGS } from '@/lib/config/win-tiers';


let CUSTOM_SHAPES: { dollar?: any; coin?: any } = {};

const initializeCustomShapes = () => {
  if (typeof window === 'undefined') return; 
  
  if (!CUSTOM_SHAPES.dollar) {
    CUSTOM_SHAPES.dollar = confetti.shapeFromPath({
      path: 'M5 0 L5 2 L3 2 L3 3 L5 3 L5 5 L3 5 L3 6 L5 6 L5 8 L6 8 L6 6 L8 6 L8 5 L6 5 L6 3 L8 3 L8 2 L6 2 L6 0 Z',
    });
  }
  
  if (!CUSTOM_SHAPES.coin) {
    CUSTOM_SHAPES.coin = confetti.shapeFromPath({
      path: 'M5 0 A5 5 0 1 0 5 10 A5 5 0 1 0 5 0 Z',
    });
  }
};

class ConfettiService {
  private currentInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastTier: keyof typeof CONFETTI_CONFIGS | null = null;
  private lastTriggerTime = 0;
  
  
  private activeAnimations = new Map<string, { cleanup: () => void; priority: number }>();
  private resourceBusy = false;

  
  cleanup() {
    if (this.currentInterval) {
      clearInterval(this.currentInterval);
      this.currentInterval = null;
    }
    this.isRunning = false;
    
    
    if (typeof window !== 'undefined' && confetti) {
      confetti.reset();
    }
  }

  
  triggerUnifiedConfetti(
    config: {
      duration: number;
      particleCount: number;
      colors: string[];
      origin: { x: number; y: number };
    },
    animationId: string,
    priority: number = 50
  ): boolean {
    
    if (typeof window === 'undefined') return false;
    
    
    if (this.resourceBusy) {
      
      const currentAnimations = Array.from(this.activeAnimations.values());
      const canInterrupt = currentAnimations.every(anim => anim.priority < priority);
      
      if (!canInterrupt) {
        return false; 
      }
      
      
      this.cleanupAnimation(animationId);
    }

    
    initializeCustomShapes();
    
    
    this.resourceBusy = true;
    
    
    const cleanup = this.executeUnifiedConfetti(config);
    
    
    this.activeAnimations.set(animationId, { cleanup, priority });
    
    return true;
  }

  private executeUnifiedConfetti(config: {
    duration: number;
    particleCount: number;
    colors: string[];
    origin: { x: number; y: number };
  }): () => void {
    if (typeof window === 'undefined') return () => {};
    
    const { duration, particleCount, colors, origin } = config;
    const animationEnd = Date.now() + duration;
    let intervalId: NodeJS.Timeout | null = null;

    
    if (duration <= 1000) {
      confetti({
        particleCount,
        colors,
        origin,
        spread: 70,
        scalar: 1.2,
      });
      
      setTimeout(() => {
        this.resourceBusy = false;
      }, duration);
      
      return () => {
        this.resourceBusy = false;
      };
    }
    
    
    intervalId = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      
      if (timeLeft <= 0) {
        if (intervalId) clearInterval(intervalId);
        this.resourceBusy = false;
        return;
      }

      const scaledParticles = Math.floor(particleCount * (timeLeft / duration) * 0.3);
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
      
      confetti({
        particleCount: scaledParticles,
        colors,
        origin: {
          x: randomInRange(origin.x - 0.1, origin.x + 0.1),
          y: randomInRange(origin.y - 0.1, origin.y + 0.1),
        },
        spread: 60,
        scalar: 1.0,
      });
    }, Math.max(100, duration / 10));

    return () => {
      if (intervalId) clearInterval(intervalId);
      this.resourceBusy = false;
    };
  }

  cleanupAnimation(animationId: string): void {
    const animation = this.activeAnimations.get(animationId);
    if (animation) {
      animation.cleanup();
      this.activeAnimations.delete(animationId);
    }
  }

  
  isResourceAvailable(): boolean {
    return !this.resourceBusy;
  }

  
  getResourceUtilization(): number {
    return this.resourceBusy ? 100 : 0;
  }

  
  triggerConfetti(tier: keyof typeof CONFETTI_CONFIGS, origin = { x: 0.5, y: 0.5 }) {
    
    if (typeof window === 'undefined') return;
    
    
    if (this.isRunning && this.lastTier === tier && Date.now() - this.lastTriggerTime < 300) {
      return;
    }
    
    
    this.cleanup();
    
    
    initializeCustomShapes();
    
    const config = CONFETTI_CONFIGS[tier];
    this.isRunning = true;
    this.lastTier = tier;
    this.lastTriggerTime = Date.now();

    switch (tier) {
      case 'small':
        this.fireSingle(config, origin);
        break;

      case 'decent':
        this.fireSideCannons(config, origin);
        break;

      case 'big':
        this.fireStarsBurst(config, origin);
        break;

      case 'huge':
        this.fireFireworks(config, origin);
        break;

      case 'legendary':
        this.fireLegendary(config, origin);
        break;

      case 'epic':
        this.fireEpic(config, origin);
        break;

      case 'mythical':
        this.fireMythical(config, origin);
        break;

      case 'godlike':
        this.fireGodlike(config, origin);
        break;

      case 'transcendent':
        this.fireTranscendent(config, origin);
        break;
    }
  }

  private fireSingle(config: any, origin: { x: number; y: number }) {
    if (typeof window === 'undefined') return;
    
    const confettiConfig = config.fire(origin);
    confetti(confettiConfig);
    
    
    setTimeout(() => {
      this.isRunning = false;
      
      if (typeof window !== 'undefined' && confetti) {
        confetti.reset();
      }
    }, config.duration || 1000);
  }

  private fireSideCannons(config: any, origin: { x: number; y: number }) {
    if (typeof window === 'undefined') return;
    const [left, right] = config.fire(origin);
    confetti(left);
    confetti(right);
    
    
    setTimeout(() => {
      this.isRunning = false;
      
      if (typeof window !== 'undefined' && confetti) {
        confetti.reset();
      }
    }, config.duration || 3000);
  }

  private fireStarsBurst(config: any, origin: { x: number; y: number }) {
    if (typeof window === 'undefined') return;
    confetti(config.fire(origin));
    setTimeout(() => {
      if (this.isRunning && typeof window !== 'undefined') confetti(config.fire(origin));
    }, 100);
    setTimeout(() => {
      if (this.isRunning && typeof window !== 'undefined') confetti(config.fire(origin));
    }, 200);
    
    
    setTimeout(() => {
      this.isRunning = false;
      
      if (typeof window !== 'undefined' && confetti) {
        confetti.reset();
      }
    }, config.duration || 3000);
  }

  private fireFireworks(config: any, origin: { x: number; y: number }) {
    if (typeof window === 'undefined') return;
    const duration = config.duration;
    const animationEnd = Date.now() + duration;

    this.currentInterval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      
      if (timeLeft <= 0 || !this.isRunning) {
        this.cleanup();
        return;
      }

      const particleCount = 50 * (timeLeft / duration);
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
      
      confetti({
        ...config.fire(origin),
        particleCount,
        origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  }

  private fireLegendary(config: any, origin: { x: number; y: number }) {
    if (typeof window === 'undefined') return;
    
    
    const burstTimes = [0, 800, 1600, 2400]; 
    
    burstTimes.forEach((delay) => {
      setTimeout(() => {
        if (!this.isRunning) return;
        
        const useCustom = Math.random() > 0.5 && CUSTOM_SHAPES.dollar && CUSTOM_SHAPES.coin;
        confetti({
          ...config.fire(origin),
          particleCount: 60, 
          shapes: useCustom ? [CUSTOM_SHAPES.dollar, CUSTOM_SHAPES.coin] : ['circle', 'square'],
          origin: {
            x: 0.3 + Math.random() * 0.4, 
            y: 0.4 + Math.random() * 0.2,
          },
        });
      }, delay);
    });
    
    
    setTimeout(() => {
      this.isRunning = false;
      if (typeof window !== 'undefined' && confetti) {
        confetti.reset();
      }
    }, config.duration || 3000);
  }

  private fireEpic(config: any, origin: { x: number; y: number }) {
    if (typeof window === 'undefined') return;
    
    
    const burstTimes = [0, 600, 1200, 1800, 2400];
    
    burstTimes.forEach((delay, index) => {
      setTimeout(() => {
        if (!this.isRunning) return;
        
        const useCustom = Math.random() > 0.3 && CUSTOM_SHAPES.dollar && CUSTOM_SHAPES.coin;
        const intensity = 1 + (index * 0.3); 
        
        confetti({
          ...config.fire(origin),
          particleCount: Math.floor(80 * intensity), 
          shapes: useCustom ? [CUSTOM_SHAPES.dollar, CUSTOM_SHAPES.coin, 'star', 'circle'] : ['circle', 'square', 'star', 'heart'],
          origin: {
            x: 0.2 + Math.random() * 0.6,
            y: 0.3 + Math.random() * 0.3,
          },
        });
      }, delay);
    });
    
    
    setTimeout(() => {
      this.isRunning = false;
      if (typeof window !== 'undefined' && confetti) {
        confetti.reset();
      }
    }, config.duration || 3000);
  }

  private fireMythical(config: any, origin: { x: number; y: number }) {
    if (typeof window === 'undefined') return;
    
    
    const burstTimes = [0, 500, 1000, 1500, 2000, 2500];
    
    burstTimes.forEach((delay, index) => {
      setTimeout(() => {
        if (!this.isRunning) return;
        
        const useCustom = Math.random() > 0.2 && CUSTOM_SHAPES.dollar && CUSTOM_SHAPES.coin;
        const isLeftSide = index % 2 === 0;
        
        confetti({
          ...config.fire(origin),
          particleCount: 90,
          shapes: useCustom ? [CUSTOM_SHAPES.dollar, CUSTOM_SHAPES.coin, 'star', 'circle', 'square'] : ['circle', 'square', 'star', 'heart', 'diamond'],
          origin: {
            x: isLeftSide ? 0.2 + Math.random() * 0.2 : 0.6 + Math.random() * 0.2,
            y: 0.3 + Math.random() * 0.2,
          },
        });
      }, delay);
    });
    
    
    setTimeout(() => {
      this.isRunning = false;
      if (typeof window !== 'undefined' && confetti) {
        confetti.reset();
      }
    }, config.duration || 3000);
  }

  private fireGodlike(config: any, origin: { x: number; y: number }) {
    if (typeof window === 'undefined') return;
    
    
    const burstTimes = [0, 400, 800, 1400, 2000, 2600];
    
    burstTimes.forEach((delay, index) => {
      setTimeout(() => {
        if (!this.isRunning) return;
        
        const useCustom = CUSTOM_SHAPES.dollar && CUSTOM_SHAPES.coin;
        const isPowerStrike = index % 2 === 1; 
        
        confetti({
          ...config.fire(origin),
          particleCount: isPowerStrike ? 120 : 80,
          shapes: useCustom ? [CUSTOM_SHAPES.dollar, CUSTOM_SHAPES.coin, 'star', 'circle', 'square'] : ['circle', 'square', 'star', 'heart', 'diamond'],
          origin: {
            x: 0.3 + Math.random() * 0.4,
            y: 0.2 + Math.random() * 0.2,
          },
        });
      }, delay);
    });
    
    
    setTimeout(() => {
      this.isRunning = false;
      if (typeof window !== 'undefined' && confetti) {
        confetti.reset();
      }
    }, config.duration || 3000);
  }

  private fireTranscendent(config: any, origin: { x: number; y: number }) {
    if (typeof window === 'undefined') return;
    
    
    const burstTimes = [0, 450, 900, 1350, 1800, 2250, 2700];
    
    burstTimes.forEach((delay, index) => {
      setTimeout(() => {
        if (!this.isRunning) return;
        
        const useCustom = CUSTOM_SHAPES.dollar && CUSTOM_SHAPES.coin;
        const isFinale = index === burstTimes.length - 1;
        const intensity = 1 + (index * 0.2); 
        
        confetti({
          ...config.fire(origin),
          particleCount: Math.floor((isFinale ? 150 : 100) * intensity),
          shapes: useCustom ? [CUSTOM_SHAPES.dollar, CUSTOM_SHAPES.coin, 'star', 'circle', 'square'] : ['circle', 'square', 'star', 'heart', 'diamond', 'cross'],
          origin: {
            x: 0.2 + Math.random() * 0.6,
            y: 0.1 + Math.random() * 0.2,
          },
        });
      }, delay);
    });
    
    
    setTimeout(() => {
      this.isRunning = false;
      if (typeof window !== 'undefined' && confetti) {
        confetti.reset();
      }
    }, config.duration || 3000);
  }

  
  triggerAchievementConfetti(colors: string[] = ['#FFD700', '#FFA500', '#FF8C00'], tier: string = 'bronze') {
    if (typeof window === 'undefined') return;
    
    
    const celebrationTier = this.getAchievementCelebrationTier(tier);
    
    
    this.triggerConfetti(celebrationTier, { x: 0.5, y: 0.6 });
    
    
  }

  
  private getAchievementCelebrationTier(achievementTier: string): keyof typeof CONFETTI_CONFIGS {
    const tierMapping = {
      bronze: 'small',      
      silver: 'big',        
      gold: 'legendary',    
      platinum: 'mythical', 
      diamond: 'transcendent' 
    } as const;
    
    return tierMapping[achievementTier as keyof typeof tierMapping] || 'small';
  }

  
  private getAchievementIntensity(tier: string) {
    const celebrationTier = this.getAchievementCelebrationTier(tier);
    const config = CONFETTI_CONFIGS[celebrationTier];
    
    const fireResult = config.fire({ x: 0.5, y: 0.5 });
    const particleCount = Array.isArray(fireResult) 
      ? fireResult[0]?.particleCount || 50 
      : fireResult.particleCount || 50;
    
    return {
      duration: config.duration || 2000,
      particleCount
    };
  }
}


export const confettiService = new ConfettiService();