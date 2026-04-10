import {
  ACHIEVEMENT_MAP,
  ALL_ACHIEVEMENTS,
  BIG_MOVES_ACHIEVEMENTS,
  CONSISTENCY_ACHIEVEMENTS,
  DIVERSIFICATION_ACHIEVEMENTS,
  FEE_ACHIEVEMENTS,
  HOLDING_ACHIEVEMENTS,
  PERFORMANCE_ACHIEVEMENTS,
  PORTFOLIO_ACHIEVEMENTS,
  RISK_ACHIEVEMENTS,
  SPEED_ACHIEVEMENTS,
  STREAK_ACHIEVEMENTS,
  TIME_BASED_ACHIEVEMENTS,
  TRADING_VOLUME_ACHIEVEMENTS
} from '@/lib/achievements/definitions'
import { UnlockConditions } from '@/lib/achievements/unlock-types'
import { StateCreator } from 'zustand'
import type {
  AchievementsSlice,
  BoundStore,
} from '../store-types'


const getAchievementPoints = (tier: string): number => {
  const points: Record<string, number> = {
    bronze: 10,
    silver: 25,
    gold: 50,
    platinum: 100,
    diamond: 250
  }
  return points[tier] || 0
}

export const createAchievementsSlice: StateCreator<
  BoundStore,
  [['zustand/immer', never]],
  [],
  AchievementsSlice
