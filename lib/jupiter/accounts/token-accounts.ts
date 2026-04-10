
import { RENT_PER_TOKEN_ACCOUNT_SOL } from '@/lib/constants/solana'
import { tokenConfirmationService } from '@/lib/services/balance-confirmation-service'
import { walletBalanceService } from '@/lib/services/wallet-balance-service'
import { useStore } from '@/lib/store'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { ComputeBudgetProgram, Connection, PublicKey, TransactionInstruction, TransactionMessage, VersionedTransaction } from '@solana/web3.js'

interface EmptyAccount {
  tokenAccount: string
  mint: string
}

interface ClosureResult {
  success: boolean
  closedAccounts?: number
  error?: string
  signature?: string
}


function createCloseAccountInstruction(
  account: PublicKey,
  destination: PublicKey,
  owner: PublicKey,
  multiSigners: PublicKey[] = []
) {
  const keys = [
    { pubkey: account, isSigner: false, isWritable: true },
    { pubkey: destination, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: true, isWritable: false }
  ]
  for (const signer of multiSigners) {
    keys.push({ pubkey: signer, isSigner: true, isWritable: false })
  }
  
  const data = Buffer.from([9])
  return new TransactionInstruction({ keys, programId: TOKEN_PROGRAM_ID, data })
}

class TokenClosureService {
  private connection: Connection
  private activeClosures: Map<string, Promise<ClosureResult>> = new Map()
  
