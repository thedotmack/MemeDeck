
export interface TokenData {
  tokenId: string
  name: string
  symbol: string
  icon: string
  price: number
  priceChange24h?: number
  volume24h?: number
  liquidity?: number
  dex?: string
  memeScore?: number
}

export interface PositionData {
  tokenId: string
  tokenName: string
  tokenSymbol: string
  quantity: number
  entryPrice: number
  currentPrice: number
  cost: number
  value: number
  unrealizedPnl: number
  tokenDecimals?: number
}

export interface CardData {
  id: string
  type: "jupiter"
  name: string
  symbol: string
  icon: string
  tokenId: string
  priceChange24h: number
  usdPrice: number
  volume24h?: number
  liquidity?: number
  dex?: string
  faceUp: boolean
  memeScore?: number
  price: number
}

export interface ServiceResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

