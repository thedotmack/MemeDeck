
export type WinTier = 'lil' | 'small' | 'decent' | 'big' | 'huge' | 'legendary' | 'epic' | 'mythical' | 'godlike' | 'transcendent';
export type LossTier = 'small' | 'moderate' | 'significant' | 'major' | 'devastating' | 'catastrophic' | 'nuclear' | 'apocalyptic' | 'extinction' | 'total_loss';



export interface WinTierConfig {
  threshold: number; 
  name: string;
  confetti: {
    particleCount: number;
    spread: number;
    colors?: string[];
    shapes?: string[];
    scalar?: number;
    startVelocity?: number;
  };
  animation: {
    duration: number;
    cardAnimation: 
      | 'subtlePulse'
      | 'gentleBounce'
      | 'cardFlip'
      | 'cardLevitate'
      | 'goldExplosion'
      | 'legendarySequence'
      | 'epicSequence'
      | 'mythicalSequence'
      | 'godlikeSequence'
      | 'transcendentSequence';
    screenEffect?: 'shake' | 'flash' | 'both';
    effectIntensity?: 'light' | 'medium' | 'heavy';
  };
  audio: {
    melody: string[];
    bassTones?: string[];
    percussive?: boolean;
  };
  borderBeam?: {
    duration: number;
    delay?: number;
    colors: string[];
  };
}

export interface LossTierConfig {
  threshold: number; 
  name: string;
  particles: {
    particleCount: number;
    spread: number;
    colors: string[];
    direction: 'downward' | 'storm';
    gravity: number;
    pattern?: 'melting' | 'draining' | 'chaos';
    drift?: string;
    velocity?: 'normal' | 'fast' | 'extreme';
    duration?: number;
  };
  animation: {
    duration: number;
    cardAnimation: 
      | 'gentleDim'
      | 'moderateDim'
      | 'notableDim'
      | 'strongDim'
      | 'devastatingDim'
      | 'catastrophicDim'
      | 'nuclearDim'
      | 'apocalypticDim'
      | 'extinctionDim'
      | 'phoenixSequence';
    screenEffect?: 'none' | 'subtle-tint' | 'light-pulse' | 'shake-flash';
    effectIntensity?: 'minimal' | 'light' | 'moderate' | 'strong' | 'heavy';
  };
  audio: {
    melody: string[];
    bassTones?: string[];
    percussive?: boolean;
    dramatic?: boolean;
    volume: number;
  };
  borderEffect: {
    duration: number;
    colors: string[];
    pattern: 'pulse' | 'beam' | 'glow' | 'heavy-beam' | 'storm';
    intensity: 'subtle' | 'moderate' | 'notable' | 'strong' | 'devastating';
  };
}

