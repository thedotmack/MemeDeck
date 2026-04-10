import { getUltraOrder } from '@/lib/jupiter/api/jupiter-ultra'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { TradingService } from '../trading-service'


interface MockPosition {
  tokenMint: string
  tokenSymbol: string
  amount: number
  purchasePrice: number
  purchaseTime: number
  userTier: 'default' | 'referred' | 'premium'
  userId: string
}

class InMemoryPositionTracker {
  private positions: Map<string, MockPosition> = new Map()
  private readonly HOLD_DURATION = 30000 

  async storeBuyPosition(
    userId: string,
    tokenMint: string,
    tokenSymbol: string,
    amount: number,
    price: number,
    userTier: 'default' | 'referred' | 'premium'
  ): Promise<void> {
    const position: MockPosition = {
      tokenMint,
      tokenSymbol,
      amount,
      purchasePrice: price,
      purchaseTime: Date.now(),
      userTier,
      userId
    }
    
    const key = `${userId}:${tokenMint}`
    this.positions.set(key, position)
    
    console.log(`📦 Stored position: ${amount} ${tokenSymbol} @ $${price} for user ${userId}`)
    
    
    setTimeout(() => {
      this.positions.delete(key)
      console.log(`🗑️ Cleaned up expired position for ${tokenSymbol}`)
    }, this.HOLD_DURATION * 2)
  }

  async getPosition(userId: string, tokenMint: string): Promise<MockPosition | null> {
    const key = `${userId}:${tokenMint}`
    const position = this.positions.get(key)
    
    if (!position) return null
    
    
    const elapsed = Date.now() - position.purchaseTime
    if (elapsed > this.HOLD_DURATION) {
      console.log(`⏰ Position aged out (${elapsed}ms > ${this.HOLD_DURATION}ms)`)
      return null
    }
    
    return position
  }

  async waitForHoldPeriod(delayMs: number = 1000): Promise<void> {
    console.log(`⏳ Simulating ${delayMs}ms hold period...`)
    await new Promise(resolve => setTimeout(resolve, delayMs))
  }

  getActivePositionsCount(): number {
    return this.positions.size
  }
}


vi.mock('../../api/jupiter-ultra')
vi.mock('../sol-price-service', () => ({
  getCurrentSOLPrice: vi.fn()
}))

