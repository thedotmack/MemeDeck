import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { PartnerFeeWalletService } from '../partner-fee-wallet-service'


const mockStore = {
  referrerHydraWallet: null as string | null,
  auth: {
    accessToken: null as string | null
  },
  setReferrerInfo: vi.fn()
}

vi.mock('@/lib/store', () => ({
  useStore: {
    getState: () => mockStore
  }
}))


global.fetch = vi.fn()

describe('PartnerFeeWalletService', () => {
  let service: PartnerFeeWalletService
  const mockPlatformWallet = 'So11111111111111111111111111111111111111112'
  const mockReferrerHydraWallet = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

  beforeEach(() => {
    
    vi.clearAllMocks()
    
    
    mockStore.referrerHydraWallet = null
    mockStore.auth.accessToken = null
    
    
    process.env.NEXT_PUBLIC_PLATFORM_FEES_WALLET_PUBLIC_KEY = mockPlatformWallet
    
    service = new PartnerFeeWalletService()
  })

  describe('getPartnerFeeWallet', () => {
    it('should return cached referrer hydra wallet when available', async () => {
      
      mockStore.referrerHydraWallet = mockReferrerHydraWallet

      const result = await service.getPartnerFeeWallet()

      expect(result).toBe(mockReferrerHydraWallet)
      
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should make API call when no cached wallet', async () => {
      
      mockStore.auth.accessToken = 'mock-access-token'
      ;(fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockReferrerHydraWallet)
      })

      const result = await service.getPartnerFeeWallet()

      expect(result).toBe(mockReferrerHydraWallet)
      expect(fetch).toHaveBeenCalledWith('/api/fees/destination', {
        headers: {
          'Authorization': 'Bearer mock-access-token'
        }
      })
    })

    it('should cache API response when different from platform wallet', async () => {
      mockStore.auth.accessToken = 'mock-access-token'
      ;(fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockReferrerHydraWallet)
      })

      await service.getPartnerFeeWallet()

      expect(mockStore.setReferrerInfo).toHaveBeenCalledWith(null, mockReferrerHydraWallet)
    })

    it('should not cache when API returns platform wallet', async () => {
      mockStore.auth.accessToken = 'mock-access-token'
      ;(fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPlatformWallet)
      })

      const result = await service.getPartnerFeeWallet()

      expect(result).toBe(mockPlatformWallet)
      
      expect(mockStore.setReferrerInfo).not.toHaveBeenCalled()
    })

    it('should fallback to platform wallet when no access token', async () => {
      
      mockStore.auth.accessToken = null

      const result = await service.getPartnerFeeWallet()

      expect(result).toBe(mockPlatformWallet)
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should fallback to platform wallet when API call fails', async () => {
      mockStore.auth.accessToken = 'mock-access-token'
      ;(fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const result = await service.getPartnerFeeWallet()

      expect(result).toBe(mockPlatformWallet)
    })

    it('should fallback to platform wallet when API throws error', async () => {
      mockStore.auth.accessToken = 'mock-access-token'
      ;(fetch as Mock).mockRejectedValueOnce(new Error('Network error'))

      const result = await service.getPartnerFeeWallet()

      expect(result).toBe(mockPlatformWallet)
    })

    it('should handle malformed API response gracefully', async () => {
      mockStore.auth.accessToken = 'mock-access-token'
      ;(fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      })

      const result = await service.getPartnerFeeWallet()

      expect(result).toBe(mockPlatformWallet)
    })
  })

  describe('clearCache', () => {
    it('should clear cached referrer info', () => {
      service.clearCache()

      expect(mockStore.setReferrerInfo).toHaveBeenCalledWith(null, null)
    })
  })

  describe('getPlatformWallet (private method)', () => {
    it('should throw error when platform wallet not configured', () => {
      
      delete process.env.NEXT_PUBLIC_PLATFORM_FEES_WALLET_PUBLIC_KEY

      expect(() => {
        
        const service = new PartnerFeeWalletService()
        
        return service.getPartnerFeeWallet()
      }).rejects.toThrow('Platform wallet address not configured')
    })
  })

  describe('Caching Behavior', () => {
    it('should use cache on subsequent calls', async () => {
      
      mockStore.auth.accessToken = 'mock-access-token'
      ;(fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockReferrerHydraWallet)
      })

      const firstResult = await service.getPartnerFeeWallet()

      
      mockStore.referrerHydraWallet = mockReferrerHydraWallet

      
      const secondResult = await service.getPartnerFeeWallet()

      expect(firstResult).toBe(mockReferrerHydraWallet)
      expect(secondResult).toBe(mockReferrerHydraWallet)
      expect(fetch).toHaveBeenCalledTimes(1) 
    })

    it('should make new API call after cache is cleared', async () => {
      
      mockStore.referrerHydraWallet = mockReferrerHydraWallet
      
      const cachedResult = await service.getPartnerFeeWallet()
      expect(cachedResult).toBe(mockReferrerHydraWallet)
      expect(fetch).not.toHaveBeenCalled()

      
      service.clearCache()
      mockStore.referrerHydraWallet = null 

      
      mockStore.auth.accessToken = 'mock-access-token'
      ;(fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockReferrerHydraWallet)
      })

      const newResult = await service.getPartnerFeeWallet()
      
      expect(newResult).toBe(mockReferrerHydraWallet)
      expect(fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle API returning null/undefined', async () => {
      mockStore.auth.accessToken = 'mock-access-token'
      ;(fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(null)
      })

      const result = await service.getPartnerFeeWallet()
      expect(result).toBe(mockPlatformWallet)
    })

    it('should handle API returning empty string', async () => {
      mockStore.auth.accessToken = 'mock-access-token'
      ;(fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve('')
      })

      const result = await service.getPartnerFeeWallet()
      expect(result).toBe(mockPlatformWallet)
    })

    it('should handle concurrent calls efficiently', async () => {
      mockStore.auth.accessToken = 'mock-access-token'
      ;(fetch as Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockReferrerHydraWallet)
      })

      
      const promises = [
        service.getPartnerFeeWallet(),
        service.getPartnerFeeWallet(),
        service.getPartnerFeeWallet()
      ]

      const results = await Promise.all(promises)

      
      results.forEach(result => {
        expect(result).toBe(mockReferrerHydraWallet)
      })

      
      expect(fetch).toHaveBeenCalled()
    })
  })

  describe('Wallet Address Validation', () => {
    it('should work with valid Solana wallet addresses', async () => {
      const validWallets = [
        'So11111111111111111111111111111111111111112', 
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 
        '11111111111111111111111111111111', 
        'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1' 
      ]

      for (const wallet of validWallets) {
        mockStore.auth.accessToken = 'mock-access-token'
        ;(fetch as Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(wallet)
        })

        const result = await service.getPartnerFeeWallet()
        expect(result).toBe(wallet)
      }
    })
  })

  describe('Real-world Integration Scenarios', () => {
    it('should handle typical referral flow', async () => {
      
      mockStore.auth.accessToken = 'new-user-token'
      ;(fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPlatformWallet) 
      })

      const result1 = await service.getPartnerFeeWallet()
      expect(result1).toBe(mockPlatformWallet)

      
      ;(fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockReferrerHydraWallet)
      })

      
      service.clearCache()
      mockStore.referrerHydraWallet = null

      const result2 = await service.getPartnerFeeWallet()
      expect(result2).toBe(mockReferrerHydraWallet)

      
      mockStore.referrerHydraWallet = mockReferrerHydraWallet
      const result3 = await service.getPartnerFeeWallet()
      expect(result3).toBe(mockReferrerHydraWallet)
    })

    it('should handle referrer wallet creation scenario', async () => {
      
      mockStore.auth.accessToken = 'user-token'
      ;(fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPlatformWallet)
      })

      const result1 = await service.getPartnerFeeWallet()
      expect(result1).toBe(mockPlatformWallet)

      
      service.clearCache()
      mockStore.referrerHydraWallet = null

      
      ;(fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockReferrerHydraWallet)
      })

      const result2 = await service.getPartnerFeeWallet()
      expect(result2).toBe(mockReferrerHydraWallet)
    })
  })
})