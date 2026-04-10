
export type AchievementCategory = 
  | 'trading_volume'
  | 'consistency'
  | 'portfolio'
  | 'streaks'
  | 'holding'
  | 'diversification'
  | 'performance'
  | 'big_moves'
  | 'speed'
  | 'fees'
  | 'risk'
  | 'time_based'
  | 'market_behavior';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon?: string;
  imagePath?: string;
  unlockConditions: AchievementCondition;
  progressTracking?: boolean;
  maxProgress?: number;
  points?: number;
}

export type AchievementCondition =
  | {
      type: 'threshold' | 'count' | 'streak' | 'percentage' | 'time_based' | 'composite';
      metric: string;
      value: number;
      timeWindow?: number; 
      additionalCriteria?: Record<string, any>;
    }
  | {
      type: 'tier_unlock' | 'collection';
      metric: string;
      value: number | string;
      additionalCriteria?: Record<string, any>;
    };


export const ACHIEVEMENT_TIERS: Record<AchievementTier, { color: string; icon: string }> = {
  bronze: { color: '#CD7F32', icon: '🥉' },
  silver: { color: '#C0C0C0', icon: '🥈' },
  gold: { color: '#FFD700', icon: '🥇' },
  platinum: { color: '#E5E4E2', icon: '💎' },
  diamond: { color: '#B9F2FF', icon: '💠' }
};

