
import type { StateCreator } from 'zustand'

export interface TutorialSlice {
  tutorial: {
    isActive: boolean;
    currentStep: number;
    completedSteps: Set<number>;
    
    
    run: boolean;
    stepIndex: number;
    continuous: boolean;
    showProgress: boolean;
    showSkipButton: boolean;
    
    
    isScaledView: boolean;
    
    
    startTutorial: () => void;
    nextStep: () => void;
    previousStep: () => void;
    completeStep: (step: number) => void;
    skipTutorial: () => void;
    finishTutorial: () => void;
    
    
    setRun: (run: boolean) => void;
    setStepIndex: (index: number) => void;
    setScaledView: (scaled: boolean) => void;
    
    
    initializeTutorialDemo: () => Promise<void>;
  }
}

export const createTutorialSlice: StateCreator<
  any,
  [['zustand/immer', never]],
  [],
  TutorialSlice
> = (set, get) => ({
  tutorial: {
    isActive: false,
    currentStep: 1,
    completedSteps: new Set(),
    
    
    run: false,
    stepIndex: 0,
    continuous: true,
    showProgress: true,
    showSkipButton: true,
    
    
    isScaledView: false,
    
    startTutorial: () => {
      set((state: any) => {
        state.tutorial.isActive = true;
        state.tutorial.currentStep = 1;
        state.tutorial.run = true;
        state.tutorial.stepIndex = 0;
      });
    },
    
    nextStep: () => {
      set((state: any) => {
        state.tutorial.currentStep = state.tutorial.currentStep + 1;
      });
    },
    
    previousStep: () => {
      set((state: any) => {
        state.tutorial.currentStep = Math.max(1, state.tutorial.currentStep - 1);
      });
    },
    
    completeStep: (step: number) => {
      set((state: any) => {
        state.tutorial.completedSteps.add(step);
      });
    },
    
    skipTutorial: () => {
      set((state: any) => {
        state.tutorial.isActive = false;
        state.tutorial.currentStep = 1;
        state.tutorial.run = false;
        state.tutorial.stepIndex = 0;
        state.tutorial.isScaledView = false;
      });
    },
    
    finishTutorial: () => {
      set((state: any) => {
        state.tutorial.isActive = false;
        state.tutorial.currentStep = 1;
        state.tutorial.run = false;
        state.tutorial.stepIndex = 0;
        state.tutorial.isScaledView = false;
      });
    },
    
    
    setRun: (run: boolean) => {
      set((state: any) => {
        state.tutorial.run = run;
      });
    },
    
    setStepIndex: (index: number) => {
      set((state: any) => {
        state.tutorial.stepIndex = index;
        state.tutorial.currentStep = index + 1;
      });
    },
    
    setScaledView: (scaled: boolean) => {
      set((state: any) => {
        state.tutorial.isScaledView = scaled;
      });
    },
    
    
    initializeTutorialDemo: async () => {
      
      try {
        
        const { logout } = get();
        if (logout) {
          await logout(); 
        }
        
        
        set((state: any) => {
          state.isDemoMode = true;
          state.isLoading = false;
          state.isAuthenticated = false; 
          state.walletBalance = 500; 
          state.hand = []; 
          state.positions = {};
          state.tokenPrices = {};
          state.realizedPnl = 0;
          state.totalFees = 0;
          state.transactions.items = [];
          state.discardPile = [];
          state.memeScores = {};
        });
        
        
        get().tutorial.startTutorial();
        
        
      } catch (error) {
        console.error('[TUTORIAL] ❌ Failed to initialize tutorial demo:', error);
        set((state: any) => {
          state.isLoading = false;
        });
      }
    },
  }
});