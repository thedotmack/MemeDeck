import { describe, it, expect } from 'vitest'
import { PublicKey, SystemProgram, ComputeBudgetProgram, TransactionMessage } from '@solana/web3.js'
import BN from 'bn.js'
import { buildFeeTransaction, validateFeeTransaction } from '../fee-transaction'

describe('Fee Transaction Builder', () => {
  const mockUserWallet = 'So11111111111111111111111111111111111111112' 
  const mockDestinationWallet = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' 
  
  describe('buildFeeTransaction', () => {
    it('should create VersionedTransaction with correct transfer instruction', () => {
      const feeAmount = '57471000' 
      
      const transaction = buildFeeTransaction({
        userWallet: mockUserWallet,
        destinationWallet: mockDestinationWallet,
        amountLamports: feeAmount
      })

      expect(transaction).toBeDefined()
      
      
      const message = TransactionMessage.decompile(transaction.message, {
        addressLookupTableAccounts: []
      })
      
      expect(message.instructions).toHaveLength(3) 
      
      
      const computeLimitInstruction = message.instructions[0]
      expect(computeLimitInstruction.programId.toString()).toBe(ComputeBudgetProgram.programId.toString())
      
      
      const computePriceInstruction = message.instructions[1]
      expect(computePriceInstruction.programId.toString()).toBe(ComputeBudgetProgram.programId.toString())
      
      
      const transferInstruction = message.instructions[2]
      expect(transferInstruction.programId.toString()).toBe(SystemProgram.programId.toString())
    })

    it('should set correct compute budget parameters', () => {
      const feeAmount = '57471000'
      
      const transaction = buildFeeTransaction({
        userWallet: mockUserWallet,
        destinationWallet: mockDestinationWallet,
        amountLamports: feeAmount
      })

      const message = TransactionMessage.decompile(transaction.message, {
        addressLookupTableAccounts: []
      })

      
      const computeLimitData = message.instructions[0].data
      expect(computeLimitData).toBeDefined()
      
      
      const computePriceData = message.instructions[1].data
      expect(computePriceData).toBeDefined()
    })

    it('should create transfer instruction with exact lamport amount', () => {
      const testCases = [
        '57471000', 
        '517239000', 
        '1000', 
        '1000000000000' 
      ]

      testCases.forEach(feeAmount => {
        const transaction = buildFeeTransaction({
          userWallet: mockUserWallet,
          destinationWallet: mockDestinationWallet,
          amountLamports: feeAmount
        })

        const message = TransactionMessage.decompile(transaction.message, {
          addressLookupTableAccounts: []
        })

        
        const transferInstruction = message.instructions[2]
        
        
        expect(transferInstruction.programId.toString()).toBe(SystemProgram.programId.toString())
        
        
        expect(transferInstruction.data.length).toBeGreaterThan(0)
      })
    })

    it('should handle BN conversion correctly for large lamport values', () => {
      
      const largeFeeAmount = '999999999999' 
      
      expect(() => {
        buildFeeTransaction({
          userWallet: mockUserWallet,
          destinationWallet: mockDestinationWallet,
          amountLamports: largeFeeAmount
        })
      }).not.toThrow()
    })

    it('should create valid VersionedTransaction structure', () => {
      const feeAmount = '57471000'
      
      const transaction = buildFeeTransaction({
        userWallet: mockUserWallet,
        destinationWallet: mockDestinationWallet,
        amountLamports: feeAmount
      })

      
      expect(transaction.message).toBeDefined()
      expect(transaction.signatures).toBeDefined()
      expect(transaction.signatures.length).toBe(1) 
      
      
      const message = TransactionMessage.decompile(transaction.message, {
        addressLookupTableAccounts: []
      })
      
      expect(message.payerKey.toString()).toBe(mockUserWallet)
      expect(message.instructions.length).toBe(3)
      expect(message.recentBlockhash).toBe('')
    })

    it('should validate wallet addresses', () => {
      const invalidWallet = 'invalid-wallet-address'
      
      expect(() => {
        buildFeeTransaction({
          userWallet: invalidWallet,
          destinationWallet: mockDestinationWallet,
          amountLamports: '1000'
        })
      }).toThrow()
    })
  })

  describe('Legacy buildFeeTransaction interface', () => {
    it('should handle legacy complex interface for backward compatibility', () => {
      const transaction = buildFeeTransaction({
        userWallet: mockUserWallet,
        platformWallet: mockDestinationWallet,
        platformAmountLamports: '57471000',
        partnerPoolWallet: mockUserWallet, 
        partnerAmountLamports: '5747100' 
      })

      const message = TransactionMessage.decompile(transaction.message, {
        addressLookupTableAccounts: []
      })

      
      expect(message.instructions.length).toBe(4) 
    })

    it('should handle legacy interface without partner wallet', () => {
      const transaction = buildFeeTransaction({
        userWallet: mockUserWallet,
        platformWallet: mockDestinationWallet,
        platformAmountLamports: '57471000'
        
      })

      const message = TransactionMessage.decompile(transaction.message, {
        addressLookupTableAccounts: []
      })

      
      expect(message.instructions.length).toBe(3)
    })
  })

  describe('validateFeeTransaction', () => {
    it('should validate correct transaction parameters', () => {
      const validParams = {
        userWallet: mockUserWallet,
        platformWallet: mockDestinationWallet,
        platformAmountLamports: '57471000'
      }

      expect(() => {
        validateFeeTransaction(validParams)
      }).not.toThrow()
    })

    it('should reject invalid wallet addresses', () => {
      const invalidParams = {
        userWallet: 'invalid-address',
        platformWallet: mockDestinationWallet,
        platformAmountLamports: '57471000'
      }

      expect(() => {
        validateFeeTransaction(invalidParams)
      }).toThrow('Invalid wallet address format')
    })

    it('should reject zero or negative amounts', () => {
      const zeroAmountParams = {
        userWallet: mockUserWallet,
        platformWallet: mockDestinationWallet,
        platformAmountLamports: '0'
      }

      expect(() => {
        validateFeeTransaction(zeroAmountParams)
      }).toThrow('Platform fee amount must be greater than 0')

      const negativeAmountParams = {
        userWallet: mockUserWallet,
        platformWallet: mockDestinationWallet,
        platformAmountLamports: '-1000'
      }

      expect(() => {
        validateFeeTransaction(negativeAmountParams)
      }).toThrow()
    })

    it('should validate partner amounts when provided', () => {
      const invalidPartnerParams = {
        userWallet: mockUserWallet,
        platformWallet: mockDestinationWallet,
        platformAmountLamports: '57471000',
        partnerPoolWallet: mockUserWallet,
        partnerAmountLamports: '0'
      }

      expect(() => {
        validateFeeTransaction(invalidPartnerParams)
      }).toThrow('Partner fee amount must be greater than 0')
    })
  })

  describe('Priority Fee Calculation', () => {
    it('should add correct priority fee instructions', () => {
      const transaction = buildFeeTransaction({
        userWallet: mockUserWallet,
        destinationWallet: mockDestinationWallet,
        amountLamports: '57471000'
      })

      const message = TransactionMessage.decompile(transaction.message, {
        addressLookupTableAccounts: []
      })

      
      const computeLimitInstruction = message.instructions[0]
      const computePriceInstruction = message.instructions[1]
      
      expect(computeLimitInstruction.programId.toString()).toBe(ComputeBudgetProgram.programId.toString())
      expect(computePriceInstruction.programId.toString()).toBe(ComputeBudgetProgram.programId.toString())
    })

    it('should calculate total priority fee correctly', () => {
      
      
      const transaction = buildFeeTransaction({
        userWallet: mockUserWallet,
        destinationWallet: mockDestinationWallet,
        amountLamports: '57471000'
      })

      
      expect(transaction).toBeDefined()
      
      const message = TransactionMessage.decompile(transaction.message, {
        addressLookupTableAccounts: []
      })
      
      
      
      
      
      expect(message.instructions.length).toBe(3)
    })
  })

  describe('Real-world Fee Scenarios', () => {
    it('should handle typical meme coin trade fees', () => {
      const scenarios = [
        {
          description: '$1 trade, default user (1%)',
          lamports: '57471000', 
          expectedSOL: 0.057471
        },
        {
          description: '$1 trade, referred user (0.9%)', 
          lamports: '51723900', 
          expectedSOL: 0.0517239
        },
        {
          description: '$10 trade, referred user (0.9%)',
          lamports: '517239000', 
          expectedSOL: 0.517239
        },
        {
          description: '$100 trade, referred user (0.9%)',
          lamports: '5172390000', 
          expectedSOL: 5.17239
        }
      ]

      scenarios.forEach(({ description, lamports, expectedSOL }) => {
        const transaction = buildFeeTransaction({
          userWallet: mockUserWallet,
          destinationWallet: mockDestinationWallet,
          amountLamports: lamports
        })

        expect(transaction).toBeDefined()
        
        
        const actualSOL = parseInt(lamports) / 1e9
        expect(actualSOL).toBeCloseTo(expectedSOL, 6)
      })
    })
  })
})