
import { Achievement, AchievementCategory, AchievementTier } from '@/lib/types/achievements';
import { getAchievementImage } from '@/lib/services/achievement-asset-service';


export const TRADING_VOLUME_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_trade',
    name: 'First Steps',
    description: 'Complete your first trade',
    category: 'trading_volume',
    tier: 'bronze',
    imagePath: getAchievementImage('first_trade'),
    unlockConditions: {
      type: 'count',
      metric: 'total_trades',
      value: 1
    }
  },
  {
    id: 'trader_10',
    name: 'Getting Started',
    description: 'Complete 10 trades',
    category: 'trading_volume',
    tier: 'bronze',
    imagePath: getAchievementImage('trader_10'),
    unlockConditions: {
      type: 'count',
      metric: 'total_trades',
      value: 10
    },
    progressTracking: true,
    maxProgress: 10
  },
  {
    id: 'trader_100',
    name: 'Experienced Trader',
    description: 'Complete 100 trades',
    category: 'trading_volume',
    tier: 'silver',
    imagePath: getAchievementImage('trader_100'),
    unlockConditions: {
      type: 'count',
      metric: 'total_trades',
      value: 100
    },
    progressTracking: true,
    maxProgress: 100
  },
  {
    id: 'trader_1000',
    name: 'Master Trader',
    description: 'Complete 1,000 trades',
    category: 'trading_volume',
    tier: 'gold',
    imagePath: getAchievementImage('trader_1000'),
    unlockConditions: {
      type: 'count',
      metric: 'total_trades',
      value: 1000
    },
    progressTracking: true,
    maxProgress: 1000
  },
  {
    id: 'volume_million',
    name: 'Whale Alert',
    description: 'Trade over $1M in total volume',
    category: 'trading_volume',
    tier: 'platinum',
    unlockConditions: {
      type: 'threshold',
      metric: 'total_volume',
      value: 1000000
    },
    progressTracking: true,
    maxProgress: 1000000
  }
];


export const CONSISTENCY_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'daily_trader_7',
    name: 'Week Warrior',
    description: 'Trade every day for 7 days',
    category: 'consistency',
    tier: 'bronze',
    imagePath: getAchievementImage('daily_trader_7'),
    unlockConditions: {
      type: 'streak',
      metric: 'daily_trades',
      value: 7
    },
    progressTracking: true,
    maxProgress: 7
  },
  {
    id: 'daily_trader_30',
    name: 'Monthly Dedication',
    description: 'Trade every day for 30 days',
    category: 'consistency',
    tier: 'silver',
    imagePath: getAchievementImage('daily_trader_30'),
    unlockConditions: {
      type: 'streak',
      metric: 'daily_trades',
      value: 30
    },
    progressTracking: true,
    maxProgress: 30
  },
  {
    id: 'weekly_trader_12',
    name: 'Quarterly Commitment',
    description: 'Trade every week for 12 weeks',
    category: 'consistency',
    tier: 'gold',
    imagePath: getAchievementImage('weekly_trader_12'),
    unlockConditions: {
      type: 'streak',
      metric: 'weekly_trades',
      value: 12
    },
    progressTracking: true,
    maxProgress: 12
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete 50 trades before 9 AM',
    category: 'consistency',
    tier: 'silver',
    imagePath: getAchievementImage('early_bird'),
    unlockConditions: {
      type: 'count',
      metric: 'early_trades',
      value: 50,
      additionalCriteria: { beforeHour: 9 }
    },
    progressTracking: true,
    maxProgress: 50
  }
];


export const PORTFOLIO_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'portfolio_100',
    name: 'Three Figures',
    description: 'Reach $100 portfolio value',
    category: 'portfolio',
    tier: 'bronze',
    unlockConditions: {
      type: 'threshold',
      metric: 'portfolio_value',
      value: 100
    }
  },
  {
    id: 'portfolio_1000',
    name: 'Four Figures',
    description: 'Reach $1,000 portfolio value',
    category: 'portfolio',
    tier: 'silver',
    unlockConditions: {
      type: 'threshold',
      metric: 'portfolio_value',
      value: 1000
    }
  },
  {
    id: 'portfolio_10000',
    name: 'Five Figures',
    description: 'Reach $10,000 portfolio value',
    category: 'portfolio',
    tier: 'gold',
    unlockConditions: {
      type: 'threshold',
      metric: 'portfolio_value',
      value: 10000
    }
  },
  {
    id: 'portfolio_100000',
    name: 'Six Figure Club',
    description: 'Reach $100,000 portfolio value',
    category: 'portfolio',
    tier: 'platinum',
    unlockConditions: {
      type: 'threshold',
      metric: 'portfolio_value',
      value: 100000
    }
  }
];


