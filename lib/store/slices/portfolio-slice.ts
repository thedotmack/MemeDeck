
import type { Transaction } from "@/lib/types/transaction";
import { StateCreator } from "zustand";

import { SIGNIFICANT_PRICE_MOVEMENT, TRADING_FEE_PERCENTAGE } from "@/lib/config/trading-constants";
import { achievementService } from "@/lib/services/achievement-service";
import { walletBalanceService } from "@/lib/services/wallet-balance-service";
import type { BoundStore, PortfolioSlice } from "../store-types";

export const createPortfolioSlice: StateCreator<BoundStore, [["zustand/immer", never]], [], PortfolioSlice> = (set, get) => ({
  
  walletBalance: 0,
  portfolioValue: 0,
  realizedPnl: 0,
  totalFees: 0,
  positions: {},

  
  buyToken: async (tokenId: string, symbol: string, tokenName: string, amount: number, price: number) => {
    const { walletBalance, totalFees, positions } = get();

    if (price <= 0 || amount <= 0) {
      return null;
    }

    if (walletBalance < amount) {
      return null;
    }

    const fee = amount * TRADING_FEE_PERCENTAGE;
    const actualAmount = amount - fee;
    const newTotalFees = totalFees + fee;
    const quantity = actualAmount / price;

  const transaction: Transaction = {
      txId: `demo-buy-${tokenId}-${Date.now()}`,
      timestamp: Date.now(),
      orderResponse: {
        side: 'buy',
        tokenId,
        amount,
        price,
        tokenSymbol: symbol,
        tokenName,
        tokenAmount: quantity,
        fee,
        status: 'confirmed'
      },
      type: 'buy',
      side: 'buy',
      tokenId,
      tokenSymbol: symbol,
      tokenName,
      amount,
      tokenAmount: quantity,
      price,
      fee,
      status: 'confirmed'
    };

    const newPositions = { ...positions };

    if (newPositions[tokenId]) {
      const position = { ...newPositions[tokenId] };
      const totalQuantity = position.quantity + quantity;
      const totalCost = position.cost + amount;
      position.quantity = totalQuantity;
      position.entryPrice = totalCost / totalQuantity;
      position.cost = totalCost;
      position.currentPrice = price;
      position.value = totalQuantity * price;
      position.unrealizedPnl = position.value - position.cost;
      newPositions[tokenId] = position;
    } else {
      newPositions[tokenId] = {
        tokenId,
        tokenName,
        tokenSymbol: symbol,
        quantity,
        entryPrice: amount / quantity,
        currentPrice: price,
        cost: amount,
        value: quantity * price,
        unrealizedPnl: quantity * price - amount,
      };
    }

    set((state) => {
      state.walletBalance = walletBalance - amount;
      state.totalFees = newTotalFees;
      state.positions = newPositions;
    });

    
    get().transactions.addTransaction(transaction);

    
    get().checkAchievements("trade");

    return transaction;
  },

  sellToken: async (tokenId: string, price: number) => {
    const { positions, totalFees } = get();

    if (price <= 0 || !positions[tokenId]) {
      return null;
    }

    const position = positions[tokenId];
    const { tokenSymbol, tokenName, quantity, entryPrice } = position;

    const grossAmount = quantity * price;
    const fee = grossAmount * TRADING_FEE_PERCENTAGE;
    const netAmount = grossAmount - fee;
    const newTotalFees = totalFees + fee;

    const cost = position.cost;
    const profit = netAmount - cost;
    const transaction: Transaction = {
      txId: `demo-sell-${tokenId}-${Date.now()}`,
      timestamp: Date.now(),
      orderResponse: {
        side: 'sell',
        tokenId,
        amount: grossAmount,
        price,
        tokenSymbol,
        tokenName,
        tokenAmount: quantity,
        fee,
        pnl: profit,
        status: 'confirmed'
      },
      type: 'sell',
      side: 'sell',
      tokenId,
      tokenSymbol,
      tokenName,
      amount: grossAmount,
      tokenAmount: quantity,
      price,
      fee,
      pnl: profit,
      status: 'confirmed'
    };

    const newPositions = { ...positions };
    delete newPositions[tokenId];

    set((state) => {
      state.walletBalance = get().walletBalance + netAmount;
      state.totalFees = newTotalFees;
      state.realizedPnl = get().realizedPnl + profit;
      state.positions = newPositions;
    });

    
    get().transactions.addTransaction(transaction);

    get().checkAchievements("trade");
    get().checkAchievements("profit");
    get().checkAchievements("streak");
    get().checkAchievements("portfolio");

    return transaction;
  },

  updateTokenPrice: (tokenId: string, newPrice: number, source?: string) => {
    const { positions } = get();

    get().updateTokenPool(tokenId, { usdPrice: newPrice });

    if (positions[tokenId]) {
      const position = positions[tokenId];

      
      if (position.unknownBasis && newPrice > 0) {
        
        const fairValueCost = position.quantity * newPrice;

        set((state) => {
          if (!state.positions) state.positions = {};
          state.positions[tokenId] = {
            ...position,
            entryPrice: newPrice,
            cost: fairValueCost,
            currentPrice: newPrice,
            value: fairValueCost,
            unrealizedPnl: 0, 
            unknownBasis: undefined, 
          };
        });
        return;
      }

      
      const newValue = position.quantity * newPrice;
      const newUnrealizedPnl = newValue - position.cost;

      set((state) => {
        if (!state.positions) state.positions = {};
        state.positions[tokenId] = {
          ...position,
          currentPrice: newPrice,
          value: newValue,
          unrealizedPnl: newUnrealizedPnl,
        };
      });
    }
  },

  
  syncPortfolioPosition: (tokenId: string, newPrice: number) => {
    const { positions } = get();

    if (positions[tokenId]) {
      
      const position = positions[tokenId];

      
      if (position.unknownBasis && newPrice > 0) {
        
        const fairValueCost = position.quantity * newPrice;

        set((state) => {
          if (!state.positions) state.positions = {};
          state.positions[tokenId] = {
            ...position,
            entryPrice: newPrice,
            cost: fairValueCost,
            currentPrice: newPrice,
            value: fairValueCost,
            unrealizedPnl: 0, 
            unknownBasis: undefined, 
          };
        });
        return;
      }

      
      const newValue = position.quantity * newPrice;
      const newUnrealizedPnl = newValue - position.cost;

      set((state) => {
        if (!state.positions) state.positions = {};
        state.positions[tokenId] = {
          ...position,
          currentPrice: newPrice,
          value: newValue,
          unrealizedPnl: newUnrealizedPnl,
        };
      });
    }
  },

  
  verifyPositionSync: async (walletAddress: string) => {
    const { positions } = get();

    for (const [tokenId, position] of Object.entries(positions)) {
      try {
        
        const actualBalance = await walletBalanceService.getTokenBalance(walletAddress, tokenId);

        
        if (position.isPending && actualBalance > 0) {
          set((state) => {
            if (state.positions[tokenId]) {
              state.positions[tokenId] = {
                ...state.positions[tokenId],
                isPending: false, 
                quantity: actualBalance, 
                entryPrice: position.cost / actualBalance, 
                value: actualBalance * position.currentPrice,
                unrealizedPnl: actualBalance * position.currentPrice - position.cost,
              };
            }
          });
          continue; 
        }

        
        if (position.isPending && actualBalance === 0) {
          const timeSinceCreation = Date.now() - (position.createdAt || 0);
          const maxPendingTime = 2 * 60 * 1000; 

          if (timeSinceCreation > maxPendingTime) {
            console.warn(`[Position Sync] Pending position timeout - removing failed transaction for ${tokenId}:`, {
              transactionHash: position.transactionHash,
              estimatedQuantity: position.quantity,
              timeSinceCreation: Math.round(timeSinceCreation / 1000),
            });

            
            get().cleanupFailedTransaction(tokenId, position.transactionHash || "");
            continue;
          } else {
            continue;
          }
        }


        if (!position.isPending) {
          const discrepancy = Math.abs(position.quantity - actualBalance);
          const discrepancyPercent = (discrepancy / position.quantity) * 100;

          if (discrepancyPercent > 1) {
            console.warn(`[Position Sync] Discrepancy detected for ${tokenId}:`, {
              storedQuantity: position.quantity,
              actualBalance,
              discrepancy,
              discrepancyPercent,
            });


            if (actualBalance === 0) {

              set((state) => {
                delete state.positions[tokenId];
              });
            } else if (discrepancyPercent > 5) {

              const newValue = actualBalance * position.currentPrice;
              const newUnrealizedPnl = newValue - position.cost;

              set((state) => {
                if (!state.positions) state.positions = {};
                state.positions[tokenId] = {
                  ...position,
                  quantity: actualBalance,
                  value: newValue,
                  unrealizedPnl: newUnrealizedPnl,
                };
              });
            }
          }
        }
      } catch (error) {
        console.error(`[Position Sync] Error checking balance for ${tokenId}:`, error);
      }
    }
  },


  cleanupFailedTransaction: (tokenId: string, transactionHash: string) => {
    const { positions } = get();
    const position = positions[tokenId];

    if (position && position.isPending && position.transactionHash === transactionHash) {
      set((state) => {

        delete state.positions[tokenId];


        state.hand = state.hand.filter((card: any) => card.id !== tokenId);


        state.walletBalance = state.walletBalance + position.cost;


        if (state.cardAnimations && state.cardAnimations[tokenId]) {
          delete state.cardAnimations[tokenId];
        }
      });

      return true;
    }

    return false;
  },


  getPortfolioValue: () => {
    const { positions } = get();
    return Object.values(positions).reduce((sum, pos) => sum + pos.value, 0);
  },


  getPositionFromTransactions: (tokenId: string) => {
    const transactions = get().transactions.getByToken(tokenId);
    const confirmedTxs = transactions.filter((tx) => {

  return tx.status === 'confirmed';
    });

    if (confirmedTxs.length === 0) return null;

    let totalQuantity = 0;
    let totalCost = 0;

    confirmedTxs.forEach((tx) => {

      const side = tx.type;
      const quantity = tx.tokenAmount;
      const cost = tx.orderResponse?.inAmount ? Number(tx.orderResponse.inAmount) / 1e6 : 0;

      if (side === "buy") {
  totalQuantity += quantity ?? 0;
        totalCost += cost;
      } else if (side === "sell") {
  totalQuantity -= quantity ?? 0;
        totalCost -= cost; 
      }
    });

    if (totalQuantity <= 0) return null;

    const avgEntryPrice = totalCost / totalQuantity;
    const currentPrice = get().getCurrentPrice?.(tokenId) || avgEntryPrice;
    const currentValue = totalQuantity * currentPrice;

    return {
      tokenId,
      quantity: totalQuantity,
      entryPrice: avgEntryPrice,
      currentPrice,
      cost: totalCost,
      value: currentValue,
      unrealizedPnl: currentValue - totalCost,
    };
  },

  getTotalUnrealizedPnl: () => {
    const { positions } = get();
    return Object.values(positions).reduce((sum, pos) => sum + pos.unrealizedPnl, 0);
  },

  getTotalPnl: () => {
    const { realizedPnl } = get();
    const unrealizedPnl = get().getTotalUnrealizedPnl();
    return realizedPnl + unrealizedPnl;
  },

  getNetWorth: () => {
    const { walletBalance } = get();
    const portfolioValue = get().getPortfolioValue();
    return walletBalance + portfolioValue;
  },

  
  getPositionValue: (tokenId: string) => {
    const { positions } = get();
    const position = positions[tokenId];
    if (!position) return 0;

    const livePrice = get().getCurrentPrice(tokenId);
    return position.quantity * livePrice;
  },

  getPositionUnrealizedPnl: (tokenId: string) => {
    const { positions } = get();
    const position = positions[tokenId];
    if (!position) return 0;

    const livePrice = get().getCurrentPrice(tokenId);
    const currentValue = position.quantity * livePrice;
    return currentValue - position.cost;
  },

  
  getLivePosition: (tokenId: string) => {
    const { positions } = get();
    const position = positions[tokenId];
    if (!position) return null;

    const livePrice = get().getCurrentPrice(tokenId);
    const currentValue = position.quantity * livePrice;
    const unrealizedPnl = currentValue - position.cost;

    return {
      ...position,
      currentPrice: livePrice,
      value: currentValue,
      unrealizedPnl,
    };
  },

  
  checkPriceAchievements: async (tokenId: string, newPrice: number, oldPrice: number, changePercent: number) => {
    const { positions, auth, isDemoMode } = get();

    
    if (!auth.isAuthenticated || isDemoMode) return;

    const position = positions[tokenId];
    if (!position) return;

    try {
      
      const positionValue = position.quantity * newPrice;
      const profitLoss = positionValue - position.cost;
      const profitLossPercent = (profitLoss / position.cost) * 100;

      
      const portfolioValue = get().getPortfolioValue();
      const totalPnl = get().getTotalPnl();
      const positionCount = Object.keys(positions).length;

      
      if (Math.abs(changePercent) >= SIGNIFICANT_PRICE_MOVEMENT) {
        try {
          
          await achievementService.handlePortfolioEvent({
            userId: get().userId || "unknown",
            sessionId: get().userId || "unknown", 
            portfolioValue,
            totalProfit: Math.max(0, totalPnl),
            totalLoss: Math.abs(Math.min(0, totalPnl)),
            positionCount,
            timestamp: Date.now(),
          });

          
          if (profitLossPercent >= 5) {
            
            await achievementService.handleCelebrationEvent({
              userId: get().userId || "unknown",
              sessionId: get().userId || "unknown",
              tokenId,
              symbol: position.tokenSymbol,
              tier: profitLossPercent >= 50 ? "legendary" : profitLossPercent >= 20 ? "big" : "decent",
              percentGain: profitLossPercent,
              profitAmount: profitLoss,
              timestamp: Date.now(),
            });
          }
        } catch (error) {
          console.warn("🏆 [PRICE] Failed to check achievements:", error);
        }
      }
    } catch (error) {
      console.warn("🏆 [PRICE] Error in achievement checking:", error);
    }
  },

  
  updatePositionFromJupiterQuote: (tokenId: string, jupiterUpdate: any) => {
    set((state) => {
      const position = state.positions[tokenId];
      if (position && jupiterUpdate) {
        
        position.currentPrice = jupiterUpdate.price || position.currentPrice;
        position.value = position.quantity * position.currentPrice;
        position.unrealizedPnl = position.value - position.cost;
      }
    });
  },

  
  resetPortfolio: () => {
    set((state) => {
      state.positions = {};
      state.realizedPnl = 0;
      state.totalFees = 0;
    });
  },
});
