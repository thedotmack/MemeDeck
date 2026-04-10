
import { tradingService, type TradeContext, type TradeRequest, type TradeResult } from '@/lib/services/trading-service'
import { devLogger } from '@/lib/utils/dev-logger'
import type { StateCreator } from 'zustand'

export interface TradeState {
  tokenId: string
  operation: 'buy' | 'sell'
  status: 'pending' | 'executing' | 'confirming' | 'completed' | 'failed'
  transactionHash?: string
  startTime: number
  endTime?: number
  error?: string
  expectedAmount?: number
  actualAmount?: number
  pnl?: number
  pnlPercent?: number
  batchId?: string
}

export interface TradingSlice {
  trading: {
    
    activeTrades: Map<string, TradeState>
    isExecutingTrade: boolean
    
    
    startTrade: (tradeParams: {
      tokenId: string
      operation: 'buy' | 'sell'
      expectedAmount?: number
      batchId?: string
    }) => string 
    
    updateTradeStatus: (tradeId: string, updates: Partial<TradeState>) => void
    completeTrade: (tradeId: string, result: {
      transactionHash: string
      actualAmount: number
      pnl?: number
      pnlPercent?: number
    }) => void
    
    failTrade: (tradeId: string, error: string) => void
    clearTrade: (tradeId: string) => void
    
    
    getActiveTrade: (tokenId: string) => TradeState | undefined
    getBatchTrades: (batchId: string) => TradeState[]
    generateBatchId: () => string
    hasActiveTrade: (tokenId: string) => boolean
    
    
    executeTradeWithFees: (
      request: TradeRequest,
      context: TradeContext & { userId: string }
    ) => Promise<TradeResult & { feeSignature?: string; tradeId?: string }>
    
    
    
    clearCompletedTrades: () => void
    clearAllTrades: () => void
  }
}

export const createTradingSlice: StateCreator<
  any, 
  [['zustand/immer', never]],
  [],
  TradingSlice
> = (set, get) => ({
  trading: {
    
    activeTrades: new Map(),
    isExecutingTrade: false,
    
    
    startTrade: (tradeParams) => {
      const tradeId = `${tradeParams.operation}-${tradeParams.tokenId}-${Date.now()}`
      
      const newTrade: TradeState = {
        tokenId: tradeParams.tokenId,
        operation: tradeParams.operation,
        status: 'pending',
        startTime: Date.now(),
        expectedAmount: tradeParams.expectedAmount,
        batchId: tradeParams.batchId
      }
      
      set((state: any) => {
        state.trading.activeTrades.set(tradeId, newTrade);
        state.trading.isExecutingTrade = true;
      })
      
      devLogger.log(`[TradingSlice] Started ${tradeParams.operation} trade:`, {
        tradeId,
        tokenId: tradeParams.tokenId,
        expectedAmount: tradeParams.expectedAmount
      })
      
      return tradeId
    },
    
    
    updateTradeStatus: (tradeId, updates) => {
      set((state: any) => {
        const trade = state.trading.activeTrades.get(tradeId)
        
        if (trade) {
          const updatedTrade = { ...trade, ...updates }
          state.trading.activeTrades.set(tradeId, updatedTrade)
          
          devLogger.log(`[TradingSlice] Updated trade ${tradeId}:`, updates)
        }
      })
    },
    
    
    completeTrade: (tradeId, result) => {
      set((state: any) => {
        const trade = state.trading.activeTrades.get(tradeId)
        
        if (trade) {
          const completedTrade: TradeState = {
            ...trade,
            status: 'completed',
            endTime: Date.now(),
            transactionHash: result.transactionHash,
            actualAmount: result.actualAmount,
            pnl: result.pnl,
            pnlPercent: result.pnlPercent
          }
          
          
          state.trading.activeTrades.delete(tradeId)
          
          devLogger.log(`[TradingSlice] Completed trade ${tradeId}:`, {
            duration: (completedTrade.endTime || Date.now()) - completedTrade.startTime,
            actualAmount: result.actualAmount,
            pnl: result.pnl
          })
          
          state.trading.isExecutingTrade = state.trading.activeTrades.size > 0
        }
      })
    },
    
    
    failTrade: (tradeId, error) => {
      set((state: any) => {
        const trade = state.trading.activeTrades.get(tradeId)
        
        if (trade) {
          const failedTrade: TradeState = {
            ...trade,
            status: 'failed',
            endTime: Date.now(),
            error
          }
          
          
          state.trading.activeTrades.delete(tradeId)
          
          devLogger.error(`[TradingSlice] Failed trade ${tradeId}:`, error)
          
          state.trading.isExecutingTrade = state.trading.activeTrades.size > 0
        }
      })
    },
    
    
    clearTrade: (tradeId) => {
      set((state: any) => {
        const wasActive = state.trading.activeTrades.delete(tradeId)
        
        if (wasActive) {
          devLogger.log(`[TradingSlice] Cleared trade ${tradeId}`)
          state.trading.isExecutingTrade = state.trading.activeTrades.size > 0
        }
      })
    },
    
    
    getActiveTrade: (tokenId) => {
      const { trading } = get()
      for (const trade of trading.activeTrades.values()) {
        if (trade.tokenId === tokenId) {
          return trade
        }
      }
      return undefined
    },
    
    
    
    hasActiveTrade: (tokenId) => {
      const { trading } = get()
      for (const trade of trading.activeTrades.values()) {
        if (trade.tokenId === tokenId) {
          return true
        }
      }
      return false
    },
    
    
    clearCompletedTrades: () => {
      
      devLogger.log('[TradingSlice] Cleared completed trades (no history stored)')
    },
    
    
    clearAllTrades: () => {
      set((state: any) => {
        state.trading.activeTrades = new Map()
        state.trading.isExecutingTrade = false
      })
      
      devLogger.log('[TradingSlice] Cleared all active trades')
    },
    
    
    getBatchTrades: (batchId) => {
      const { trading } = get()
      return Array.from(trading.activeTrades.values() as Iterable<TradeState>).filter((trade) => trade.batchId === batchId)
    },
    
    
    generateBatchId: () => {
      return `batch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    },
    
    

    
    executeTradeWithFees: async (request, context) => {
      const referralCode = null 
      
      try {
        devLogger.log('[TradingSlice] Executing trade with integrated fee processing:', {
          tokenSymbol: request.tokenSymbol,
          side: request.side,
          amountUsd: request.amountUsd,
          referralCode,
          userWallet: context.walletAddress
        })

        
        const authState = get()
        const hasPartner = authState.referredBy !== null
        const contextWithPartner = { ...context, hasPartner }
        
        devLogger.log('[TradingSlice] Executing trade with partner:', hasPartner)
        
        
        const tradeResult = await tradingService.executeTrade(request, contextWithPartner)
        
        
        const tradeId = `${request.side}-${request.tokenMint.slice(-8)}-${Date.now()}`
        const tradeResultWithId = { ...tradeResult, tradeId }

        
        devLogger.log('[TradingSlice] Trade completed - fee processing handled in trading service')
        
        
        return {
          ...tradeResult,
          tradeId
        }
        
      } catch (error) {
        devLogger.error('[TradingSlice] Trade with fees failed:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Trade execution failed',
          isLive: context.isLiveMode
        }
      }
    }
  }
})