export const STREAK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'win_streak_3',
    name: 'Hat Trick',
    description: '3 profitable trades in a row',
    category: 'streaks',
    tier: 'bronze',
    unlockConditions: {
      type: 'streak',
      metric: 'win_streak',
      value: 3
    }
  },
  {
    id: 'win_streak_10',
    name: 'On Fire',
    description: '10 profitable trades in a row',
    category: 'streaks',
    tier: 'silver',
    unlockConditions: {
      type: 'streak',
      metric: 'win_streak',
      value: 10
    }
  },
  {
    id: 'win_streak_25',
    name: 'Unstoppable',
    description: '25 profitable trades in a row',
    category: 'streaks',
    tier: 'gold',
    unlockConditions: {
      type: 'streak',
      metric: 'win_streak',
      value: 25
    }
  },
  {
    id: 'comeback_king',
    name: 'Comeback King',
    description: 'Win after 5 losses in a row',
    category: 'streaks',
    tier: 'silver',
    unlockConditions: {
      type: 'composite',
      metric: 'comeback',
      value: 1,
      additionalCriteria: { afterLosses: 5 }
    }
  },
  {
    id: 'perfect_day',
    name: 'Perfect Day',
    description: 'All trades profitable in a single day (min 5)',
    category: 'streaks',
    tier: 'gold',
    unlockConditions: {
      type: 'composite',
      metric: 'perfect_day',
      value: 1,
      additionalCriteria: { minTrades: 5 }
    }
  }
];


export const HOLDING_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'diamond_hands_24h',
    name: 'Day Holder',
    description: 'Hold a position for 24 hours',
    category: 'holding',
    tier: 'bronze',
    unlockConditions: {
      type: 'time_based',
      metric: 'hold_duration',
      value: 86400000 
    }
  },
  {
    id: 'diamond_hands_week',
    name: 'Week Warrior',
    description: 'Hold a position for 1 week',
    category: 'holding',
    tier: 'silver',
    unlockConditions: {
      type: 'time_based',
      metric: 'hold_duration',
      value: 604800000 
    }
  },
  {
    id: 'diamond_hands_month',
    name: 'Monthly Master',
    description: 'Hold a position for 1 month',
    category: 'holding',
    tier: 'gold',
    unlockConditions: {
      type: 'time_based',
      metric: 'hold_duration',
      value: 2592000000 
    }
  },
  {
    id: 'paper_hands',
    name: 'Paper Hands',
    description: 'Sell within 1 minute of buying (10 times)',
    category: 'holding',
    tier: 'bronze',
    unlockConditions: {
      type: 'count',
      metric: 'quick_sells',
      value: 10,
      additionalCriteria: { withinMinutes: 1 }
    }
  }
];


export const DIVERSIFICATION_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'diverse_5',
    name: 'Variety Pack',
    description: 'Hold 5 different tokens at once',
    category: 'diversification',
    tier: 'bronze',
    imagePath: getAchievementImage('diverse_5'),
    unlockConditions: {
      type: 'count',
      metric: 'unique_holdings',
      value: 5
    }
  },
  {
    id: 'diverse_10',
    name: 'Well Rounded',
    description: 'Hold 10 different tokens at once',
    category: 'diversification',
    tier: 'silver',
    unlockConditions: {
      type: 'count',
      metric: 'unique_holdings',
      value: 10
    }
  },
  {
    id: 'diverse_25',
    name: 'Diversification Master',
    description: 'Hold 25 different tokens at once',
    category: 'diversification',
    tier: 'gold',
    unlockConditions: {
      type: 'count',
      metric: 'unique_holdings',
      value: 25
    }
  },
  {
    id: 'balanced_portfolio',
    name: 'Perfectly Balanced',
    description: 'No single position over 20% of portfolio (min 5 positions)',
    category: 'diversification',
    tier: 'silver',
    unlockConditions: {
      type: 'percentage',
      metric: 'max_position_percentage',
      value: 20,
      additionalCriteria: { minPositions: 5 }
    }
  }
];


