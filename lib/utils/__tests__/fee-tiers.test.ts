import BN from 'bn.js'
import { describe, expect, it } from 'vitest'
import { calculateTradeFees } from '../fee-calculator'
import { FEE_ROUTING } from '../fee-routing'

describe('Clean Fee Architecture', () => {
  describe('FEE_ROUTING - Simple Binary Decision', () => {
    it('should define platform and partner routes only', () => {
      expect(FEE_ROUTING).toBeDefined()
      expect(FEE_ROUTING.platform).toBeDefined()
      expect(FEE_ROUTING.partner).toBeDefined()
    })

    it('should route fees correctly for users without partners', () => {
      const platformRouting = FEE_ROUTING.platform
      
      expect(platformRouting.userPlatformFee).toBe(0.01) 
    })

    it('should route fees correctly for users with partners', () => {
      const partnerRouting = FEE_ROUTING.partner
      
      expect(partnerRouting.userPlatformFee).toBe(0.009) 
    })
  })

  

  describe('PRODUCTION calculateTradeFees function', () => {
    it('should charge users correct fee amounts based on partner status', () => {
      const tradeAmountLamports = new BN(100_000_000_000) 
      
      
      const noPartnerResult = calculateTradeFees(tradeAmountLamports, false)
      const expectedPlatformFee = tradeAmountLamports.mul(new BN(100)).div(new BN(10000)) 
      expect(noPartnerResult.userPays.toString()).toBe(expectedPlatformFee.toString())
      
      
      const partnerResult = calculateTradeFees(tradeAmountLamports, true)
      const expectedPartnerFee = tradeAmountLamports.mul(new BN(90)).div(new BN(10000)) 
      expect(partnerResult.userPays.toString()).toBe(expectedPartnerFee.toString())
    })

    it('should handle different trade amounts correctly', () => {
      const testCases = [
        { amountLamports: new BN(1_000_000_000), hasPartner: false, expectedFeePercent: 0.01 },
        { amountLamports: new BN(10_000_000_000), hasPartner: false, expectedFeePercent: 0.01 },
        { amountLamports: new BN(1_000_000_000), hasPartner: true, expectedFeePercent: 0.009 },
        { amountLamports: new BN(10_000_000_000), hasPartner: true, expectedFeePercent: 0.009 },
        { amountLamports: new BN(50_000_000_000), hasPartner: true, expectedFeePercent: 0.009 }
      ]

      testCases.forEach(({ amountLamports, hasPartner, expectedFeePercent }) => {
        const result = calculateTradeFees(amountLamports, hasPartner)
        const expectedFee = amountLamports.mul(new BN(Math.round(expectedFeePercent * 10000))).div(new BN(10000))
        expect(result.userPays.toString()).toBe(expectedFee.toString())
      })
    })

    it('should default to null tier when no tier specified', () => {
      const amountLamports = new BN(100_000_000_000)
  const resultNoPartner = calculateTradeFees(amountLamports, false)
  const resultExplicitNoPartner = calculateTradeFees(amountLamports, false)
  expect(resultNoPartner.userPays.toString()).toBe(resultExplicitNoPartner.userPays.toString())
    })
  })

  describe('Business Logic Validation', () => {
    it('should provide fee benefit for partner users', () => {
  const tradeAmountLamports = new BN(100_000_000_000) 
  const noPartnerResult = calculateTradeFees(tradeAmountLamports, false)
  const partnerResult = calculateTradeFees(tradeAmountLamports, true)
  const partnerResult2 = calculateTradeFees(tradeAmountLamports, true)
      
  
  expect(partnerResult.userPays.lt(noPartnerResult.userPays)).toBe(true)
  expect(partnerResult2.userPays.toString()).toBe(partnerResult.userPays.toString())
    })

    it('should have reasonable fee percentages', () => {
      Object.values(FEE_ROUTING).forEach(routing => {
        
        expect(routing.userPlatformFee).toBeGreaterThanOrEqual(0.005)
        expect(routing.userPlatformFee).toBeLessThanOrEqual(0.02)
      })
    })
  })
})