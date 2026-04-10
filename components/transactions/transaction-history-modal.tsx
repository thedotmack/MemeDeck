'use client'

import { useState, useEffect, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { cn } from '@/lib/utils'
import { Clock, RefreshCw, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { TradePairRow } from './trade-pair-row'
import { TransactionRow } from './transaction-row'

export function TransactionHistoryModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const [dbTransactions, setDbTransactions] = useState<any[]>([])
  
  const userId = useStore.use.userId() ?? null
  const isDemoMode = useStore.use.isDemoMode() ?? false
  const auth = useStore.use.auth() || {}
  const accessToken = auth?.accessToken

  const handleRefresh = useCallback(async () => {
    if (isDemoMode || !accessToken) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/transactions', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setDbTransactions(data.transactions || [])
      } else {
        console.error('[TransactionHistory] API error:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('[TransactionHistory] Failed to refresh transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isDemoMode, accessToken])

  
  useEffect(() => {
    if (isOpen && !isDemoMode && accessToken) {
      handleRefresh()
    }
  }, [isOpen, isDemoMode, accessToken, handleRefresh])

  
  const { pairedTrades, unpairedTx, summary } = (() => {
    if (isDemoMode || dbTransactions.length === 0) {
      return {
        pairedTrades: [],
        unpairedTx: [],
        summary: { totalPnL: 0, winRate: 0, totalTrades: 0, biggestWin: 0, biggestLoss: 0 }
      }
    }

    
    const confirmedTx = dbTransactions.filter(tx => tx.status === 'confirmed')
    
    
    const pairedTrades: any[] = []
    const unpairedTx: any[] = []
    const buyQueue: any[] = []
    
    
    const tokenGroups = new Map<string, any[]>()
    
    for (const tx of confirmedTx.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())) {
      const orderResp = tx.ultraOrderResponse || {}
      const solMint = 'So11111111111111111111111111111111111111112'
      const isBuy = orderResp.inputMint === solMint
      const tokenMint = isBuy ? orderResp.outputMint : orderResp.inputMint
      
      if (!tokenMint) continue
      
      if (!tokenGroups.has(tokenMint)) {
        tokenGroups.set(tokenMint, [])
      }
      tokenGroups.get(tokenMint)!.push({...tx, isBuy})
    }
    
    
    for (const [tokenMint, tokenTxs] of tokenGroups) {
      const buyQueue: any[] = []
      
      for (const tx of tokenTxs) {
        if (tx.isBuy) {
          buyQueue.push(tx)
        } else if (buyQueue.length > 0) {
          const buyTx = buyQueue.shift()!
          const sellTx = tx
          
          const buyAmount = Number(buyTx.amountUsd) || 0
          const sellAmount = Number(sellTx.amountUsd) || 0
          const pnl = sellAmount - buyAmount
          const pnlPercent = buyAmount > 0 ? (pnl / buyAmount) * 100 : 0
          const holdingTime = new Date(sellTx.createdAt).getTime() - new Date(buyTx.createdAt).getTime()
          
          pairedTrades.push({
            buyTx,
            sellTx,
            pnl,
            pnlPercent,
            holdingTime,
            tokenSymbol: buyTx.tokenSymbol || 'TOKEN',
            tokenMint
          })
        } else {
          unpairedTx.push(tx)
        }
      }
      
      
      unpairedTx.push(...buyQueue)
    }
    
    
    const totalPnL = pairedTrades.reduce((sum, trade) => sum + trade.pnl, 0)
    const winningTrades = pairedTrades.filter(trade => trade.pnl > 0)
    const winRate = pairedTrades.length > 0 ? (winningTrades.length / pairedTrades.length) * 100 : 0
    const biggestWin = pairedTrades.length > 0 ? Math.max(...pairedTrades.map(t => t.pnl)) : 0
    const biggestLoss = pairedTrades.length > 0 ? Math.min(...pairedTrades.map(t => t.pnl)) : 0
    
    return {
      pairedTrades: pairedTrades.sort((a, b) => new Date(b.sellTx.createdAt).getTime() - new Date(a.sellTx.createdAt).getTime()),
      unpairedTx: unpairedTx.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      summary: { totalPnL, winRate, totalTrades: pairedTrades.length, biggestWin, biggestLoss }
    }
  })()

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <div className="w-full bg-gray-900 rounded-lg max-h-[90vh] overflow-hidden">
        {}
        <div className="p-6 border-b border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Clock className="w-6 h-6 text-purple-500" />
              Trading Performance
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
              className="border-gray-700 hover:bg-gray-800"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </Button>
          </div>
          
          {}
          {summary.totalTrades > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-400">Total P&L</span>
                </div>
                <div className={cn(
                  "text-xl font-bold",
                  summary.totalPnL > 0 ? "text-green-400" : "text-red-400"
                )}>
                  {summary.totalPnL > 0 ? '+' : ''}${summary.totalPnL.toFixed(2)}
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-400">Win Rate</span>
                </div>
                <div className="text-xl font-bold text-blue-400">
                  {summary.winRate.toFixed(1)}%
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-gray-400">Best Win</span>
                </div>
                <div className="text-xl font-bold text-green-400">
                  +${summary.biggestWin.toFixed(2)}
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span className="text-gray-400">Worst Loss</span>
                </div>
                <div className="text-xl font-bold text-red-400">
                  ${summary.biggestLoss.toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </div>

        {}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-4">
          {pairedTrades.length === 0 && unpairedTx.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                <Clock className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-gray-500 text-lg">No trades yet</p>
              <p className="text-gray-600 text-sm mt-2">Your trading performance will appear here</p>
            </div>
          ) : (
            <div className="space-y-6">
              {}
              {pairedTrades.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Completed Trades ({pairedTrades.length})
                  </h3>
                  <div className="space-y-3">
                    {pairedTrades.map((trade, index) => (
                      <TradePairRow key={`${trade.buyTx.id}-${trade.sellTx.id}`} linkedTrade={trade} />
                    ))}
                  </div>
                </div>
              )}
              
              {}
              {unpairedTx.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    Open Positions ({unpairedTx.length})
                  </h3>
                  <div className="space-y-3">
                    {unpairedTx.map((tx) => {
                      
                      const transformedTx = {
                        txId: tx.finalTransactionHash || tx.id,
                        timestamp: new Date(tx.createdAt).getTime(),
                        orderResponse: tx.ultraOrderResponse || {},
                        txResponse: tx.executionResponse || {},
                        routePlan: tx.ultraOrderRequest?.routePlan || [],
                        rawApiData: {
                          ...tx.metadata,
                          tokenSymbol: tx.tokenSymbol,
                          status: tx.status,
                          error: tx.errorMessage
                        }
                      }
                      return <TransactionRow key={tx.id} transaction={transformedTx} />
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}