export const PERFORMANCE_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'profit_100',
    name: 'First Profit',
    description: 'Earn $100 in total profit',
    category: 'performance',
    tier: 'bronze',
    imagePath: getAchievementImage('profit_100'),
    unlockConditions: {
      type: 'threshold',
      metric: 'total_profit',
      value: 100
    },
    progressTracking: true,
    maxProgress: 100
  },
  {
    id: 'profit_1000',
    name: 'Profit Machine',
    description: 'Earn $1,000 in total profit',
    category: 'performance',
    tier: 'silver',
    unlockConditions: {
      type: 'threshold',
      metric: 'total_profit',
      value: 1000
    },
    progressTracking: true,
    maxProgress: 1000
  },
  {
    id: 'profit_10000',
    name: 'Big Earner',
    description: 'Earn $10,000 in total profit',
    category: 'performance',
    tier: 'gold',
    unlockConditions: {
      type: 'threshold',
      metric: 'total_profit',
      value: 10000
    },
    progressTracking: true,
    maxProgress: 10000
  },
  {
    id: 'win_rate_60',
    name: 'Consistent Winner',
    description: 'Maintain 60% win rate (min 50 trades)',
    category: 'performance',
    tier: 'silver',
    unlockConditions: {
      type: 'percentage',
      metric: 'win_rate',
      value: 60,
      additionalCriteria: { minTrades: 50 }
    }
  },
  {
    id: 'win_rate_80',
    name: 'Trading God',
    description: 'Maintain 80% win rate (min 100 trades)',
    category: 'performance',
    tier: 'platinum',
    unlockConditions: {
      type: 'percentage',
      metric: 'win_rate',
      value: 80,
      additionalCriteria: { minTrades: 100 }
    }
  }
];