> = (set, get) => ({
  
  earnedAchievements: {},
  achievementProgress: {},
  totalPoints: 0,
  
  
  tierAchievements: {
    tokenAchievements: {},
    globalTiers: {}
  },

  
  earnAchievement: (achievementId: string) => {
    const achievement = ACHIEVEMENT_MAP.get(achievementId)
    if (!achievement || get().earnedAchievements[achievementId]) return

    set((state) => {
      
      state.earnedAchievements[achievementId] = {
        id: achievementId,
        earnedAt: new Date().toISOString()
      }

      
      state.totalPoints += getAchievementPoints(achievement.tier)

      
      delete state.achievementProgress[achievementId]
    })

    
    const uiState = get().ui
    if (uiState) {
      get().setUi({
        achievementNotification: {
          id: achievement.id,
          name: achievement.name,
          timestamp: Date.now()
        }
      })
    }

    
    window.audioEngine?.playAchievementUnlock?.()
  },

  
  updateProgress: (achievementId: string, progress: number) => {
    const achievement = ACHIEVEMENT_MAP.get(achievementId)
    if (!achievement || !achievement.progressTracking || get().earnedAchievements[achievementId]) return

    set((state) => {
      state.achievementProgress[achievementId] = {
        currentProgress: progress,
        lastUpdated: new Date().toISOString()
      }
    })

    
    if (achievement.maxProgress && progress >= achievement.maxProgress) {
      get().earnAchievement(achievementId)
    }
  },

  
  checkAchievements: (context: 'trade' | 'profit' | 'streak' | 'portfolio' | 'all') => {
    const state = get()
    const { positions, portfolioValue, realizedPnl, totalFees } = state
    
    
    type TransactionLike = {
      type?: string
      side?: string
      amount?: number
      tokenAmount?: number
      pnl?: number
      fee?: number
      fees?: number
      timestamp?: number | string
      tokenSymbol?: string
    }
    const transactions: TransactionLike[] = (state.transactions?.items || []) as TransactionLike[]
    const hand = state.hand || []
    
    
    const isEarned = (id: string) => !!state.earnedAchievements[id]

    
    if (context === 'trade' || context === 'all') {
  const totalTrades = transactions.length
  const totalVolume = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0)

      TRADING_VOLUME_ACHIEVEMENTS.forEach(achievement => {
        if (isEarned(achievement.id)) return
        const unlock = achievement.unlockConditions as UnlockConditions | unknown
        if (hasMetric(unlock)) {
          const metric = unlock.metric
          const value = numericValue(unlock.value)
          if (metric === 'total_trades' && totalTrades >= value) {
            get().earnAchievement(achievement.id)
          } else if (metric === 'total_volume' && totalVolume >= value) {
            get().earnAchievement(achievement.id)
          } else if (achievement.progressTracking) {
            const progress = metric === 'total_trades' ? totalTrades : totalVolume
            get().updateProgress(achievement.id, progress)
          }
        }
      })

      
      checkSpeedAchievements(transactions, isEarned, get)
    }

    
    if (context === 'portfolio' || context === 'all') {
      PORTFOLIO_ACHIEVEMENTS.forEach(achievement => {
        if (isEarned(achievement.id)) return
        const unlock = achievement.unlockConditions as UnlockConditions
        const value = Number(unlock.value) || 0
        if (portfolioValue >= value) get().earnAchievement(achievement.id)
      })

      
      const uniqueHoldings = hand.length
      DIVERSIFICATION_ACHIEVEMENTS.forEach(achievement => {
        if (isEarned(achievement.id)) return
        const unlock = achievement.unlockConditions as UnlockConditions | unknown
        if (hasMetric(unlock)) {
          const metric = unlock.metric
          const value = numericValue(unlock.value)
          if (metric === 'unique_holdings' && uniqueHoldings >= value) {
            get().earnAchievement(achievement.id)
          } else if (achievement.id === 'balanced_portfolio' && uniqueHoldings >= 5) {
            const balanced = hand.every(card => {
              const position = positions[card.address]
              return position && (position.value / portfolioValue) <= 0.2
            })
            if (balanced) get().earnAchievement(achievement.id)
          }
        }
      })
    }

    
    if (context === 'profit' || context === 'all') {
      const totalProfit = realizedPnl
  const winningTrades = transactions.filter(tx => (tx.type || tx.side) === 'sell' && !!tx.pnl && tx.pnl > 0).length
  const totalSells = transactions.filter(tx => (tx.type || tx.side) === 'sell').length
      const winRate = totalSells > 0 ? (winningTrades / totalSells) * 100 : 0

      PERFORMANCE_ACHIEVEMENTS.forEach(achievement => {
        if (isEarned(achievement.id)) return
        const unlock = achievement.unlockConditions as UnlockConditions | unknown
        if (hasMetric(unlock)) {
          const metric = unlock.metric
          const additionalCriteria = hasAdditionalCriteria(unlock) ? unlock.additionalCriteria : undefined
          const value = numericValue(unlock.value)
          if (metric === 'total_profit' && totalProfit >= value) {
            get().earnAchievement(achievement.id)
          } else if (metric === 'win_rate' && winRate >= value && totalSells >= (additionalCriteria?.minTrades || 0)) {
            get().earnAchievement(achievement.id)
          } else if (achievement.progressTracking && metric === 'total_profit') {
            get().updateProgress(achievement.id, totalProfit)
          }
        }
      })

      
  
  const feeTotalTrades = transactions.length
  const feeTotalVolume = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0)
  FEE_ACHIEVEMENTS.forEach(achievement => {
        if (isEarned(achievement.id)) return
        const unlock = achievement.unlockConditions as UnlockConditions | unknown
        if (hasMetric(unlock)) {
          const metric = unlock.metric
          const additionalCriteria = hasAdditionalCriteria(unlock) ? unlock.additionalCriteria : undefined
          const value = numericValue(unlock.value)
          if (metric === 'total_fees_paid' && totalFees >= value) {
            get().earnAchievement(achievement.id)
          } else if (metric === 'fee_percentage' && feeTotalTrades >= (additionalCriteria?.minTrades || 0)) {
            const feePercentage = feeTotalVolume > 0 ? (totalFees / feeTotalVolume) * 100 : 0
            if (feePercentage <= value) get().earnAchievement(achievement.id)
          } else if (achievement.id === 'fee_master' && totalFees >= 5000 && totalProfit > 0) {
            get().earnAchievement(achievement.id)
          }
        }
      })
    }

    
    if (context === 'streak' || context === 'all') {
      checkStreakAchievements(transactions, isEarned, get)
    }

    
    if (context === 'trade' || context === 'all') {
      checkConsistencyAchievements(transactions, isEarned, get)
    }

    
    if (context === 'trade' || context === 'all') {
      checkHoldingAchievements(transactions, positions, isEarned, get)
    }

    
    if (context === 'trade' || context === 'all') {
      checkRiskAchievements(transactions, positions, portfolioValue, isEarned, get)
      checkTimeBasedAchievements(transactions, isEarned, get)
    }

    
    checkTierAchievements(state, isEarned, get)
  },

  
  initializeAchievements: () => {
    get().checkAchievements('all')
  },

  
  getAchievementStats: () => {
    const state = get()
    const earned = Object.keys(state.earnedAchievements)
    const totalAchievements = ALL_ACHIEVEMENTS.length
    
    
    const categoryCounts: Record<string, { earned: number; total: number }> = {}
    ALL_ACHIEVEMENTS.forEach(achievement => {
      if (!categoryCounts[achievement.category]) {
        categoryCounts[achievement.category] = { earned: 0, total: 0 }
      }
      categoryCounts[achievement.category].total++
      if (earned.includes(achievement.id)) {
        categoryCounts[achievement.category].earned++
      }
    })
    
    
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000
    const recentAchievements = earned
      .filter(id => {
        const earnedAt = state.earnedAchievements[id]?.earnedAt
        return earnedAt && new Date(earnedAt).getTime() > dayAgo
      })
      .map(id => ACHIEVEMENT_MAP.get(id))
      .filter(Boolean)
    
    return {
      totalEarned: earned.length,
      totalAvailable: totalAchievements,
      completionPercentage: (earned.length / totalAchievements) * 100,
      totalPoints: state.totalPoints,
      categoryCounts,
      recentAchievements
    }
  },

  
  getAchievementProgress: () => {
    const state = get()
    const progress: Record<string, { current: number; max: number; percentage: number }> = {}
    
    ALL_ACHIEVEMENTS.forEach(achievement => {
      if (achievement.progressTracking && achievement.maxProgress && !state.earnedAchievements[achievement.id]) {
        const current = state.achievementProgress[achievement.id]?.currentProgress || 0
        progress[achievement.id] = {
          current,
          max: achievement.maxProgress,
          percentage: (current / achievement.maxProgress) * 100
        }
      }
    })
    
    return progress
  },
});


