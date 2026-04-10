export interface TooltipData {
  title: string;
  description: string;
  details?: TooltipDetail[];
  icon?: string;
  color?: 'blue' | 'green' | 'purple' | 'red' | 'yellow' | 'gray';
}

export interface TooltipDetail {
  label: string;
  value: string | number;
  color?: 'green' | 'red' | 'blue' | 'yellow' | 'gray';
  icon?: string;
}

export interface UpdatesTooltipData extends TooltipData {
  updatesPerMinute: number;
  activityLevel: 'slow' | 'fast' | 'very-fast' | 'blazing';
  lastUpdate?: string;
  trend?: 'increasing' | 'decreasing' | 'stable';
}

export interface LiquidityTooltipData extends TooltipData {
  poolLiquidity: number;
  liquidityLevel: 'desert' | 'low' | 'medium' | 'high';
  tradingImplication: string;
  slippageEstimate?: number;
}

export interface AgeTooltipData extends TooltipData {
  ageMs: number;
  ageFormatted: string;
  maturityLevel: 'new' | 'young' | 'growing' | 'mature' | 'ancient';
  riskLevel: 'very-high' | 'high' | 'medium' | 'low';
  creationTime?: string;
}

export interface SparklineTooltipData extends TooltipData {
  gains: Array<{ period: string; value: number | null; }>;
  buyPressure5m?: number;
  trend: 'bullish' | 'bearish' | 'neutral';
}

export interface PriceTooltipData extends TooltipData {
  currentPrice: number;
  priceChange24h?: number;
  volume24h?: number;
  marketCap?: string;
  allTimeHigh?: number;
  allTimeLow?: number;
}

export interface SignalTooltipData extends TooltipData {
  signal: 'STRONG' | 'RISING' | 'WATCH' | 'FLAT';
  signalStrength: number;
  explanation: string;
  factors: string[];
  confidence: number;
}