export const BIG_MOVES_ACHIEVEMENTS: Achievement[] = [
  
  {
    id: 'moonshot',
    name: 'To The Moon',
    description: 'Single trade with 10x return',
    category: 'big_moves',
    tier: 'gold',
    imagePath: getAchievementImage('moonshot'),
    unlockConditions: {
      type: 'threshold',
      metric: 'single_trade_multiplier',
      value: 10
    }
  },
  {
    id: 'jackpot',
    name: 'Jackpot',
    description: 'Single trade profit over $10,000',
    category: 'big_moves',
    tier: 'platinum',
    unlockConditions: {
      type: 'threshold',
      metric: 'single_trade_profit',
      value: 10000
    }
  },
  {
    id: 'survivor',
    name: 'Survivor',
    description: 'Recover from 90% portfolio loss',
    category: 'big_moves',
    tier: 'gold',
    unlockConditions: {
      type: 'composite',
      metric: 'recovery',
      value: 1,
      additionalCriteria: { fromLoss: 90 }
    }
  },
  {
    id: 'risk_taker',
    name: 'Risk Taker',
    description: 'Make a trade worth 50% of portfolio',
    category: 'big_moves',
    tier: 'silver',
    unlockConditions: {
      type: 'percentage',
      metric: 'trade_size_percentage',
      value: 50
    }
  },
  {
    id: 'all_in',
    name: 'All In',
    description: 'Trade 100% of portfolio in one position',
    category: 'big_moves',
    tier: 'gold',
    unlockConditions: {
      type: 'percentage',
      metric: 'trade_size_percentage',
      value: 100
    }
  },
  {
    id: 'rekt',
    name: 'REKT',
    description: 'Lose 50% on a single trade and keep playing',
    category: 'big_moves',
    tier: 'bronze',
    unlockConditions: {
      type: 'composite',
      metric: 'big_loss_survivor',
      value: 1,
      additionalCriteria: { lossPercentage: 50 }
    }
  },

  
  {
    id: 'first_green',
    name: 'First Green',
    description: 'Reach Small Win tier (1%+ gain)',
    category: 'big_moves',
    tier: 'bronze',
    unlockConditions: {
      type: 'tier_unlock',
      metric: 'win_tier_reached',
      value: 'small'
    }
  },
  {
    id: 'decent_achiever',
    name: 'Decent Achiever',
    description: 'Reach Decent Win tier (2%+ gain)',
    category: 'big_moves',
    tier: 'bronze',
    unlockConditions: {
      type: 'tier_unlock',
      metric: 'win_tier_reached',
      value: 'decent'
    }
  },
  {
    id: 'big_winner',
    name: 'Big Winner',
    description: 'Reach Big Win tier (5%+ gain)',
    category: 'big_moves',
    tier: 'silver',
    imagePath: getAchievementImage('big_winner'),
    unlockConditions: {
      type: 'tier_unlock',
      metric: 'win_tier_reached',
      value: 'big'
    }
  },
  {
    id: 'huge_success',
    name: 'Huge Success',
    description: 'Reach Huge Win tier (10%+ gain)',
    category: 'big_moves',
    tier: 'silver',
    unlockConditions: {
      type: 'tier_unlock',
      metric: 'win_tier_reached',
      value: 'huge'
    }
  },
  {
    id: 'legendary_trader',
    name: 'Legendary Status',
    description: 'Reach Legendary Win tier (20%+ gain)',
    category: 'big_moves',
    tier: 'gold',
    unlockConditions: {
      type: 'tier_unlock',
      metric: 'win_tier_reached',
      value: 'legendary'
    }
  },
  {
    id: 'epic_master',
    name: 'Epic Achievement',
    description: 'Reach Epic Win tier (30%+ gain)',
    category: 'big_moves',
    tier: 'gold',
    unlockConditions: {
      type: 'tier_unlock',
      metric: 'win_tier_reached',
      value: 'epic'
    }
  },
  {
    id: 'mythical_trader',
    name: 'Mythical Gains',
    description: 'Reach Mythical Win tier (50%+ gain)',
    category: 'big_moves',
    tier: 'platinum',
    unlockConditions: {
      type: 'tier_unlock',
      metric: 'win_tier_reached',
      value: 'mythical'
    }
  },
  {
    id: 'godlike_performance',
    name: 'Godlike Performance',
    description: 'Reach Godlike Win tier (75%+ gain)',
    category: 'big_moves',
    tier: 'platinum',
    unlockConditions: {
      type: 'tier_unlock',
      metric: 'win_tier_reached',
      value: 'godlike'
    }
  },
  {
    id: 'transcendent_master',
    name: 'Transcendent Master',
    description: 'Reach Transcendent Win tier (100%+ gain)',
    category: 'big_moves',
    tier: 'diamond',
    unlockConditions: {
      type: 'tier_unlock',
      metric: 'win_tier_reached',
      value: 'transcendent'
    }
  },

  
  {
    id: 'first_red',
    name: 'Reality Check',
    description: 'Experience Small Loss tier (1%+ loss)',
    category: 'big_moves',
    tier: 'bronze',
    unlockConditions: {
      type: 'tier_unlock',
      metric: 'loss_tier_reached',
      value: 'small'
    }
  },
  {
    id: 'moderate_learner',
    name: 'Learning Experience',
    description: 'Experience Moderate Loss tier (2%+ loss)',
    category: 'big_moves',
    tier: 'bronze',
    unlockConditions: {
      type: 'tier_unlock',
      metric: 'loss_tier_reached',
      value: 'moderate'
    }
  },
  {
    id: 'significant_survivor',
    name: 'Tough Lesson',
    description: 'Experience Significant Loss tier (3%+ loss)',
    category: 'big_moves',
    tier: 'bronze',
    unlockConditions: {
      type: 'tier_unlock',
      metric: 'loss_tier_reached',
      value: 'significant'
    }
  },
  {
    id: 'major_endurance',
    name: 'Major Endurance',
    description: 'Experience Major Loss tier (4%+ loss)',
    category: 'big_moves',
    tier: 'silver',
    unlockConditions: {
      type: 'tier_unlock',
      metric: 'loss_tier_reached',
      value: 'major'
    }
  },
  {
    id: 'devastating_resilience',
    name: 'Devastating Resilience',
    description: 'Experience Devastating Loss tier (5%+ loss)',
    category: 'big_moves',
    tier: 'silver',
    unlockConditions: {
      type: 'tier_unlock',
      metric: 'loss_tier_reached',
      value: 'devastating'
    }
  },
  {
    id: 'catastrophic_courage',
    name: 'Catastrophic Courage',
    description: 'Experience Catastrophic Loss tier (10%+ loss)',
    category: 'big_moves',
    tier: 'gold',
    unlockConditions: {
      type: 'tier_unlock',
      metric: 'loss_tier_reached',
      value: 'catastrophic'
    }
  },
  {
    id: 'nuclear_nerve',
    name: 'Nuclear Nerve',
    description: 'Experience Nuclear Loss tier (25%+ loss)',
    category: 'big_moves',
    tier: 'gold',
    unlockConditions: {
      type: 'tier_unlock',
      metric: 'loss_tier_reached',
      value: 'nuclear'
    }
  },
  {
    id: 'apocalyptic_acceptance',
    name: 'Apocalyptic Acceptance',
    description: 'Experience Apocalyptic Loss tier (50%+ loss)',
    category: 'big_moves',
    tier: 'platinum',
    unlockConditions: {
      type: 'tier_unlock',
      metric: 'loss_tier_reached',
      value: 'apocalyptic'
    }
  },
  {
    id: 'extinction_endurance',
    name: 'Extinction Endurance',
    description: 'Experience Extinction Loss tier (75%+ loss)',
    category: 'big_moves',
    tier: 'platinum',
    unlockConditions: {
      type: 'tier_unlock',
      metric: 'loss_tier_reached',
      value: 'extinction'
    }
  },
  {
    id: 'phoenix_spirit',
    name: 'Phoenix Spirit',
    description: 'Experience Total Loss tier (100%+ loss) and continue',
    category: 'big_moves',
    tier: 'diamond',
    unlockConditions: {
      type: 'tier_unlock',
      metric: 'loss_tier_reached',
      value: 'total_loss'
    }
  },

  
  {
    id: 'tier_collector',
    name: 'Tier Collector',
    description: 'Unlock all 9 win tiers',
    category: 'big_moves',
    tier: 'diamond',
    unlockConditions: {
      type: 'collection',
      metric: 'win_tiers_unlocked',
      value: 9,
      additionalCriteria: { requiredTiers: ['small', 'decent', 'big', 'huge', 'legendary', 'epic', 'mythical', 'godlike', 'transcendent'] }
    }
  },
  {
    id: 'experience_master',
    name: 'Experience Master',
    description: 'Experience all 10 loss tiers',
    category: 'big_moves',
    tier: 'diamond',
    unlockConditions: {
      type: 'collection',
      metric: 'loss_tiers_experienced',
      value: 10,
      additionalCriteria: { requiredTiers: ['small', 'moderate', 'significant', 'major', 'devastating', 'catastrophic', 'nuclear', 'apocalyptic', 'extinction', 'total_loss'] }
    }
  },
  {
    id: 'tier_grandmaster',
    name: 'Tier Grandmaster',
    description: 'Unlock all 19 animation tiers (wins + losses)',
    category: 'big_moves',
    tier: 'diamond',
    unlockConditions: {
      type: 'collection',
      metric: 'all_tiers_experienced',
      value: 19
    }
  }
];


