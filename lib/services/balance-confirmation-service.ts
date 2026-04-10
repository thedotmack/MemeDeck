
import { CONFIRMATION_POLLING_CONFIG } from '@/lib/config/trading-constants';
import { signature } from '@solana/kit';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';
import { getRpc, type SolanaRpc } from './solana-rpc';
import { walletBalanceService } from './wallet-balance-service';

interface TokenConfirmationResult {
  confirmed: boolean;
  tokenMint?: string;
  balance?: number;
  error?: string;
  signature?: string;
}

interface CloseableAccount {
  tokenAccount: string;
  mint: string;
  balance: number;
}

interface AccountConfirmationResult {
  confirmed: boolean;
  closeableAccounts?: CloseableAccount[];
  closedAccounts?: string[];
  error?: string;
  pollingDuration?: number;
}

class TokenConfirmationService {
  private rpc: SolanaRpc;
  private activeCloseablePolls: Map<string, Promise<AccountConfirmationResult>> = new Map()
  private activeClosurePolls: Map<string, Promise<AccountConfirmationResult>> = new Map()
  
  
  private get pollInterval() { return CONFIRMATION_POLLING_CONFIG.POLL_INTERVAL; }
  private get maxPollTime() { return CONFIRMATION_POLLING_CONFIG.MAX_POLL_TIME; }
  private get progressLogInterval() { return CONFIRMATION_POLLING_CONFIG.PROGRESS_LOG_INTERVAL; }
  
  constructor() {
    this.rpc = getRpc();
  }
  
    async confirmTransactionBySignature(
    transactionSignature: string,
    options?: { commitment?: 'confirmed' | 'finalized' }
  ): Promise<TokenConfirmationResult> {
    
    if (transactionSignature === 'pending') {
      return {
        confirmed: false,
        error: 'Signature is pending - falling back to balance polling',
        signature: transactionSignature
      };
    }
    
    const startTime = Date.now();
    const commitment = options?.commitment || 'confirmed';
    

    
    const checkStatus = async (): Promise<TokenConfirmationResult> => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed > this.maxPollTime) {
        return {
          confirmed: false,
          error: 'Confirmation timeout - transaction may still succeed',
          signature: transactionSignature
        };
      }
      
