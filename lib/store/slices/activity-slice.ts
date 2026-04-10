import { StateCreator } from "zustand";
import type { ActivityToken, ConnectionState } from "../../jupiter/realtime/activity-websocket";
import type { BoundStore } from "../store-types";

const BLOCKED_TOKENS_STORAGE_KEY = "memedeck-blocked-hot-tokens";

const getLocalStorage = (): Storage | null => {
  if (typeof globalThis === "undefined") {
    return null;
  }

  const storage = (globalThis as typeof globalThis & { localStorage?: Storage }).localStorage;
  return storage ?? null;
};

const readBlockedTokensFromStorage = (): string[] => {
  const storage = getLocalStorage();
  if (!storage) {
    return [];
  }

  try {
    const stored = storage.getItem(BLOCKED_TOKENS_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((tokenId) => (typeof tokenId === "string" ? tokenId.trim() : ""))
      .filter((tokenId): tokenId is string => tokenId.length > 0);
  } catch (error) {
    console.error("[ActivitySlice] Failed to read blocked tokens from storage", error);
    return [];
  }
};

const persistBlockedTokensToStorage = (tokenIds: string[]) => {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  try {
    const uniqueIds = Array.from(new Set(tokenIds.filter((id) => typeof id === "string" && id.length > 0)));
    storage.setItem(BLOCKED_TOKENS_STORAGE_KEY, JSON.stringify(uniqueIds));
  } catch (error) {
    console.error("[ActivitySlice] Failed to persist blocked tokens", error);
  }
};


export type { ActivityToken } from "../../jupiter/realtime/activity-websocket";


export interface HotToken {
  id: string;
  symbol: string;
  name: string;
  icon?: string;
  usdPrice: number;
  oneMinGain?: number | null;
  twoMinGain?: number | null;
  threeMinGain?: number | null;
  fourMinGain?: number | null;
  fiveMinGain?: number | null;
  buyPressure5m?: number;
  volume24h?: number;
  liquidity?: number;
  mcap?: number;
  lastUpdated: number;
}

export interface ActivitySlice {
  activity: {
    
    tokens: ActivityToken[];
    isLoading: boolean;
    lastUpdated: number;
    error: string | null;
    
    
    isConnected: boolean;
    connectionState: ConnectionState;
    
    
    sidebarOpen: boolean;
    blockedTokens: string[];
  };
  
  
  updateActivityTokens: (tokens: ActivityToken[]) => void;
  setConnectionState: (state: ConnectionState) => void;
  setActivityError: (error: string | null) => void;
  clearActivityError: () => void;
  
  
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setBlockedTokens: (tokenIds: string[]) => void;
  toggleBlockedToken: (tokenId: string) => void;
  isTokenBlocked: (tokenId: string) => boolean;
  clearBlockedTokens: () => void;
  
  
  getTopTokens: (limit: number) => ActivityToken[];
  getTokenById: (id: string) => ActivityToken | undefined;
  
  
  fetchHotTokens: () => Promise<void>;
  updateHotTokenData: (tokenId: string, data: Partial<HotToken>) => void;
  updateSidebarTokenFromPool: (tokenId: string, poolData: any) => void;
}

export const createActivitySlice: StateCreator<
  BoundStore,
  [['zustand/immer', never]],
  [],
  ActivitySlice
> = (set, get) => ({
  activity: {
    tokens: [],
    isLoading: false,
    lastUpdated: 0,
    error: null,
    isConnected: false,
    connectionState: 'disconnected' as ConnectionState,
    sidebarOpen: false,
    blockedTokens: readBlockedTokensFromStorage(),
  },

  updateActivityTokens: (tokens: ActivityToken[]) => {
    set((state) => {
      state.activity.tokens = tokens;
      state.activity.lastUpdated = Date.now();
      state.activity.isLoading = false;
      state.activity.error = null;
    });
  },

  setConnectionState: (connectionState: ConnectionState) => {
    set((state) => {
      state.activity.connectionState = connectionState;
      state.activity.isConnected = connectionState === 'connected';
    });
  },

  setActivityError: (error: string | null) => {
    set((state) => {
      state.activity.error = error;
      state.activity.isLoading = false;
    });
  },

  clearActivityError: () => {
    set((state) => {
      state.activity.error = null;
    });
  },

  toggleSidebar: () => {
    set((state) => {
      state.activity.sidebarOpen = !state.activity.sidebarOpen;
    });
  },

  setSidebarOpen: (open: boolean) => {
    set((state) => {
      state.activity.sidebarOpen = open;
    });
  },

  setBlockedTokens: (tokenIds: string[]) => {
    const sanitized = Array.from(new Set((tokenIds || []).filter((id) => typeof id === 'string' && id.length > 0)));
    set((state) => {
      state.activity.blockedTokens = sanitized;
    });
    persistBlockedTokensToStorage(sanitized);
  },

  toggleBlockedToken: (tokenId: string) => {
    if (typeof tokenId !== 'string' || tokenId.length === 0) {
      return;
    }

    set((state) => {
      const blockedSet = new Set(state.activity.blockedTokens || []);
      if (blockedSet.has(tokenId)) {
        blockedSet.delete(tokenId);
      } else {
        blockedSet.add(tokenId);
      }
      state.activity.blockedTokens = Array.from(blockedSet);
      persistBlockedTokensToStorage(state.activity.blockedTokens);
    });
  },

  isTokenBlocked: (tokenId: string) => {
    const state = get();
    return state.activity.blockedTokens?.includes(tokenId) ?? false;
  },

  clearBlockedTokens: () => {
    set((state) => {
      state.activity.blockedTokens = [];
    });
    persistBlockedTokensToStorage([]);
  },

  getTopTokens: (limit: number) => {
    const state = get();
    const blocked = new Set(state.activity.blockedTokens || []);
    return state.activity.tokens.filter(token => !blocked.has(token.tokenId)).slice(0, limit);
  },

  getTokenById: (id: string) => {
    const state = get();
    return state.activity.tokens.find(token => token.tokenId === id);
  },

  
  fetchHotTokens: async () => {
    
    
    const state = get();
    if (state.activity.tokens.length === 0 && !state.activity.isConnected) {
      set((state) => {
        state.activity.error = 'Live data connection not available. Please check your internet connection.';
      });
    }
  },

  updateHotTokenData: (() => {
    let lastUpdateTime = 0;
    const THROTTLE_MS = 1100; 
    const pendingUpdates = new Map<string, Partial<HotToken>>();

    return (tokenId: string, data: Partial<HotToken>) => {
      const now = Date.now();

      
      pendingUpdates.set(tokenId, data);

      
      if (lastUpdateTime > 0 && now - lastUpdateTime < THROTTLE_MS) {
        return;
      }

      lastUpdateTime = now;

      
      set((state) => {
        state.activity.tokens = state.activity.tokens.map((token) => {
          const updates = pendingUpdates.get(token.tokenId);
          if (updates) {
            
            if (updates.usdPrice !== undefined) token.price = updates.usdPrice;
            if (updates.oneMinGain !== undefined) token.oneMinGain = updates.oneMinGain ?? undefined;
            if (updates.twoMinGain !== undefined) token.twoMinGain = updates.twoMinGain ?? undefined;
            if (updates.threeMinGain !== undefined) token.threeMinGain = updates.threeMinGain ?? undefined;
            if (updates.fourMinGain !== undefined) token.fourMinGain = updates.fourMinGain ?? undefined;
            if (updates.fiveMinGain !== undefined) token.fiveMinGain = updates.fiveMinGain ?? undefined;
            if (updates.buyPressure5m !== undefined) token.buyPressure5m = updates.buyPressure5m;
            if (updates.volume24h !== undefined) token.volume24h = updates.volume24h;
            if (updates.liquidity !== undefined) token.liquidity = updates.liquidity;
          }
          return token;
        });
        state.activity.lastUpdated = Date.now();
      });

      
      pendingUpdates.clear();
    };
  })(),

  
  updateSidebarTokenFromPool: (tokenId: string, poolData: any) => {
    set((state) => {
      const tokenIndex = state.activity.tokens.findIndex(token => token.tokenId === tokenId);
      
      if (tokenIndex === -1) {
        return; 
      }

      const token = state.activity.tokens[tokenIndex];
      token.price = poolData.usdPrice || token.price;
      token.oneMinGain = poolData.gains?.oneMin ?? poolData.oneMinGain ?? token.oneMinGain;
      token.twoMinGain = poolData.gains?.twoMin ?? poolData.twoMinGain ?? token.twoMinGain;
      token.threeMinGain = poolData.gains?.threeMin ?? poolData.threeMinGain ?? token.threeMinGain;
      token.fourMinGain = poolData.gains?.fourMin ?? poolData.fourMinGain ?? token.fourMinGain;
      token.fiveMinGain = poolData.gains?.fiveMin ?? poolData.fiveMinGain ?? token.fiveMinGain;
      token.buyPressure5m = poolData.buyPressure5m ?? token.buyPressure5m;
      token.volume24h = poolData.volume24h ?? token.volume24h;
      token.liquidity = poolData.liquidity ?? token.liquidity;
      state.activity.lastUpdated = Date.now();
    });
  },

});