function checkSpeedAchievements(
  transactions: { type?: string; side?: string; tokenSymbol?: string; timestamp?: number | string; pnl?: number }[],
  isEarned: (id: string) => boolean,
  get: () => BoundStore
) {
  SPEED_ACHIEVEMENTS.forEach(achievement => {
    if (isEarned(achievement.id)) return
  const unlock = achievement.unlockConditions as UnlockConditions | unknown
  if (!hasMetric(unlock)) return
  const metric = unlock.metric
  const timeWindow = hasTimeWindow(unlock) ? (unlock.timeWindow) : undefined
  const value = numericValue(unlock.value)
    
    if (metric === 'trades_per_hour' || metric === 'trades_per_day') {
      const now = Date.now()
      const recentTrades = transactions.filter(tx => {
        const ts = typeof tx.timestamp === 'string' ? new Date(tx.timestamp).getTime() : (tx.timestamp || 0)
        return ts > now - (timeWindow || 0)
      }).length
      
  if (recentTrades >= value) {
        get().earnAchievement(achievement.id)
      }
    } else if (metric === 'quick_profitable_flips') {
      
      let quickFlips = 0
  const sells = transactions.filter(tx => (tx.type || tx.side) === 'sell' && !!tx.pnl && tx.pnl > 0)
      
      sells.forEach(sell => {
        const sellTs = typeof sell.timestamp === 'string' ? new Date(sell.timestamp).getTime() : (sell.timestamp || 0)
        const buy = transactions.find(tx => {
          const buyTs = typeof tx.timestamp === 'string' ? new Date(tx.timestamp).getTime() : (tx.timestamp || 0)
          return (tx.type || tx.side) === 'buy' &&
            tx.tokenSymbol === sell.tokenSymbol &&
            buyTs < sellTs &&
            sellTs - buyTs < 5 * 60 * 1000
        })
        if (buy) quickFlips++
      })
      
  if (quickFlips >= value) {
        get().earnAchievement(achievement.id)
      }
    }
  })
}


