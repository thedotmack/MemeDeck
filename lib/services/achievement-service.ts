
import type { Achievement } from '@/lib/types/achievements';
import type { WinTier, LossTier } from '@/lib/types/celebrations';
import { ACHIEVEMENT_MAP } from '@/lib/achievements/definitions';
import { useStore } from '@/lib/store';


interface AchievementUnlockContext {
  triggerAction: string;
  actionDetails: any;
  unlockMessage: string;
}


export interface AchievementNotification {
  achievementId: string;
  unlockedAt: number;
  isNew: boolean;
}


interface TierAchievementState {
  celebrationTiers: Record<string, {
    highestTier: WinTier | null;
    achievementsUnlocked: string[];
    tierHistory: Array<{
      tier: WinTier | LossTier;
      type: 'win' | 'loss';
      unlockedAt: number;
      achievementAwarded: boolean;
    }>;
  }>;
  globalTierAchievements: {
    winTiersUnlocked: Set<WinTier>;
    lossTiersExperienced: Set<LossTier>;
  };
}

interface AchievementCheckResult {
  newAchievements: Achievement[];
  shouldTriggerNotification: boolean;
  tierProgressUpdated: boolean;
}

class AchievementService {
  
  private notificationQueue: AchievementNotification[] = [];
  private currentNotification: AchievementNotification | null = null;
  private isShowingNotification = false;
  private notificationListeners: ((notification: AchievementNotification | null) => void)[] = [];

  
  
  

  queueAchievementNotification(achievementId: string, isNew: boolean = true): void {
    const notification: AchievementNotification = {
      achievementId,
      unlockedAt: Date.now(),
      isNew
    };

    const exists = this.notificationQueue.some(n => n.achievementId === achievementId);
    if (!exists) {
      this.notificationQueue.push(notification);
      this.processNotificationQueue();
    }
  }

  private processNotificationQueue(): void {
    if (this.isShowingNotification || this.notificationQueue.length === 0) {
      return;
    }

    const notification = this.notificationQueue.shift()!;
    this.showNotification(notification);
  }

  private showNotification(notification: AchievementNotification): void {
    this.isShowingNotification = true;
    this.currentNotification = notification;
    
    this.notificationListeners.forEach(listener => listener(notification));

    
  }

  hideNotification(): void {
    this.isShowingNotification = false;
    this.currentNotification = null;
    
    this.notificationListeners.forEach(listener => listener(null));

    setTimeout(() => {
      this.processNotificationQueue();
    }, 1000);
  }

  subscribeToNotifications(listener: (notification: AchievementNotification | null) => void): () => void {
    this.notificationListeners.push(listener);
    listener(this.currentNotification);
    
    return () => {
      const index = this.notificationListeners.indexOf(listener);
      if (index > -1) {
        this.notificationListeners.splice(index, 1);
      }
    };
  }

  getCurrentNotification(): AchievementNotification | null {
    return this.currentNotification;
  }

  isNotificationVisible(): boolean {
    return this.isShowingNotification;
  }

  clearQueue(): void {
    this.notificationQueue = [];
    if (this.isShowingNotification) {
      this.hideNotification();
    }
  }

  getQueueLength(): number {
    return this.notificationQueue.length;
  }

  queueMultipleAchievements(achievementIds: string[], isNew: boolean = true): void {
    achievementIds.forEach(id => {
      this.queueAchievementNotification(id, isNew);
    });
  }

  getAchievementStats(unlockedAchievementIds: string[]): {
    totalAchievements: number;
    unlockedCount: number;
    progressPercentage: number;
    categoriesCompleted: string[];
  } {
    const allAchievements = Array.from(ACHIEVEMENT_MAP.values());
    const unlockedSet = new Set(unlockedAchievementIds);
    
    const totalAchievements = allAchievements.length;
    const unlockedCount = unlockedAchievementIds.length;
    
    const progressPercentage = totalAchievements > 0 ? (unlockedCount / totalAchievements) * 100 : 0;
    
    const categoriesCompleted: string[] = [];
    const achievementsByCategory = allAchievements.reduce((acc, achievement) => {
      if (!acc[achievement.category]) {
        acc[achievement.category] = [];
      }
      acc[achievement.category].push(achievement);
      return acc;
    }, {} as Record<string, Achievement[]>);
    
    Object.entries(achievementsByCategory).forEach(([category, achievements]) => {
      const allUnlocked = achievements.every(achievement => unlockedSet.has(achievement.id));
      if (allUnlocked) {
        categoriesCompleted.push(category);
      }
    });

    return {
      totalAchievements,
      unlockedCount,
      progressPercentage,
      categoriesCompleted
    };
  }

  getRecentAchievements(timeWindowMs: number = 5 * 60 * 1000): AchievementNotification[] {
    const cutoff = Date.now() - timeWindowMs;
    return this.notificationQueue
      .concat(this.currentNotification ? [this.currentNotification] : [])
      .filter(notification => notification.unlockedAt > cutoff);
  }

  
  
  

