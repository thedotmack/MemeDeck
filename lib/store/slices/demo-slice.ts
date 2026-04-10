
import type { ActivityToken } from '@/lib/jupiter/realtime/activity-websocket';
import type { StateCreator } from 'zustand';

export interface DemoOpenPositionOptions {
  primaryToken?: ActivityToken | null;
  tokenId?: string | null;
  amountOverride?: number;
  cardCountOverride?: number;
}

export interface DemoSlice {
  demo: {
    
    budget: number;
    positionSize: number;
    maxPositions: number;
    
    
    lastDrawTime: number;
    drawCooldown: number;
    
    
  openPosition: (options?: DemoOpenPositionOptions) => Promise<void>;
    closePosition: (tokenId: string) => Promise<void>;
    reset: () => Promise<void>;
    
    
    getAvailableCash: () => number;
    canOpenPosition: () => boolean;
    getTotalInvested: () => number;
  }
}


const DEMO_BUDGET = 500;           
const DEMO_POSITION_SIZE = 100;    
const DEMO_MAX_POSITIONS = 5;      

export const createDemoSlice: StateCreator<
  any, 
  [['zustand/immer', never]],
  [],
  DemoSlice
> = (set, get) => ({
  demo: {
    
    budget: DEMO_BUDGET,
    positionSize: DEMO_POSITION_SIZE,
    maxPositions: DEMO_MAX_POSITIONS,
    
    
    lastDrawTime: 0,
    drawCooldown: 200, 
    
    
    openPosition: async (options?: DemoOpenPositionOptions) => {
      try {
        const { hand, walletBalance, isDemoMode, ui, demo, activity } = get();

        const now = Date.now();
        if (now - demo.lastDrawTime < demo.drawCooldown) {
          return;
        }

        if (!isDemoMode) {
          return;
        }

        const overrideAmount = options?.amountOverride;
        const drawAmount = typeof overrideAmount === 'number' && overrideAmount > 0
          ? overrideAmount
          : ui.selectedDrawAmount || DEMO_POSITION_SIZE;

        const overrideCardCount = options?.cardCountOverride;
        const cardCount = typeof overrideCardCount === 'number' && overrideCardCount > 0
          ? overrideCardCount
          : ui.selectedCardCount || 1;

        const availableSlots = DEMO_MAX_POSITIONS - hand.length;
        const cardsToAdd = Math.min(cardCount, availableSlots);

        if (cardsToAdd === 0) {
          return;
        }

        const totalCost = drawAmount * cardsToAdd;
        if (walletBalance < totalCost) {
          return;
        }

        const normalizeTokenId = (token: any): string | null => {
          if (!token) return null;
          if (typeof token.tokenId === 'string') return token.tokenId;
          if (typeof token.id === 'string') return token.id;
          return null;
        };

        const resolveTokenPrice = (token: any): number => {
          if (!token) return 0;
          const priceSources = [token.price, token.usdPrice, token.currentPrice];
          for (const value of priceSources) {
            if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
              return value;
            }
          }
          return 0;
        };

        const requestedTokenId = options?.primaryToken?.tokenId ?? options?.tokenId ?? null;

        const currentTokenIds = new Set<string>(hand.map((card: any) => card.id));
        const candidateTokens: any[] = [];

        const appendToken = (token: any) => {
          const tokenId = normalizeTokenId(token);
          if (!tokenId || currentTokenIds.has(tokenId)) {
            return;
          }

          candidateTokens.push({
            ...token,
            tokenId,
          });
          currentTokenIds.add(tokenId);
        };

        if (options?.primaryToken) {
          appendToken(options.primaryToken);
        }

        // Use activity tokens from the store (same source as hot tokens sidebar)
        if (candidateTokens.length < cardsToAdd) {
          const activityTokens = activity?.tokens ?? [];
          if (activityTokens.length === 0) {
            console.error('[DEMO] No activity tokens available in store');
            throw new Error('No tokens available - open the Hot Tokens sidebar first');
          }

          for (const token of activityTokens) {
            appendToken(token);
            if (candidateTokens.length >= cardsToAdd) break;
          }
        }

        const filteredTokens = candidateTokens.filter((token) => resolveTokenPrice(token) > 0);

        if (filteredTokens.length < cardsToAdd) {
          return;
        }

        if (requestedTokenId) {
          const index = filteredTokens.findIndex((token) => token.tokenId === requestedTokenId);
          if (index > 0) {
            const [match] = filteredTokens.splice(index, 1);
            filteredTokens.unshift(match);
          }
        }

        const tokensForDraw = filteredTokens.slice(0, cardsToAdd);
        const drawCooldown = demo.drawCooldown;

        for (let i = 0; i < tokensForDraw.length; i++) {
          const selectedToken = tokensForDraw[i];
          const tokenId = selectedToken.tokenId;
          const tokenPrice = resolveTokenPrice(selectedToken);

          if (!tokenId || tokenPrice <= 0) {
            continue;
          }

          const shares = drawAmount / tokenPrice;
          const currentValue = shares * tokenPrice;
          const unrealizedPnl = currentValue - drawAmount;

          const symbol =
            selectedToken.symbol ||
            selectedToken.tokenSymbol ||
            selectedToken.name ||
            tokenId;

          const name =
            selectedToken.name ||
            selectedToken.tokenName ||
            selectedToken.symbol ||
            tokenId;

          const memeScoreCandidate =
            typeof selectedToken.winRate === 'number'
              ? Math.round(selectedToken.winRate * 100)
              : typeof selectedToken.memeScore === 'number'
                ? selectedToken.memeScore
                : 0;
          const memeScore = memeScoreCandidate || 50;

          const newCard = {
            id: tokenId,
            type: 'jupiter' as const,
            name,
            symbol,
            icon: selectedToken.icon || '/digital-token.webp',
            priceChange24h: selectedToken.fiveMinGain || selectedToken.priceChange24h || 0,
            usdPrice: tokenPrice,
            volume24h: selectedToken.volume24h || 0,
            liquidity: selectedToken.liquidity || 0,
            memeScore,
            rawData: selectedToken,
            faceUp: true,
            tokenId,
            price: tokenPrice,
            dex: selectedToken.dex,
          };

          const newPosition = {
            tokenId: newCard.id,
            tokenSymbol: newCard.symbol,
            tokenName: newCard.name,
            quantity: shares,
            cost: drawAmount,
            entryPrice: tokenPrice,
            currentPrice: tokenPrice,
            value: currentValue,
            unrealizedPnl,
          };

          set((state: any) => {
            state.hand.push(newCard);
            state.walletBalance -= drawAmount;
            if (!state.positions) state.positions = {};
            state.positions[newCard.id] = newPosition;
            if (!state.tokenPrices) state.tokenPrices = {};
            state.tokenPrices[newCard.id] = tokenPrice;

            if (!state.cardAnimations) state.cardAnimations = {};
            state.cardAnimations[newCard.id] = {
              type: 'entry',
              variant: 'slideInLeft',
              timestamp: Date.now(),
            };

            state.demo.lastDrawTime = Date.now();
          });

          if (i < tokensForDraw.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, drawCooldown));
          }
        }
      } catch (error) {
        console.error('[DEMO] ❌ Failed to open positions:', error);
      }
    },
    
    
    closePosition: async (tokenId: string) => {
      
      try {
        const { hand, positions, isDemoMode } = get();
        
        
        if (!isDemoMode) {
          return;
        }
        
        
        const card = hand.find((c: any) => c.id === tokenId);
        const position = positions[tokenId];
        
        if (!card || !position) {
          return;
        }
        
        
        const saleProceeds = position.value || position.cost;
        const profit = saleProceeds - position.cost;
        const isWinning = profit > 0;

        // Update financial state and trigger exit animation
        // Do NOT remove from hand — completeCardExit handles that after animation
        set((state: any) => {
          state.walletBalance += saleProceeds;
          delete state.positions[tokenId];

          if (!state.cardAnimations) state.cardAnimations = {};
          state.cardAnimations[tokenId] = {
            type: 'exit',
            variant: isWinning ? 'slideOutUp' : 'hinge',
            timestamp: Date.now()
          };
        });
        
        
      } catch (error) {
        console.error('[DEMO] ❌ Failed to close position:', error);
      }
    },
    
    
    reset: async () => {
      const { resetDemoMode } = get();
      if (resetDemoMode) {
        await resetDemoMode();
      }
    },
    
    
    getAvailableCash: () => {
      const { walletBalance } = get();
      return walletBalance || 0;
    },
    
    
    canOpenPosition: () => {
      const { hand, isDemoMode, walletBalance, ui } = get();
      
      if (!isDemoMode) return false;
      if (hand.length >= DEMO_MAX_POSITIONS) return false;
      
      
      const drawAmount = ui.selectedDrawAmount || DEMO_POSITION_SIZE;
      const cardCount = ui.selectedCardCount || 1;
      
      
      const availableSlots = DEMO_MAX_POSITIONS - hand.length;
      const cardsToAdd = Math.min(cardCount, availableSlots);
      
      if (cardsToAdd === 0) return false;
      
      
      const totalCost = drawAmount * cardsToAdd;
      return (walletBalance || 0) >= totalCost;
    },
    
    
    getTotalInvested: () => {
      const { positions } = get();
      return Object.values(positions || {}).reduce(
        (sum: number, pos: any) => sum + (pos.cost || 0), 
        0
      );
    }
  }
});