function checkStreakAchievements(
  transactions: { type?: string; side?: string; timestamp?: number | string; pnl?: number }[],
  isEarned: (id: string) => boolean,
  get: () => BoundStore
) {
  
  const sortedTx = [...transactions].sort((a, b) => {
    const aTs = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : (a.timestamp || 0)
    const bTs = typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : (b.timestamp || 0)
    return aTs - bTs
  })

  
  let currentWinStreak = 0
  let maxWinStreak = 0
  let currentLossStreak = 0
  let maxLossStreak = 0
  
  const sells = sortedTx.filter(tx => (tx.type || tx.side) === 'sell')
  
  sells.forEach(sell => {
    if (sell.pnl && sell.pnl > 0) {
      currentWinStreak++
      currentLossStreak = 0
      maxWinStreak = Math.max(maxWinStreak, currentWinStreak)
    } else {
      currentLossStreak++
      currentWinStreak = 0
      maxLossStreak = Math.max(maxLossStreak, currentLossStreak)
    }
  })

  STREAK_ACHIEVEMENTS.forEach(achievement => {
    if (isEarned(achievement.id)) return
  const unlock = achievement.unlockConditions as UnlockConditions | unknown
  if (!hasMetric(unlock)) return
  const metric = unlock.metric
  const value = numericValue(unlock.value)
    
    if (metric === 'win_streak' && maxWinStreak >= value) {
      get().earnAchievement(achievement.id)
    } else if (achievement.id === 'comeback_king' && maxLossStreak >= 5 && currentWinStreak > 0) {
      get().earnAchievement(achievement.id)
    } else if (achievement.id === 'perfect_day') {
      
      const today = new Date().toDateString()
      const todayTrades = sells.filter(tx => {
        const ts = typeof tx.timestamp === 'string' ? new Date(tx.timestamp).getTime() : (tx.timestamp || 0)
        return new Date(ts).toDateString() === today
      })
      
      if (todayTrades.length >= 5 && todayTrades.every(tx => tx.pnl && tx.pnl > 0)) {
        get().earnAchievement(achievement.id)
      }
    }
  })
}


function checkTierAchievements(
  state: BoundStore,
  isEarned: (id: string) => boolean,
  get: () => BoundStore
) {
  const tierAchievements = state.tierAchievements || { globalTiers: {} }
  const unlockedWinTiers = Object.keys(tierAchievements.globalTiers).filter(tier => 
    tier.includes('win') || ['small', 'decent', 'big', 'huge', 'legendary', 'epic', 'mythical', 'godlike', 'transcendent'].includes(tier)
  )
  const unlockedLossTiers = Object.keys(tierAchievements.globalTiers).filter(tier => 
    tier.includes('loss') || ['moderate', 'significant', 'major', 'devastating', 'catastrophic', 'nuclear', 'apocalyptic', 'extinction', 'total_loss'].includes(tier)
  )

  BIG_MOVES_ACHIEVEMENTS.forEach(achievement => {
    if (isEarned(achievement.id)) return
  const unlock = achievement.unlockConditions as UnlockConditions | unknown
  if (!isTierUnlock(unlock) && !isTierCollection(unlock)) return
  const type = unlock.type
  const metric = 'metric' in unlock ? unlock.metric : undefined
  const value = numericValue(unlock.value)
    
    if (type === 'tier_unlock') {
  const tierName = String(value)
      if (tierAchievements.globalTiers[tierName]) {
        get().earnAchievement(achievement.id)
      }
    } else if (type === 'collection') {
  if (metric === 'win_tiers_unlocked' && unlockedWinTiers.length >= value) {
        get().earnAchievement(achievement.id)
      } else if (metric === 'loss_tiers_experienced' && unlockedLossTiers.length >= value) {
        get().earnAchievement(achievement.id)
      } else if (metric === 'all_tiers_experienced' && (unlockedWinTiers.length + unlockedLossTiers.length) >= value) {
        get().earnAchievement(achievement.id)
      }
    }
  })
}


function checkConsistencyAchievements(
  transactions: { type?: string; side?: string; timestamp?: number | string }[],
  isEarned: (id: string) => boolean,
  get: () => BoundStore
) {
  
  const dayGroups: Record<string, any[]> = {}
  transactions.forEach(tx => {
    const ts = typeof tx.timestamp === 'string' ? new Date(tx.timestamp).getTime() : (tx.timestamp || 0)
    const day = new Date(ts).toDateString()
    if (!dayGroups[day]) dayGroups[day] = []
    dayGroups[day].push(tx)
  })

  const tradingDays = Object.keys(dayGroups).length
  
  
  const sortedDays = Object.keys(dayGroups).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
  
  let currentStreak = 0
  let maxDailyStreak = 0
  let lastDay: Date | null = null
  
  sortedDays.forEach(dayStr => {
    const day = new Date(dayStr)
    if (lastDay && day.getTime() - lastDay.getTime() === 24 * 60 * 60 * 1000) {
      currentStreak++
    } else {
      currentStreak = 1
    }
    maxDailyStreak = Math.max(maxDailyStreak, currentStreak)
    lastDay = day
  })

  CONSISTENCY_ACHIEVEMENTS.forEach(achievement => {
    if (isEarned(achievement.id)) return
  const unlock = achievement.unlockConditions as UnlockConditions | unknown
  if (!hasMetric(unlock)) return
  const metric = unlock.metric
  const value = numericValue(unlock.value)
    
  if (metric === 'daily_trades' && maxDailyStreak >= value) {
      get().earnAchievement(achievement.id)
    } else if (metric === 'early_trades') {
      const earlyTrades = transactions.filter(tx => {
        const ts = typeof tx.timestamp === 'string' ? new Date(tx.timestamp).getTime() : (tx.timestamp || 0)
        const hour = new Date(ts).getHours()
        return hour < 9
      }).length
      
      if (earlyTrades >= value) {
        get().earnAchievement(achievement.id)
      } else if (achievement.progressTracking) {
        get().updateProgress(achievement.id, earlyTrades)
      }
    }
  })
}


