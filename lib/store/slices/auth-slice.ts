import { ULTRA_API_BASE_URL } from '@/lib/config/trading-constants';
import { tokenMetadataService } from '@/lib/services/token-metadata';
import type { UserTier } from '@/lib/utils/fee-tiers';
import { StateCreator } from 'zustand';
import type {
  AuthSlice,
  BoundStore,
  TradeResult
} from '../store-types';


export const createAuthSlice: StateCreator<
  BoundStore,
  [['zustand/immer', never]],
  [],
  AuthSlice
> = (set, get) => ({
  
  userId: null,
  isDemoMode: false,
  
  
  referredBy: null,
  referrerUserId: null,
  referrerHydraWallet: null,
  
  
  tradingStats: {
    totalTrades: 0,
    totalWins: 0,
    totalProfit: 0,
    winRate: 0,
    currentStreak: 0,
    favoriteToken: null
  },
  
  
  balancePollingInterval: null,
  
  
  auth: {
    user: null,
    isAuthenticated: false,
    isLoading: true, 
    accessToken: null,
    tradingMode: 'demo' as const,
    canTradeLive: false,
    embeddedWallet: null
  },

  
  setAuth: (updates: Partial<AuthSlice['auth']>) => {
    set((state) => {
      Object.assign(state.auth, updates);
    });
  },


  
  switchToUser: async (userId: string, accessToken?: string, embeddedWalletAddress?: string) => {
    
    set((state) => {
      state.isLoading = true;
      state.auth.isAuthenticated = true;
      state.auth.accessToken = accessToken || null;
      state.userId = userId;
      state.isDemoMode = false;
    });
    
    try {
      
      set((state) => {
        state.hand = [];
        state.positions = {};
        state.deck = [];
        state.discardPile = [];
        state.memeScores = {};
        state.walletBalance = 0;
        state.realizedPnl = 0;
        state.totalFees = 0;
        state.transactions.items = [];
      });
      
      
      await get().loadOnChainPositions(userId, accessToken, embeddedWalletAddress);
      
      
      get().initializeDrawAmounts();
      
    } catch (error) {
      set((state) => {
        state.isLoading = false;
      });
    }
  },

  switchToDemo: async () => {
    set((state) => {
      state.isLoading = true;
      state.isDemoMode = true;
      state.userId = 'demo';
    });
    
    try {
      await get().createFreshDemoState();
      get().initializeDrawAmounts();
    } catch (error) {
      set((state) => {
        state.isLoading = false;
      });
    }
  },

  
  initializeDemoMode: async () => {
    
    const { isDemoMode, userId, hand, isLoading } = get();
    if (isDemoMode && userId === 'demo' && hand.length > 0 && !isLoading) {
      return;
    }
    
    set((state) => {
      state.isDemoMode = true;
      state.isLoading = true;
      state.userId = 'demo';
    });
    
    try {
      await get().createFreshDemoState();
      get().initializeDrawAmounts();
      
      
      const finalState = get();
      
      
      set((state) => {
        state.isLoading = false;
      });
      
    } catch (error) {
      // Don't re-throw - demo mode should work even if initialization partially fails
      // User will have empty hand but can draw cards manually
      console.warn('[DEMO] Demo mode initialization encountered an error:', error);
      set((state) => {
        state.isLoading = false;
        state.isDemoMode = true;
        state.userId = 'demo';
      });
    }
  },



  createFreshDemoState: async () => {
    try {
      
      set((state) => {
        state.userId = 'demo';
        state.walletBalance = 500; 
        state.isDemoMode = true;
        state.isLoading = false;
        state.hand = [];
        state.deck = [];
        state.positions = {};
        
        state.realizedPnl = 0;
        state.totalFees = 0;
        state.transactions.items = [];
        state.discardPile = [];
        state.memeScores = {};
      });
      
      
      get().initializeDrawAmounts();
      
      
      const currentHand = get().hand;
      if (currentHand.length === 0) {
        try {
          const demo = get().demo;
          // Pass explicit parameters since UI state may not be synced yet
          await demo.openPosition({
            amountOverride: 100,   // DEMO_POSITION_SIZE
            cardCountOverride: 3,  // Default demo card count
          });
        } catch (error) {
          // If initial position fetch fails (network error, API down),
          // continue with empty hand - user can draw cards manually
          console.warn('[DEMO] Failed to load initial position, starting with empty hand:', error);
        }
      }
      
      
    } catch (error) {
      set((state) => {
        state.isLoading = false;
      });
    }
  },



  resetDemoMode: async () => {
    try {
      set((state) => {
        state.isLoading = true;
      });
      
      
      set((state) => {
        state.hand = [];
        state.deck = [];
        state.discardPile = [];
        state.positions = {};
        state.walletBalance = 0;
        state.realizedPnl = 0;
        state.totalFees = 0;
        state.transactions.items = [];
        
        state.memeScores = {};
        state.celebration = {
          isActive: false,
          tier: null,
          cardId: null,
          profit: 0,
          percentGain: 0,
          tokenSymbol: '',
          startTime: 0,
        };
        state.activityTracking = {
          updateCounts: {},
          recentUpdates: {},
          activityScores: {},
          lastCalculation: 0,
        };
        state.operations = {
          draw: { status: "idle", timestamp: 0 },
          discard: { status: "idle", timestamp: 0 },
          reset: { status: "idle", timestamp: 0 },
        };
        state.ui.isShuffling = false;
        state.ui.focusedCardId = null;
        state.ui.isCardFocused = false;
        state.isDemoMode = true;
        state.isLoading = true;
      });
      

      await get().createFreshDemoState();
      
      
    } catch (error) {
      set((state) => {
        state.isLoading = false;
      });
    }
  },



  loadOnChainPositions: async (userId: string, accessToken?: string, embeddedWalletAddress?: string) => {
    try {
      const walletAddress = embeddedWalletAddress || get().auth.user?.walletAddress;
      
      if (!walletAddress) {
        return;
      }
      

      let userCostBasis: Record<string, { totalCost: number; buyCount: number }> = {};
      
      try {
        const costBasisResponse = await fetch(`/api/user/cost-basis?userId=${userId}`);
        const costBasisResult = await costBasisResponse.json();
        
        if (costBasisResult.success) {
          userCostBasis = costBasisResult.data;
        }
      } catch (error) {

      }
      

      const balancesResponse = await fetch(`${ULTRA_API_BASE_URL}/balances/${walletAddress}`);
      
      if (!balancesResponse.ok) {
        throw new Error(`Jupiter API returned ${balancesResponse.status}`);
      }
      
      const balances = await balancesResponse.json();
      

      const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      const usdcBalance = balances[USDC_MINT]?.uiAmount || 0;
      const solBalance = balances['SOL']?.uiAmount || 0;
      
      
      const tokenMints: string[] = [];
      const tokenBalances: Record<string, number> = {};
      
      for (const [tokenMint, balanceData] of Object.entries(balances)) {
        
        const SOL_MINT = 'So11111111111111111111111111111111111111112'; 
        
        if (tokenMint === 'SOL' || tokenMint === USDC_MINT || tokenMint === SOL_MINT) {
          continue;
        }
        
        const balance = (typeof balanceData === 'object' && balanceData && 'uiAmount' in balanceData)
          ? Number((balanceData as { uiAmount?: unknown }).uiAmount) || 0
          : 0;
        
        
        if (balance > 0) {
          tokenMints.push(tokenMint);
          tokenBalances[tokenMint] = balance;
        }
      }
      
      
      let tokenMetadata = new Map();
      try {
        tokenMetadata = await tokenMetadataService.batchGetTokenMetadata(tokenMints);
      } catch (error) {
        
      }
      
      
      const handCards: any[] = [];
      const positions: Record<string, any> = {};
      
      for (const tokenMint of tokenMints) {
        const balance = tokenBalances[tokenMint];
        const metadata = tokenMetadata.get(tokenMint);
        const costBasisData = userCostBasis[tokenMint];
        
        
        const card = {
          id: tokenMint,
          type: "jupiter" as const,
          name: metadata?.name || 'Unknown Token',
          symbol: metadata?.symbol || 'Unknown',
          icon: metadata?.icon || "/digital-token.webp",
          priceChange24h: metadata?.priceChange24h || 0,
          usdPrice: metadata?.price || 0,
          volume24h: metadata?.volume24h || 0,
          liquidity: metadata?.liquidity || 0,
          memeScore: 50, 
          rawData: balances[tokenMint], 
          faceUp: true,
        };
        
        handCards.push(card);
        
        
        
        if (costBasisData && costBasisData.totalCost > 0) {
          
          const avgEntryPrice = costBasisData.totalCost / balance;
          
          positions[tokenMint] = {
            tokenId: tokenMint,
            tokenSymbol: metadata?.symbol || 'Unknown',
            tokenName: metadata?.name || 'Unknown Token',
            quantity: balance, 
            entryPrice: avgEntryPrice,
            cost: costBasisData.totalCost,
            entryTimestamp: Date.now(), 
            
            currentPrice: metadata?.price || 0,
            value: balance * (metadata?.price || 0),
            unrealizedPnl: (balance * (metadata?.price || 0)) - costBasisData.totalCost,
          };
        } else {
          
          
          positions[tokenMint] = {
            tokenId: tokenMint,
            tokenSymbol: metadata?.symbol || 'Unknown',
            tokenName: metadata?.name || 'Unknown Token',
            quantity: balance,
            entryPrice: metadata?.price || 0, 
            cost: balance * (metadata?.price || 0), 
            entryTimestamp: Date.now(),
            unknownBasis: true, 
            
            currentPrice: metadata?.price || 0,
            value: balance * (metadata?.price || 0),
            unrealizedPnl: 0, 
          };
        }
      }
      
      
      set((state) => {
        state.hand = handCards;
        state.positions = positions;
        state.walletBalance = usdcBalance;
        if (state.auth.user) {
          state.auth.user.solBalance = solBalance;
          
        }
        state.isLoading = false;
      });
      
      
    } catch (error) {
      
      set((state) => {
        state.hand = [];
        state.positions = {};
        state.walletBalance = 0;
        state.isLoading = false;
      });
    }
  },

  
  createFreshPaperTradingState: async (userId: string, accessToken?: string) => {
    try {
      
      set((state) => {
        state.userId = userId;
        state.walletBalance = 500; 
        state.isDemoMode = false; 
        state.isLoading = false;
        state.hand = []; 
        state.deck = []; 
        state.positions = {}; 
        state.realizedPnl = 0;
        state.totalFees = 0;
        state.transactions.items = [];
        state.discardPile = [];
        state.memeScores = {};
      });
      
    } catch (error) {
      set((state) => {
        state.isLoading = false;
      });
      throw error;
    }
  },

  
  switchToLiveMode: async () => {
    const state = get();
    
    
    const validation = await get().validateLiveTradingRequirements();
    if (!validation.valid) {
      throw new Error(`Live trading requirements not met: ${validation.errors.join(', ')}`);
    }

    
    set((state) => {
      state.auth.tradingMode = 'live';
      state.auth.canTradeLive = true;
      if (state.auth.user) {
        state.auth.user.isLiveMode = true;
      }
    });
  },

  switchToPaperMode: async () => {
    set((state) => {
      state.auth.tradingMode = 'paper';
      state.auth.canTradeLive = false;
      if (state.auth.user) {
        state.auth.user.isLiveMode = false;
      }
    });
  },

  setWalletAddress: (address: string) => {
    set((state) => {
      if (state.auth.user) {
        state.auth.user.walletAddress = address;
      }
    });
  },

  updateWalletBalance: (usdcBalance: number) => {
    set((state) => {
      state.walletBalance = usdcBalance;
      
      
    });
  },
  
  updateSolBalance: (balance: number) => {
    set((state) => {
      if (state.auth.user) {
        state.auth.user.solBalance = balance;
      }
    });
  },
  
  validateLiveTradingRequirements: async () => {
    const state = get();
    const errors: string[] = [];

    
    if (!state.auth.isAuthenticated || !state.auth.user) {
      errors.push('User must be authenticated');
    }

    
    if (!state.auth.user?.walletAddress) {
      errors.push('Wallet must be connected');
    }

    

    return {
      valid: errors.length === 0,
      errors
    };
  },

  
  recordTradeStats: (trade: TradeResult) => {
    set((state) => {
      state.tradingStats.totalTrades++;
      
      if (trade.type === 'sell' && trade.profit !== undefined) {
        
        state.tradingStats.totalProfit += trade.profit;
        
        if (trade.isWin) {
          state.tradingStats.totalWins++;
          state.tradingStats.currentStreak = Math.max(0, state.tradingStats.currentStreak) + 1;
        } else {
          state.tradingStats.currentStreak = Math.min(0, state.tradingStats.currentStreak) - 1;
        }
        
        
        const sellTrades = state.tradingStats.totalTrades; 
        state.tradingStats.winRate = sellTrades > 0 ? state.tradingStats.totalWins / sellTrades : 0;
      }
      
      
      if (!state.tradingStats.favoriteToken || Math.random() > 0.7) {
        state.tradingStats.favoriteToken = trade.symbol;
      }
    });
  },
  

  
  saveCriticalState: async () => {
    const state = get();
    const { userId, isDemoMode } = state;
    
    if (!userId || isDemoMode) {
      return true; 
    }
    
    
    return true;
  },


  setReferredBy: (userId: string | null) => {
    set((state) => {
      state.referredBy = userId;
    });
  },

  setReferrerInfo: (userId: string | null, hydraWallet: string | null) => {
    set((state) => {
      state.referrerUserId = userId;
      state.referrerHydraWallet = hydraWallet;
    });
  },

  setUserTier: (tier: UserTier) => {
    set((state) => {
      if (state.auth.user) {
        state.auth.user.tier = tier;
      }
    });
  },

  
  getAccessToken: () => {
    const { auth } = get();
    return auth.accessToken || null;
  },
});