  constructor() {
    this.connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!)
  }
  
    clearActiveClosures(walletAddress?: string): void {
    if (walletAddress) {
      this.activeClosures.delete(walletAddress)
      console.log('[TokenClosure] 🧹 Manually cleared active closure for wallet:', walletAddress.slice(-8))
    } else {
      this.activeClosures.clear()
      console.log('[TokenClosure] 🧹 Manually cleared all active closures')
    }
  }

    isClosureActive(walletAddress: string): boolean {
    return this.activeClosures.has(walletAddress)
  }

    async getReclaimableSOL(walletAddress: string): Promise<number> {
    try {
      const emptyAccounts = await this.findEmptyTokenAccounts(walletAddress)
      // Recoverable rent is the count of empty token accounts times the rent per account
      return emptyAccounts.length * RENT_PER_TOKEN_ACCOUNT_SOL
    } catch (error) {
      console.log('[TokenClosure] Error calculating reclaimable SOL:', error)
      return 0
    }
  }

    async closeEmptyTokenAccounts(
    walletAddress: string, 
    wallet: any,
    getAccessToken: () => Promise<string>,
    sendTransaction: (params: { transaction: VersionedTransaction, connection: Connection }) => Promise<{ signature: string }>
  ): Promise<ClosureResult> {
    
    const existingClosure = this.activeClosures.get(walletAddress)
    if (existingClosure) {
      console.log('[TokenClosure] ⚠️ Closure already in progress for wallet:', walletAddress.slice(-8))
      console.log('[TokenClosure] 🔄 Returning existing closure promise to prevent duplicates')
      return existingClosure
    }

    
    const closurePromise = this.performClosure(walletAddress, wallet, getAccessToken, sendTransaction)
    this.activeClosures.set(walletAddress, closurePromise)
    
    
    closurePromise.finally(async () => {
      this.activeClosures.delete(walletAddress)
      console.log('[TokenClosure] 🧹 Cleaned up active closure tracking for wallet:', walletAddress.slice(-8))
      
      
      walletBalanceService.getBalances(walletAddress)
        .then(balances => {
          useStore.getState().updateSolBalance(balances.sol)
        })
        .catch(() => {
          
        })
    })
    
    return closurePromise
  }

    private async performClosure(
    walletAddress: string, 
    wallet: any,
    getAccessToken: () => Promise<string>,
    sendTransaction: (params: { transaction: VersionedTransaction, connection: Connection }) => Promise<{ signature: string }>
  ): Promise<ClosureResult> {
    try {
      console.log('[TokenClosure] Starting token closure for wallet:', walletAddress)

      
      console.log('[TokenClosure] 💰 Refreshing SOL balance after sale...')
      walletBalanceService.getBalances(walletAddress)
        .then(balances => {
          useStore.getState().updateSolBalance(balances.sol)
          console.log('[TokenClosure] ✅ SOL balance updated after sale:', balances.sol)
        })
        .catch(() => {
          
        })

      
      console.log('[TokenClosure] Polling for closeable token accounts...')
      const closeableResult = await tokenConfirmationService.pollForCloseableAccounts(
        walletAddress,
        1 
      )

      
      if (!closeableResult.confirmed || !closeableResult.closeableAccounts?.length) {
        console.log('[TokenClosure] No closeable accounts available after polling')
        return { success: true, closedAccounts: 0 }
      }

      console.log('[TokenClosure] ✅ Found closeable accounts:', {
        count: closeableResult.closeableAccounts.length,
        accounts: closeableResult.closeableAccounts.map(acc => ({ 
          account: acc.tokenAccount.slice(-8),
          mint: acc.mint.slice(-8) 
        }))
      })

      const emptyAccounts = closeableResult.closeableAccounts.map(acc => ({
        tokenAccount: acc.tokenAccount,
        mint: acc.mint
      }))
      console.log('[TokenClosure] Using polled closeable accounts:', emptyAccounts.length)

      
      const transaction = await this.createCloseTransaction(emptyAccounts, walletAddress)
      console.log('[TokenClosure] Created transaction with', emptyAccounts.length, 'close instructions')
      
      
      console.log('[TokenClosure] 🚀 Sending transaction via Privy...')
      
      
      sendTransaction({ 
        transaction, 
        connection: this.connection 
      }).then(result => {
        console.log('[TokenClosure] ✅ Transaction sent successfully:', result.signature)
      }).catch(error => {
        
        if (error.name === 'TransactionExpiredTimeoutError' || error.message?.includes('timeout')) {
          console.log('[TokenClosure] Transaction timeout (expected for token closure)')
        } else {
          console.log('[TokenClosure] Transaction send failed (will rely on account polling):', error.message)
        }
      })
      
      console.log('[TokenClosure] Transaction sent (not waiting for confirmation)')
      
      
      console.log('[TokenClosure] Starting account closure confirmation monitoring...')
      console.log('[TokenClosure] 🔍 Confirmation details:', {
        walletAddress: walletAddress.slice(-8),
        accountsToClose: emptyAccounts.length,
        accountAddresses: emptyAccounts.map(acc => acc.tokenAccount.slice(-8))
      })
      
      const accountsToClose = emptyAccounts.map(acc => acc.tokenAccount)
      
      console.log('[TokenClosure] 🚀 Starting pollForAccountClosure...')
      const confirmationResult = await tokenConfirmationService.pollForAccountClosure(
        walletAddress,
        accountsToClose
      )
      
      console.log('[TokenClosure] 🏁 Confirmation completed with result:', {
        confirmed: confirmationResult.confirmed,
        error: confirmationResult.error,
        closedCount: confirmationResult.closedAccounts?.length || 0
      })
      
      
      if (confirmationResult.confirmed && confirmationResult.closedAccounts && confirmationResult.closedAccounts.length > 0) {
        console.log('[TokenClosure] 💰 Refreshing SOL balance after successful closure...')
        walletBalanceService.getBalances(walletAddress)
          .then(balances => {
            useStore.getState().updateSolBalance(balances.sol)
            console.log('[TokenClosure] ✅ SOL balance refreshed:', balances.sol)
          })
          .catch(() => {
            
          })
      }
      
      return {
        success: confirmationResult.confirmed,
        closedAccounts: confirmationResult.closedAccounts?.length || 0,
        signature: 'fire-and-forget' 
      }
      
    } catch (error) {
      console.log('[TokenClosure] Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

    private async findEmptyTokenAccounts(walletAddress: string): Promise<EmptyAccount[]> {
    const walletPubkey = new PublicKey(walletAddress)
    
    
    const tokenAccounts = await this.connection.getTokenAccountsByOwner(
      walletPubkey,
      { programId: TOKEN_PROGRAM_ID }
    )

    const emptyAccounts: EmptyAccount[] = []
    
    for (const account of tokenAccounts.value) {
      const balance = await this.connection.getTokenAccountBalance(account.pubkey)
        .catch(() => {
          console.warn('[TokenClosure] Failed to check balance for account:', account.pubkey.toString())
          return null
        })
      
      if (!balance || balance.value.uiAmount !== 0) {
        continue
      }
      
      
      const accountData = account.account.data
      const mintBytes = accountData.subarray(0, 32)
      const mintAddress = new PublicKey(mintBytes).toString()
      
      emptyAccounts.push({
        tokenAccount: account.pubkey.toString(),
        mint: mintAddress
      })
    }

    return emptyAccounts
  }

    private async createCloseTransaction(emptyAccounts: EmptyAccount[], walletAddress: string): Promise<VersionedTransaction> {
    const instructions = []

    
    instructions.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 }))

    
    for (const account of emptyAccounts) {
      instructions.push(createCloseAccountInstruction(
        new PublicKey(account.tokenAccount),
        new PublicKey(walletAddress),  
        new PublicKey(walletAddress)   
      ))
    }

    
    const { blockhash } = await this.connection.getLatestBlockhash()
    
    
    const messageV0 = new TransactionMessage({
      payerKey: new PublicKey(walletAddress),
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message()

    return new VersionedTransaction(messageV0)
  }

}

export const tokenClosureService = new TokenClosureService()