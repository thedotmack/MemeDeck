




export type AnimationPriority = 'critical' | 'high' | 'medium' | 'low';



export type AnimationType = 
  | 'price_change'      
  | 'celebration'       
  | 'loss_animation'    
  | 'audio_sequence'    
  | 'attention_seeker'; 


export type AnimationResource = 
  | 'border_beam'       
  | 'sparkles'          
  | 'screen_shake'      
  | 'screen_flash'      
  | 'screen_tint'       
  | 'audio_mixer'       
  | 'confetti_system'   
  | 'effects_3d_system'; 


export interface AnimationDefinition {
  id: string;
  cardId?: string;                    
  type: AnimationType;
  priority: AnimationPriority;
  duration: number;                   
  
  
  resources: AnimationResource[];
  
  
  config: AnimationConfig;
  
  
  onStart?: () => void;
  onPhaseComplete?: (phase: string) => void;
  onComplete?: () => void;
  onCancel?: () => void;
}


export type AnimationConfig = 
  | PriceAnimationConfig
  | CelebrationAnimationConfig  
  | LossAnimationConfig
  | AudioSequenceConfig
  | SparklesAnimationConfig
  | AttentionSeekerConfig;


export type PriceChangeType = 'gain' | 'loss' | 'stable';


export type AnimationIntensity = 'minimal' | 'light' | 'moderate' | 'strong' | 'heavy' | 'extreme';


export interface PriceAnimationConfig {
  type: 'price_change';
  oldPrice: number;
  newPrice: number;
  percentChange: number;
  changeType: PriceChangeType;
  intensity: AnimationIntensity;
  
  
  phases: {
    beam: {
      duration: number;
      colors: { from: string; to: string };
      size: number;
    };
    priceTransition: {
      duration: number;
      startValue: number;
      endValue: number;
    };
  };
}


export interface CelebrationAnimationConfig {
  type: 'celebration';
  tier: 'small' | 'decent' | 'big' | 'huge' | 'legendary' | 'epic' | 'mythical' | 'godlike' | 'transcendent';
  percentGain: number;
  
  
  phases: {
    effects3D?: {
      variant: string;
      text: string;
      particleType: 'coins' | 'gems' | 'crystals' | 'orbs' | 'cosmic';
      particleCount: number;
      intensity: 'subtle' | 'moderate' | 'massive' | 'extreme' | 'catastrophic';
      duration: number;
      audioLayers: {
        base: string;
        particle: string;
        impact: string;
        ambient?: string;
      };
    };
    audio?: {
      melody: string[];
      bassTones?: string[];
      percussive: boolean;
    };
    borderBeam?: {
      duration: number;
      colors: string[];
      delay?: number;
    };
    screenEffect?: {
      type: 'shake' | 'flash';
      intensity: 'light' | 'medium' | 'heavy';
      duration: number;
    };
    cardAnimation?: {
      
      type: 
        | 'subtlePulse'
        | 'gentleBounce'
        | 'cardFlip'
        | 'cardLevitate'
        | 'goldExplosion'
        | 'legendarySequence'
        | 'epicSequence'
        | 'mythicalSequence'
        | 'godlikeSequence'
        | 'transcendentSequence'
        | AttentionSeekerConfig['variant'];
      duration: number;
    };
  };
}


interface LossAnimationConfig {
  type: 'loss_animation';
  tier: 'small' | 'moderate' | 'significant' | 'major' | 'devastating' | 'catastrophic' | 'nuclear' | 'apocalyptic' | 'extinction' | 'total_loss';
  percentLoss: number;
  
  
  phases: {
    effects3D?: {
      variant: string;
      text: string;
      particleType: 'falling-coins' | 'debris' | 'ash' | 'void' | 'ceremonial-fire';
      particleCount: number;
      intensity: 'subtle' | 'moderate' | 'massive' | 'extreme' | 'catastrophic';
      duration: number;
      audioLayers: {
        base: string;
        particle: string;
        impact: string;
        ambient?: string;
      };
    };
    audio?: {
      melody: string[];
      bassTones?: string[];
      percussive: boolean;
      volume: number;
    };
    borderEffect?: {
      duration: number;
      colors: string[];
      pattern: 'pulse' | 'beam' | 'glow' | 'heavy-beam' | 'storm';
      intensity: 'subtle' | 'moderate' | 'notable' | 'strong' | 'devastating';
    };
    screenEffect?: {
      type: 'subtle-tint' | 'light-pulse' | 'shake-flash';
      intensity: 'minimal' | 'light' | 'moderate' | 'strong' | 'heavy';
      duration: number;
    };
    cardAnimation?: {
      
      type:
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
      duration: number;
    };
  };
}




interface AudioSequenceConfig {
  type: 'audio_sequence';
  sequences: {
    delay: number;
    notes: string[];
    duration: number;
    volume: number;
  }[];
  
  
  fadeIn?: number;
  fadeOut?: number;
  mixWith?: 'background' | 'silence';
}


interface SparklesAnimationConfig {
  type: 'sparkles';
  count: number;
  size: number;
  duration: number;
  colors: string[];
  pattern: 'twinkle' | 'float' | 'spiral' | 'burst';
  density: 'sparse' | 'normal' | 'dense';
  trigger: 'continuous' | 'burst' | 'controlled';
  repeat: boolean;
}


export interface AttentionSeekerConfig {
  type: 'attention_seeker';
  variant: 'bounce' | 'flash' | 'pulse' | 'rubberBand' | 'shakeX' | 'shakeY' | 'headShake' | 'swing' | 'tada' | 'wobble' | 'jello' | 'heartBeat';
  intensity: 'subtle' | 'normal' | 'dramatic';
  duration: number;
  repeat?: number | boolean;
  delay?: number;
  
  
  faster?: boolean;
  fast?: boolean;
  slow?: boolean;
  slower?: boolean;
  
  
  audio?: {
    enabled: boolean;
    variant: 'playful' | 'energetic' | 'subtle';
    volume: number;
  };
}


import type { LossTier, WinTier } from '@/lib/types/celebrations';

export interface AnimationFactory {
  createPriceAnimation: (cardId: string, oldPrice: number, newPrice: number) => AnimationDefinition;
  createCelebration: (cardId: string, tier: Exclude<WinTier, 'lil'> | 'small', percentGain: number, origin: { x: number; y: number }) => AnimationDefinition;
  createLossAnimation: (cardId: string, tier: LossTier, percentLoss: number, origin: { x: number; y: number }) => AnimationDefinition;
  createSparkles: (cardId: string, pattern: 'twinkle' | 'float' | 'spiral' | 'burst', intensity: 'subtle' | 'moderate' | 'dramatic') => AnimationDefinition;
  createAttentionSeeker: (cardId: string, variant: AttentionSeekerConfig['variant'], intensity?: 'subtle' | 'normal' | 'dramatic') => AnimationDefinition;
}


