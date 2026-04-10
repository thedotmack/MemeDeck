
import { useStore } from '@/lib/store'
import {
    CardData,
    PositionData,
    ServiceResult,
    TokenData
} from '@/lib/types/trading'

interface BuyParams {
  drawAmount: number
  cardCount: number
  currentHandTokenIds: string[]
  pendingTokenIds?: string[]
}

interface BuyResult extends ServiceResult<TokenData[]> {
  selectedTokens?: TokenData[]
}

class BuyService {
  
    getAvailableTokens(): TokenData[] {
    const { activity } = useStore.getState();
    
    if (!activity.tokens || activity.tokens.length === 0) {
      throw new Error('Token data not available. Please check your connection.');
    }

    const blockedSet = new Set(activity.blockedTokens || []);
    const availableTokens = activity.tokens.filter(token => !blockedSet.has(token.tokenId));

    if (availableTokens.length === 0) {
      throw new Error('No tokens available after filtering blocked tokens.');
    }

    return availableTokens.slice(0, 20).map(token => ({
      tokenId: token.tokenId,
      name: token.name || 'Unknown Token',
      symbol: token.symbol || '???',
      icon: token.icon || '/digital-token.webp',
      price: token.price || 0,
      priceChange24h: token.oneMinGain || 0, 
      volume24h: token.volume24h,
      liquidity: token.liquidity,
      dex: 'Jupiter', 
      memeScore: token.signal === 'STRONG' ? 100 : token.signal === 'RISING' ? 75 : token.signal === 'WATCH' ? 60 : 50
    }));
  }

    async fetchAvailableTokens(): Promise<TokenData[]> {
    return this.getAvailableTokens();
  }

    selectTokensForBuy(params: BuyParams, availableTokens: TokenData[]): BuyResult {
    const { cardCount, currentHandTokenIds, pendingTokenIds = [] } = params
    
    
    const unavailableTokenIds = new Set([...currentHandTokenIds, ...pendingTokenIds])
    
    
    const availableUniqueTokens = availableTokens.filter(token => 
      !unavailableTokenIds.has(token.tokenId)
    )
    
    if (availableUniqueTokens.length < cardCount) {
      return {
        success: false,
        error: `Not enough unique tokens available. Need: ${cardCount}, Available: ${availableUniqueTokens.length}, In hand: ${currentHandTokenIds.length}, Pending: ${pendingTokenIds.length}`
      }
    }
    
    
    const selectedTokens = availableUniqueTokens.slice(0, cardCount)
    
    return {
      success: true,
      selectedTokens
    }
  }

    preventDuplicateTokens(tokenIds: string[], handTokenIds: string[], pendingTokenIds: string[]): string[] {
    const unavailableTokenIds = new Set([...handTokenIds, ...pendingTokenIds])
    
    return tokenIds.filter(tokenId => 
      !unavailableTokenIds.has(tokenId)
    )
  }

    createCardFromToken(token: TokenData): CardData {
    return {
      id: token.tokenId,
      type: "jupiter" as const,
      name: token.name,
      symbol: token.symbol,
      icon: token.icon,
      tokenId: token.tokenId,
      priceChange24h: token.priceChange24h || 0,
      usdPrice: token.price,
      volume24h: token.volume24h,
      liquidity: token.liquidity,
      dex: token.dex,
      faceUp: true,
      memeScore: token.memeScore,
      price: token.price
    }
  }

    createPositionFromTrade(
    token: TokenData,
    tradeResult: any,
    drawAmount: number
  ): PositionData {
    const actualCost = tradeResult.actualAmountUsd || drawAmount
    const actualShares = tradeResult.actualTokenAmount || (drawAmount / token.price)
    const actualEntryPrice = actualCost / actualShares  
    const currentValue = actualShares * token.price
    const unrealizedPnl = currentValue - actualCost
    
    return {
      tokenId: token.tokenId,
      tokenName: token.name,
      tokenSymbol: token.symbol,
      quantity: actualShares,
      entryPrice: actualEntryPrice,  
      currentPrice: token.price,
      cost: actualCost,
      value: currentValue,
      unrealizedPnl: unrealizedPnl
    }
  }

    async fetchJupiterQuote(tokenId: string, usdcAmount: number) {
    const quoteUrl = new URL('https://lite-api.jup.ag/swap/v1/quote');
    quoteUrl.searchParams.append('inputMint', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); 
    quoteUrl.searchParams.append('outputMint', tokenId);
    quoteUrl.searchParams.append('amount', usdcAmount.toString());
    quoteUrl.searchParams.append('slippageBps', '50');
    quoteUrl.searchParams.append('restrictIntermediateTokens', 'true');
    
    const response = await fetch(quoteUrl.toString());
    return await response.json();
  }

    usdToUsdcAmount(usdAmount: number): number {
    return Math.round(usdAmount * 1_000_000); 
  }
}


export const buyService = new BuyService()