
import { useToastContext } from '@/components/providers/toast-provider'
import { USDC_MINT } from '@/lib/config/trading-constants'
import { walletBalanceService } from '@/lib/services/wallet-balance-service'
import { useStore } from '@/lib/store'
import { processErrorMessage } from '@/lib/utils/error-message-processor'

export function useTransactionToasts() {
  const { toast } = useToastContext()
  
  
  const updateWalletBalance = useStore.use.updateWalletBalance() ?? (() => {});
  const updateSolBalance = useStore.use.updateSolBalance() ?? (() => {});
  const auth = useStore.use.auth() ?? { user: null };
  
  
  const refreshBalancesAfterTransaction = async () => {
    try {
      const walletAddress = auth?.user?.walletAddress
      
      if (!walletAddress) {
        return 
      }
      
      
      const balances = await walletBalanceService.getBalances(walletAddress)
      const usdcBalance = balances.tokens[USDC_MINT] ?? 0

      
      updateWalletBalance(usdcBalance || 0)
      updateSolBalance(balances.sol || 0)

      console.log('[TransactionToasts] ✅ Balances refreshed after successful transaction:', {
        usdc: usdcBalance,
        sol: balances.sol
      })
    } catch (error) {
      console.error('[TransactionToasts] Failed to refresh balances after transaction:', error)
      
    }
  }
  
  const notifyTransactionSent = (tokenSymbol: string, operation: 'buy' | 'sell') => {
    const title = operation === 'buy' ? 
      `🚀 Purchase Order Placed` : 
      `📤 Sell Order Placed`
    
    const description = operation === 'buy' ?
      `Processing your order...` :
      `Selling ${tokenSymbol}...`
    
    toast({
      title,
      description,
      duration: 3000,
      variant: 'default'
    })
  }
  
  const notifyTransactionConfirmed = (tokenSymbol: string, operation: 'buy' | 'sell', pnl?: number) => {
    const title = operation === 'buy' ? 
      `✅ ${tokenSymbol} Added` : 
      `💰 ${tokenSymbol} Sold`
    
    const description = pnl ? 
      `${pnl >= 0 ? 'Profit' : 'Loss'}: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}` : 
      'Transaction confirmed'
    
    toast({
      title,
      description,
      duration: 4000,
      variant: (operation === 'sell' && pnl && pnl >= 0) ? 'success' : 'default'
    })
    
    
    refreshBalancesAfterTransaction().catch(() => {
      
    })
  }

  const notifyMessage = (title: string, description?: string, variant: 'default' | 'success' | 'error' | 'warning' = 'success') => {
    toast({
      title,
      description,
      duration: 4000,
      variant
    })
  }
  
  const notifyTransactionFailed = (tokenSymbol: string, operation: 'buy' | 'sell', error: string) => {
    
    const isBalanceIssueMessage = typeof error === 'string' && error.indexOf('Balance Issue:') === 0

    const userFriendlyError = isBalanceIssueMessage
      ? error
      : processErrorMessage(error, {
          operation: operation === 'buy' ? 'Purchase' : 'Sale',
          tokenSymbol
        })

    toast({
      title: `${operation === 'buy' ? 'Buy' : 'Sell'} Failed`,
      description: userFriendlyError,
      duration: 8000,
      variant: 'error',
      action: {
        label: 'Retry',
        onClick: () => {
          
          
        }
      }
    })
  }
  
  const notifyBatchTransactionResults = (batchId: string, successful: number, failed: number, total: number) => {
    if (failed === 0) {
      toast({
        title: `🎉 All ${total} Cards Purchased`,
        description: `Successfully added ${successful} tokens to your portfolio`,
        duration: 4000,
        variant: 'success'
      })
      
      
      refreshBalancesAfterTransaction().catch(() => {
        
      })
    } else if (successful === 0) {
      toast({
        title: '❌ Purchase Failed',
        description: `None of the ${total} tokens could be purchased. Please check your balance and try again.`,
        duration: 6000,
        variant: 'error'
      })
    } else {
      toast({
        title: `⚠️ Partial Purchase (${successful}/${total})`,
        description: `${successful} cards added successfully, ${failed} failed. Check individual token liquidity.`,
        duration: 5000,
        variant: 'warning'
      })
      
      
      refreshBalancesAfterTransaction().catch(() => {
        
      })
    }
  }
  
  return {
    notifyTransactionSent,
    notifyTransactionConfirmed,
    notifyTransactionFailed,
    notifyBatchTransactionResults,
    notifyMessage
  }
}