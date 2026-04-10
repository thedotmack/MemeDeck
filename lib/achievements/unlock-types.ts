

type TradingVolumeMetric = 'total_trades' | 'total_volume'
type SpeedMetric = 'trades_per_hour' | 'trades_per_day' | 'quick_profitable_flips'
type PerformanceMetric = 'total_profit' | 'win_rate'
type FeeMetric = 'total_fees_paid' | 'fee_percentage'
type DiversificationMetric = 'unique_holdings'
type HoldingMetric = 'hold_duration' | 'quick_sells'
type RiskMetric = 'controlled_losses' | 'risk_control'
type TimeBasedMetric = 'night_trades' | 'weekend_trading_weeks'
type ConsistencyMetric = 'daily_trades' | 'early_trades'
type StreakMetric = 'win_streak'
type TierCollectionMetric = 'win_tiers_unlocked' | 'loss_tiers_experienced' | 'all_tiers_experienced'

interface BaseUnlock { value: number }

export interface TradingVolumeUnlock extends BaseUnlock { metric: TradingVolumeMetric }
export interface SpeedUnlock extends BaseUnlock { metric: SpeedMetric; timeWindow?: number }
export interface PerformanceUnlock extends BaseUnlock { metric: PerformanceMetric; additionalCriteria?: { minTrades?: number } }
export interface FeeUnlock extends BaseUnlock { metric: FeeMetric; additionalCriteria?: { minTrades?: number } }
export interface DiversificationUnlock extends BaseUnlock { metric: DiversificationMetric }
export interface HoldingUnlock extends BaseUnlock { metric: HoldingMetric }
export interface RiskUnlock extends BaseUnlock { metric: RiskMetric; additionalCriteria?: { maxLossPercentage?: number; minTrades?: number; maxLossPerTrade?: number } }
export interface TimeBasedUnlock extends BaseUnlock { metric: TimeBasedMetric; additionalCriteria?: { afterHour?: number; beforeHour?: number } }
export interface ConsistencyUnlock extends BaseUnlock { metric: ConsistencyMetric; additionalCriteria?: { minTrades?: number } }
export interface StreakUnlock extends BaseUnlock { metric: StreakMetric; additionalCriteria?: { minTrades?: number } }
export interface TierUnlock extends BaseUnlock { type: 'tier_unlock'; metric?: string; tierName?: string }
export interface TierCollectionUnlock extends BaseUnlock { type: 'collection'; metric: TierCollectionMetric }

export type UnlockConditions =
  | TradingVolumeUnlock
  | SpeedUnlock
  | PerformanceUnlock
  | FeeUnlock
  | DiversificationUnlock
  | HoldingUnlock
  | RiskUnlock
  | TimeBasedUnlock
  | ConsistencyUnlock
  | StreakUnlock
  | TierUnlock
  | TierCollectionUnlock

