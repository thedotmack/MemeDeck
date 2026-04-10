'use client'

import type { DatabaseLinkedTrade } from '@/lib/services/database-transaction-pairing-service'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import {
    AlertTriangle,
    ArrowDown,
    ArrowRight,
    ArrowUp,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    DollarSign,
    ExternalLink,
    Share2,
    Timer,
    XCircle
} from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'


interface UltraOrderResponseLite {
  inUsdValue?: number
  outUsdValue?: number
  tokenSymbol?: string
  outAmount?: string | number
  outputMint?: string
  platformFee?: number
  platformFeePercent?: number
  networkFee?: number
}

interface ExecutionResponseLite {
  status?: string
  feeAmount?: number
  networkFee?: number
  priorityFee?: number
}


function asUltraOrder(data: unknown): UltraOrderResponseLite {
  if (data && typeof data === 'object') return data as UltraOrderResponseLite
  return {}
}
function asExecution(data: unknown): ExecutionResponseLite {
  if (data && typeof data === 'object') return data as ExecutionResponseLite
  return {}
}

interface TradePairRowProps {
  linkedTrade: DatabaseLinkedTrade
}

export function TradePairRow({ linkedTrade }: TradePairRowProps) {
  const [expanded, setExpanded] = useState(false)

  const { buyTx, sellTx, pnl, pnlPercent, holdingTime = 0, tokenSymbol: linkedTokenSymbol } = linkedTrade

  
  
  const buyOrderData = asUltraOrder((buyTx as any).ultraOrderResponse || (linkedTrade as any).ultraOrderResponse)
  const sellOrderData = asUltraOrder((sellTx as any).ultraOrderResponse || (linkedTrade as any).ultraOrderResponse)
  const buyExecData = asExecution((buyTx as any).executionResponse || (linkedTrade as any).executionResponse)
  const sellExecData = asExecution((sellTx as any).executionResponse || (linkedTrade as any).executionResponse)
  
  
  const buyAmountUsd = Number(buyTx.amountUsd) || buyOrderData.inUsdValue || 0
  const sellAmountUsd = Number(sellTx.amountUsd) || sellOrderData.outUsdValue || 0
  
  
  const extractFeeData = (tx: { ultraOrderResponse?: unknown; executionResponse?: unknown }) => {
    const orderResp = asUltraOrder(tx.ultraOrderResponse)
    const execResp = asExecution(tx.executionResponse)
    const platformFee = orderResp.platformFee ?? execResp.feeAmount ?? 0
    const networkFee = execResp.networkFee ?? orderResp.networkFee ?? 0
    const priorityFee = execResp.priorityFee ?? 0
    return {
      platformFee,
      networkFee,
      priorityFee,
      totalFees: platformFee + networkFee + priorityFee,
      platformFeePercent: orderResp.platformFeePercent ?? null
    }
  }
  
  const buyFeeData = extractFeeData(buyTx)
  const sellFeeData = extractFeeData(sellTx)
  
  
  const netPnlData = (() => {
    const buyTotalFees = buyFeeData.totalFees
    const sellTotalFees = sellFeeData.totalFees
    
    if (buyTotalFees !== null && sellTotalFees !== null) {
      const totalFees = buyTotalFees + sellTotalFees
      const netPnl = pnl - totalFees
      const netPnlPercent = buyAmountUsd > 0 ? (netPnl / buyAmountUsd) * 100 : 0
      
      return {
        grossPnl: pnl,
        grossPnlPercent: pnlPercent,
        totalFees,
        netPnl,
        netPnlPercent,
        hasCompleteData: true
      }
    }
    
    return {
      grossPnl: pnl,
      grossPnlPercent: pnlPercent,
      totalFees: null,
      netPnl: null,
      netPnlPercent: null,
      hasCompleteData: false
    }
  })()
  
  
  const tokenSymbol = linkedTokenSymbol || buyTx.tokenSymbol || buyOrderData.tokenSymbol || 'TOKEN'
  const tokenAmount = Number(buyOrderData.outAmount ?? 0) / 1e9
  const tokenMint = buyTx.tokenMint || buyOrderData.outputMint || linkedTrade.tokenMint
  
  
  const buySuccess = buyExecData.status === 'Success'
  const sellSuccess = sellExecData.status === 'Success'
  const overallSuccess = buySuccess && sellSuccess
  
  
  const holdingTimeHours = holdingTime / (1000 * 60 * 60)
  const holdingTimeDisplay = holdingTimeHours < 1 
    ? `${Math.round(holdingTime / (1000 * 60))}m`
    : `${holdingTimeHours.toFixed(1)}h`

  
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

  
  const celebrationPnlPercent = netPnlData.hasCompleteData ? netPnlData.netPnlPercent! : netPnlData.grossPnlPercent
  const celebration = getCelebrationTier(celebrationPnlPercent)

  const handleShare = () => {
    const pnlDisplay = pnl > 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`
    const text = `${celebration.icon} ${celebration.label}! ${pnlDisplay} (${pnlPercent.toFixed(1)}%) trading ${tokenSymbol} on @MemeDeck 🎮🃏`
    
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
    
    if (window.confirm('Share your trade on Twitter?')) {
      window.open(twitterUrl, '_blank', 'width=550,height=420')
    } else {
      navigator.clipboard.writeText(text)
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
            <div className="flex items-center gap-2">
              {}
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                {tokenMint ? (
                  <Image 
                    src={`https://memedeck.win/cached-images/${tokenMint}.webp`}
                    alt={tokenSymbol}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      
                      e.currentTarget.style.display = 'none'
                      const sibling = e.currentTarget.nextElementSibling as HTMLElement | null
                      if (sibling) sibling.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div className="w-full h-full bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-xs font-bold" style={{display: tokenMint ? 'none' : 'flex'}}>
                  {tokenSymbol.slice(0, 2).toUpperCase()}
                </div>
              </div>
              
              {}
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center">
                  <ArrowDown className="w-2 h-2" />
                </div>
                <ArrowRight className="w-3 h-3 text-gray-500" />
                <div className="w-4 h-4 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center">
                  <ArrowUp className="w-2 h-2" />
                </div>
              </div>
            </div>
          </div>

          {}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-white">
                TRADE COMPLETE
              </span>
              <span className="text-xs text-gray-500">
                {format(new Date(buyTx.createdAt), 'MMM dd')} → {format(new Date(sellTx.createdAt), 'MMM dd')}
              </span>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Timer className="w-3 h-3" />
                {holdingTimeDisplay}
              </div>
            </div>
            
            {}
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-200">
              <span className="text-red-300">${buyAmountUsd.toFixed(2)}</span>
              <ArrowRight className="w-4 h-4 text-gray-500" />
              <span className="text-green-300">${sellAmountUsd.toFixed(2)}</span>
              <span className="text-xs text-gray-500 ml-2">
                {tokenAmount.toFixed(2)} {tokenSymbol}
              </span>
            </div>
          </div>
        </div>

        {}
        <div className="flex items-center gap-4">
          {}
          <div className="text-right">
            {netPnlData.hasCompleteData ? (
              <>
                <div className={cn(
                  "text-xl font-bold",
                  netPnlData.netPnl! > 0 ? "text-green-400" : "text-red-400"
                )}>
                  {netPnlData.netPnl! > 0 ? '+' : ''}${netPnlData.netPnl!.toFixed(2)}
                </div>
                <div className={cn(
                  "text-sm",
                  netPnlData.netPnlPercent! > 0 ? "text-green-400" : "text-red-400"
                )}>
                  {netPnlData.netPnlPercent! > 0 ? '+' : ''}{netPnlData.netPnlPercent!.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-400">
                  Gross: ${netPnlData.grossPnl.toFixed(2)} • Fees: -${netPnlData.totalFees!.toFixed(4)}
                </div>
              </>
            ) : (
              <>
                <div className={cn(
                  "text-xl font-bold",
                  netPnlData.grossPnl > 0 ? "text-green-400" : "text-red-400"
                )}>
                  {netPnlData.grossPnl > 0 ? '+' : ''}${netPnlData.grossPnl.toFixed(2)}
                  <span className="text-orange-400 text-sm ml-1">*</span>
                </div>
                <div className={cn(
                  "text-sm",
                  netPnlData.grossPnlPercent > 0 ? "text-green-400" : "text-red-400"
                )}>
                  {netPnlData.grossPnlPercent > 0 ? '+' : ''}{netPnlData.grossPnlPercent.toFixed(1)}%
                </div>
                <div className="text-xs text-orange-400">
                  *Fee data incomplete
                </div>
              </>
            )}
          </div>

          {/* Celebration Badge */}
          {Math.abs(celebrationPnlPercent) > 10 && (
            <div className="flex items-center gap-2">
              <span className="text-lg">{celebration.icon}</span>
              <span className={cn("text-sm font-bold", celebration.color)}>
                {celebration.label}
              </span>
            </div>
          )}

          {/* Profit Sharing Actions */}
          <div className="flex items-center gap-2">
            {/* Share Button - Always visible for big wins/losses */}
            {Math.abs(celebrationPnlPercent) > 10 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  handleShare()
                }}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share {pnl > 0 ? 'Win' : 'Loss'}
              </button>
            )}
            
            {}
            <button 
              onClick={(e) => {
                e.stopPropagation()
                navigator.clipboard.writeText(`${pnl > 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPercent.toFixed(1)}%)`)
              }}
              className="p-2 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-green-400"
              title="Copy P&L"
            >
              <DollarSign className="w-4 h-4" />
            </button>
            
            {overallSuccess ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
          </div>
        </div>
      </div>

      {}
      {expanded && (
        <div className="border-t border-gray-700/50 bg-gray-800/20 p-4 space-y-4">
          {}
          <div className="bg-green-500/10 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ArrowDown className="w-4 h-4 text-green-400" />
                <span className="text-green-300 font-medium">BUY</span>
                <span className="text-xs text-gray-400">
                  {format(new Date(buyTx.createdAt), 'MMM dd, HH:mm:ss')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {buySuccess ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <button 
                  onClick={() => window.open(`https://solscan.io/tx/${buyTx.finalTransactionHash}`, '_blank')}
                  className="text-xs text-gray-400 hover:text-purple-400"
                >
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-300">
              <span className="font-semibold">${buyAmountUsd.toFixed(2)}</span>
              <span className="text-xs text-gray-500 ml-2">({tokenAmount.toFixed(2)} {tokenSymbol})</span>
            </div>
            <div className="text-xs text-gray-400">
              TX: {buyTx.finalTransactionHash?.slice(0, 8)}...{buyTx.finalTransactionHash?.slice(-8)}
            </div>
          </div>

          {}
          <div className="bg-red-500/10 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ArrowUp className="w-4 h-4 text-red-400" />
                <span className="text-red-300 font-medium">SELL</span>
                <span className="text-xs text-gray-400">
                  {format(new Date(sellTx.createdAt), 'MMM dd, HH:mm:ss')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {sellSuccess ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <button 
                  onClick={() => window.open(`https://solscan.io/tx/${sellTx.finalTransactionHash}`, '_blank')}
                  className="text-xs text-gray-400 hover:text-purple-400"
                >
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-300">
              <span className="font-semibold">${sellAmountUsd.toFixed(2)}</span>
              <span className="text-xs text-gray-500 ml-2">({tokenAmount.toFixed(2)} {tokenSymbol})</span>
            </div>
            <div className="text-xs text-gray-400">
              TX: {sellTx.finalTransactionHash?.slice(0, 8)}...{sellTx.finalTransactionHash?.slice(-8)}
            </div>
          </div>

          {}
          <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t border-gray-700/50">
            <div>
              <div className="text-gray-400 text-xs mb-1">Holding Time</div>
              <div className="text-blue-400 font-medium">{holdingTimeDisplay}</div>
            </div>
            
            <div>
              <div className="text-gray-400 text-xs mb-1">Token</div>
              <div className="text-gray-300 font-medium text-xs">
                {buyTx.tokenMint?.slice(0, 8)}...{buyTx.tokenMint?.slice(-8)}
              </div>
            </div>
          </div>
          
          {}
          {netPnlData.hasCompleteData && (
            <div className="border-t border-gray-700/50 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-400 text-sm font-medium">Fee Summary</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400 text-xs mb-1">Buy Transaction Fees</div>
                  <div className="text-yellow-400 font-medium">
                    ${buyFeeData.totalFees.toFixed(6)}
                  </div>
                  {buyFeeData.platformFeePercent !== null && (
                    <div className="text-xs text-gray-500">
                      Platform: {(buyFeeData.platformFeePercent * 100).toFixed(2)}%
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="text-gray-400 text-xs mb-1">Sell Transaction Fees</div>
                  <div className="text-yellow-400 font-medium">
                    ${sellFeeData.totalFees.toFixed(6)}
                  </div>
                  {sellFeeData.platformFeePercent !== null && (
                    <div className="text-xs text-gray-500">
                      Platform: {(sellFeeData.platformFeePercent * 100).toFixed(2)}%
                    </div>
                  )}
                </div>
                
                <div className="col-span-2 pt-2 border-t border-gray-700/50">
                  <div className="text-gray-400 text-xs mb-1">Total Fees Impact</div>
                  <div className="text-red-400 font-medium">
                    -${netPnlData.totalFees!.toFixed(4)} 
                    <span className="text-gray-500 ml-1 text-xs">
                      ({((netPnlData.totalFees! / buyAmountUsd) * 100).toFixed(2)}% of trade)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {}
          {tokenSymbol.includes('...') && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 mt-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <span className="text-orange-300 text-xs font-medium">
                  Token symbol could not be resolved
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}