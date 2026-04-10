import { StateCreator } from 'zustand'
import type { 
  PortfolioSlice, 
  CoreSlice, 
  UISlice, 
  AuthSlice, 
  AnimationSlice,
  BoundStore,
  UiState,
  AudioState,
  StartupModalState,
  GameState
} from '../store-types'

interface PricePoint {
  price: number;
  timestamp: number;
  percentChange: number;
}

interface PriceNotificationState {
  lastNotificationTime: Record<string, number>;
  lastAnimationCompleteTime: Record<string, number>;
  hotTokens: string[];
}

export const createUISlice: StateCreator<
  BoundStore,
  [['zustand/immer', never]],
  [],
  UISlice
> = (set, get) => {
  
  
  const initialAmounts = {
    selectedDrawAmount: 100,
    selectedCardCount: 3,
  };

  return {
    
    ui: {
      isShuffling: false,
      focusedCardId: null,
      isCardFocused: false,
      sortMode: 'default',
      sortAscending: false,
      showActivityIndicators: false,
      showActivityMonitor: false,
      chartType: 'line',
      selectedDrawAmount: initialAmounts.selectedDrawAmount,
      selectedCardCount: initialAmounts.selectedCardCount,
      customAmount: '',
      viewMode: 'carousel',
      selectedCardIndex: -1,
      textureCache: {},
      hoveredCardImageUrl: null
    },

  
  audio: {
    masterVolume: 0.8,
    musicEnabled: true,
    musicVolume: 0.15,
    sfxEnabled: true,
    sfxVolume: 0.7,
    uiEnabled: true,
    uiVolume: 0.5,
    
    speechEnabled: true,
    speechVolume: 0.7,
    initialized: false
  },

  
  screenEffects: {
    isShaking: false,
    isFlashing: false,
    isTinted: false,
    shakeIntensity: 'light',
    flashColor: 'white',
    tintColor: 'green',
    tintOpacity: 0.1
  },

  
  game: {
    audioInitialized: false,
    engineInitialized: false
  },

  
  startupModal: {
    customAmount: '',
    isCustomActive: false
  },


  isLoading: false,


  funding: {
    fundingModalOpen: false,
    solPrice: null as number | null,
    solPriceLastFetched: null as number | null,
  },
  

  transactionModal: {
    isOpen: false,
  },


  setUi: (updates: Partial<UiState>) => {
    set((state) => {
      state.ui = { ...state.ui, ...updates };
    });
  },

  setAudio: (updates: Partial<AudioState>) => {
    set((state) => {
      state.audio = { ...state.audio, ...updates };
    });
  },

  setGame: (updates: Partial<GameState>) => {
    set((state) => {
      state.game = { ...state.game, ...updates };
    });
  },

  setStartupModal: (updates: Partial<StartupModalState>) => {
    set((state) => {
      state.startupModal = { ...state.startupModal, ...updates };
    });
  },

  setLoading: (loading: boolean) => {
    set((state) => {
      state.isLoading = loading;
    });
  },


  toggleMusic: () => {
    set((state) => {
      state.audio.musicEnabled = !state.audio.musicEnabled;
    });
  },

  toggleSfx: () => {
    set((state) => {
      state.audio.sfxEnabled = !state.audio.sfxEnabled;
    });
  },

  setMusicVolume: (volume: number) => {
    set((state) => {
      state.audio.musicVolume = Math.max(0, Math.min(1, volume));
    });
  },

  setSfxVolume: (volume: number) => {
    set((state) => {
      state.audio.sfxVolume = Math.max(0, Math.min(1, volume));
    });
  },

  setMasterVolume: (volume: number) => {
    set((state) => {
      state.audio.masterVolume = Math.max(0, Math.min(1, volume));
    });
  },

  setUiVolume: (volume: number) => {
    set((state) => {
      state.audio.uiVolume = Math.max(0, Math.min(1, volume));
    });
  },

  toggleUi: () => {
    set((state) => {
      state.audio.uiEnabled = !state.audio.uiEnabled;
    });
  },


  setFocusedCard: (cardId: string | null) => {
    set((state) => {
      state.ui.focusedCardId = cardId;
      state.ui.isCardFocused = cardId !== null;
    });
  },


  setSortMode: (mode: UISlice['ui']['sortMode']) => {
    set((state) => {
      state.ui.sortMode = mode;
    });
  },

  toggleSortDirection: () => {
    set((state) => {
      state.ui.sortAscending = !state.ui.sortAscending;
    });
  },

  
  toggleActivityIndicators: () => {
    set((state) => {
      state.ui.showActivityIndicators = !state.ui.showActivityIndicators;
    });
  },

  toggleActivityMonitor: () => {
    set((state) => {
      state.ui.showActivityMonitor = !state.ui.showActivityMonitor;
    });
  },

  
  setChartType: (type: 'line' | 'candle') => {
    set((state) => {
      state.ui.chartType = type;
    });
  },

  
  triggerScreenShake: (intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    set((state) => {
      state.screenEffects.isShaking = true;
      state.screenEffects.shakeIntensity = intensity;
    });
  },

  triggerScreenFlash: (color: string = 'white') => {
    set((state) => {
      state.screenEffects.isFlashing = true;
      state.screenEffects.flashColor = color;
    });
  },

  stopScreenShake: () => {
    set((state) => {
      state.screenEffects.isShaking = false;
    });
  },

  stopScreenFlash: () => {
    set((state) => {
      state.screenEffects.isFlashing = false;
    });
  },

  clearScreenEffects: () => {
    set((state) => {
      state.screenEffects.isShaking = false;
      state.screenEffects.isFlashing = false;
      state.screenEffects.isTinted = false;
      state.screenEffects.shakeIntensity = 'light';
      state.screenEffects.flashColor = 'white';
      state.screenEffects.tintColor = 'green';
      state.screenEffects.tintOpacity = 0.1;
    });
  },

  
  setHoveredCardImage: (imageUrl: string | null) => {
    set((state) => {
      state.ui.hoveredCardImageUrl = imageUrl;
    });
  },

  
  setSelectedDrawAmount: (amount: number) => {
    set((state) => {
      state.ui.selectedDrawAmount = amount;
    });
  },

  setSelectedCardCount: (count: number) => {
    set((state) => {
      state.ui.selectedCardCount = count;
    });
  },

  setCustomAmount: (amount: string) => {
    set((state) => {
      state.ui.customAmount = amount;
    });
  },

  
  toggleViewMode: () => {
    set((state) => {
      state.ui.viewMode = state.ui.viewMode === 'carousel' ? 'grid' : 'carousel';
    });
  },

  
  setSelectedCardIndex: (index: number) => {
    set((state) => {
      state.ui.selectedCardIndex = index;
    });
  },

  
  preloadHandTextures: async () => {
    const { hand } = get();
    if (!hand || hand.length === 0) return;

    
    const iconUrls = hand
      .map(card => card.icon)
      .filter((icon, index, arr) => icon && arr.indexOf(icon) === index); 

    
    const preloadPromises = iconUrls.map(async (iconUrl) => {
      if (!iconUrl) return;
      
      const { ui } = get();
      if (ui.textureCache?.[iconUrl]) return; 

      try {
        
        const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(iconUrl)}&width=256&height=256`;
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        const texture = await new Promise((resolve, reject) => {
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Failed to load: ${iconUrl}`));
          img.src = proxyUrl;
        });

        
        get().cacheTexture(iconUrl, texture);
      } catch (error) {
        
      }
    });

    await Promise.allSettled(preloadPromises);
  },

  cacheTexture: (url: string, texture: any) => {
    set((state) => {
      if (!state.ui.textureCache) {
        state.ui.textureCache = {};
      }
      state.ui.textureCache[url] = texture;
    });
  },

  getCachedTexture: (url: string) => {
    const { ui } = get();
    return ui.textureCache?.[url] || null;
  },

  
  initializeDrawAmounts: () => {
    const state = get();
    const isAuthenticated = state.auth?.isAuthenticated;
    
    
    if (isAuthenticated && !state.isDemoMode) {
      
      set((state) => {
        state.ui.selectedDrawAmount = 1;
        state.ui.selectedCardCount = 1;
      });
    } else {
      
      set((state) => {
        state.ui.selectedDrawAmount = 100;
        state.ui.selectedCardCount = 3;
      });
    }
  },

  
  setFundingModalOpen: (isOpen: boolean) => {
    set((state) => {
      state.funding.fundingModalOpen = isOpen;
    });
  },


  openFundingModal: () => {
    set((state) => {
      state.funding.fundingModalOpen = true;
    });
  },

  closeFundingModal: () => {
    set((state) => {
      state.funding.fundingModalOpen = false;
    });
  },
  
  
  openTransactionModal: () => {
    set((state) => {
      state.transactionModal.isOpen = true;
    });
  },
  
  closeTransactionModal: () => {
    set((state) => {
      state.transactionModal.isOpen = false;
    });
  },

  
  setSolPrice: (price: number) => {
    set((state) => {
      state.funding.solPrice = price;
      state.funding.solPriceLastFetched = Date.now();
    });
  },

  fetchSolPrice: async () => {
    try {
      const { getSolPrice } = require('@/lib/services/sol-price-service');
      const price = await getSolPrice();
      get().setSolPrice(price);
      return price;
    } catch (error) {
      console.error('Failed to fetch SOL price:', error);
      return 180; 
    }
  },

  getSolPriceFromStore: () => {
    const { funding } = get();
    const now = Date.now();
    const CACHE_DURATION = 30000; 
    
    
    if (funding.solPrice && funding.solPriceLastFetched && 
        (now - funding.solPriceLastFetched) < CACHE_DURATION) {
      return funding.solPrice;
    }
    
    
    return funding.solPrice || 180;
  },

  };
};