export const SPEED_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete 10 trades in 1 hour',
    category: 'speed',
    tier: 'silver',
    unlockConditions: {
      type: 'count',
      metric: 'trades_per_hour',
      value: 10,
      timeWindow: 3600000 
    }
  },
  {
    id: 'flash_trader',
    name: 'Flash Trader',
    description: 'Complete 50 trades in 1 day',
    category: 'speed',
    tier: 'gold',
    unlockConditions: {
      type: 'count',
      metric: 'trades_per_day',
      value: 50,
      timeWindow: 86400000 
    }
  },
  {
    id: 'quick_flip',
    name: 'Quick Flip',
    description: 'Buy and sell within 5 minutes with profit (25 times)',
    category: 'speed',
    tier: 'silver',
    unlockConditions: {
      type: 'count',
      metric: 'quick_profitable_flips',
      value: 25,
      additionalCriteria: { withinMinutes: 5, profitable: true }
    }
  }
];


export const FEE_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'fee_conscious',
    name: 'Fee Conscious',
    description: 'Pay less than 1% in fees over 100 trades',
    category: 'fees',
    tier: 'silver',
    unlockConditions: {
      type: 'percentage',
      metric: 'fee_percentage',
      value: 1,
      additionalCriteria: { minTrades: 100, maxPercentage: true }
    }
  },
  {
    id: 'fee_whale',
    name: 'Fee Whale',
    description: 'Pay over $1,000 in total fees',
    category: 'fees',
    tier: 'gold',
    unlockConditions: {
      type: 'threshold',
      metric: 'total_fees_paid',
      value: 1000
    }
  },
  {
    id: 'fee_master',
    name: 'Fee Master',
    description: 'Profitable despite paying over $5,000 in fees',
    category: 'fees',
    tier: 'platinum',
    unlockConditions: {
      type: 'composite',
      metric: 'profitable_despite_fees',
      value: 1,
      additionalCriteria: { minFees: 5000, profitable: true }
    }
  }
];


