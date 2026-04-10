
import type { OperationState } from '@/lib/data/types';
import type { JupiterTokenCard, MemeScore, TokenPosition } from '@/lib/types/shared';
import type { Transaction as UnifiedTransaction } from '@/lib/types/transaction';
import type { UserTier } from '@/lib/utils/fee-tiers';



export interface PriceNotificationState {
  lastNotificationTime: Record<string, number>;
  lastAnimationCompleteTime: Record<string, number>;
  hotTokens: string[];
}

export interface ActivityTracking {
  updateCounts: Record<string, number>;
  recentUpdates: Record<string, number[]>;
  activityScores: Record<string, number>;
  lastCalculation: number;
}



export interface UiState {
  isShuffling: boolean;
  focusedCardId: string | null;
  isCardFocused: boolean;
  sortMode: 'default' | 'value' | 'change' | 'activity' | 'price' | 'volume' | 'alphabetical' | 'performance' | 'risk';
  sortAscending: boolean;
  showActivityIndicators: boolean;
  showActivityMonitor: boolean;
  chartType: 'line' | 'candle';
  selectedDrawAmount: number;
  selectedCardCount: number;
  customAmount: string;
  viewMode: 'carousel' | 'grid';
  selectedCardIndex: number;
  priceNotifications?: PriceNotificationState;
  hoveredCardImageUrl?: string | null;
  textureCache?: Record<string, any>;
  achievementScratch?: {
    id: string;
    name: string;
    timestamp: number;
    isVisible: boolean;
  };
  achievementNotification?: {
    id: string;
    name: string;
    timestamp: number;
  };
}

export interface ScreenEffectsState {
  isShaking: boolean;
  isFlashing: boolean;
  isTinted: boolean;
  shakeIntensity: 'light' | 'medium' | 'heavy';
  flashColor: string;
  tintColor: string;
  tintOpacity: number;
}

export interface AudioState {
  masterVolume: number;
  musicEnabled: boolean;
  musicVolume: number;
  sfxEnabled: boolean;
  sfxVolume: number;
  uiEnabled: boolean;
  uiVolume: number;
  
  speechEnabled: boolean;
  speechVolume: number;
  initialized: boolean;
}

export interface GameState {
  audioInitialized: boolean;
  engineInitialized: boolean;
}

export interface StartupModalState {
  customAmount: string;
  isCustomActive: boolean;
}


