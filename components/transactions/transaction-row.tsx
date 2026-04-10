'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { 
  ArrowRight, 
  ArrowDown, 
  ArrowUp, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Share2,
  ChevronDown,
  ChevronRight,
  Trophy,
  Zap,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Copy
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Transaction } from '@/lib/types/transaction'

interface TransactionRowProps {
  transaction: Transaction
  linkedTrade?: {
    buyTx: Transaction
    sellTx: Transaction
    pnl: number
    pnlPercent: number
    celebration?: string
  }
}

export function TransactionRow({ transaction, linkedTrade }: TransactionRowProps) {
  const [expanded, setExpanded] = useState(false)

  
  const orderData = transaction.orderResponse || {}
  const execData = transaction.txResponse || {}
  
  
  const extractFeeData = (tx: Transaction) => {
    const orderResp = tx.orderResponse || {}
    const routePlan = tx.routePlan?.[0] || {}
    
    
    const platformFee = orderResp.platformFee || routePlan.feeAmount || 0
    const networkFee = tx.rawApiData?.networkFee || orderResp.networkFee || 0
    const priorityFee = tx.rawApiData?.priorityFee || 0
    
    return {
      platformFee,
      networkFee, 
      priorityFee,
      totalFees: platformFee + networkFee + priorityFee,
      platformFeePercent: orderResp.platformFeePercent || null,
      feeMint: orderResp.feeMint || 'SOL'
    }
  }
  
  const feeData = extractFeeData(transaction)

  const isSuccess = execData.status === 'Success' || orderData.status === 'confirmed'
  const isFailed = transaction.rawApiData?.error || transaction.rawApiData?.failureReason
  
  
  const isBuy = orderData.side === 'buy' || 
                (orderData.side !== 'sell' && orderData.inputMint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
  const tradeType = isBuy ? 'BUY' : 'SELL'
  
  
  const rawApiData = transaction.rawApiData || {}
  
  
  const inputAmount = isFailed 
    ? (rawApiData.requestedAmount || orderData.amount || 0)
    : isBuy 
      ? (orderData.inAmount ? Number(orderData.inAmount) / 1e6 : 0) 
      : (orderData.inAmount ? Number(orderData.inAmount) / 1e9 : 0) 
  
  const outputAmount = isFailed
    ? 0 
    : isBuy 
      ? (orderData.outAmount ? Number(orderData.outAmount) / 1e9 : 0) 
      : (orderData.outAmount ? Number(orderData.outAmount) / 1e6 : 0) 
  
  
  const actualInputAmount = !isFailed && execData.inputAmountResult 
    ? (isBuy ? Number(execData.inputAmountResult) / 1e6 : Number(execData.inputAmountResult) / 1e9)
    : inputAmount
  
  const actualOutputAmount = !isFailed && execData.outputAmountResult 
    ? (isBuy ? Number(execData.outputAmountResult) / 1e9 : Number(execData.outputAmountResult) / 1e6)
    : outputAmount

  
  const inputUsdValue = isBuy ? actualInputAmount : (orderData.inUsdValue || 0)
  
  
  const tokenSymbol = orderData.tokenSymbol || rawApiData.tokenSymbol || 
    (isBuy ? orderData.outputMint?.slice(-8) : orderData.inputMint?.slice(-8)) || 'TOKEN'
  const tokenAmount = isBuy ? actualOutputAmount : actualInputAmount
  
  
  const failureReason = isFailed ? (
    rawApiData.failureReason || 
    (typeof rawApiData.error === 'string' ? rawApiData.error : JSON.stringify(rawApiData.error)) || 
    'Unknown error'
  ) : null
  
  
  const getCelebrationTier = (pnlPercent: number) => {
    if (pnlPercent >= 1000) return { label: 'LEGENDARY', color: 'text-yellow-400', icon: '👑' }
    if (pnlPercent >= 500) return { label: 'EPIC WIN', color: 'text-purple-400', icon: '🚀' }
    if (pnlPercent >= 200) return { label: 'BIG WIN', color: 'text-green-400', icon: '💰' }
    if (pnlPercent >= 50) return { label: 'NICE WIN', color: 'text-blue-400', icon: '📈' }
    if (pnlPercent >= 10) return { label: 'PROFIT', color: 'text-green-300', icon: '✅' }
    if (pnlPercent >= -10) return { label: 'BREAK EVEN', color: 'text-gray-400', icon: '➖' }
    if (pnlPercent >= -50) return { label: 'SMALL LOSS', color: 'text-orange-400', icon: '📉' }
    return { label: 'RIP', color: 'text-red-400', icon: '💀' }
  }

  const handleShare = () => {
    if (linkedTrade) {
      const celebration = getCelebrationTier(linkedTrade.pnlPercent)
      const text = `${celebration.icon} ${celebration.label}! Made ${linkedTrade.pnl > 0 ? '$' : '-$'}${Math.abs(linkedTrade.pnl).toFixed(2)} (${linkedTrade.pnlPercent.toFixed(1)}%) trading on @MemeDeck 🎮`
      navigator.clipboard.writeText(text)
      
    }
  }

  const handleCopyHash = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (transaction.txId && !transaction.txId.startsWith('failed-')) {
      navigator.clipboard.writeText(transaction.txId)
      
    }
  }

  return (
    <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg overflow-hidden hover:bg-gray-800/50 transition-colors">
      {}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded); } }}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-4">
          {}
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
            
            {}
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full",
              isFailed 
                ? "bg-gray-500/20 text-gray-400" 
                : isBuy 
                  ? "bg-green-500/20 text-green-400" 
                  : "bg-red-500/20 text-red-400"
            )}>
              {isFailed ? (
                <XCircle className="w-4 h-4" />
              ) : isBuy ? (
                <ArrowDown className="w-4 h-4" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </div>
          </div>

          {}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                "text-sm font-bold",
                isFailed 
                  ? "text-gray-400" 
                  : isBuy 
                    ? "text-green-400" 
                    : "text-red-400"
              )}>
                {isFailed ? `${tradeType} FAILED` : tradeType}
              </span>
              <span className="text-xs text-gray-500">
                {format(new Date(transaction.timestamp), 'MMM dd, HH:mm')}
              </span>
            </div>
            
            {}
            {isFailed ? (
              <div className="text-sm text-gray-400">
                <div>Attempted: ${inputAmount.toFixed(2)} {isBuy ? '→ ' + tokenSymbol : '→ USDC'}</div>
                <div className="text-xs text-red-400 mt-1">
                  {failureReason?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span>${inputUsdValue.toFixed(2)}</span>
                <ArrowRight className="w-3 h-3 text-gray-500" />
                <span>
                  {tokenAmount.toFixed(tokenAmount < 1 ? 6 : 2)} {isBuy ? tokenSymbol : 'USDC'}
                </span>
              </div>
            )}
          </div>
        </div>

        {}
        <div className="flex items-center gap-4">
          {}
          {linkedTrade && (
            <div className="text-right">
              <div className={cn(
                "text-lg font-bold",
                linkedTrade.pnl > 0 ? "text-green-400" : "text-red-400"
              )}>
                {linkedTrade.pnl > 0 ? '+' : ''}${linkedTrade.pnl.toFixed(2)}
              </div>
              <div className={cn(
                "text-xs",
                linkedTrade.pnlPercent > 0 ? "text-green-400" : "text-red-400"
              )}>
                {linkedTrade.pnlPercent > 0 ? '+' : ''}{linkedTrade.pnlPercent.toFixed(1)}%
              </div>
            </div>
          )}

          {/* Celebration Badge */}
          {linkedTrade && linkedTrade.pnlPercent > 10 && (
            <div className="flex items-center gap-1">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className={cn(
                "text-xs font-bold",
                getCelebrationTier(linkedTrade.pnlPercent).color
              )}>
                {getCelebrationTier(linkedTrade.pnlPercent).label}
              </span>
            </div>
          )}

          {/* Status & Actions */}
          <div className="flex items-center gap-2">
            {linkedTrade && (
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  handleShare()
                }}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
              >
                <Share2 className="w-4 h-4 text-gray-400 hover:text-purple-400" />
              </button>
            )}
            
            {isFailed ? (
              <XCircle className="w-5 h-5 text-red-400" />
            ) : isSuccess ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      {expanded && (
        <div className="border-t border-gray-700/50 bg-gray-800/20 p-4 space-y-4">
          {isFailed ? (
            /* Failed Transaction Details */
            <div className="space-y-3">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-300 font-medium">Transaction Failed</span>
                </div>
                <div className="text-sm text-gray-300 mb-2">
                  <strong>Error:</strong> {typeof rawApiData.error === 'string' ? rawApiData.error : JSON.stringify(rawApiData.error) || 'Unknown error occurred'}
                </div>
                {rawApiData.failureDetails && (
                  <div className="text-xs text-gray-400">
                    <strong>Details:</strong> {rawApiData.failureDetails}
                  </div>
                )}
              </div>
              
              {}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400 text-xs mb-1">Failure Type</div>
                  <div className="text-red-400 font-medium">
                    {failureReason?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </div>
                </div>
                
                <div>
                  <div className="text-gray-400 text-xs mb-1">Attempted Amount</div>
                  <div className="text-yellow-400 font-medium">
                    ${inputAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
                        <div className="space-y-4">
              {}
              <div>
                <div className="text-gray-400 text-xs mb-1">Slippage</div>
                <div className="text-yellow-400 font-medium">
                  {((orderData.slippageBps || 0) / 100).toFixed(2)}%
                </div>
              </div>

              {}
              {feeData.totalFees > 0 && (
                <div className="border-t border-gray-700/50 pt-3">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-yellow-400" />
                    <span className="text-gray-400 text-xs font-medium">Fee Breakdown</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400 text-xs mb-1">Platform Fee</div>
                      <div className="text-yellow-400 font-medium">
                        ${feeData.platformFee.toFixed(6)}
                        {feeData.platformFeePercent !== null && (
                          <span className="text-gray-500 ml-1 text-xs">
                            ({(feeData.platformFeePercent * 100).toFixed(2)}%)
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-gray-400 text-xs mb-1">Network Fee</div>
                      <div className="text-blue-400 font-medium">
                        {feeData.networkFee.toFixed(6)} SOL
                      </div>
                    </div>
                    
                    {feeData.priorityFee !== null && (
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Priority Fee</div>
                        <div className="text-purple-400 font-medium">
                          {feeData.priorityFee.toFixed(6)} SOL
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <div className="text-gray-400 text-xs mb-1">Total Fees</div>
                      <div className="text-red-400 font-medium">
                        ${feeData.totalFees.toFixed(6)}
                      </div>
                    </div>
                  </div>
                  
                  {}
                  {feeData.feeMint && (
                    <div className="mt-3 pt-2 border-t border-gray-700/50">
                      <div className="text-gray-400 text-xs mb-1">Fee Token</div>
                      <div className="text-gray-300 text-xs font-mono">
                        {feeData.feeMint.slice(0, 8)}...{feeData.feeMint.slice(-8)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {}
          {!isFailed && tokenSymbol.includes('...') && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 mt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <span className="text-orange-300 text-xs font-medium">
                  Token symbol could not be resolved
                </span>
              </div>
            </div>
          )}

          {}
          <div className="flex items-center gap-4 pt-2 border-t border-gray-700/50">
            {!isFailed && transaction.txId && !transaction.txId.startsWith('failed-') && (
              <>
                <button 
                  onClick={() => window.open(`https://solscan.io/tx/${transaction.txId}`, '_blank')}
                  className="flex items-center gap-2 text-xs text-gray-400 hover:text-purple-400 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  View on Solscan
                </button>
                <button 
                  onClick={handleCopyHash}
                  className="flex items-center gap-2 text-xs text-gray-400 hover:text-green-400 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  Copy Hash
                </button>
              </>
            )}
            
            {isFailed && (
              <div className="text-xs text-gray-500">
                Transaction Hash: {transaction.txId}
              </div>
            )}
            
            {orderData.requestId && (
              <div className="text-xs text-gray-500">
                Request: {orderData.requestId.slice(0, 8)}...{orderData.requestId.slice(-8)}
              </div>
            )}
          </div>

          {}
          {process.env.NODE_ENV === 'development' && (
            <details className="text-xs">
              <summary className="text-gray-400 cursor-pointer hover:text-gray-300">
                Developer: Raw Data
              </summary>
              <pre className="mt-2 p-2 bg-gray-900 rounded text-gray-300 overflow-x-auto">
                {JSON.stringify({ 
                  orderResponse: transaction.orderResponse,
                  txResponse: transaction.txResponse,
                  routePlan: transaction.routePlan,
                  rawApiData: transaction.rawApiData
                }, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  )
}