export const RISK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'stop_loss_pro',
    name: 'Stop Loss Pro',
    description: 'Exit 10 losing positions at less than 10% loss',
    category: 'risk',
    tier: 'silver',
    unlockConditions: {
      type: 'count',
      metric: 'controlled_losses',
      value: 10,
      additionalCriteria: { maxLossPercentage: 10 }
    }
  },
  {
    id: 'risk_manager',
    name: 'Risk Manager',
    description: 'Never lose more than 5% on a single trade (100 trades)',
    category: 'risk',
    tier: 'gold',
    unlockConditions: {
      type: 'composite',
      metric: 'risk_control',
      value: 1,
      additionalCriteria: { maxLossPerTrade: 5, minTrades: 100 }
    }
  },
  {
    id: 'volatility_surfer',
    name: 'Volatility Surfer',
    description: 'Profit from 10 tokens with 50%+ daily volatility',
    category: 'risk',
    tier: 'gold',
    unlockConditions: {
      type: 'count',
      metric: 'volatile_wins',
      value: 10,
      additionalCriteria: { minVolatility: 50, profitable: true }
    }
  }
];


export const TIME_BASED_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Complete 50 trades after midnight',
    category: 'time_based',
    tier: 'silver',
    unlockConditions: {
      type: 'count',
      metric: 'night_trades',
      value: 50,
      additionalCriteria: { afterHour: 0, beforeHour: 6 }
    }
  },
  {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Trade every weekend for 2 months',
    category: 'time_based',
    tier: 'silver',
    unlockConditions: {
      type: 'streak',
      metric: 'weekend_trading_weeks',
      value: 8
    }
  },
  {
    id: 'market_timer',
    name: 'Market Timer',
    description: 'Profit in all market sessions (Asia, Europe, US) in one day',
    category: 'time_based',
    tier: 'gold',
    unlockConditions: {
      type: 'composite',
      metric: 'global_market_profit',
      value: 1,
      additionalCriteria: { sessions: ['asia', 'europe', 'us'] }
    }
  }
];


const MARKET_BEHAVIOR_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'trend_follower',
    name: 'Trend Follower',
    description: 'Profit from 10 trending tokens',
    category: 'market_behavior',
    tier: 'silver',
    unlockConditions: {
      type: 'count',
      metric: 'trend_profits',
      value: 10
    }
  },
  {
    id: 'contrarian',
    name: 'Contrarian',
    description: 'Buy 10 tokens after 20%+ drops and profit',
    category: 'market_behavior',
    tier: 'gold',
    unlockConditions: {
      type: 'count',
      metric: 'dip_buy_profits',
      value: 10,
      additionalCriteria: { minDrop: 20, profitable: true }
    }
  },
  {
    id: 'market_sage',
    name: 'Market Sage',
    description: 'Achieve 70% win rate in both bull and bear markets',
    category: 'market_behavior',
    tier: 'diamond',
    unlockConditions: {
      type: 'composite',
      metric: 'market_mastery',
      value: 1,
      additionalCriteria: { minWinRate: 70, bothMarkets: true }
    }
  }
];


export const ALL_ACHIEVEMENTS: Achievement[] = [
  ...TRADING_VOLUME_ACHIEVEMENTS,
  ...CONSISTENCY_ACHIEVEMENTS,
  ...PORTFOLIO_ACHIEVEMENTS,
  ...STREAK_ACHIEVEMENTS,
  ...HOLDING_ACHIEVEMENTS,
  ...DIVERSIFICATION_ACHIEVEMENTS,
  ...PERFORMANCE_ACHIEVEMENTS,
  ...BIG_MOVES_ACHIEVEMENTS,
  ...SPEED_ACHIEVEMENTS,
  ...FEE_ACHIEVEMENTS,
  ...RISK_ACHIEVEMENTS,
  ...TIME_BASED_ACHIEVEMENTS,
  ...MARKET_BEHAVIOR_ACHIEVEMENTS
];


export const ACHIEVEMENT_MAP = new Map<string, Achievement>(
  ALL_ACHIEVEMENTS.map(achievement => [achievement.id, achievement])
);


