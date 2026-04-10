
export interface BaseCard {
  id: string;
  [key: string]: any; 
}


export interface JupiterTokenCard extends BaseCard {
  type: "jupiter";
  name: string;
  symbol: string;
  icon: string;
  priceChange24h: number;
  usdPrice: number;
  volume24h?: number;
  liquidity?: number;
  dex?: string;
  rawData?: any;
  faceUp?: boolean;
  memeScore?: any; 
  
  marketCapRank?: number;
  age?: number; 
  exchangeCount?: number;
  lastActivity?: string; 
  vsMarket?: number; 
  price?: number; 
  
  riskFlags?: string[]; 
  oneMinGain?: number;   
  twoMinGain?: number;   
  threeMinGain?: number; 
  fourMinGain?: number;  
  fiveMinGain?: number;  
  dumpTimer?: {         
    estimatedMinutes: number;
    dumpProbability: number;
    pumpDurationMinutes: number;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  } | null;
}



export interface TokenPosition {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  cost: number;
  value: number;
  unrealizedPnl: number;
  isPending?: boolean; 
  transactionHash?: string; 
  tokenDecimals?: number; 
  unknownBasis?: boolean; 
  createdAt?: number; 
}





export interface MemeScoreVerdict {
  tier: number;
  phrase: string;
  score: number;
  weight: number;
}

export interface MemeScoreRedFlag {
  id: string;
  name: string;
  explanation: string;
}

export interface MemeScore {
  token: string;
  symbol: string;
  overall: number;
  verdicts: {
    cashOut: MemeScoreVerdict;
    priceVibes: MemeScoreVerdict;
    whalePower: MemeScoreVerdict;
    genuineTrades: MemeScoreVerdict;
  };
  redFlags: MemeScoreRedFlag[];
  breakdown: {
    weightedAverage: number;
    totalWeight: number;
  };
}



