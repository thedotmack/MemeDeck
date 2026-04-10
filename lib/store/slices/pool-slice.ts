import { StateCreator } from "zustand";
import type { BoundStore, PoolSlice, TokenPoolData } from "../store-types";

export const createPoolSlice: StateCreator<
  BoundStore,
  [['zustand/immer', never]],
  [],
  PoolSlice
> = (set, get) => ({
  
  tokenPools: {},
  subscribedTokens: new Set(),
  poolUpdateCount: 0,

  
  loadInitialPools: (pools: TokenPoolData[]) => {

    const tokenPools: Record<string, TokenPoolData> = {};
    const tokenIds: string[] = [];

    pools.forEach((pool: any) => {
      const tokenId = pool.baseAsset?.id || pool.id;
      if (tokenId) {
        
        const poolData: any = {
          id: tokenId,
          symbol: pool.baseAsset?.symbol || pool.symbol || "",
          name: pool.baseAsset?.name || pool.name || "",
        };
        

        if (pool.baseAsset?.usdPrice != null) poolData.usdPrice = pool.baseAsset.usdPrice;
        else if (pool.usdPrice != null) poolData.usdPrice = pool.usdPrice;
        
        if (pool.liquidity != null) poolData.liquidity = pool.liquidity;
        if (pool.volume24h != null) poolData.volume24h = pool.volume24h;
        if (pool.baseAsset?.mcap != null || pool.mcap != null) poolData.mcap = pool.baseAsset?.mcap || pool.mcap;
        if (pool.baseAsset?.fdv != null || pool.fdv != null) poolData.fdv = pool.baseAsset?.fdv || pool.fdv;
        if (pool.baseAsset?.holderCount != null || pool.holderCount != null) poolData.holderCount = pool.baseAsset?.holderCount || pool.holderCount;
        if (pool.baseAsset?.stats5m != null || pool.stats5m != null) poolData.stats5m = pool.baseAsset?.stats5m || pool.stats5m;
        if (pool.baseAsset?.stats1h != null || pool.stats1h != null) poolData.stats1h = pool.baseAsset?.stats1h || pool.stats1h;
        if (pool.baseAsset?.stats24h != null || pool.stats24h != null) poolData.stats24h = pool.baseAsset?.stats24h || pool.stats24h;
        if (pool.baseAsset?.icon != null || pool.icon != null) poolData.icon = pool.baseAsset?.icon || pool.icon;
        
        poolData.lastUpdated = Date.now();
        poolData.updateCount = 0;
        
        tokenPools[tokenId] = poolData;
        tokenIds.push(tokenId);
      }
    });

    set((state) => {
      state.tokenPools = tokenPools;
      state.subscribedTokens = new Set(tokenIds);
      state.poolUpdateCount = 0;
    });
  },

  updateTokenPool: (() => {
    let lastUpdateTime = 0;
    const THROTTLE_MS = 400;
    const pendingUpdates = new Map<string, Partial<TokenPoolData>>();
    
    return (tokenId: string, poolData: Partial<TokenPoolData>) => {
      const now = Date.now();
      

      pendingUpdates.set(tokenId, poolData);
      
      if (now - lastUpdateTime < THROTTLE_MS) {
        return;
      }
      
      lastUpdateTime = now;
      

      for (const [updateTokenId, latestPoolData] of pendingUpdates) {
        const oldPrice = get().tokenPools[updateTokenId]?.usdPrice;
        const newPrice = latestPoolData.usdPrice;
        
        set(state => {
          const existingPool = state.tokenPools[updateTokenId] || { 
            id: updateTokenId, 
            symbol: '', 
            name: '', 
            usdPrice: undefined, 
            liquidity: undefined, 
            volume24h: undefined,
            lastUpdated: 0,
            updateCount: 0
          };
          

          const filteredPoolData = Object.fromEntries(
            Object.entries(latestPoolData).filter(([key, value]) => value != null)
          );
          
          const updatedPool: TokenPoolData = {
            ...existingPool,
            ...filteredPoolData,
            lastUpdated: Date.now(),
            updateCount: existingPool.updateCount + 1
          };
          
          return {
            tokenPools: {
              ...state.tokenPools,
              [updateTokenId]: updatedPool
            },
            poolUpdateCount: state.poolUpdateCount + 1
          };
        });
        

        if (newPrice !== oldPrice && newPrice) {
          const syncPortfolioPosition = get().syncPortfolioPosition;
          if (syncPortfolioPosition) {
            syncPortfolioPosition(updateTokenId, newPrice);
          }
        }
        

        const updateActivityTracking = get().updateActivityTracking;
        if (updateActivityTracking) {
          updateActivityTracking(updateTokenId);
        }
        

        const updateSidebarTokenFromPool = get().updateSidebarTokenFromPool;
        if (updateSidebarTokenFromPool) {
          updateSidebarTokenFromPool(updateTokenId, latestPoolData);
        }
      }
      

      pendingUpdates.clear();
    }
  })(),

  updateTokenPrice: (tokenId: string, price: number, source = "unknown") => {
    get().updateTokenPool(tokenId, {
      usdPrice: price
    });
  },

  subscribeToTokens: (tokenIds: string[]) => {

    set((state) => {
      tokenIds.forEach(id => state.subscribedTokens.add(id));
    });
  },

  unsubscribeFromTokens: (tokenIds: string[]) => {

    set((state) => {
      tokenIds.forEach((id) => state.subscribedTokens.delete(id));
    });
  },

  removeToken: (tokenId: string) => {
    set((state) => {
      delete state.tokenPools[tokenId];
      state.subscribedTokens.delete(tokenId);
    });
  },

  
  getTokenPrice: (tokenId: string) => {
    return get().tokenPools[tokenId]?.usdPrice;
  },

  getTokenData: (tokenId: string) => {
    return get().tokenPools[tokenId] || null;
  },

  getActiveTokens: () => {
    return Object.keys(get().tokenPools);
  },

  getSubscribedTokens: () => {
    return Array.from(get().subscribedTokens);
  },

  
  getCurrentPrice: (tokenId: string) => {
    return get().tokenPools[tokenId]?.usdPrice;
  },

  get24hPriceChange: (tokenId: string) => {
    return get().tokenPools[tokenId]?.stats24h?.priceChange ?? 0;
  },

  get24hVolume: (tokenId: string) => {
    return get().tokenPools[tokenId]?.volume24h ?? 0;
  },

  getLiquidity: (tokenId: string) => {
    return get().tokenPools[tokenId]?.liquidity ?? 0;
  },

  getOrganicScore: (tokenId: string) => {
    return get().tokenPools[tokenId]?.organicScore ?? 0;
  },

  getHolderCount: (tokenId: string) => {
    return get().tokenPools[tokenId]?.holderCount ?? 0;
  },

  
  getTokenPerformance: (tokenId: string, timeframe: "5m" | "1h" | "24h") => {
    const pool = get().tokenPools[tokenId];
    if (!pool) return 0;

    switch (timeframe) {
      case "5m":
  return pool.stats5m?.priceChange ?? 0;
      case "1h":
  return pool.stats1h?.priceChange ?? 0;
      case "24h":
  return pool.stats24h?.priceChange ?? 0;
      default:
        return 0;
    }
  },

  getTokenActivity: (tokenId: string) => {
    const pool = get().tokenPools[tokenId];
    return {
      updateCount: pool?.updateCount ?? 0,
      lastUpdated: pool?.lastUpdated ?? 0,
    };
  },

  
  getOneMinGain: (tokenId: string) => {
    const pool = get().tokenPools[tokenId];
    return pool?.gains?.oneMin ?? pool?.oneMinGain ?? null;
  },

  getTwoMinGain: (tokenId: string) => {
    const pool = get().tokenPools[tokenId];
    return pool?.gains?.twoMin ?? pool?.twoMinGain ?? null;
  },

  getThreeMinGain: (tokenId: string) => {
    const pool = get().tokenPools[tokenId];
    return pool?.gains?.threeMin ?? pool?.threeMinGain ?? null;
  },

  getFourMinGain: (tokenId: string) => {
    const pool = get().tokenPools[tokenId];
    return pool?.gains?.fourMin ?? pool?.fourMinGain ?? null;
  },

  getFiveMinGain: (tokenId: string) => {
    const pool = get().tokenPools[tokenId];
    return pool?.gains?.fiveMin ?? pool?.fiveMinGain ?? null;
  },

  getTokenSignal: (tokenId: string) => {
    return get().tokenPools[tokenId]?.signal || null;
  },

  getUpdatesPerMinute: (tokenId: string) => {
    const pool = get().tokenPools[tokenId];
    const value = pool?.updatesPerMinute;
    return value ?? 0;
  },

  getBuyPressure5m: (tokenId: string) => {
    return get().tokenPools[tokenId]?.buyPressure5m ?? 0;
  },

  getTokenFirstSeen: (tokenId: string) => {
    const pool = get().tokenPools[tokenId];
    if (!pool?.firstSeen || pool.firstSeen === null) return 0;
    return pool.firstSeen;
  },

  getWinRate: (tokenId: string) => {
    return get().tokenPools[tokenId]?.winRate ?? 0;
  },
});
