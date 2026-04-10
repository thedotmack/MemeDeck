import BN from 'bn.js'
import { describe, expect, it } from 'vitest'
import { calculateTradeFees } from '../fee-calculator'
import { FEE_ROUTING } from '../fee-routing'

describe('Fee Calculator Production Code', () => {
  describe('Fee Routing Configuration', () => {
    it('should load fee routing from fee-tiers.ts', () => {
      expect(FEE_ROUTING.platform).toBeDefined()
      expect(FEE_ROUTING.partner).toBeDefined()
      
      expect(FEE_ROUTING.platform.userPlatformFee).toBe(0.01) 
      expect(FEE_ROUTING.partner.userPlatformFee).toBe(0.009) 
    })
  })

  describe('No Partner (1% fee)', () => {
    it('should calculate 1% platform fee for trades', () => {
      const tradeAmount = new BN('1000000000') 
      const result = calculateTradeFees(tradeAmount, false)
      
      const expectedFee = new BN('10000000') 
      expect(result.userPays.toString()).toBe(expectedFee.toString())
      expect(result.platformFee.toString()).toBe(expectedFee.toString())
    })

    it('should have no referrer share since no partner', () => {
      const tradeAmount = new BN('1000000000') 
      const result = calculateTradeFees(tradeAmount, false)
      
      expect(result.referrerShare.toString()).toBe('0')
      expect(result.userDiscount.toString()).toBe('0')
    })
  })

  describe('Standard Partner (0.9% fee)', () => {
    it('should calculate 0.9% platform fee for trades', () => {
      const tradeAmount = new BN('1000000000') 
      const result = calculateTradeFees(tradeAmount, true)
      
      const expectedFee = new BN('9000000') 
      expect(result.userPays.toString()).toBe(expectedFee.toString())
      expect(result.platformFee.toString()).toBe(expectedFee.toString())
    })

    it('should provide discount compared to no partner', () => {
      const tradeAmount = new BN('1000000000') 
  const noPartnerResult = calculateTradeFees(tradeAmount, false)
  const partnerResult = calculateTradeFees(tradeAmount, true)
      
  expect(partnerResult.userPays.lt(noPartnerResult.userPays)).toBe(true)
      
  
  const savings = noPartnerResult.userPays.sub(partnerResult.userPays)
      const expectedSavings = new BN('1000000') 
      expect(savings.toString()).toBe(expectedSavings.toString())
    })
  })

  describe('Premium Partner (0.9% fee)', () => {
    it('should calculate same platform fee as standard partner', () => {
      const tradeAmount = new BN('1000000000') 
  const partnerResult1 = calculateTradeFees(tradeAmount, true)
  const partnerResult2 = calculateTradeFees(tradeAmount, true)
      
  
  expect(partnerResult1.userPays.toString()).toBe(partnerResult2.userPays.toString())
  expect(partnerResult1.platformFee.toString()).toBe(partnerResult2.platformFee.toString())
    })

    it('should have no referrer share calculation (handled by Hydra)', () => {
      const tradeAmount = new BN('1000000000') 
      const result = calculateTradeFees(tradeAmount, true)
      
      
      expect(result.referrerShare.toString()).toBe('0')
    })
  })

  describe('Edge Cases and Precision', () => {
    it('should handle very small amounts without precision loss', () => {
      const tradeAmount = new BN('1') 
      const result = calculateTradeFees(tradeAmount, false)
      
      
      expect(result.userPays.gte(new BN('0'))).toBe(true)
      expect(result.platformFee.gte(new BN('0'))).toBe(true)
    })

    it('should handle very large amounts without overflow', () => {
      const tradeAmount = new BN('1000000000000000000') 
      const result = calculateTradeFees(tradeAmount, false)
      
      expect(result.userPays.gt(new BN('0'))).toBe(true)
      expect(result.platformFee.gt(new BN('0'))).toBe(true)
    })

    it('should maintain BN precision throughout calculations', () => {
      const tradeAmount = new BN('123456789') 
      const result = calculateTradeFees(tradeAmount, true)
      
      
      expect(BN.isBN(result.userPays)).toBe(true)
      expect(BN.isBN(result.platformFee)).toBe(true)
      expect(BN.isBN(result.referrerShare)).toBe(true)
      expect(BN.isBN(result.grossAmount)).toBe(true)
    })

    it('should have correct relationship between fields', () => {
  const tradeAmount = new BN('1000000000') 
  const result = calculateTradeFees(tradeAmount, true)
      
  
  expect(result.grossAmount.toString()).toBe(tradeAmount.toString())
      
  
  expect(result.userPays.toString()).toBe(result.platformFee.toString())
      
  
  expect(result.netPlatformFee.toString()).toBe(result.platformFee.toString())
      
  
  expect(result.userDiscount.toString()).toBe('0')
    })
  })

  describe('Realistic Trading Scenarios', () => {
    it('should calculate fees for typical meme coin trades', () => {
      const tradeSizes = [
        new BN('1000000000'), 
        new BN('10000000000'), 
        new BN('50000000000'), 
        new BN('100000000000') 
      ]

      tradeSizes.forEach(tradeAmount => {
        const noPartnerResult = calculateTradeFees(tradeAmount, false)
        const partnerResult = calculateTradeFees(tradeAmount, true)
        
        
        const expectedNoPartnerFee = tradeAmount.mul(new BN(100)).div(new BN(10000))
        expect(noPartnerResult.userPays.toString()).toBe(expectedNoPartnerFee.toString())
        
        
        const expectedPartnerFee = tradeAmount.mul(new BN(90)).div(new BN(10000))
        expect(partnerResult.userPays.toString()).toBe(expectedPartnerFee.toString())
      })
    })
  })
})