export interface AuthState {
  user: {
    id: string;
    username: string;
    walletAddress: string | null;
    portfolioValue: number;
    solBalance?: number;
    isLiveMode?: boolean;
    tier?: UserTier; 
  
  hydraWalletAddress?: string | null;
  hydraFanoutId?: string | null;
  revSharePercentage?: number | null;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  tradingMode: 'demo' | 'paper' | 'live';
  canTradeLive: boolean;
  embeddedWallet: any | null; 
  
  referrerUserId?: string | null;
  referrerHydraWallet?: string | null;
}


export interface CelebrationState {
  isActive: boolean;
  tier: 'lil' | 'small' | 'decent' | 'big' | 'huge' | 'legendary' | 'epic' | 'mythical' | 'godlike' | 'transcendent' | null; 
  cardId: string | null;
  profit: number;
  percentGain: number;
  tokenSymbol: string;
  startTime: number;
}


interface SetCard {
  id: string;
  tokenId: string;
  symbol: string;
  name: string;
  icon?: string;
  basisPrice?: number;
  quantity: number;
  position: number;
  addedAt: Date;
}

interface CardSet {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  isDemo: boolean;
  isActive: boolean;
  basisAmount: number;
  cards: SetCard[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CardSetsState {
  cardSets: CardSet[];
  activeSetId: string | null;
  isLoading: boolean;
}


export interface PepeEventState {
  isActive: boolean;
  context: string;
  tokenId?: string;
  tokenSymbol?: string;
  data?: any;
  startTime: number;
}



export interface PortfolioSlice {
  
  walletBalance: number;
  portfolioValue: number;
  realizedPnl: number;
  totalFees: number;
  positions: Record<string, TokenPosition>;
  
  
  buyToken: (tokenId: string, symbol: string, tokenName: string, amount: number, price: number) => Promise<UnifiedTransaction | null>;
  sellToken: (tokenId: string, price: number) => Promise<UnifiedTransaction | null>;
  updateTokenPrice: (tokenId: string, newPrice: number, source?: string) => void;
  syncPortfolioPosition: (tokenId: string, newPrice: number) => void;
  verifyPositionSync: (walletAddress: string) => Promise<void>;
  updatePositionFromJupiterQuote: (tokenId: string, jupiterUpdate: any) => void;
  cleanupFailedTransaction: (tokenId: string, transactionHash: string) => boolean;
  
  checkPriceAchievements?: (tokenId: string, newPrice: number, oldPrice: number, changePercent: number) => Promise<void>;

  
  
  getPortfolioValue: () => number;
  getTotalUnrealizedPnl: () => number;
  getTotalPnl: () => number;
  getNetWorth: () => number;
  
  
  resetPortfolio: () => void;
}

export interface CoreSlice {
  
  deck: JupiterTokenCard[];
  hand: JupiterTokenCard[];
  discardPile: JupiterTokenCard[];
  selectedCardIds: string[];
  operations: Record<string, OperationState>;
  cardSets: CardSetsState;
  exitingPositions: Record<string, TokenPosition>; 
  
  
  initializeCards: (dealToHand?: boolean, handSize?: number) => Promise<void>;
  closePosition: (cardId: string) => Promise<void>;
  resetSession: () => Promise<void>;
  getCardById: (cardId: string) => JupiterTokenCard | null;
}

export interface UISlice {
  
  ui: UiState;
  audio: AudioState;
  screenEffects: ScreenEffectsState;
  game: GameState;
  startupModal: StartupModalState;
  isLoading: boolean;
  funding: {
    fundingModalOpen: boolean;
    solPrice: number | null;
    solPriceLastFetched: number | null;
  };
  transactionModal: {
    isOpen: boolean;
  };
  
  
  setUi: (updates: Partial<UiState>) => void;
  setAudio: (updates: Partial<AudioState>) => void;
  setGame: (updates: Partial<GameState>) => void;
  setStartupModal: (updates: Partial<StartupModalState>) => void;
  setLoading: (loading: boolean) => void;
  
  
  toggleMusic: () => void;
  toggleSfx: () => void;
  toggleUi: () => void;
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  setUiVolume: (volume: number) => void;
  setMasterVolume: (volume: number) => void;
  
  
  setFocusedCard: (cardId: string | null) => void;
  setSortMode: (mode: UiState['sortMode']) => void;
  toggleSortDirection: () => void;
  toggleActivityIndicators: () => void;
  toggleActivityMonitor: () => void;
  setChartType: (type: 'line' | 'candle') => void;
  setHoveredCardImage: (imageUrl: string | null) => void;
  preloadHandTextures: () => Promise<void>;
  cacheTexture: (url: string, texture: any) => void;
  getCachedTexture: (url: string) => any | null;
  setSelectedDrawAmount: (amount: number) => void;
  setSelectedCardCount: (count: number) => void;
  setCustomAmount: (amount: string) => void;
  initializeDrawAmounts: () => void;
  toggleViewMode: () => void;
  setSelectedCardIndex: (index: number) => void;
  
  
  triggerScreenShake: (intensity?: 'light' | 'medium' | 'heavy', duration?: number) => void;
  triggerScreenFlash: (color?: string, duration?: number) => void;
  stopScreenShake: () => void;
  stopScreenFlash: () => void;
  clearScreenEffects: () => void;
  
  
  setFundingModalOpen: (isOpen: boolean) => void;
  openFundingModal: () => void;
  closeFundingModal: () => void;
  
  
  openTransactionModal: () => void;
  closeTransactionModal: () => void;

  
  setSolPrice: (price: number) => void;
  fetchSolPrice: () => Promise<number>;
  getSolPriceFromStore: () => number;
}




export interface TradingStats {
  totalTrades: number;
  totalWins: number;
  totalProfit: number;
  winRate: number;
  currentStreak: number;
  favoriteToken: string | null;
}




export interface TradeResult {
  tokenId: string;
  symbol: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  profit?: number;
  isWin?: boolean;
}

export interface AuthSlice {
  
  userId: string | null;
  isDemoMode: boolean;
  auth: AuthState;
  
  
  referredBy: string | null;
  
  referrerUserId: string | null;
  referrerHydraWallet: string | null;
  
  
  tradingStats: TradingStats;
  
  
  balancePollingInterval: NodeJS.Timeout | null;
  
  
  setAuth: (updates: Partial<AuthState>) => void;
  switchToUser: (userId: string, accessToken?: string, embeddedWalletAddress?: string) => Promise<void>;
  switchToDemo: () => Promise<void>;
  
  
  switchToLiveMode: () => Promise<void>;
  switchToPaperMode: () => Promise<void>;
  setWalletAddress: (address: string) => void;
  updateSolBalance: (balance: number) => void;
  updateWalletBalance: (usdcBalance: number) => void;
  
  
  initializeDemoMode: () => Promise<void>;
  resetDemoMode: () => Promise<void>;
  createFreshDemoState: () => Promise<void>;
  
  
  createFreshPaperTradingState: (userId: string, accessToken?: string) => Promise<void>;
  
  
  validateLiveTradingRequirements: () => Promise<{ valid: boolean; errors: string[] }>;
  
  
  loadOnChainPositions: (userId: string, accessToken?: string, embeddedWalletAddress?: string) => Promise<void>;
  
  
  recordTradeStats: (trade: TradeResult) => void;
  
  
  setReferredBy: (userId: string | null) => void;
  setReferrerInfo: (userId: string | null, hydraWallet: string | null) => void;
  setUserTier: (tier: UserTier) => void;
  
  
  getAccessToken: () => string | null;
  
  
  saveCriticalState: () => Promise<boolean>;
}

export interface LossAnimationState {
  isActive: boolean;
  tier: 'small' | 'moderate' | 'significant' | 'major' | 'devastating' | 'catastrophic' | 'nuclear' | 'apocalyptic' | 'extinction' | 'total_loss' | null;
  cardId: string | null;
  loss: number;
  percentLoss: number;
  tokenSymbol: string;
  startTime: number;
}

export interface AnimationSlice {
  
  memeScores: Record<string, MemeScore>;
  activityTracking: ActivityTracking;
  celebration: CelebrationState;
  lossAnimation: LossAnimationState;
  pepeEvent: PepeEventState;
  cardAnimations: Record<string, {
    
    type: 'animation' | 'entry' | 'exit' | 'celebration';
    variant: string;
    delay?: number;
    timestamp: number;
    cardToDiscard?: any; 
    
    celebrationIndex?: number;
    celebrationAnimations?: string[];
    sequenceId?: number;
  }>;
  
  
  getTokenActivityScore: (tokenId: string) => number;
  getMostActiveTokens: (limit: number) => Array<{ tokenId: string; score: number }>;
  setMemeScore: (tokenId: string, memeScore: MemeScore) => void;
  
  
  
  triggerCelebration: (cardId: string, tokenSymbol: string, profit: number, percentGain: number) => void;
  clearCelebration: () => void;
  
  
  triggerLossAnimation: (cardId: string, tokenSymbol: string, loss: number, percentLoss: number) => void;
  clearLossAnimation: () => void;
  
  
  triggerPepeEvent: (context: string, tokenId?: string, tokenSymbol?: string, data?: any) => void;
  clearPepeEvent: () => void;
  
  
  updateActivityTracking: (tokenId: string) => void;
  
  
  clearCardAnimation: (cardId: string) => void;
  
  
  triggerCardAnimation: (cardId: string, variant: string, type?: 'animation' | 'entry' | 'exit' | 'celebration') => void;
  triggerCelebrationSequence: (cardId: string) => void;
  completeCardExit: (cardId: string) => void;
}


export interface AchievementsSlice {
  
  earnedAchievements: Record<string, { id: string; earnedAt: string }>;
  achievementProgress: Record<string, { currentProgress: number; lastUpdated: string }>;
  totalPoints: number;
  
  
  tierAchievements: {
    tokenAchievements: Record<string, any>;
    globalTiers: Record<string, any>;
  };
  
  
  earnAchievement: (achievementId: string) => void;
  checkAchievements: (context: 'trade' | 'profit' | 'streak' | 'portfolio' | 'all') => void;
  updateProgress: (achievementId: string, progress: number) => void;
  initializeAchievements: () => void;
  getAchievementStats: () => {
    totalEarned: number;
    totalAvailable: number;
    completionPercentage: number;
    totalPoints: number;
    categoryCounts: Record<string, { earned: number; total: number }>;
    recentAchievements: any[];
  };
  getAchievementProgress: () => Record<string, { current: number; max: number; percentage: number }>;
}




export interface TokenPoolData {
  id: string
  symbol: string
  name: string
  icon?: string
  usdPrice: number
  liquidity: number
  volume24h: number
  fdv?: number
  mcap?: number
  stats5m?: {
    priceChange: number
    volumeChange: number
    buyVolume: number
    sellVolume: number
    numBuys: number
    numSells: number
    buyPressure?: number
  }
  stats1h?: {
    priceChange: number
    volumeChange: number
    buyVolume: number
    sellVolume: number
  }
  stats24h?: {
    priceChange: number
    volumeChange: number
  }
  holderCount?: number
  organicScore?: number
  organicScoreLabel?: string
  launchpad?: string
  graduatedAt?: string
  lastUpdated: number
  updateCount: number
  rawPoolData?: any
  
  
  firstSeen?: number | null
  oneMinGain?: number | null
  twoMinGain?: number | null
  threeMinGain?: number | null
  fourMinGain?: number | null
  fiveMinGain?: number | null
  signal?: string | null
  buyPressure5m?: number
  updatesPerMinute?: number
  winRate?: number
  upMoves?: number
  downMoves?: number
  lastDirection?: 1 | -1 | 0
  
  
  gains?: {
    oneMin: number | null
    twoMin: number | null
    threeMin: number | null
    fourMin: number | null
    fiveMin: number | null
  }
  
  
  momentum?: {
    upMoves: number
    downMoves: number
    winRate: number
  }
}

export interface PoolSlice {
  tokenPools: Record<string, TokenPoolData>
  subscribedTokens: Set<string>
  poolUpdateCount: number
  
  updateTokenPool: (tokenId: string, poolData: Partial<TokenPoolData>) => void
  updateTokenPrice: (tokenId: string, price: number, source?: string) => void
  subscribeToTokens: (tokenIds: string[]) => void
  unsubscribeFromTokens: (tokenIds: string[]) => void
  removeToken: (tokenId: string) => void
  
  getTokenPrice: (tokenId: string) => number
  getTokenData: (tokenId: string) => TokenPoolData | null
  getActiveTokens: () => string[]
  getSubscribedTokens: () => string[]
  
  getCurrentPrice: (tokenId: string) => number
  get24hPriceChange: (tokenId: string) => number
  get24hVolume: (tokenId: string) => number
  getLiquidity: (tokenId: string) => number
  getOrganicScore: (tokenId: string) => number
  getHolderCount: (tokenId: string) => number
  
  getTokenPerformance: (tokenId: string, timeframe: '5m' | '1h' | '24h') => number
  getTokenActivity: (tokenId: string) => { updateCount: number; lastUpdated: number }
  
  
  getOneMinGain: (tokenId: string) => number | null
  getTwoMinGain: (tokenId: string) => number | null
  getThreeMinGain: (tokenId: string) => number | null
  getFourMinGain: (tokenId: string) => number | null
  getFiveMinGain: (tokenId: string) => number | null
  getTokenSignal: (tokenId: string) => string | null
  getUpdatesPerMinute: (tokenId: string) => number
  getBuyPressure5m: (tokenId: string) => number
  getTokenFirstSeen: (tokenId: string) => number
  getWinRate: (tokenId: string) => number
}


import type { ActivitySlice } from './slices/activity-slice';
import type { DemoSlice } from './slices/demo-slice';
import type { TradingSlice } from './slices/trading-slice';
import type { TransactionSlice } from './slices/transaction-slice';
import type { TutorialSlice } from './slices/tutorial-slice';
export type { ActivitySlice, DemoSlice, TradingSlice, TransactionSlice, TutorialSlice };


export type BoundStore = PortfolioSlice & CoreSlice & UISlice & AuthSlice & AnimationSlice & AchievementsSlice & DemoSlice & TutorialSlice & PoolSlice & TradingSlice & TransactionSlice & ActivitySlice;