  async handleTradeEvent(event: {
    userId: string;
    sessionId: string;
    tokenId: string;
    symbol: string;
    tradeType: 'buy' | 'sell';
    amount: number;
    price: number;
    profitLoss?: number;
    isFirstTrade?: boolean;
    timestamp: number;
  }): Promise<void> {
    const context: AchievementUnlockContext = {
      triggerAction: 'trade',
      actionDetails: {
        tokenId: event.tokenId,
        symbol: event.symbol,
        tradeType: event.tradeType,
        amount: event.amount,
        price: event.price,
        profitLoss: event.profitLoss,
        sessionId: event.sessionId,
        timestamp: event.timestamp
      },
      unlockMessage: `Unlocked through ${event.tradeType} trade of ${event.symbol}`
    };

    if (event.isFirstTrade) {
      await this.checkAndUnlock('first_green', event.userId, context);
    }

    if (event.tradeType === 'buy' && event.amount >= 100) {
      await this.checkAndUnlock('whale_trader', event.userId, context);
    }

    
    const store = useStore.getState();
    store.updateProgress('trading_volume_milestone', event.amount);
    
    
    store.checkAchievements('trade');
  }

  async handleCelebrationEvent(event: {
    userId: string;
    sessionId: string;
    tokenId: string;
    symbol: string;
    tier: string;
    percentGain: number;
    profitAmount: number;
    timestamp: number;
  }): Promise<void> {
    const context: AchievementUnlockContext = {
      triggerAction: 'celebration',
      actionDetails: {
        tokenId: event.tokenId,
        symbol: event.symbol,
        celebrationTier: event.tier,
        percentGain: event.percentGain,
        profitLoss: event.profitAmount,
        sessionId: event.sessionId,
        timestamp: event.timestamp
      },
      unlockMessage: `Unlocked through ${event.tier} celebration on ${event.symbol} (+${event.percentGain.toFixed(1)}%)`
    };

    const store = useStore.getState();
    
    
    
    

    
    switch (event.tier) {
      case 'legendary':
        await this.checkAndUnlock('legendary_gains', event.userId, context);
        break;
      case 'epic':
        await this.checkAndUnlock('epic_gains', event.userId, context);
        break;
      case 'mythical':
        await this.checkAndUnlock('mythical_gains', event.userId, context);
        break;
      case 'godlike':
        await this.checkAndUnlock('godlike_gains', event.userId, context);
        break;
      case 'transcendent':
        await this.checkAndUnlock('transcendent_gains', event.userId, context);
        break;
    }

    if (event.percentGain >= 100) {
      await this.checkAndUnlock('moonshot', event.userId, context);
    }

    if (event.percentGain >= 500) {
      await this.checkAndUnlock('to_the_moon', event.userId, context);
    }

    
    store.checkAchievements('profit');
    store.checkAchievements('all'); 
  }

  async handlePortfolioEvent(event: {
    userId: string;
    sessionId: string;
    portfolioValue: number;
    totalProfit: number;
    totalLoss: number;
    positionCount: number;
    timestamp: number;
  }): Promise<void> {
    const context: AchievementUnlockContext = {
      triggerAction: 'portfolio_milestone',
      actionDetails: {
        portfolioValue: event.portfolioValue,
        totalProfit: event.totalProfit,
        sessionId: event.sessionId,
        timestamp: event.timestamp
      },
      unlockMessage: `Unlocked through portfolio milestone: $${event.portfolioValue.toFixed(2)} value`
    };

    const store = useStore.getState();

    if (event.portfolioValue >= 10000) {
      await this.checkAndUnlock('portfolio_10k', event.userId, context);
    }

    if (event.portfolioValue >= 100000) {
      await this.checkAndUnlock('portfolio_100k', event.userId, context);
    }

    if (event.totalProfit >= 1000) {
      await this.checkAndUnlock('profit_master', event.userId, context);
    }

    if (event.positionCount >= 10) {
      await this.checkAndUnlock('diversified_trader', event.userId, context);
    }

    
    store.checkAchievements('portfolio');
  }

  async handleStreakEvent(event: {
    userId: string;
    sessionId: string;
    streakType: 'win' | 'loss';
    streakCount: number;
    timestamp: number;
  }): Promise<void> {
    const context: AchievementUnlockContext = {
      triggerAction: 'streak',
      actionDetails: {
        streakType: event.streakType,
        streakCount: event.streakCount,
        sessionId: event.sessionId,
        timestamp: event.timestamp
      },
      unlockMessage: `Unlocked through ${event.streakType} streak of ${event.streakCount}`
    };

    const store = useStore.getState();

    if (event.streakType === 'win') {
      if (event.streakCount >= 5) {
        await this.checkAndUnlock('win_streak_5', event.userId, context);
      }
      if (event.streakCount >= 10) {
        await this.checkAndUnlock('win_streak_10', event.userId, context);
      }
      if (event.streakCount >= 20) {
        await this.checkAndUnlock('diamond_hands', event.userId, context);
      }
    }

    
    store.checkAchievements('streak');
  }

