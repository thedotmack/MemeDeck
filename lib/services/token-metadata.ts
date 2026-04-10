
interface TokenMetadata {
  tokenId: string
  symbol: string
  name: string
  icon: string | null
  price: number
  priceChange24h: number
  volume24h: number
  liquidity: number
  signal: string
  updatesPerMinute: number
}

interface TokenMetadataResponse {
  success: boolean
  data?: Record<string, TokenMetadata>
  error?: string
  timestamp?: number
}

class TokenMetadataService {
  private cache = new Map<string, { data: TokenMetadata; expires: number }>()
  private readonly CACHE_TTL = 60 * 1000 

    async batchGetTokenMetadata(tokenMints: string[]): Promise<Map<string, TokenMetadata>> {
    if (tokenMints.length === 0) {
      return new Map()
    }

    const results = new Map<string, TokenMetadata>()
    const uncachedTokens: string[] = []
    const now = Date.now()

    
    for (const tokenMint of tokenMints) {
      const cached = this.cache.get(tokenMint)
      if (cached && cached.expires > now) {
        results.set(tokenMint, cached.data)
      } else {
        uncachedTokens.push(tokenMint)
      }
    }

    
    if (uncachedTokens.length > 0) {
      try {
        console.log(`[TokenMetadata] Fetching metadata for ${uncachedTokens.length} tokens`)
        
        const tokensParam = uncachedTokens.join(',')
        const response = await fetch(`/api/jupiter-proxy/metadata?tokens=${encodeURIComponent(tokensParam)}`)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data: TokenMetadataResponse = await response.json()
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch token metadata')
        }

        if (data.data) {
          
          for (const [tokenMint, metadata] of Object.entries(data.data)) {
            console.log(`[TokenMetadata] Received metadata for ${tokenMint}:`, {
              symbol: metadata.symbol,
              name: metadata.name,
              icon: metadata.icon
            })
            
            this.cache.set(tokenMint, {
              data: metadata,
              expires: now + this.CACHE_TTL
            })
            results.set(tokenMint, metadata)
          }
          
          console.log(`[TokenMetadata] Successfully fetched ${Object.keys(data.data).length} token metadata`)
        }
      } catch (error) {
        console.error('[TokenMetadata] Error fetching token metadata:', error)
        
        
        for (const tokenMint of uncachedTokens) {
          if (!results.has(tokenMint)) {
            const fallback: TokenMetadata = {
              tokenId: tokenMint,
              symbol: 'Unknown',
              name: 'Unknown Token',
              icon: '/digital-token.webp',
              price: 0,
              priceChange24h: 0,
              volume24h: 0,
              liquidity: 0,
              signal: 'FLAT',
              updatesPerMinute: 0
            }
            results.set(tokenMint, fallback)
          }
        }
      }
    }

    return results
  }

    async getTokenMetadata(tokenMint: string): Promise<TokenMetadata | null> {
    const results = await this.batchGetTokenMetadata([tokenMint])
    return results.get(tokenMint) || null
  }

    clearCache(): void {
    this.cache.clear()
  }

    getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()).map(key => key.slice(-8))
    }
  }
}


export const tokenMetadataService = new TokenMetadataService()