import { audioSystem, ensureAudioInitialized } from "@/lib/audio";
import type { MemeScore } from "@/lib/types/shared";
import { determineLossTier, determineWinTier } from "@/lib/utils/win-detection";
import { StateCreator } from "zustand";
import type { AnimationSlice, BoundStore } from "../store-types";

export const createAnimationSlice: StateCreator<
  BoundStore,
  [['zustand/immer', never]],
  [],
  AnimationSlice
> = (set, get) => ({
  
  memeScores: {},
  activityTracking: {
    updateCounts: {},
    recentUpdates: {},
    activityScores: {},
    lastCalculation: 0,
  },
  cardAnimations: {},

  
  celebration: {
    isActive: false,
    tier: null,
    cardId: null,
    profit: 0,
    percentGain: 0,
    tokenSymbol: "",
    startTime: 0,
  },


  lossAnimation: {
    isActive: false,
    tier: null,
    cardId: null,
    loss: 0,
    percentLoss: 0,
    tokenSymbol: "",
    startTime: 0,
  },



  pepeEvent: {
    isActive: false,
    context: "",
    tokenId: undefined,
    tokenSymbol: undefined,
    data: undefined,
    startTime: 0,
  },


  getTokenActivityScore: (tokenId: string) => {
    const { activityTracking } = get();

    return activityTracking.activityScores[tokenId] || 0;
  },

  getMostActiveTokens: (limit: number) => {
    const { activityTracking } = get();


    const allTokenIds = [...Object.keys(activityTracking.updateCounts), ...Object.keys(activityTracking.activityScores)];


    const uniqueTokenIds = [...new Set(allTokenIds)];
    const tokenScores = uniqueTokenIds.map((tokenId) => ({
      tokenId,
      score: get().getTokenActivityScore(tokenId),
    }));


    return tokenScores.sort((a, b) => b.score - a.score).slice(0, limit);
  },


  setMemeScore: (tokenId: string, memeScore: MemeScore) => {
    set((state) => {
      if (!state.memeScores) state.memeScores = {};
      state.memeScores[tokenId] = memeScore;
    });
  },


  triggerCelebration: (cardId: string, tokenSymbol: string, profit: number, percentGain: number) => {

    if (get().celebration.isActive) {
      return;
    }


    const tier = determineWinTier(percentGain);

    if (tier) {
      set((state) => {
        state.celebration = {
          isActive: true,
          tier,
          cardId,
          profit,
          percentGain,
          tokenSymbol,
          startTime: Date.now(),
        };
      });


      ensureAudioInitialized().then(() => {
        audioSystem.playForTier(tier, true);
      });


      setTimeout(() => {
        set((state) => {
          state.celebration = {
            isActive: false,
            tier: null,
            cardId: null,
            profit: 0,
            percentGain: 0,
            tokenSymbol: "",
            startTime: 0,
          };
        });
      }, 2500);
    } else {
    }
  },


  triggerLossAnimation: (cardId: string, tokenSymbol: string, loss: number, percentLoss: number) => {

    if (get().lossAnimation.isActive) {
      return;
    }


    const tier = determineLossTier(percentLoss);

    if (tier) {
      set((state) => {
        state.lossAnimation = {
          isActive: true,
          tier,
          cardId,
          loss,
          percentLoss,
          tokenSymbol,
          startTime: Date.now(),
        };
      });


      ensureAudioInitialized().then(() => {
        audioSystem.playForTier(tier, false);
      });


      setTimeout(() => {
        set((state) => {
          state.lossAnimation = {
            isActive: false,
            tier: null,
            cardId: null,
            loss: 0,
            percentLoss: 0,
            tokenSymbol: "",
            startTime: 0,
          };
        });
      }, 2500);
    } else {
    }
  },

  clearCelebration: () => {
    set((state) => {
      state.celebration = {
        isActive: false,
        tier: null,
        cardId: null,
        profit: 0,
        percentGain: 0,
        tokenSymbol: "",
        startTime: 0,
      };
    });
  },

  clearLossAnimation: () => {
    set((state) => {
      state.lossAnimation = {
        isActive: false,
        tier: null,
        cardId: null,
        loss: 0,
        percentLoss: 0,
        tokenSymbol: "",
        startTime: 0,
      };
    });
  },


  updateActivityTracking: (tokenId: string) => {
    set((state) => {
      const now = Date.now();
      const currentCount = state.activityTracking.updateCounts[tokenId] || 0;
      const currentRecent = state.activityTracking.recentUpdates[tokenId] || [];


      const fiveMinutesAgo = now - 5 * 60 * 1000;
      const recentUpdates = [...currentRecent.filter((t) => t > fiveMinutesAgo), now];

      state.activityTracking.updateCounts[tokenId] = currentCount + 1;
      state.activityTracking.recentUpdates[tokenId] = recentUpdates;
      state.activityTracking.lastCalculation = now;
    });
  },



  triggerPepeEvent: (context: string, tokenId?: string, tokenSymbol?: string, data?: any) => {
    set((state) => {
      state.pepeEvent = {
        isActive: true,
        context,
        tokenId,
        tokenSymbol,
        data,
        startTime: Date.now(),
      };
    });


    setTimeout(() => {
      get().clearPepeEvent();
    }, 2000);
  },

  clearPepeEvent: () => {
    set((state) => {
      state.pepeEvent = {
        isActive: false,
        context: "",
        tokenId: undefined,
        tokenSymbol: undefined,
        data: undefined,
        startTime: 0,
      };
    });
  },

  
  clearCardAnimation: (cardId: string) => {
    set((state) => {
      delete state.cardAnimations[cardId];
    });
  },

  
  triggerCardAnimation: (cardId: string, variant: string, type: 'animation' | 'entry' | 'exit' | 'celebration' = 'animation') => {

    set((state) => {
      if (!state.cardAnimations) state.cardAnimations = {};
      state.cardAnimations[cardId] = {
        type,
        variant,
        timestamp: Date.now(),
      };
    });
  },

  
  triggerCelebrationSequence: (cardId: string) => {
    const celebrationAnimations = ['tada', 'pulseCelebration'];
    let currentIndex = 0;
    const sequenceId = Date.now();

    
    set((state) => {
      if (!state.cardAnimations) state.cardAnimations = {};
      state.cardAnimations[cardId] = {
        type: 'celebration',
        variant: celebrationAnimations[currentIndex],
        celebrationIndex: currentIndex,
        celebrationAnimations,
        timestamp: sequenceId,
        sequenceId,
      };
    });

    
    const chainNextAnimation = () => {
      currentIndex++;
      if (currentIndex < celebrationAnimations.length) {
        setTimeout(() => {
          set((state) => {
            const animation = state.cardAnimations[cardId];
            if (!animation || animation.type !== 'celebration' || animation.sequenceId !== sequenceId) {
              return;
            }
            animation.variant = celebrationAnimations[currentIndex];
            animation.celebrationIndex = currentIndex;
            animation.timestamp = Date.now();
          });
          chainNextAnimation();
        }, 1000); 
      } else {
        
        setTimeout(() => {
          set((state) => {
            const animation = state.cardAnimations[cardId];
            if (!animation || animation.sequenceId !== sequenceId) {
              return;
            }
            state.cardAnimations[cardId] = {
              type: 'exit',
              variant: 'slideOutUp',
              timestamp: Date.now(),
            };
          });
        }, 1000);
      }
    };

    chainNextAnimation();
  },

  
  completeCardExit: (cardId: string) => {
    const state = get();
    const cardToDiscard = state.hand.find((card) => card.id === cardId);
    
    if (cardToDiscard) {
      
      set((state) => {
        state.hand = state.hand.filter((card) => card.id !== cardId);
        state.discardPile.push(cardToDiscard);
        delete state.exitingPositions[cardId];
      });
    }
    
    
    get().clearCardAnimation(cardId);
  },
});