function checkHoldingAchievements(
  transactions: { type?: string; side?: string; tokenSymbol?: string; timestamp?: number | string }[],
  positions: Record<string, any>,
  isEarned: (id: string) => boolean,
  get: () => BoundStore
) {
  HOLDING_ACHIEVEMENTS.forEach(achievement => {
    if (isEarned(achievement.id)) return
  const unlock = achievement.unlockConditions as UnlockConditions | unknown
  if (!hasMetric(unlock)) return
  const metric = unlock.metric
  const value = numericValue(unlock.value)
    
    if (metric === 'hold_duration') {
      
      Object.values(positions).forEach((position: any) => {
        const buyTx = transactions.find(tx => (tx.type || tx.side) === 'buy' && tx.tokenSymbol === position.tokenSymbol)
        if (buyTx) {
          const buyTs = typeof buyTx.timestamp === 'string' ? new Date(buyTx.timestamp).getTime() : (buyTx.timestamp || 0)
          const holdTime = Date.now() - buyTs
          if (holdTime >= value) {
            get().earnAchievement(achievement.id)
          }
        }
      })
    } else if (metric === 'quick_sells') {
      let quickSells = 0
      const sells = transactions.filter(tx => (tx.type || tx.side) === 'sell')
      
      sells.forEach(sell => {
        const sellTs = typeof sell.timestamp === 'string' ? new Date(sell.timestamp).getTime() : (sell.timestamp || 0)
        const buy = transactions.find(tx => {
          const buyTs = typeof tx.timestamp === 'string' ? new Date(tx.timestamp).getTime() : (tx.timestamp || 0)
          return (tx.type || tx.side) === 'buy' &&
            tx.tokenSymbol === sell.tokenSymbol &&
            buyTs < sellTs &&
            sellTs - buyTs < 60 * 1000
        })
        if (buy) quickSells++
      })
      
      if (quickSells >= value) {
        get().earnAchievement(achievement.id)
      }
    }
  })
}


function checkRiskAchievements(
  transactions: { type?: string; side?: string; pnl?: number; amount?: number; fee?: number; fees?: number }[],
  positions: Record<string, any>,
  portfolioValue: number,
  isEarned: (id: string) => boolean,
  get: () => BoundStore
) {
  RISK_ACHIEVEMENTS.forEach(achievement => {
    if (isEarned(achievement.id)) return
  const unlock = achievement.unlockConditions as UnlockConditions | unknown
  if (!hasMetric(unlock)) return
  const metric = unlock.metric
  const additionalCriteria = hasAdditionalCriteria(unlock) ? unlock.additionalCriteria : undefined
  const value = numericValue(unlock.value)
    
    if (metric === 'controlled_losses') {
      const controlledLosses = transactions
        .filter(tx => (tx.type || tx.side) === 'sell' && !!tx.pnl && tx.pnl < 0)
        .filter(tx => {
          const gross = (tx.amount || 0) - ((tx.fee ?? tx.fees) || 0)
          if (gross <= 0) return false
          const lossPercentage = Math.abs(((tx.pnl as number) / gross) * 100)
          return lossPercentage <= (additionalCriteria?.maxLossPercentage || 10)
        }).length
      
  if (controlledLosses >= value) {
        get().earnAchievement(achievement.id)
      }
    } else if (metric === 'risk_control') {
  const sells = transactions.filter(tx => (tx.type || tx.side) === 'sell')
      const hasRiskControl = sells.length >= (additionalCriteria?.minTrades || 100) &&
        sells.every(tx => {
          if (!tx.pnl || tx.pnl >= 0) return true
          const gross = (tx.amount || 0) - ((tx.fee ?? tx.fees) || 0)
          if (gross <= 0) return true
            const lossPercentage = Math.abs(((tx.pnl as number) / gross) * 100)
          return lossPercentage <= (additionalCriteria?.maxLossPerTrade || 5)
        })
      
      if (hasRiskControl) {
        get().earnAchievement(achievement.id)
      }
    }
  })
}


