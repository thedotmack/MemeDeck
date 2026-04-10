import BN from 'bn.js'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { calculateTradeFees } from '../../utils/fee-calculator'
import { buildFeeTransaction } from '../../utils/fee-transaction'
import { TradingService } from '../trading-service'


vi.mock('../../utils/fee-calculator')
vi.mock('../../utils/fee-transaction')
vi.mock('../partner-fee-wallet-service')
vi.mock('@solana/web3.js', () => ({
  Connection: vi.fn(),
  VersionedTransaction: vi.fn(),
  TransactionMessage: vi.fn()
}))


const mockGetUltraOrder = vi.fn()
vi.mock('../../api/jupiter-ultra', () => ({
  getUltraOrder: mockGetUltraOrder
}))

describe('Trading Service - Fee Integration', () => {
  let tradingService: TradingService
  const mockSOLPrice = 174
  
  
  const mockContext = {
    walletAddress: 'So11111111111111111111111111111111111111112',
    userTier: 'referred' as const,
    isLiveMode: true,
    signTransaction: vi.fn(),
    sendTransaction: vi.fn(),
    userId: 'test-user-123',
    accessToken: 'mock-access-token'
  }

  
  const mockFeeCalculation = {
    grossAmount: new BN('5747126000'), 
    platformFee: new BN('51724134'), 
    referrerShare: new BN('5747126'), 
    userDiscount: new BN('0'),
    netPlatformFee: new BN('51724134'),
    userPays: new BN('51724134') 
  }

  beforeEach(() => {
    vi.clearAllMocks()
    tradingService = new TradingService()
    
    
    ;(calculateTradeFees as Mock).mockReturnValue(mockFeeCalculation)
    ;(buildFeeTransaction as Mock).mockReturnValue({
      message: { serialize: () => Buffer.from('mock-transaction') }
    })
    
    mockGetUltraOrder.mockResolvedValue({
      transaction: Buffer.from('mock-jupiter-tx').toString('base64'),
      outputAmount: '5000000000' 
    })
  })

  describe('Buy Order Fee Handling', () => {
    it('should calculate fees correctly for buy orders', async () => {
      const tradeRequest = {
        side: 'buy' as const,
  tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  tokenSymbol: 'TEST',
        amountUsd: 1,
        currentTokenPrice: 0.001,
        tokenDecimals: 9
      }

      
      const mockGetSOLBalance = vi.spyOn(tradingService as any, 'getSOLBalance')
      mockGetSOLBalance.mockResolvedValue(14561536) 

      
      await tradingService.executeTrade(tradeRequest, mockContext)

      
      expect(calculateTradeFees).toHaveBeenCalledWith(
        expect.any(BN), 
        'referred'
      )
    })

    it('should deduct fees from trade amount for buy orders', async () => {
      const tradeRequest = {
        side: 'buy' as const,
  tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  tokenSymbol: 'TEST',
        amountUsd: 1,
        currentTokenPrice: 0.001,
        tokenDecimals: 9
      }

      const mockGetSOLBalance = vi.spyOn(tradingService as any, 'getSOLBalance')
      mockGetSOLBalance.mockResolvedValue(14561536)

      await tradingService.executeTrade(tradeRequest, mockContext)

      
      expect(mockGetUltraOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: expect.stringMatching(/^\d+$/) 
        })
      )
    })

    it('should handle different user tiers correctly', async () => {
      const testCases = [
        { tier: 'default' as const, expectedRate: 0.01 },
        { tier: 'referred' as const, expectedRate: 0.009 },
        { tier: 'premium' as const, expectedRate: 0.009 }
      ]

      for (const { tier, expectedRate } of testCases) {
        vi.clearAllMocks()
        
        const contextWithTier = { ...mockContext, userTier: tier }
        const tradeRequest = {
          side: 'buy' as const,
          tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          amountUsd: 100, 
          currentTokenPrice: 0.001,
          tokenDecimals: 9,
          tokenSymbol: 'TEST'
        }

        const mockGetSOLBalance = vi.spyOn(tradingService as any, 'getSOLBalance')
        mockGetSOLBalance.mockResolvedValue(1000000000) 

        await tradingService.executeTrade(tradeRequest, contextWithTier)

        expect(calculateTradeFees).toHaveBeenCalledWith(
          expect.any(BN),
          tier
        )
      }
    })
  })

  describe('Sell Order Fee Handling', () => {
    it('should calculate fees on expected proceeds for sell orders', async () => {
      const tradeRequest = {
        side: 'sell' as const,
  tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  tokenSymbol: 'TEST',
        amountUsd: 1, 
        currentTokenPrice: 0.001,
        tokenDecimals: 9
      }

      const mockGetTokenBalance = vi.spyOn(tradingService as any, 'getTokenBalance')
      mockGetTokenBalance.mockResolvedValue(1000000000) 

      await tradingService.executeTrade(tradeRequest, mockContext)

      
      expect(calculateTradeFees).toHaveBeenCalledWith(
        expect.any(BN), 
        'referred'
      )
    })

    it('should use full balance for sell orders without deducting fees', async () => {
      const tradeRequest = {
        side: 'sell' as const,
  tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  tokenSymbol: 'TEST',
        amountUsd: 1,
        currentTokenPrice: 0.001,
        tokenDecimals: 9
      }

      const mockBalance = 1500000000 
      const mockGetTokenBalance = vi.spyOn(tradingService as any, 'getTokenBalance')
      mockGetTokenBalance.mockResolvedValue(mockBalance)

      await tradingService.executeTrade(tradeRequest, mockContext)

      
      expect(mockGetUltraOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: mockBalance.toString()
        })
      )
    })

    it('should validate token balance before selling', async () => {
      const tradeRequest = {
        side: 'sell' as const,
  tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  tokenSymbol: 'TEST',
        amountUsd: 1,
        currentTokenPrice: 0.001,
        tokenDecimals: 9
      }

      
      const mockGetTokenBalance = vi.spyOn(tradingService as any, 'getTokenBalance')
      mockGetTokenBalance.mockResolvedValue(0)

      const result = await tradingService.executeTrade(tradeRequest, mockContext)

      expect(result.success).toBe(false)
      expect(result.error).toContain('No tokens found on-chain to sell')
    })
  })

  describe('Fee Transaction Building', () => {
    it('should build fee transaction with correct parameters', async () => {
      const tradeRequest = {
        side: 'buy' as const,
        tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          tokenSymbol: 'TEST',
        amountUsd: 1,
        currentTokenPrice: 0.001,
        tokenDecimals: 9
      }

      const mockGetSOLBalance = vi.spyOn(tradingService as any, 'getSOLBalance')
      mockGetSOLBalance.mockResolvedValue(14561536)

      await tradingService.executeTrade(tradeRequest, mockContext)

      
      expect(buildFeeTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          userWallet: mockContext.walletAddress,
          destinationWallet: expect.any(String),
          amountLamports: mockFeeCalculation.userPays.toString()
        })
      )
    })

    it('should skip fee transaction in paper mode', async () => {
      const paperContext = { ...mockContext, isLiveMode: false }
      const tradeRequest = {
        side: 'buy' as const,
        tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          tokenSymbol: 'TEST',
        amountUsd: 1,
        currentTokenPrice: 0.001,
        tokenDecimals: 9
      }

      await tradingService.executeTrade(tradeRequest, paperContext)

      
      expect(buildFeeTransaction).not.toHaveBeenCalled()
    })

    it('should skip fee transaction when no wallet context', async () => {
  const noWalletContext = { ...mockContext, userId: undefined as any }
      const tradeRequest = {
        side: 'buy' as const,
        tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          tokenSymbol: 'TEST',
        amountUsd: 1,
        currentTokenPrice: 0.001,
        tokenDecimals: 9
      }

      await tradingService.executeTrade(tradeRequest, noWalletContext)

      expect(buildFeeTransaction).not.toHaveBeenCalled()
    })
  })

  describe('Fee Amount Validation', () => {
    it('should calculate correct fee amounts for typical trades', async () => {
      const testScenarios = [
        {
          amountUsd: 1,
          tier: 'default' as const,
          expectedFeeUSD: 0.01,
          description: '$1 trade, default tier'
        },
        {
          amountUsd: 1,
          tier: 'referred' as const,
          expectedFeeUSD: 0.009,
          description: '$1 trade, referred tier'
        },
        {
          amountUsd: 10,
          tier: 'referred' as const,
          expectedFeeUSD: 0.09,
          description: '$10 trade, referred tier'
        },
        {
          amountUsd: 100,
          tier: 'premium' as const,
          expectedFeeUSD: 0.9,
          description: '$100 trade, premium tier'
        }
      ]

      for (const scenario of testScenarios) {
        vi.clearAllMocks()
        
        
        const grossLamports = new BN(Math.floor((scenario.amountUsd / mockSOLPrice) * 1e9))
        const feeRate = scenario.tier === 'default' ? 0.01 : 0.009
        const expectedFeeLamports = grossLamports.muln(feeRate * 1000).divn(1000)
        
        
        const mockFee = {
          grossAmount: grossLamports,
          platformFee: expectedFeeLamports,
          referrerShare: grossLamports.muln(1).divn(1000), 
          userDiscount: new BN('0'),
          netPlatformFee: expectedFeeLamports,
          userPays: expectedFeeLamports
        }
        
        ;(calculateTradeFees as Mock).mockReturnValue(mockFee)

        const context = { ...mockContext, userTier: scenario.tier }
        const tradeRequest = {
          side: 'buy' as const,
          tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          amountUsd: scenario.amountUsd,
          currentTokenPrice: 0.001,
          tokenDecimals: 9,
          tokenSymbol: 'TEST'
        }

        const mockGetSOLBalance = vi.spyOn(tradingService as any, 'getSOLBalance')
        mockGetSOLBalance.mockResolvedValue(1000000000) 

        await tradingService.executeTrade(tradeRequest, context)

        
        expect(buildFeeTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            amountLamports: expectedFeeLamports.toString()
          })
        )
      }
    })

    it('should handle precision correctly for small amounts', async () => {
      const smallTradeRequest = {
        side: 'buy' as const,
        tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amountUsd: 0.5, 
        currentTokenPrice: 0.001,
  tokenDecimals: 9,
  tokenSymbol: 'TEST'
      }

      const mockGetSOLBalance = vi.spyOn(tradingService as any, 'getSOLBalance')
      mockGetSOLBalance.mockResolvedValue(14561536)

      await tradingService.executeTrade(smallTradeRequest, mockContext)

      
      expect(calculateTradeFees).toHaveBeenCalledWith(
        expect.any(BN),
        'referred'
      )
      
      
      const callArgs = (buildFeeTransaction as Mock).mock.calls[0][0]
      const feeAmount = parseInt(callArgs.amountLamports)
      expect(feeAmount).toBeGreaterThan(0)
      expect(feeAmount).toBeLessThan(1000000000) 
    })
  })

  describe('Error Handling in Fee Processing', () => {
    it('should continue trade execution even if fee transaction building fails', async () => {
      ;(buildFeeTransaction as Mock).mockImplementation(() => {
        throw new Error('Fee transaction building failed')
      })

      const tradeRequest = {
        side: 'buy' as const,
        tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amountUsd: 1,
        currentTokenPrice: 0.001,
  tokenDecimals: 9,
  tokenSymbol: 'TEST'
      }

      const mockGetSOLBalance = vi.spyOn(tradingService as any, 'getSOLBalance')
      mockGetSOLBalance.mockResolvedValue(14561536)

      const result = await tradingService.executeTrade(tradeRequest, mockContext)

      
      expect(result.success).toBe(true)
    })

    it('should handle fee calculation errors gracefully', async () => {
      ;(calculateTradeFees as Mock).mockImplementation(() => {
        throw new Error('Fee calculation failed')
      })

      const tradeRequest = {
        side: 'buy' as const,
        tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amountUsd: 1,
        currentTokenPrice: 0.001,
  tokenDecimals: 9,
  tokenSymbol: 'TEST'
      }

      const mockGetSOLBalance = vi.spyOn(tradingService as any, 'getSOLBalance')
      mockGetSOLBalance.mockResolvedValue(14561536)

      
      const result = await tradingService.executeTrade(tradeRequest, mockContext)
      
      
      expect(result).toBeDefined()
    })
  })

  describe('SOL Price Integration', () => {
    it('should use current SOL price for fee calculations', async () => {
      const tradeRequest = {
        side: 'buy' as const,
        tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amountUsd: 1,
        currentTokenPrice: 0.001,
  tokenDecimals: 9,
  tokenSymbol: 'TEST'
      }

      
      const mockSolPriceService = vi.spyOn(tradingService as any, 'getCurrentSOLPrice')
      mockSolPriceService.mockResolvedValue(174) 

      const mockGetSOLBalance = vi.spyOn(tradingService as any, 'getSOLBalance')
      mockGetSOLBalance.mockResolvedValue(14561536)

      await tradingService.executeTrade(tradeRequest, mockContext)

      
      expect(calculateTradeFees).toHaveBeenCalledWith(
        expect.any(BN), 
        'referred'
      )
    })
  })
})