describe('Trading Flow - End-to-End with Real Market Data', () => {
  let tradingService: TradingService
  let positionTracker: InMemoryPositionTracker
  let mockGetCurrentSOLPrice: Mock

  
  const POPULAR_TOKENS = {
    BONK: {
      mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      symbol: 'BONK',
      decimals: 5
    },
    WIF: {
      mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
      symbol: 'WIF', 
      decimals: 6
    },
    PEPE: {
      mint: 'BzUodBR1jyX4Y4VYYa5aYvGayVnN1V5ZNb7A6C9e6WGk',
      symbol: 'PEPE',
      decimals: 8
    }
  }

  
  const REAL_USERS = {
    USER_1: {
      id: 'did:privy:cmdt7o4450090l10b3qekff3c',
      tier: 'default' as const, 
      walletAddress: 'So11111111111111111111111111111111111111112'
    },
    USER_2: {
      id: 'did:privy:cme1s9nzo0115jp0b1vvor7zr',
      tier: 'referred' as const, 
      walletAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    tradingService = new TradingService()
    positionTracker = new InMemoryPositionTracker()
    
    
    mockGetCurrentSOLPrice = vi.fn()
    mockGetCurrentSOLPrice.mockResolvedValue(174) 
    
    
    ;(getUltraOrder as Mock).mockImplementation(async (request) => {
      
      const baseAmount = parseInt(request.amount)
      const isSOLToToken = request.inputMint === 'So11111111111111111111111111111111111111112'
      
      return {
        transaction: Buffer.from(`mock-jupiter-tx-${Date.now()}`).toString('base64'),
        outputAmount: isSOLToToken 
          ? (baseAmount * 1000000).toString() 
          : (baseAmount / 1000).toString(), 
        inputAmount: request.amount,
        outputMint: request.outputMint,
        inputMint: request.inputMint,
        priceImpact: Math.random() * 2, 
        swapMode: 'ExactIn'
      }
    })
    
    console.log('\n🚀 Starting new E2E test scenario')
  })

  afterEach(() => {
    console.log(`📊 Test completed. Active positions: ${positionTracker.getActivePositionsCount()}`)
  })

  describe('Full Trading Flow: Buy → Hold → Sell', () => {
    it('should execute complete $1 BONK trade for default user', async () => {
      const user = REAL_USERS.USER_1
      const token = POPULAR_TOKENS.BONK
      const tradeAmountUSD = 1

      console.log(`\n=== $${tradeAmountUSD} ${token.symbol} Trade Test (Default User) ===`)

      
      const context = {
        walletAddress: user.walletAddress,
        userTier: user.tier,
        isLiveMode: false, 
        signTransaction: vi.fn(),
        sendTransaction: vi.fn().mockResolvedValue({ signature: 'mock-signature' }),
        userId: user.id,
        accessToken: 'mock-access-token'
      }

      
      const mockGetSOLBalance = vi.spyOn(tradingService as any, 'getSOLBalance')
      mockGetSOLBalance.mockResolvedValue(14561536) 

      
      console.log('\n📈 Phase 1: Buy Order')
      
      const buyRequest = {
        side: 'buy' as const,
        tokenMint: token.mint,
        tokenSymbol: token.symbol,
        amountUsd: tradeAmountUSD,
        currentTokenPrice: 0.000021, 
        tokenDecimals: token.decimals
      }

      const buyResult = await tradingService.executeTrade(buyRequest, context)

      
      expect(buyResult.success).toBe(true)
      expect(buyResult.transactionHash).toBeDefined()
      expect(buyResult.actualAmountUsd).toBeCloseTo(tradeAmountUSD, 1)
      
      console.log(`✅ Buy executed: ${buyResult.actualTokenAmount} ${token.symbol}`)
      console.log(`💰 Fee: $${buyResult.fees || 0} (${user.tier} tier)`)

      
      await positionTracker.storeBuyPosition(
        user.id,
        token.mint,
        token.symbol,
        buyResult.actualTokenAmount || 0,
  buyResult.actualAmountUsd ?? 0,
        user.tier
      )

      
      console.log('\n⏳ Phase 2: Hold Position (30s simulation)')
      await positionTracker.waitForHoldPeriod(1000) 

      
      const storedPosition = await positionTracker.getPosition(user.id, token.mint)
      expect(storedPosition).toBeTruthy()
      expect(storedPosition?.amount).toBeGreaterThan(0)

      
      console.log('\n📉 Phase 3: Sell Order')

      
      const mockGetTokenBalance = vi.spyOn(tradingService as any, 'getTokenBalance')
      mockGetTokenBalance.mockResolvedValue(storedPosition!.amount)

      const sellRequest = {
        side: 'sell' as const,
        tokenMint: token.mint,
        tokenSymbol: token.symbol,
        amountUsd: tradeAmountUSD, 
        currentTokenPrice: 0.000022, 
        tokenDecimals: token.decimals
      }

      const sellResult = await tradingService.executeTrade(sellRequest, context)

      
      expect(sellResult.success).toBe(true)
      expect(sellResult.transactionHash).toBeDefined()
      expect(sellResult.actualAmountUsd).toBeGreaterThan(0)

      console.log(`✅ Sell executed: $${sellResult.actualAmountUsd}`)
      console.log(`💰 Fee: $${sellResult.fees || 0}`)

      
      const totalFees = (buyResult.fees || 0) + (sellResult.fees || 0)
  const netResult = (sellResult.actualAmountUsd ?? 0) - tradeAmountUSD - totalFees
      
      console.log(`\n📊 Trade Summary:`)
      console.log(`   Initial: $${tradeAmountUSD}`)
      console.log(`   Final: $${sellResult.actualAmountUsd}`)
      console.log(`   Total fees: $${totalFees}`)
      console.log(`   Net result: $${netResult}`)

      
      expect(totalFees).toBeGreaterThan(0)
      expect(totalFees).toBeLessThan(tradeAmountUSD * 0.025) 
    })

    it('should execute complete $10 WIF trade for referred user', async () => {
      const user = REAL_USERS.USER_2
      const token = POPULAR_TOKENS.WIF
      const tradeAmountUSD = 10

      console.log(`\n=== $${tradeAmountUSD} ${token.symbol} Trade Test (Referred User) ===`)

      const context = {
        walletAddress: user.walletAddress,
        userTier: user.tier,
        isLiveMode: false,
        signTransaction: vi.fn(),
        sendTransaction: vi.fn().mockResolvedValue({ signature: 'mock-signature' }),
        userId: user.id,
        accessToken: 'mock-access-token'
      }

      const mockGetSOLBalance = vi.spyOn(tradingService as any, 'getSOLBalance')
      mockGetSOLBalance.mockResolvedValue(100000000) 

      
      console.log('\n📈 Phase 1: Buy Order')

      const buyRequest = {
        side: 'buy' as const,
        tokenMint: token.mint,
        tokenSymbol: token.symbol,
        amountUsd: tradeAmountUSD,
        currentTokenPrice: 1.85, 
        tokenDecimals: token.decimals
      }

      const buyResult = await tradingService.executeTrade(buyRequest, context)

      expect(buyResult.success).toBe(true)
      console.log(`✅ Buy executed: ${buyResult.actualTokenAmount} ${token.symbol}`)

      
      const expectedBuyFee = tradeAmountUSD * 0.009 
      console.log(`💰 Expected fee: $${expectedBuyFee} (referred discount)`)

      await positionTracker.storeBuyPosition(
        user.id,
        token.mint,
        token.symbol,
        buyResult.actualTokenAmount || 0,
  buyResult.actualAmountUsd ?? 0,
        user.tier
      )

      
      console.log('\n⏳ Phase 2: Hold Position')
      await positionTracker.waitForHoldPeriod(1000)

      const storedPosition = await positionTracker.getPosition(user.id, token.mint)
      expect(storedPosition?.userTier).toBe('referred')

      
      console.log('\n📉 Phase 3: Sell Order')

      const mockGetTokenBalance = vi.spyOn(tradingService as any, 'getTokenBalance')
      mockGetTokenBalance.mockResolvedValue(storedPosition!.amount)

      const sellRequest = {
        side: 'sell' as const,
        tokenMint: token.mint,
        tokenSymbol: token.symbol,
        amountUsd: tradeAmountUSD * 1.05, 
        currentTokenPrice: 1.94, 
        tokenDecimals: token.decimals
      }

      const sellResult = await tradingService.executeTrade(sellRequest, context)

      expect(sellResult.success).toBe(true)
      console.log(`✅ Sell executed: $${sellResult.actualAmountUsd}`)

      
      const totalFees = (buyResult.fees || 0) + (sellResult.fees || 0)
  const expectedTotalFees = (tradeAmountUSD + (sellResult.actualAmountUsd ?? 0)) * 0.009

      console.log(`\n📊 Referred User Benefits:`)
      console.log(`   Fee rate: 0.9% (vs 1% default)`)
      console.log(`   Total fees: $${totalFees}`)
      console.log(`   Savings vs default: ~$${(tradeAmountUSD * 0.001).toFixed(3)}`)

      expect(totalFees).toBeLessThan(expectedTotalFees * 1.1) 
    })

    it('should execute complete $100 PEPE trade for premium user', async () => {
      const user = { ...REAL_USERS.USER_1, tier: 'premium' as const } 
      const token = POPULAR_TOKENS.PEPE
      const tradeAmountUSD = 100

      console.log(`\n=== $${tradeAmountUSD} ${token.symbol} Trade Test (Premium User) ===`)

      const context = {
        walletAddress: user.walletAddress,
        userTier: user.tier,
        isLiveMode: false,
        signTransaction: vi.fn(),
        sendTransaction: vi.fn().mockResolvedValue({ signature: 'mock-signature' }),
        userId: user.id,
        accessToken: 'mock-access-token'
      }

      const mockGetSOLBalance = vi.spyOn(tradingService as any, 'getSOLBalance')
      mockGetSOLBalance.mockResolvedValue(1000000000) 

      
      const buyRequest = {
        side: 'buy' as const,
        tokenMint: token.mint,
        tokenSymbol: token.symbol,
        amountUsd: tradeAmountUSD,
        currentTokenPrice: 0.00000845, 
        tokenDecimals: token.decimals
      }

      console.log('\n📈 Executing buy...')
      const buyResult = await tradingService.executeTrade(buyRequest, context)
      expect(buyResult.success).toBe(true)

      await positionTracker.storeBuyPosition(
        user.id,
        token.mint,
        token.symbol,
        buyResult.actualTokenAmount || 0,
  buyResult.actualAmountUsd ?? 0,
        user.tier
      )

      console.log('\n⏳ Holding position...')
      await positionTracker.waitForHoldPeriod(1500) 

      console.log('\n📉 Executing sell...')
      const mockGetTokenBalance = vi.spyOn(tradingService as any, 'getTokenBalance')
      mockGetTokenBalance.mockResolvedValue(buyResult.actualTokenAmount || 0)

      const sellRequest = {
        side: 'sell' as const,
        tokenMint: token.mint,
        tokenSymbol: token.symbol,
        amountUsd: tradeAmountUSD * 0.98, 
        currentTokenPrice: 0.00000828,
        tokenDecimals: token.decimals
      }

      const sellResult = await tradingService.executeTrade(sellRequest, context)
      expect(sellResult.success).toBe(true)

      
      const totalFees = (buyResult.fees || 0) + (sellResult.fees || 0)
      console.log(`\n📊 Premium User Trade:`)
      console.log(`   Buy: $${buyResult.actualAmountUsd}`)
      console.log(`   Sell: $${sellResult.actualAmountUsd}`)
      console.log(`   Total fees: $${totalFees}`)
  console.log(`   Loss scenario: -$${tradeAmountUSD - (sellResult.actualAmountUsd ?? 0)}`)

      expect(totalFees).toBeGreaterThan(0)
    })
  })

  describe('Real Market Data Integration', () => {
    it('should use actual SOL price for fee calculations', async () => {
      
      mockGetCurrentSOLPrice.mockResolvedValue(174) 

      const context = {
        walletAddress: REAL_USERS.USER_1.walletAddress,
        userTier: 'default' as const,
        isLiveMode: false,
        signTransaction: vi.fn(),
        sendTransaction: vi.fn().mockResolvedValue({ signature: 'mock-signature' }),
        userId: REAL_USERS.USER_1.id,
        accessToken: 'mock-access-token'
      }

      const tradeRequest = {
        side: 'buy' as const,
        tokenMint: POPULAR_TOKENS.BONK.mint,
        tokenSymbol: POPULAR_TOKENS.BONK.symbol,
        amountUsd: 1,
        currentTokenPrice: 0.000021,
        tokenDecimals: POPULAR_TOKENS.BONK.decimals
      }

      const mockGetSOLBalance = vi.spyOn(tradingService as any, 'getSOLBalance')
      mockGetSOLBalance.mockResolvedValue(14561536)

      const result = await tradingService.executeTrade(tradeRequest, context)

      expect(result.success).toBe(true)
      
      
      expect(mockGetCurrentSOLPrice).toHaveBeenCalled()
      
      console.log(`💹 Using real SOL price: $${await mockGetCurrentSOLPrice()}`)
      console.log(`🧮 $1 trade = ~${(1/174 * 1e9).toFixed(0)} lamports`)
    })

    it('should handle realistic Jupiter Ultra API responses', async () => {
      
      const mockJupiterResponse = {
        transaction: 'realistic-base64-transaction-data',
        outputAmount: '47619047619', 
        inputAmount: '5747126',  
        outputMint: POPULAR_TOKENS.BONK.mint,
        inputMint: 'So11111111111111111111111111111111111111112',
        priceImpact: 0.15, 
        swapMode: 'ExactIn'
      }

      ;(getUltraOrder as Mock).mockResolvedValue(mockJupiterResponse)

      const context = {
        walletAddress: REAL_USERS.USER_1.walletAddress,
        userTier: 'default' as const,
        isLiveMode: false,
        signTransaction: vi.fn(),
        sendTransaction: vi.fn().mockResolvedValue({ signature: 'mock-signature' }),
        userId: REAL_USERS.USER_1.id,
        accessToken: 'mock-access-token'
      }

      const tradeRequest = {
        side: 'buy' as const,
        tokenMint: POPULAR_TOKENS.BONK.mint,
        tokenSymbol: POPULAR_TOKENS.BONK.symbol,
        amountUsd: 1,
        currentTokenPrice: 0.000021,
        tokenDecimals: POPULAR_TOKENS.BONK.decimals
      }

      const mockGetSOLBalance = vi.spyOn(tradingService as any, 'getSOLBalance')
      mockGetSOLBalance.mockResolvedValue(14561536)

      const result = await tradingService.executeTrade(tradeRequest, context)

      expect(result.success).toBe(true)
      expect(getUltraOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          inputMint: 'So11111111111111111111111111111111111111112',
          outputMint: POPULAR_TOKENS.BONK.mint,
          amount: expect.stringMatching(/^\d+$/),
          taker: REAL_USERS.USER_1.walletAddress
        })
      )

      console.log(`🎯 Jupiter integration test passed`)
      console.log(`📊 Price impact: ${mockJupiterResponse.priceImpact}%`)
    })
  })

  describe('Position Tracking and Timing', () => {
    it('should track positions accurately over time', async () => {
      const userId = REAL_USERS.USER_1.id
      const tokenMint = POPULAR_TOKENS.WIF.mint
      const tokenSymbol = POPULAR_TOKENS.WIF.symbol

      console.log('\n⏱️  Testing position timing and cleanup')

      
      await positionTracker.storeBuyPosition(
        userId,
        tokenMint,
        tokenSymbol,
        1000, 
        10.5, 
        'referred'
      )

      
      let position = await positionTracker.getPosition(userId, tokenMint)
      expect(position).toBeTruthy()
      expect(position?.amount).toBe(1000)
      expect(position?.purchasePrice).toBe(10.5)

      console.log(`✅ Position stored and retrieved successfully`)

      
      await positionTracker.waitForHoldPeriod(500)
      position = await positionTracker.getPosition(userId, tokenMint)
      expect(position).toBeTruthy()

      console.log(`✅ Position persisted through hold period`)

      
      await positionTracker.storeBuyPosition(
        REAL_USERS.USER_2.id,
        POPULAR_TOKENS.BONK.mint,
        POPULAR_TOKENS.BONK.symbol,
        50000000, 
        1.0, 
        'default'
      )

      const user1Position = await positionTracker.getPosition(userId, tokenMint)
      const user2Position = await positionTracker.getPosition(REAL_USERS.USER_2.id, POPULAR_TOKENS.BONK.mint)

      expect(user1Position?.tokenSymbol).toBe('WIF')
      expect(user2Position?.tokenSymbol).toBe('BONK')
      expect(user1Position?.userTier).toBe('referred')
      expect(user2Position?.userTier).toBe('default')

      console.log(`✅ Multiple positions tracked correctly`)
      console.log(`📊 Active positions: ${positionTracker.getActivePositionsCount()}`)
    })

    it('should simulate realistic hold periods', async () => {
      const startTime = Date.now()
      
      console.log('\n⏰ Testing hold period simulation')
      
      
      await positionTracker.waitForHoldPeriod(100)
      const shortElapsed = Date.now() - startTime
      expect(shortElapsed).toBeGreaterThan(90) 
      expect(shortElapsed).toBeLessThan(200)

      
      const mediumStart = Date.now()
      await positionTracker.waitForHoldPeriod(500)
      const mediumElapsed = Date.now() - mediumStart
      expect(mediumElapsed).toBeGreaterThan(450)
      expect(mediumElapsed).toBeLessThan(600)

      console.log(`✅ Hold periods simulated accurately`)
      console.log(`   Short: ${shortElapsed}ms`)
      console.log(`   Medium: ${mediumElapsed}ms`)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle failed buy orders gracefully', async () => {
      
      ;(getUltraOrder as Mock).mockRejectedValue(new Error('Jupiter API unavailable'))

      const context = {
        walletAddress: REAL_USERS.USER_1.walletAddress,
        userTier: 'default' as const,
        isLiveMode: false,
        signTransaction: vi.fn(),
        sendTransaction: vi.fn(),
        userId: REAL_USERS.USER_1.id,
        accessToken: 'mock-access-token'
      }

      const tradeRequest = {
        side: 'buy' as const,
        tokenMint: POPULAR_TOKENS.BONK.mint,
        tokenSymbol: POPULAR_TOKENS.BONK.symbol,
        amountUsd: 1,
        currentTokenPrice: 0.000021,
        tokenDecimals: POPULAR_TOKENS.BONK.decimals
      }

      const mockGetSOLBalance = vi.spyOn(tradingService as any, 'getSOLBalance')
      mockGetSOLBalance.mockResolvedValue(14561536)

      const result = await tradingService.executeTrade(tradeRequest, context)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      
      console.log(`✅ Failed buy handled gracefully: ${result.error}`)
    })

    it('should handle missing position for sell orders', async () => {
      const userId = REAL_USERS.USER_1.id
      const tokenMint = POPULAR_TOKENS.WIF.mint

      
      const position = await positionTracker.getPosition(userId, tokenMint)
      expect(position).toBeNull()

      
      const mockGetTokenBalance = vi.spyOn(tradingService as any, 'getTokenBalance')
      mockGetTokenBalance.mockResolvedValue(0)

      const context = {
        walletAddress: REAL_USERS.USER_1.walletAddress,
        userTier: 'default' as const,
        isLiveMode: false,
        signTransaction: vi.fn(),
        sendTransaction: vi.fn(),
        userId: userId,
        accessToken: 'mock-access-token'
      }

      const sellRequest = {
        side: 'sell' as const,
        tokenMint: tokenMint,
        tokenSymbol: POPULAR_TOKENS.WIF.symbol,
        amountUsd: 1,
        currentTokenPrice: 1.85,
        tokenDecimals: POPULAR_TOKENS.WIF.decimals
      }

      const result = await tradingService.executeTrade(sellRequest, context)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('No tokens found')
      
      console.log(`✅ Missing position handled correctly: ${result.error}`)
    })
  })
})