  async handleSessionEvent(event: {
    userId: string;
    sessionId: string;
    type: 'start' | 'end';
    sessionData?: {
      duration?: number;
      tradesCount?: number;
      finalProfit?: number;
      cardsDrawn?: number;
    };
    timestamp: number;
  }): Promise<void> {
    if (event.type === 'end' && event.sessionData) {
      const context: AchievementUnlockContext = {
        triggerAction: 'session_event',
        actionDetails: {
          ...event.sessionData,
          sessionId: event.sessionId,
          timestamp: event.timestamp
        },
        unlockMessage: `Unlocked through session completion`
      };

      if (event.sessionData.tradesCount && event.sessionData.tradesCount >= 50) {
        await this.checkAndUnlock('active_trader', event.userId, context);
      }

      if (event.sessionData.duration && event.sessionData.duration >= 3600000) {
        await this.checkAndUnlock('marathon_trader', event.userId, context);
      }

      if (event.sessionData.cardsDrawn && event.sessionData.cardsDrawn >= 100) {
        await this.checkAndUnlock('card_collector', event.userId, context);
      }

      
      const store = useStore.getState();
      store.checkAchievements('all');
    }
  }

  private async checkAndUnlock(
    achievementId: string, 
    userId: string, 
    context: AchievementUnlockContext
  ): Promise<void> {
    try {
      const store = useStore.getState();
      const hasAchievement = !!store.earnedAchievements[achievementId];
      if (hasAchievement) return;

      
      store.earnAchievement(achievementId);
      
      const achievement = ACHIEVEMENT_MAP.get(achievementId);
      if (achievement) {
        this.queueAchievementNotification(achievementId, true);
        
        this.triggerAchievementAnimation(achievementId, achievement.name);
      }

    } catch (error) {
      console.error(`🏆 [TRIGGER] Failed to check/unlock achievement ${achievementId}:`, error);
    }
  }

  private triggerAchievementAnimation(achievementId: string, achievementName: string): void {
    try {
      const store = useStore.getState();
      const achievement = ACHIEVEMENT_MAP.get(achievementId);
      
      if (!achievement) {
        console.error(`🏆 [TRIGGER] Achievement ${achievementId} not found in ACHIEVEMENT_MAP`);
        return;
      }

      
      
      if (store.triggerPepeEvent) {
        store.triggerPepeEvent('achievement_unlocked', achievementId, achievementName, {
          achievementName,
          achievementId,
          imagePath: achievement.imagePath,
          message: `🎉 You earned an award! Scratch below to reveal your achievement! 🏆`,
          timestamp: Date.now(),
          scratchToReveal: true,
          messageType: 'achievement_scratch'
        });
      }

    } catch (error) {
      console.error('🏆 [TRIGGER] Failed to trigger achievement animation:', error);
    }
  }

  
  triggerFullScreenCelebration(achievementId: string, achievementName: string): void {
    try {
      const store = useStore.getState();
      
      
      if (store.setUi) {
        store.setUi({
          achievementNotification: {
            id: achievementId,
            name: achievementName,
            timestamp: Date.now(),
          }
        });
      }

      

    } catch (error) {
      console.error('🏆 [TRIGGER] Failed to trigger full screen celebration:', error);
    }
  }


  async manualUnlock(
    userId: string,
    achievementId: string,
    reason: string = 'Manual unlock'
  ): Promise<boolean> {
    const context: AchievementUnlockContext = {
      triggerAction: 'manual',
      actionDetails: {
        timestamp: Date.now(),
        metadata: { reason }
      },
      unlockMessage: reason
    };

    try {
      const store = useStore.getState();
      const hasAchievement = !!store.earnedAchievements[achievementId];
      if (hasAchievement) return false;

      
      store.earnAchievement(achievementId);
      
      const achievement = ACHIEVEMENT_MAP.get(achievementId);
      if (achievement) {
        this.queueAchievementNotification(achievementId, true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`🏆 [TRIGGER] Failed to manually unlock achievement ${achievementId}:`, error);
      return false;
    }
  }

  async checkAllAchievements(userId: string, sessionId: string): Promise<number> {
    try {
      const store = useStore.getState();
      const beforeCount = Object.keys(store.earnedAchievements).length;
      
      
      store.checkAchievements('all');
      
      const afterCount = Object.keys(store.earnedAchievements).length;
      return afterCount - beforeCount;
    } catch (error) {
      console.error('🏆 [TRIGGER] Failed to check all achievements:', error);
      return 0;
    }
  }

  
  
  

  checkTierAchievements(
    tokenId: string,
    tier: WinTier | LossTier,
    type: 'win' | 'loss',
    currentState: TierAchievementState
  ): AchievementCheckResult {
    const result: AchievementCheckResult = {
      newAchievements: [],
      shouldTriggerNotification: false,
      tierProgressUpdated: false
    };

    
    
    
    return result;
  }

}


export const achievementService = new AchievementService();