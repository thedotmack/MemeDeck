import { ULTRA_API_BASE_URL, USDC_MINT } from '@/lib/config/trading-constants'
import { getSolPrice } from '@/lib/services/sol-price-service'
import { isBalancesMap } from '@/lib/types/guards'
import { address } from '@solana/kit'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import BN from 'bn.js'
import { getRpc, type SolanaRpc } from './solana-rpc'
import { tokenMetadataService } from './token-metadata'

interface WalletBalances {
  sol: number
  tokens: Record<string, number> 
}

interface TokenBalance {
  mint: string
  amount: number
  decimals: number
  uiAmount: number
}

interface TokenPosition {
  tokenId: string
  name: string
  symbol: string
  amount: number
  price: number
  usdValue: number
  icon?: string
}

class WalletBalanceService {
  private rpc: SolanaRpc
  private cache: Map<string, { data: WalletBalances; timestamp: number }>
  private readonly CACHE_DURATION = 5000 

  constructor() {
    this.rpc = getRpc()
    this.cache = new Map()
  }

    async getBalances(walletAddress: string): Promise<WalletBalances> {
    const cacheKey = `balances_${walletAddress}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }

    try {
      const [solBalance, tokenBalances] = await Promise.all([
        this.getSolBalance(walletAddress),
        this.getTokenBalances(walletAddress)
      ])

      const balances: WalletBalances = {
        sol: solBalance,
        tokens: tokenBalances
      }

      
      this.cache.set(cacheKey, {
        data: balances,
        timestamp: Date.now()
      })

      return balances
    } catch (error) {
      console.error('[WalletBalanceService] Failed to get balances:', error)
      throw new Error(`Failed to fetch wallet balances: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

    async getSolBalance(walletAddress: string): Promise<number> {
    try {
      const walletAddr = address(walletAddress)
      const result = await this.rpc.getBalance(walletAddr, { commitment: 'confirmed' }).send()
      return Number(result.value) / 1_000_000_000
    } catch (error) {
      console.error('[WalletBalanceService] Failed to get SOL balance:', error)
      throw new Error(`Failed to fetch SOL balance: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

    async getUsdcBalance(walletAddress: string): Promise<number> {
    try {
      console.log('[WalletBalanceService] Getting USDC balance from Jupiter Ultra API for:', walletAddress);
      
      
      const balancesResponse = await fetch(`${ULTRA_API_BASE_URL}/balances/${walletAddress}`)
      
      if (!balancesResponse.ok) {
        const errorText = await balancesResponse.text()
        console.error('[WalletBalanceService] Jupiter API error for USDC:', balancesResponse.status, errorText)
        throw new Error(`Jupiter API returned ${balancesResponse.status}`)
      }
      
  const balances = await balancesResponse.json()
  console.log('[WalletBalanceService] Jupiter balances for USDC:', JSON.stringify(balances, null, 2))
  if (!isBalancesMap(balances)) throw new Error('Unexpected balances response shape')
      
      
      const usdcBalance = balances[USDC_MINT]?.uiAmount || 0
      
      console.log('[WalletBalanceService] USDC balance result:', usdcBalance);
      return usdcBalance;
      
    } catch (error) {
      console.error('[WalletBalanceService] Failed to get USDC balance from Jupiter:', error);
      
      console.log('[WalletBalanceService] Falling back to RPC method for USDC balance');
      const balance = await this.getTokenBalance(walletAddress, USDC_MINT);
      return balance;
    }
  }

    async getTokenBalance(walletAddress: string, tokenMint: string): Promise<number> {
    try {
      const walletAddr = address(walletAddress)
      const mintAddr = address(tokenMint)

      
      const tokenAccounts = await this.rpc.getTokenAccountsByOwner(
        walletAddr,
        { mint: mintAddr },
        { commitment: 'confirmed', encoding: 'jsonParsed' }
      ).send()

      if (tokenAccounts.value.length === 0) {
        return 0
      }

      
      
      let totalBalance = 0
      for (const tokenAccount of tokenAccounts.value) {
        const accountData = tokenAccount.account.data.parsed.info
        totalBalance += accountData.tokenAmount.uiAmount || 0
      }

      return totalBalance
    } catch (error) {
      console.error('[WalletBalanceService] Failed to get token balance:', error)
      return 0 
    }
  }

    async getTokenBalanceRaw(walletAddress: string, tokenMint: string): Promise<BN> {
    try {
      const walletAddr = address(walletAddress)
      const mintAddr = address(tokenMint)

      
      const tokenAccounts = await this.rpc.getTokenAccountsByOwner(
        walletAddr,
        { mint: mintAddr },
        { commitment: 'confirmed', encoding: 'jsonParsed' }
      ).send()

      if (tokenAccounts.value.length === 0) {
        return new BN(0)
      }

      
      
      let totalBalance = new BN(0)
      for (const tokenAccount of tokenAccounts.value) {
        const accountData = tokenAccount.account.data.parsed.info
        const rawAmount = accountData.tokenAmount.amount
        if (typeof rawAmount === 'string') {
          totalBalance = totalBalance.add(new BN(rawAmount))
        } else if (rawAmount !== undefined && rawAmount !== null) {
          totalBalance = totalBalance.add(new BN(String(rawAmount)))
        }
      }

      return totalBalance
    } catch (error) {
      console.error('[WalletBalanceService] Failed to get raw token balance:', error)
      return new BN(0) 
    }
  }

    private async getTokenBalances(walletAddress: string): Promise<Record<string, number>> {
    try {
      const walletAddr = address(walletAddress)

      
      const tokenAccounts = await this.rpc.getTokenAccountsByOwner(
        walletAddr,
        { programId: address(TOKEN_PROGRAM_ID.toString()) },
        { commitment: 'confirmed', encoding: 'jsonParsed' }
      ).send()

      const tokenBalances: Record<string, number> = {}

      for (const tokenAccount of tokenAccounts.value) {
        const accountData = tokenAccount.account.data.parsed.info
        const mint = accountData.mint
        const balance = accountData.tokenAmount.uiAmount || 0

        
        if (balance > 0) {
          tokenBalances[mint] = balance
        }
      }

      return tokenBalances
    } catch (error) {
      console.error('[WalletBalanceService] Failed to get token balances:', error)
      return {}
    }
  }

    async hasSufficientSol(walletAddress: string, requiredAmount: number): Promise<boolean> {
    try {
      const solBalance = await this.getSolBalance(walletAddress)
      return solBalance >= requiredAmount
    } catch (error) {
      console.error('[WalletBalanceService] Failed to check SOL sufficiency:', error)
      return false
    }
  }

    async hasSufficientToken(walletAddress: string, tokenMint: string, requiredAmount: number): Promise<boolean> {
    try {
      const tokenBalance = await this.getTokenBalance(walletAddress, tokenMint)
      return tokenBalance >= requiredAmount
    } catch (error) {
      console.error('[WalletBalanceService] Failed to check token sufficiency:', error)
      return false
    }
  }

    async estimateTransactionFee(): Promise<number> {
    try {
      
      const { value: latestBlockhash } = await this.rpc.getLatestBlockhash({ commitment: 'confirmed' }).send()
      
      
      return 0.00025 
    } catch (error) {
      console.error('[WalletBalanceService] Failed to estimate transaction fee:', error)
      return 0.00025 
    }
  }

    clearCache(walletAddress?: string): void {
    if (walletAddress) {
      this.cache.delete(`balances_${walletAddress}`)
    } else {
      this.cache.clear()
    }
  }

    isValidWalletAddress(addr: string): boolean {
    try {
      address(addr)
      return true
    } catch {
      return false
    }
  }

    async getTokenPositions(walletAddress: string): Promise<TokenPosition[]> {
    try {
      console.log('[WalletBalanceService] Fetching positions from Jupiter Ultra API for:', walletAddress)
      
      
      const balancesResponse = await fetch(`${ULTRA_API_BASE_URL}/balances/${walletAddress}`)
      
      if (!balancesResponse.ok) {
        const errorText = await balancesResponse.text()
        console.error('[WalletBalanceService] Jupiter API error:', balancesResponse.status, errorText)
        throw new Error(`Jupiter API returned ${balancesResponse.status}`)
      }
      
      const balances = await balancesResponse.json()
      console.log('[WalletBalanceService] Jupiter balances response:', JSON.stringify(balances, null, 2))
      
      const positions: TokenPosition[] = []
      
      
  for (const [tokenMint, balanceData] of Object.entries(balances)) {
        
        const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
        const SOL_MINT = 'So11111111111111111111111111111111111111112' 
        
        if (tokenMint === 'SOL' || tokenMint === USDC_MINT || tokenMint === SOL_MINT) {
          continue
        }
        
  const balance = (balanceData && typeof balanceData === 'object' && 'uiAmount' in balanceData
          ? Number((balanceData as { uiAmount?: unknown }).uiAmount) || 0
          : 0) || 0
        
        
        if (balance > 0) {
          try {
            
            const tokenData = await this.getTokenMetadata(tokenMint)
            
            if (tokenData && tokenData.price > 0) {
              const usdValue = balance * tokenData.price
              
              
              if (usdValue > 1) {
                positions.push({
                  tokenId: tokenMint,
                  name: tokenData.name || 'Unknown Token',
                  symbol: tokenData.symbol || 'Unknown',
                  amount: balance,
                  price: tokenData.price,
                  usdValue: usdValue,
                  icon: tokenData.icon
                })
              }
            }
          } catch (error) {
            console.warn(`[WalletBalanceService] Failed to get metadata for token ${tokenMint}:`, error)
            
          }
        }
      }
      
      
      positions.sort((a, b) => b.usdValue - a.usdValue)
      
      console.log(`[WalletBalanceService] Found ${positions.length} positions worth > $1`)
      
      return positions
    } catch (error) {
      console.error('[WalletBalanceService] Failed to get token positions from Jupiter:', error)
      
      
      console.log('[WalletBalanceService] Falling back to RPC method')
      return this.getTokenPositionsViaRPC(walletAddress)
    }
  }

    private async getTokenPositionsViaRPC(walletAddress: string): Promise<TokenPosition[]> {
    try {
      const walletAddr = address(walletAddress)

      
      const tokenAccounts = await this.rpc.getTokenAccountsByOwner(
        walletAddr,
        { programId: address(TOKEN_PROGRAM_ID.toString()) },
        { commitment: 'confirmed', encoding: 'jsonParsed' }
      ).send()

      const positions: TokenPosition[] = []

      for (const tokenAccount of tokenAccounts.value) {
        const accountData = tokenAccount.account.data.parsed.info
        const mint = accountData.mint
        const balance = accountData.tokenAmount.uiAmount || 0

        
        const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
        const SOL_MINT = 'So11111111111111111111111111111111111111112' 
        if (mint === USDC_MINT || mint === SOL_MINT) {
          continue
        }

        
        if (balance > 0) {
          try {
            
            const tokenData = await this.getTokenMetadata(mint)
            
            if (tokenData && tokenData.price > 0) {
              const usdValue = balance * tokenData.price
              
              
              if (usdValue > 1) {
                positions.push({
                  tokenId: mint,
                  name: tokenData.name || 'Unknown Token',
                  symbol: tokenData.symbol || 'Unknown',
                  amount: balance,
                  price: tokenData.price,
                  usdValue: usdValue,
                  icon: tokenData.icon
                })
              }
            }
          } catch (error) {
            console.warn(`[WalletBalanceService] Failed to get metadata for token ${mint}:`, error)
            
          }
        }
      }

      
      positions.sort((a, b) => b.usdValue - a.usdValue)

      return positions
    } catch (error) {
      console.error('[WalletBalanceService] Failed to get token positions via RPC:', error)
      return []
    }
  }

    private async getTokenMetadata(tokenMint: string): Promise<{ name: string; symbol: string; price: number; icon?: string } | null> {
    try {
      
      const metadata = await tokenMetadataService.getTokenMetadata(tokenMint)
      
      if (metadata) {
        return {
          name: metadata.name,
          symbol: metadata.symbol,
          price: metadata.price,
          icon: metadata.icon || undefined
        }
      }

      
      const jupiterResponse = await fetch(`https://api.jup.ag/price/v2?ids=${tokenMint}`)
      if (jupiterResponse.ok) {
        const jupiterData = await jupiterResponse.json()
        if (jupiterData[tokenMint]) {
          return {
            name: 'Unknown Token', 
            symbol: 'Unknown',  
            price: jupiterData[tokenMint].usdPrice || 0
          }
        }
      }

      return null
    } catch (error) {
      console.error(`[WalletBalanceService] Failed to get token metadata for ${tokenMint}:`, error)
      return null
    }
  }

    async getTradingBalance(walletAddress: string): Promise<number> {
    console.log('[WalletBalanceService] Getting SOL balance for trading')
    return await this.getSolBalance(walletAddress)
  }

    async getTradingBalanceUSD(walletAddress: string): Promise<number> {
    const solBalance = await this.getSolBalance(walletAddress)
    
    let solPrice: number
    try {
      solPrice = await getSolPrice()
    } catch (error) {
      console.warn('[WalletBalanceService] Failed to fetch SOL price:', error)
      return 0
    }
    
    const usdValue = solBalance * solPrice
    console.log(`[WalletBalanceService] SOL trading balance: ${solBalance} SOL = $${usdValue.toFixed(2)} USD`)
    return usdValue
  }

    getTradingCurrencySymbol(): string {
    return 'SOL'
  }

    async hasSufficientTradingBalance(walletAddress: string, requiredUsdAmount: number): Promise<boolean> {
    try {
      
      
    let solPrice: number
    try {
      solPrice = await getSolPrice()
      } catch (error) {
        console.warn('[WalletBalanceService] Cannot check SOL sufficiency - failed to fetch price:', error)
        return false
      }
      
      const requiredSol = requiredUsdAmount / solPrice
      const solBalance = await this.getSolBalance(walletAddress)
      
      
      const availableForTrading = Math.max(0, solBalance)
      
      console.log(`[WalletBalanceService] SOL sufficiency check: need ${requiredSol} SOL, have ${availableForTrading} SOL available`)
      return availableForTrading >= requiredSol
    } catch (error) {
      console.error('[WalletBalanceService] Failed to check trading balance sufficiency:', error)
      return false
    }
  }

    async getConnectionHealth(): Promise<{ healthy: boolean; latency?: number }> {
    try {
      const start = Date.now()
      await this.rpc.getSlot({ commitment: 'confirmed' }).send()
      const latency = Date.now() - start
      
      return {
        healthy: true,
        latency
      }
    } catch (error) {
      console.error('[WalletBalanceService] Connection health check failed:', error)
      return {
        healthy: false
      }
    }
  }
}


export const walletBalanceService = new WalletBalanceService()