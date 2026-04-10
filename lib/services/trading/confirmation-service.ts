
import { tokenConfirmationService } from '@/lib/services/balance-confirmation-service'


interface ConfirmationParams {
  transactionHash: string
  tokenMint: string
  walletAddress: string
  operation: 'buy' | 'sell'
  expectedAmount?: number
}

interface ConfirmationResult {
  confirmed: boolean
  tokenMint?: string
  balance?: number
  error?: string
  pollingDuration?: number
}

interface ConfirmationCallbacks {
  onProgress?: (elapsed: number, remaining: number) => void
  onConfirmed?: (result: ConfirmationResult) => void
  onFailed?: (error: string) => void
}

class ConfirmationService {
  private activePollers = new Map<string, AbortController>()

    async confirmBuyTransaction(
    params: ConfirmationParams,
    callbacks?: ConfirmationCallbacks
  ): Promise<ConfirmationResult> {
    const { tokenMint, walletAddress, transactionHash } = params
    
    console.log('[ConfirmationService] Starting buy confirmation:', {
      tokenMint: tokenMint.slice(-8),
      transactionHash: transactionHash.slice(-8),
      walletAddress: walletAddress.slice(-8)
    })

    
    const controller = new AbortController()
    this.activePollers.set(transactionHash, controller)

    try {
      
      const result = await tokenConfirmationService.pollForSpecificToken(
        tokenMint,
        walletAddress
      )

      
      if (controller.signal.aborted) {
        console.log('[ConfirmationService] Buy confirmation was aborted')
        return { confirmed: false, error: 'Confirmation aborted' }
      }

      if (result.confirmed) {
        console.log('[ConfirmationService] Buy transaction confirmed successfully')
        callbacks?.onConfirmed?.(result)
      } else {
        console.error('[ConfirmationService] Buy confirmation failed:', result.error)
        callbacks?.onFailed?.(result.error || 'Unknown error')
      }

      return result
    } finally {
      this.activePollers.delete(transactionHash)
    }
  }

    async confirmSellTransaction(
    params: ConfirmationParams,
    callbacks?: ConfirmationCallbacks
  ): Promise<ConfirmationResult> {
    const { tokenMint, walletAddress, transactionHash } = params
    
    console.log('[ConfirmationService] Starting sell confirmation:', {
      tokenMint: tokenMint.slice(-8),
      transactionHash: transactionHash.slice(-8),
      walletAddress: walletAddress.slice(-8)
    })

    
    const controller = new AbortController()
    this.activePollers.set(transactionHash, controller)

    try {
      
      const result = await tokenConfirmationService.pollForTokenDisappearance(
        tokenMint,
        walletAddress
      )

      
      if (controller.signal.aborted) {
        console.log('[ConfirmationService] Sell confirmation was aborted')
        return { confirmed: false, error: 'Confirmation aborted' }
      }

      if (result.confirmed) {
        console.log('[ConfirmationService] Sell transaction confirmed successfully')
        callbacks?.onConfirmed?.(result)
      } else {
        console.error('[ConfirmationService] Sell confirmation failed:', result.error)
        callbacks?.onFailed?.(result.error || 'Unknown error')
      }

      return result
    } finally {
      this.activePollers.delete(transactionHash)
    }
  }

    async confirmSOLIncrease(
    params: Omit<ConfirmationParams, 'tokenMint'>,
    callbacks?: ConfirmationCallbacks
  ): Promise<ConfirmationResult> {
    const { walletAddress, transactionHash, expectedAmount } = params
    
    console.log('[ConfirmationService] Starting SOL increase confirmation:', {
      transactionHash: transactionHash.slice(-8),
      walletAddress: walletAddress.slice(-8),
      expectedAmount
    })

    
    const controller = new AbortController()
    this.activePollers.set(transactionHash, controller)

    try {
      
      const result = await tokenConfirmationService.pollSOLIncrease(
        walletAddress,
        expectedAmount
      )

      
      if (controller.signal.aborted) {
        console.log('[ConfirmationService] SOL confirmation was aborted')
        return { confirmed: false, error: 'Confirmation aborted' }
      }

      if (result.confirmed) {
        console.log('[ConfirmationService] SOL increase confirmed successfully')
        callbacks?.onConfirmed?.(result)
      } else {
        console.error('[ConfirmationService] SOL confirmation failed:', result.error)
        callbacks?.onFailed?.(result.error || 'Unknown error')
      }

      return result
    } finally {
      this.activePollers.delete(transactionHash)
    }
  }



    async confirmTransaction(
    params: ConfirmationParams,
    callbacks?: ConfirmationCallbacks
  ): Promise<ConfirmationResult> {
    switch (params.operation) {
      case 'buy':
        return this.confirmBuyTransaction(params, callbacks)
      case 'sell':
        return this.confirmSellTransaction(params, callbacks)
      default:
        throw new Error(`Unknown operation: ${params.operation}`)
    }
  }

    stopConfirmation(transactionHash: string): boolean {
    const controller = this.activePollers.get(transactionHash)
    if (controller) {
      console.log('[ConfirmationService] Stopping confirmation for:', transactionHash.slice(-8))
      controller.abort()
      this.activePollers.delete(transactionHash)
      return true
    }
    return false
  }

    stopAllConfirmations(): number {
    const count = this.activePollers.size
    console.log(`[ConfirmationService] Stopping ${count} active confirmations`)
    
    for (const [hash, controller] of this.activePollers) {
      controller.abort()
    }
    
    this.activePollers.clear()
    return count
  }

    getActiveConfirmations(): string[] {
    return Array.from(this.activePollers.keys())
  }

    isConfirmationActive(transactionHash: string): boolean {
    return this.activePollers.has(transactionHash)
  }

    async startConfirmationMonitoring(
    transactionHash: string,
    tokenMint: string,
    walletAddress: string,
    operation: 'buy' | 'sell',
    callbacks?: ConfirmationCallbacks
  ): Promise<ConfirmationResult> {
    console.log('[ConfirmationService] Starting confirmation monitoring:', {
      tokenMint: tokenMint.slice(-8),
      transactionHash: transactionHash.slice(-8),
      walletAddress: walletAddress.slice(-8),
      operation
    })

    const params: ConfirmationParams = {
      transactionHash,
      tokenMint,
      walletAddress,
      operation
    }

    return await this.confirmTransaction(params, callbacks)
  }
}


export const confirmationService = new ConfirmationService()