
import { ACHIEVEMENT_MAP } from '@/lib/achievements/definitions';
import { achievementService, type AchievementNotification } from '@/lib/services/achievement-service';
import { useStore } from '@/lib/store';
import { usePrivy } from '@privy-io/react-auth';
import { useCallback, useEffect, useState } from 'react';


interface PersistedAchievement {
  achievementId: string;
  earnedAt: Date;
  achievement: {
    id: string;
    category: string;
    tier: string;
    points: number;
  };
}

interface AchievementProgress {
  [achievementId: string]: number;
}

interface AchievementAuditEntry {
  achievementId: string;
  achievementName: string;
  earnedAt: Date;
  triggerAction: string;
  actionDetails: any;
  sessionId: string | null;
}

interface UserAchievementData {
  achievements: PersistedAchievement[];
  progress: AchievementProgress;
  auditTrail: AchievementAuditEntry[];
  totalUnlocked: number;
  totalPoints: number;
  isLoading: boolean;
  error: string | null;
}

export function useAchievements() {
  const { user, authenticated: isAuthenticated } = usePrivy();
  
  
  const accessTokenFromStore = useStore.use.getAccessToken();
  
  const getAccessToken = useCallback(async () => {
    try {
      return accessTokenFromStore;
    } catch (error) {
      console.error('Failed to get access token from store:', error);
      return null;
    }
  }, []);
  
  
  const [currentNotification, setCurrentNotification] = useState<AchievementNotification | null>(null);
  const tierAchievements = useStore.use.tierAchievements() || { tokenAchievements: {} };
  
  
  const earnedAchievements = useStore.use.earnedAchievements() || {};
  
  
  const realizedPnl = useStore.use.realizedPnl() || 0;
  const portfolioValue = useStore.use.portfolioValue() || 0;
  const walletBalance = useStore.use.walletBalance() || 0;
  const totalFees = useStore.use.totalFees() || 0;
  const transactions = useStore.use.transactions()?.items || [];
  const positions = useStore.use.positions() || {};
  const hand = useStore.use.hand() || [];
  const getPortfolioValue = useStore.use.getPortfolioValue();
  const getNetWorth = useStore.use.getNetWorth();
  const getTotalUnrealizedPnl = useStore.use.getTotalUnrealizedPnl();
  const getTotalPnl = useStore.use.getTotalPnl();
  const triggerPepeEvent = useStore.use.triggerPepeEvent();
  
  
  const achievementProgress = useStore.use.achievementProgress() || {};
  const totalPoints = useStore.use.totalPoints() || 0;
  const checkAchievements = useStore.use.checkAchievements();
  
  
  const [data, setData] = useState<UserAchievementData>({
    achievements: [],
    progress: {},
    auditTrail: [],
    totalUnlocked: 0,
    totalPoints: 0,
    isLoading: false,
    error: null
  });

  
  useEffect(() => {
    const unsubscribe = achievementService.subscribeToNotifications((notification) => {
      setCurrentNotification(notification);
    });

    return unsubscribe;
  }, []);

    const fetchAchievements = useCallback(async () => {
    console.log('🏆 [HOOK] Loading achievements from store');
    
    if (!isAuthenticated || !user) {
      setData(prev => ({ ...prev, achievements: [], progress: {}, auditTrail: [], totalUnlocked: 0, totalPoints: 0 }));
      return;
    }

    setData(prev => ({ ...prev, isLoading: false, error: null }));
    
    
    const achievements: PersistedAchievement[] = Object.entries(earnedAchievements).map(([id, data]: any) => ({
      achievementId: id,
      earnedAt: data.earnedAt instanceof Date ? data.earnedAt : new Date(data.earnedAt),
      achievement: {
        id,
        category: 'unknown', 
        tier: 'bronze', 
        points: 0 
      }
    }));
    
    
    const mappedProgress: AchievementProgress = Object.fromEntries(
      Object.entries(achievementProgress).map(([k, v]: any) => [k, typeof v === 'number' ? v : (v?.currentProgress ?? 0)])
    );

    setData(prev => ({
      ...prev,
      achievements,
      progress: mappedProgress,
      auditTrail: [], 
      totalUnlocked: achievements.length,
      totalPoints,
      isLoading: false,
      error: null
    }));
  }, [isAuthenticated, user, earnedAchievements, achievementProgress, totalPoints]);

    const checkForNewAchievements = useCallback(async (): Promise<number> => {
    if (!isAuthenticated || !user) return 0;

    console.log('🏆 [HOOK] Checking achievements using store methods');
    
    try {
      const oldCount = Object.keys(earnedAchievements).length;
      
      
      checkAchievements('all');
      
      
      const newCount = Object.keys(earnedAchievements).length;
      const earnedCount = newCount - oldCount;
      
      if (earnedCount > 0) {
        
        await fetchAchievements();
      }
      
      return earnedCount;
    } catch (error) {
      console.error('🏆 [HOOK] Failed to check for new achievements:', error);
      return 0;
    }
  }, [isAuthenticated, user, fetchAchievements, earnedAchievements, checkAchievements]);

    const hasAchievement = useCallback((achievementId: string): boolean => {
    return data.achievements.some(a => a.achievementId === achievementId);
  }, [data.achievements]);

    const getAchievementProgress = useCallback((achievementId: string): number => {
    return data.progress[achievementId] || 0;
  }, [data.progress]);

    const getAchievementsByCategory = useCallback((category: string): PersistedAchievement[] => {
    return data.achievements.filter(a => a.achievement.category === category);
  }, [data.achievements]);

    const getRecentAchievements = useCallback((hours: number = 24): PersistedAchievement[] => {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return data.achievements.filter(a => new Date(a.earnedAt) > cutoff);
  }, [data.achievements]);

    const getCompletionPercentage = useCallback((): number => {
    
    try {
      
      
      const totalPossible = 25; 
      return data.totalUnlocked > 0 ? (data.totalUnlocked / totalPossible) * 100 : 0;
    } catch {
      return 0;
    }
  }, [data.totalUnlocked]);

    const getPointsByTier = useCallback((): Record<string, number> => {
    const pointsByTier: Record<string, number> = {};
    
    data.achievements.forEach(a => {
      const tier = a.achievement.tier;
      pointsByTier[tier] = (pointsByTier[tier] || 0) + (a.achievement.points || 0);
    });

    return pointsByTier;
  }, [data.achievements]);

    const getCategoryStats = useCallback((): Record<string, { unlocked: number; total: number }> => {
    const categoryStats: Record<string, { unlocked: number; total: number }> = {};
    
    
    data.achievements.forEach(a => {
      const category = a.achievement.category;
      if (!categoryStats[category]) {
        categoryStats[category] = { unlocked: 0, total: 5 }; 
      }
      categoryStats[category].unlocked++;
    });

    
    const allCategories = ['trading', 'celebration', 'portfolio', 'streak', 'session'];
    allCategories.forEach(category => {
      if (!categoryStats[category]) {
        categoryStats[category] = { unlocked: 0, total: 5 };
      }
    });
    
    return categoryStats;
  }, [data.achievements]);

    const checkPriceAchievement = useCallback(async (tokenId: string, newPrice: number, oldPrice: number, changePercent: number) => {
    if (!isAuthenticated || !user) return;

    try {
      const position = positions[tokenId];
      
      if (!position) return;

      const currentPortfolioValue = getPortfolioValue ? getPortfolioValue() : portfolioValue;
      const currentTotalPnl = getTotalPnl ? getTotalPnl() : realizedPnl;
      const positionCount = Object.keys(positions).length;
      
      
      const positionValue = position.quantity * newPrice;
      const profitLoss = positionValue - position.cost;
      const profitLossPercent = (profitLoss / position.cost) * 100;

      
      if (Math.abs(changePercent) >= 5) { 
        
        await achievementService.handlePortfolioEvent({
          userId: user.id,
          sessionId: user.id,
          portfolioValue,
          totalProfit: Math.max(0, currentTotalPnl),
          totalLoss: Math.abs(Math.min(0, currentTotalPnl)),
          positionCount,
          timestamp: Date.now()
        });
        
        
        if (profitLossPercent >= 5) { 
          await achievementService.handleCelebrationEvent({
            userId: user.id,
            sessionId: user.id,
            tokenId,
            symbol: position.tokenSymbol,
            tier: profitLossPercent >= 50 ? 'legendary' : profitLossPercent >= 20 ? 'big' : 'decent',
            percentGain: profitLossPercent,
            profitAmount: profitLoss,
            timestamp: Date.now()
          });
        }
      }
    } catch (error) {
      console.error('🏆 [HOOK] Achievement check failed:', error);
    }
  }, [isAuthenticated, user, getAccessToken, positions, portfolioValue, realizedPnl, 
    getPortfolioValue, getTotalPnl]);

  
  useEffect(() => {
    fetchAchievements();
  }, []); 

  
  
  
  
  
  
  
  
  
  

  
  
  const unlockedAchievementIds = Object.entries(tierAchievements.tokenAchievements || {})
    .flatMap(([tokenKey, token]: [string, any]) =>
      (token.achievementsUnlocked || []).map((achievementId: string) => ({
        key: `${tokenKey}-${achievementId}`,
        id: achievementId
      }))
    );

  
  const stats = achievementService.getAchievementStats(unlockedAchievementIds);

  
  const hasRecentAchievements = false;

  return {
    
    currentNotification,
    isNotificationVisible: currentNotification !== null,
    hideNotification: () => achievementService.hideNotification(),
    queueAchievement: (achievementId: string) => achievementService.queueAchievementNotification(achievementId),
    
    
    achievements: data.achievements,
    progress: data.progress,
    auditTrail: data.auditTrail,
    totalUnlocked: data.totalUnlocked,
    totalPoints: data.totalPoints,
    isLoading: data.isLoading,
    error: data.error,
    
    
    refreshAchievements: fetchAchievements,
    checkForNewAchievements,
    checkPriceAchievement,
    
    
    hasAchievement,
    getAchievementProgress,
    getAchievementsByCategory,
    getRecentAchievements,
    
    
    stats,
    hasRecentAchievements,
    getCompletionPercentage,
    getPointsByTier,
    getCategoryStats,
    
    
    tierAchievements,
    unlockedAchievementIds,
    
    
    clearNotificationQueue: () => achievementService.clearQueue(),
    debugTriggerAchievement: (achievementId: string) => {
      
      
      
      if (typeof window !== 'undefined' && triggerPepeEvent) {
        const achievementDef = ACHIEVEMENT_MAP.get(achievementId);
        if (achievementDef) {
          
          triggerPepeEvent('achievement_unlocked', achievementId, achievementDef.name, {
              achievementName: achievementDef.name,
              achievementId,
              imagePath: achievementDef.imagePath,
              message: `🎉 You earned an award! Scratch below to reveal your achievement! 🏆`,
              timestamp: Date.now(),
              scratchToReveal: true,
              messageType: 'achievement_scratch'
            });
            
          }
      }
    },
  };
}