
import { enableMapSet } from 'immer'
import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { normalizeUserObject } from '../utils/auth-helpers'
import { createPgStorage } from './pg-storage'


enableMapSet()

import { createAchievementsSlice } from './slices/achievements-slice'
import { createActivitySlice } from './slices/activity-slice'
import { createAnimationSlice } from './slices/animation-slice'
import { createAuthSlice } from './slices/auth-slice'
import { createCoreSlice } from './slices/core-slice'
import { createDemoSlice } from './slices/demo-slice'
import { createPortfolioSlice } from './slices/portfolio-slice'
import { createTutorialSlice } from './slices/tutorial-slice'
import { createUISlice } from './slices/ui-slice'

import { createPoolSlice } from './slices/pool-slice'
import { createTradingSlice } from './slices/trading-slice'
import { createTransactionSlice } from './slices/transaction-slice'

import { createSelectors } from './create-selectors'
import type { BoundStore } from './store-types'


const createAdaptiveStorage = () => {
  let pgStorage: ReturnType<typeof createPgStorage> | null = null
  
  
  const getAccessToken = async () => {
    const state = useStoreBase.getState()
    return state.auth?.accessToken || ''
  }
  
  return {
    async getItem(key: string): Promise<string | null> {

      const currentState = useStoreBase?.getState?.()
      
      if (currentState?.isDemoMode || !currentState?.auth?.isAuthenticated) {

        return null
      }
      

      if (!pgStorage) {

        pgStorage = createPgStorage(getAccessToken)
      }
      
      return pgStorage.getItem(key)
    },
    
    async setItem(key: string, value: string): Promise<void> {
      const currentState = useStoreBase?.getState?.()
      
      if (currentState?.isDemoMode || !currentState?.auth?.isAuthenticated) {

        return
      }
      

      if (!pgStorage) {
        pgStorage = createPgStorage(getAccessToken)
      }
      

  await pgStorage.setItem(key, value)
    },
    
    async removeItem(key: string): Promise<void> {
      const currentState = useStoreBase?.getState?.()
      
      if (currentState?.isDemoMode || !currentState?.auth?.isAuthenticated) {

        return
      }
      
      if (!pgStorage) {
        pgStorage = createPgStorage(getAccessToken)
      }
      
  await pgStorage.removeItem(key)
    }
  }
}

const useStoreBase = create<BoundStore>()(
  persist(
    devtools(
      immer(
        (...a) => ({

        ...createCoreSlice(...a),
        ...createUISlice(...a),
        ...createAnimationSlice(...a),
        ...createDemoSlice(...a),
        ...createTutorialSlice(...a),
        ...createPoolSlice(...a),
        ...createActivitySlice(...a),


        ...createTransactionSlice(...a),
        ...createAuthSlice(...a),
        ...createAchievementsSlice(...a),


        ...createTradingSlice(...a),


        ...createPortfolioSlice(...a),
        })
      ),
      {
        name: 'memedeck-store-devtools',
      }
    ),
    {
      name: 'memedeck-store',
      storage: createJSONStorage(() => createAdaptiveStorage()),
      onRehydrateStorage: () => (state) => {
        
      },
      skipHydration: true, 
      partialize: (state) => ({
        
        auth: {
          ...state.auth,
          user: normalizeUserObject(state.auth.user)
        },
        earnedAchievements: state.earnedAchievements,
        achievementProgress: state.achievementProgress,
        totalPoints: state.totalPoints,
        tierAchievements: state.tierAchievements,
      }),
    }
  )
)

export const useStore = createSelectors(useStoreBase)


export const useActivityStore = {
  use: {
    activity: () => useStore.use.activity(),
    updateActivityTokens: () => useStore.use.updateActivityTokens(),
    setConnectionState: () => useStore.use.setConnectionState(),
    setActivityError: () => useStore.use.setActivityError(),
    clearActivityError: () => useStore.use.clearActivityError(),
    toggleSidebar: () => useStore.use.toggleSidebar(),
    setSidebarOpen: () => useStore.use.setSidebarOpen(),
  blockedTokens: () => useStore((state: BoundStore) => state.activity.blockedTokens),
  setBlockedTokens: () => useStore.use.setBlockedTokens(),
  toggleBlockedToken: () => useStore.use.toggleBlockedToken(),
  clearBlockedTokens: () => useStore.use.clearBlockedTokens(),
  isTokenBlocked: () => useStore.use.isTokenBlocked(),
    getTopTokens: () => useStore.use.getTopTokens(),
    getTokenById: () => useStore.use.getTokenById(),
    fetchHotTokens: () => useStore.use.fetchHotTokens(),
    updateHotTokenData: () => useStore.use.updateHotTokenData(),
    updateSidebarTokenFromPool: () => useStore.use.updateSidebarTokenFromPool(),
  }
}



export type { BoundStore } from './store-types'