      try {
        const sig = signature(transactionSignature);
        const result = await this.rpc.getSignatureStatuses([sig]).send();
        
        if (!result.value || !result.value[0]) {
          
          await new Promise(resolve => setTimeout(resolve, this.pollInterval));
          return checkStatus();
        }
        
        const status = result.value[0];
        
        if (status.err) {
          return {
            confirmed: false,
            error: `Transaction failed: ${JSON.stringify(status.err)}`,
            signature: transactionSignature
          };
        }
        
        if (status.confirmationStatus === commitment || status.confirmationStatus === 'finalized') {

          
          return {
            confirmed: true,
            signature: transactionSignature
          };
        }
        
        
        await new Promise(resolve => setTimeout(resolve, this.pollInterval));
        return checkStatus();
        
      } catch (error) {
        console.error('[TokenConfirmation] Error checking signature status:', error);
        
        await new Promise(resolve => setTimeout(resolve, this.pollInterval));
        return checkStatus();
      }
    };
    
    return checkStatus();
  }
  
    async pollForNewToken(
    walletAddress: string,
    excludeTokens: string[] = []
  ): Promise<TokenConfirmationResult> {

    
    
    return this.pollForSpecificToken('', walletAddress);
  }
  
  /**
   * Poll for a specific token to appear in wallet - FALLBACK METHOD
   * Only use when signature is not available
   */
  async pollForSpecificToken(
    tokenMint: string,
    walletAddress: string
  ): Promise<TokenConfirmationResult> {
    const startTime = Date.now();
    

    

    const checkTokenBalance = async (): Promise<TokenConfirmationResult> => {
      const elapsed = Date.now() - startTime;
      

      if (elapsed > this.maxPollTime) {

        return {
          confirmed: false,
          error: 'Confirmation timeout - max poll time exceeded'
        };
      }
      
      
      const balance = await walletBalanceService.getTokenBalance(walletAddress, tokenMint);
      
      if (balance > 0) {
        return {
          confirmed: true,
          tokenMint: tokenMint,
          balance: balance
        };
      }
      
      
      await new Promise(resolve => setTimeout(resolve, this.pollInterval));
      return checkTokenBalance();
    };
    
    return checkTokenBalance();
  }
  
    async pollForTokenDisappearance(
    tokenMint: string,
    walletAddress: string
  ): Promise<TokenConfirmationResult> {
    const startTime = Date.now();
    
    
    const initialBalance = await walletBalanceService.getTokenBalance(walletAddress, tokenMint);
    
    if (initialBalance <= 0) {
      return {
        confirmed: true,
        tokenMint: tokenMint,
        balance: 0
      };
    }
    

    
    const checkTokenDisappearance = async (): Promise<TokenConfirmationResult> => {
      const elapsed = Date.now() - startTime;
      
      
      if (elapsed > this.maxPollTime) {
        return {
          confirmed: false,
          error: 'Confirmation timeout - max poll time exceeded'
        };
      }
      

      
      
      const currentBalance = await walletBalanceService.getTokenBalance(walletAddress, tokenMint);
      
      if (currentBalance <= 0) {
        
        return {
          confirmed: true,
          tokenMint: tokenMint,
          balance: currentBalance
        };
      }
      
      
      await new Promise(resolve => setTimeout(resolve, this.pollInterval));
      return checkTokenDisappearance();
    };
    
    return checkTokenDisappearance();
  }


    async pollSOLIncrease(
    walletAddress: string,
    expectedIncrease?: number
  ): Promise<TokenConfirmationResult> {
    const startTime = Date.now();
    
    
    const initialBalance = await walletBalanceService.getSolBalance(walletAddress);
    

    
    
    const checkSOLIncrease = async (): Promise<TokenConfirmationResult> => {
      const elapsed = Date.now() - startTime;
      
      
      if (elapsed > this.maxPollTime) {

        return {
          confirmed: false,
          error: 'Confirmation timeout - max poll time exceeded'
        };
      }
      

      
      
      const currentBalance = await walletBalanceService.getSolBalance(walletAddress);
      const balanceIncrease = currentBalance - initialBalance;
      

      
      if (balanceIncrease > 0) {
        return {
          confirmed: true,
          tokenMint: 'SOL', 
          balance: currentBalance
        };
      }
      
      
      await new Promise(resolve => setTimeout(resolve, this.pollInterval));
      return checkSOLIncrease();
    };
    
    return checkSOLIncrease();
  }

    async pollForCloseableAccounts(
    walletAddress: string,
    minAccountsToClose: number = 1
  ): Promise<AccountConfirmationResult> {
    const pollKey = `${walletAddress}-${minAccountsToClose}`
    
    
    const existingPoll = this.activeCloseablePolls.get(pollKey)
    if (existingPoll) {
      return existingPoll
    }

    
    const pollPromise = this.performCloseablePoll(walletAddress, minAccountsToClose)
    this.activeCloseablePolls.set(pollKey, pollPromise)
    
    
    pollPromise.finally(() => {
      this.activeCloseablePolls.delete(pollKey)
    })
    
    return pollPromise
  }

    private async performCloseablePoll(
    walletAddress: string,
    minAccountsToClose: number = 1
  ): Promise<AccountConfirmationResult> {
    const startTime = Date.now();
    const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!);
    
    
    
    const checkCloseableAccounts = async (): Promise<AccountConfirmationResult> => {
      const elapsed = Date.now() - startTime;
      
      
      if (elapsed > this.maxPollTime) {
        return {
          confirmed: false,
          error: 'Polling timeout - max poll time exceeded'
        };
      }
      
      try {
        
        const walletPubkey = new PublicKey(walletAddress);
        const tokenAccounts = await connection.getTokenAccountsByOwner(
          walletPubkey,
          { programId: TOKEN_PROGRAM_ID }
        );

        const closeableAccounts: CloseableAccount[] = [];
        
        for (const account of tokenAccounts.value) {
          try {
            const balance = await connection.getTokenAccountBalance(account.pubkey);
            
            if (balance.value.uiAmount === 0) {
              
              const accountData = account.account.data;
              const mintBytes = accountData.slice(0, 32);
              const mintAddress = new PublicKey(mintBytes).toString();
              
              closeableAccounts.push({
                tokenAccount: account.pubkey.toString(),
                mint: mintAddress,
                balance: 0
              });
            }
          } catch (balanceError) {
            console.warn('[TokenConfirmation] Failed to check balance for account:', account.pubkey.toString());
            continue;
          }
        }
        
        
        if (closeableAccounts.length >= minAccountsToClose) {
          return {
            confirmed: true,
            closeableAccounts,
            pollingDuration: elapsed
          };
        }
        
      } catch (error) {
        console.error('[TokenConfirmation] Error checking closeable accounts:', error);
      }
      
      
      await new Promise(resolve => setTimeout(resolve, this.pollInterval));
      return checkCloseableAccounts();
    };
    
    return checkCloseableAccounts();
  }

    async pollForAccountClosure(
    walletAddress: string,
    accountsToClose: string[]
  ): Promise<AccountConfirmationResult> {
    const pollKey = `${walletAddress}-${accountsToClose.join(',')}`
    
    
    const existingPoll = this.activeClosurePolls.get(pollKey)
    if (existingPoll) {
      return existingPoll
    }

    
    const pollPromise = this.performClosurePoll(walletAddress, accountsToClose)
    this.activeClosurePolls.set(pollKey, pollPromise)
    
    
    pollPromise.finally(() => {
      this.activeClosurePolls.delete(pollKey)
    })
    
    return pollPromise
  }

    private async performClosurePoll(
    walletAddress: string,
    accountsToClose: string[]
  ): Promise<AccountConfirmationResult> {
    const startTime = Date.now();
    const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!);
    
    
    console.log('[TokenConfirmation] 🔍 Starting account closure monitoring:', {
      walletAddress: walletAddress.slice(-8),
      accountCount: accountsToClose.length,
      accounts: accountsToClose.map(addr => addr.slice(-8))
    })
    
    
    const checkAccountsClosed = async (): Promise<AccountConfirmationResult> => {
      const elapsed = Date.now() - startTime;
      
      
      if (elapsed > this.maxPollTime) {
        return {
          confirmed: false,
          error: 'Confirmation timeout - max poll time exceeded'
        };
      }
      
      
      
      try {
        
        const walletPubkey = new PublicKey(walletAddress);

        
        const currentAccounts = await connection.getTokenAccountsByOwner(
          walletPubkey,
          { programId: TOKEN_PROGRAM_ID }
        );
        

        
        
        const currentAccountPubkeys = currentAccounts.value.map(acc => acc.pubkey.toString());
        const stillExisting = accountsToClose.filter(accountPubkey => 
          currentAccountPubkeys.includes(accountPubkey)
        );
        
        const closedAccounts = accountsToClose.filter(accountPubkey => 
          !currentAccountPubkeys.includes(accountPubkey)
        );
        

        
        
        if (closedAccounts.length === accountsToClose.length) {
          console.log('[TokenConfirmation] ✅ Account closure confirmed!', {
            closedCount: closedAccounts.length,
            duration: `${(elapsed / 1000).toFixed(1)}s`
          })
          
          return {
            confirmed: true,
            closedAccounts,
            pollingDuration: elapsed
          };
        }
        
        
        if (closedAccounts.length > 0) {
        }
        
      } catch (error) {

      }
      
      
      await new Promise(resolve => setTimeout(resolve, this.pollInterval));
      return checkAccountsClosed();
    };
    
    return checkAccountsClosed();
  }
}


export const tokenConfirmationService = new TokenConfirmationService();