function checkTimeBasedAchievements(
  transactions: { timestamp?: number | string }[],
  isEarned: (id: string) => boolean,
  get: () => BoundStore
) {
  TIME_BASED_ACHIEVEMENTS.forEach(achievement => {
    if (isEarned(achievement.id)) return
  const unlock = achievement.unlockConditions as UnlockConditions | unknown
  if (!hasMetric(unlock)) return
  const metric = unlock.metric
  const additionalCriteria = hasAdditionalCriteria(unlock) ? unlock.additionalCriteria : undefined
  const value = numericValue(unlock.value)
    
    if (metric === 'night_trades') {
      const nightTrades = transactions.filter(tx => {
        const ts = typeof tx.timestamp === 'string' ? new Date(tx.timestamp).getTime() : (tx.timestamp || 0)
        const hour = new Date(ts).getHours()
        return hour >= (additionalCriteria?.afterHour || 0) && 
               hour < (additionalCriteria?.beforeHour || 6)
      }).length
      
  if (nightTrades >= value) {
        get().earnAchievement(achievement.id)
      }
    } else if (metric === 'weekend_trading_weeks') {
      
      const weekGroups: Record<string, any[]> = {}
      transactions.forEach(tx => {
        const ts = typeof tx.timestamp === 'string' ? new Date(tx.timestamp).getTime() : (tx.timestamp || 0)
        const date = new Date(ts)
        const weekStart = new Date(date.getFullYear(), 0, 1 + (Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)) * 7))
        const weekKey = weekStart.toISOString().split('T')[0]
        
        if (!weekGroups[weekKey]) weekGroups[weekKey] = []
        weekGroups[weekKey].push(tx)
      })
      
      let consecutiveWeekendWeeks = 0
      Object.values(weekGroups).forEach(weekTxs => {
        const hasWeekendTrade = weekTxs.some(tx => {
          const day = new Date(tx.timestamp).getDay()
          return day === 0 || day === 6 
        })
        
        if (hasWeekendTrade) {
          consecutiveWeekendWeeks++
        } else {
          consecutiveWeekendWeeks = 0
        }
      })
      
  if (consecutiveWeekendWeeks >= value) {
        get().earnAchievement(achievement.id)
      }
    }
  })
}


interface MetricUnlockLike { metric: string; value?: unknown }
interface AdditionalCriteriaUnlockLike extends MetricUnlockLike { additionalCriteria?: { [k: string]: unknown; minTrades?: number; maxLossPercentage?: number; maxLossPerTrade?: number; afterHour?: number; beforeHour?: number } }
function isObject(u: unknown): u is Record<string, unknown> { return !!u && typeof u === 'object' && !Array.isArray(u) }
function hasMetric(u: unknown): u is MetricUnlockLike & AdditionalCriteriaUnlockLike {
  return (
    isObject(u) &&
    'metric' in u &&
    typeof (u as { metric?: unknown }).metric === 'string'
  )
}
function hasAdditionalCriteria(u: unknown): u is MetricUnlockLike & AdditionalCriteriaUnlockLike {
  return hasMetric(u) && 'additionalCriteria' in (u as { additionalCriteria?: unknown })
}
function numericValue(v: unknown): number { return typeof v === 'number' ? v : Number(v) || 0 }

interface TimeWindowUnlockLike extends MetricUnlockLike { timeWindow: number }
function hasTimeWindow(u: unknown): u is MetricUnlockLike & AdditionalCriteriaUnlockLike & TimeWindowUnlockLike {
  return (
    hasMetric(u) &&
  'timeWindow' in (u as { timeWindow?: unknown }) &&
  typeof (u as { timeWindow?: unknown }).timeWindow === 'number'
  )
}


interface TierUnlockLike { type: 'tier_unlock'; value: unknown }
interface TierCollectionLike { type: 'collection'; metric: string; value: unknown }
function isTierUnlock(u: unknown): u is TierUnlockLike {
  return (
    isObject(u) &&
  'type' in u &&
  (u as { type?: unknown }).type === 'tier_unlock'
  )
}
function isTierCollection(u: unknown): u is TierCollectionLike {
  return (
    isObject(u) &&
  'type' in u &&
  (u as { type?: unknown }).type === 'collection' &&
  'metric' in u &&
  typeof (u as { metric?: unknown }).metric === 'string'
  )
}