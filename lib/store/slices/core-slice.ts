import { StateCreator } from "zustand";
import type { JupiterTokenCard } from "@/lib/types/shared";
import type { OperationState } from "@/lib/data/types";
import type { PortfolioSlice, CoreSlice, UISlice, AuthSlice, AnimationSlice, BoundStore } from "../store-types";


export const createCoreSlice: StateCreator<
  BoundStore,
  [['zustand/immer', never]],
  [],
  CoreSlice
> = (set, get) => ({
  
  deck: [],
  hand: [],
  discardPile: [],
  selectedCardIds: [],
  operations: {
    draw: { status: "idle", timestamp: 0 },
    discard: { status: "idle", timestamp: 0 },
    reset: { status: "idle", timestamp: 0 },
  },
  exitingPositions: {},

  
  cardSets: {
    cardSets: [],
    activeSetId: null,
    isLoading: false,
  },

  
  initializeCards: async (dealToHand = false, handSize = 0) => {

    try {
      set((state) => {
        state.isLoading = true;
      });

      
      const activeTokens = get().getActiveTokens();
      
      if (activeTokens.length === 0) {
        console.warn("[CARDS] No tokens available in Pool slice");
        set({ isLoading: false });
        return;
      }

      
      const freshCards = activeTokens.map(tokenId => {
        const tokenData = get().getTokenData(tokenId);
        return {
          id: tokenId,
          type: "jupiter" as const,
          name: tokenData?.name || "Unknown Token",
          symbol: tokenData?.symbol || "???",
          icon: tokenData?.icon || "/digital-token.webp",
          priceChange24h: 0, 
          usdPrice: 0, 
          faceUp: false,
        };
      });


      if (dealToHand && handSize > 0) {
        

        const handCards = freshCards.slice(0, handSize).map(card => ({
          ...card,
          faceUp: true,
        }));
        
        const remainingDeck = freshCards.slice(handSize);

        set((state) => {
          state.deck = remainingDeck;
          state.hand = handCards;
          state.isLoading = false;
        });
      } else {
        

        const shuffledDeck = [...freshCards];
        for (let i = shuffledDeck.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
        }

        set((state) => {
          state.deck = shuffledDeck;
          state.hand = [];
          state.isLoading = false;
        });
      }

    } catch (error) {
      console.error("[CARDS] Failed to initialize cards:", error);
      set((state) => {
        state.isLoading = false;
      });
    }
  },


  closePosition: async (cardId: string) => {
    const { hand } = get();

    set((state) => {
      state.operations.discard = { status: "loading", timestamp: Date.now() };
    });

    try {
      const cardToDiscard = hand.find((card) => card.id === cardId);
      if (!cardToDiscard) {
        throw new Error(`Card with id ${cardId} not found in hand`);
      }

      
      const { positions } = get();

      if (!positions[cardId]) {
        throw new Error(`No position found for card ${cardToDiscard.symbol} (${cardId})`);
      }

      
      const currentPrice = get().getCurrentPrice(cardId);
      if (currentPrice <= 0) {
        throw new Error(`Invalid price for card ${cardToDiscard.symbol}: ${currentPrice}`);
      }

      
      const position = positions[cardId];
      const currentValue = position.quantity * currentPrice;
      const profit = currentValue - position.cost;

      
      set((state) => {
        if (!state.exitingPositions) state.exitingPositions = {};
        state.exitingPositions[cardId] = {
          ...position,
          currentPrice,
          value: currentValue,
          unrealizedPnl: profit
        };
      });

      
      
      const sellResult = await get().sellToken(cardId, currentPrice);
      if (!sellResult) {
        throw new Error(`Failed to close position for ${cardToDiscard.symbol}`);
      }
      const realizedProfit = typeof sellResult.pnl === "number" ? sellResult.pnl : profit;
      const isWinning = realizedProfit > 0;
      const percentGain = position.cost > 0 ? (realizedProfit / position.cost) * 100 : 0;

      // Storage persistence should not block post-confirmation UI cleanup.
      try {
        await get().saveCriticalState();
      } catch (persistError) {
        console.warn("[CLOSE POSITION] Failed to persist critical state:", persistError);
      }

      set((state) => {
        state.operations.discard = { status: "success", timestamp: Date.now() };
      });

      if (isWinning) {
        get().triggerCelebrationSequence(cardId);
        get().triggerCelebration(cardId, cardToDiscard.symbol, realizedProfit, percentGain);
      } else {
        get().triggerCardAnimation(cardId, "hinge", "exit");
        get().triggerLossAnimation(cardId, cardToDiscard.symbol, Math.abs(realizedProfit), Math.abs(percentGain));
      }
    } catch (error) {
      set((state) => {
        state.operations.discard = {
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: Date.now(),
        };
      });
    }
  },

  resetSession: async () => {

    set((state) => {
      state.operations.reset = { status: "loading", timestamp: Date.now() };
    });

    try {
      if (get().isDemoMode) {
        
        await get().resetDemoMode();
      } else {
        
        const { walletBalance } = get();
        const portfolioValue = get().getPortfolioValue();
        const newWalletBalance = walletBalance + portfolioValue;

        
        
        
        

        set((state) => {
          state.hand = [];
          state.deck = [];
          state.discardPile = [];
          state.selectedCardIds = [];
          state.operations = {
            draw: { status: "idle", timestamp: 0 },
            discard: { status: "idle", timestamp: 0 },
            reset: { status: "idle", timestamp: 0 },
          };
          state.ui.isShuffling = false;
          state.ui.focusedCardId = null;
          state.ui.isCardFocused = false;
          state.walletBalance = newWalletBalance; 
        });

        
        get().resetPortfolio();

        
        
        
        
        

        
        await get().saveCriticalState();
      }

      set((state) => {
        state.operations.reset = { status: "success", timestamp: Date.now() };
      });

    } catch (error) {
      console.error("[RESET] ❌ Reset failed:", error);
      set((state) => {
        state.operations.reset = {
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: Date.now(),
        };
      });
    }
  },

  getCardById: (cardId: string) => {
    const { hand, deck, discardPile } = get();

    
    const handCard = hand.find((card) => card.id === cardId);
    if (handCard) return handCard;

    
    const deckCard = deck.find((card) => card.id === cardId);
    if (deckCard) return deckCard;

    
    const discardCard = discardPile.find((card) => card.id === cardId);
    if (discardCard) return discardCard;

    return null;
  },

});
