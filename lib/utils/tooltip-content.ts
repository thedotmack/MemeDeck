import {
  TooltipDetail,
  UpdatesTooltipData,
  LiquidityTooltipData,
  AgeTooltipData,
  SparklineTooltipData,
  SignalTooltipData
} from '@/lib/types/tooltip-types';

export function createUpdatesTooltip(updatesPerMinute: number, lastUpdate?: string): UpdatesTooltipData {
  const getSignal = (upm: number): 'FLAT' | 'WATCH' | 'RISING' | 'STRONG' => {
    if (upm >= 45) return 'STRONG';
    if (upm >= 30) return 'RISING';
    if (upm >= 15) return 'WATCH';
    return 'FLAT';
  };

  const signal = getSignal(updatesPerMinute);

  
  const activityLevel = signal === 'STRONG' ? 'blazing' : 
                       signal === 'RISING' ? 'very-fast' : 
                       signal === 'WATCH' ? 'fast' : 'slow';

  return {
    title: `Updates/min: ${updatesPerMinute}`,
    description: '',
    color: signal === 'STRONG' ? 'green' : signal === 'RISING' ? 'blue' : signal === 'WATCH' ? 'yellow' : 'gray',
    icon: '',
    updatesPerMinute,
    activityLevel,
    lastUpdate,
    details: []
  };
}

export function createLiquidityTooltip(poolLiquidity: number): LiquidityTooltipData {
  const formatLiquidity = (liquidity: number): string => {
    if (liquidity >= 1000000) return `$${(liquidity / 1000000).toFixed(1)}M`;
    if (liquidity >= 1000) return `$${(liquidity / 1000).toFixed(0)}K`;
    return `$${liquidity.toFixed(0)}`;
  };

  return {
    title: `Liquidity: ${formatLiquidity(poolLiquidity)}`,
    description: '',
    color: 'blue',
    icon: '',
    poolLiquidity,
    liquidityLevel: 'medium',
    tradingImplication: '',
    slippageEstimate: 0,
    details: []
  };
}

export function createAgeTooltip(ageMs: number, tokenFirstSeen?: number): AgeTooltipData {
  const formatAge = (ageMs: number): string => {
    if (ageMs <= 0) return '0s';

    const seconds = Math.floor(ageMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  const ageFormatted = formatAge(ageMs);

  return {
    title: `Age: ${ageFormatted}`,
    description: '',
    color: 'purple',
    icon: '',
    ageMs,
    ageFormatted,
    maturityLevel: 'growing',
    riskLevel: 'medium',
    creationTime: tokenFirstSeen ? new Date(tokenFirstSeen).toLocaleString() : undefined,
    details: []
  };
}

export function createSparklineTooltip(
  oneMinGain: number | null,
  twoMinGain: number | null,
  threeMinGain: number | null,
  fourMinGain: number | null,
  fiveMinGain: number | null,
  buyPressure5m?: number
): SparklineTooltipData {
  const gains = [
    { period: '1m', value: oneMinGain },
    { period: '2m', value: twoMinGain },
    { period: '3m', value: threeMinGain },
    { period: '4m', value: fourMinGain },
    { period: '5m', value: fiveMinGain }
  ];

  return {
    title: 'Price Changes',
    description: '',
    color: 'gray',
    icon: '',
    gains,
    buyPressure5m,
    trend: 'neutral',
    details: gains.map(g => ({
      label: g.period,
      value: g.value !== null ? `${g.value > 0 ? '+' : ''}${g.value.toFixed(1)}%` : '--',
      color: (g.value !== null ? (g.value >= 0 ? 'green' : 'red') : 'gray') as 'green' | 'red' | 'gray'
    }))
  };
}

export function createSignalTooltip(
  signal: 'STRONG' | 'RISING' | 'WATCH' | 'FLAT',
  signalStrength: number = 0,
  factors: string[] = []
): SignalTooltipData {
  const signalRanges = {
    STRONG: '45+',
    RISING: '30-44', 
    WATCH: '15-29',
    FLAT: '0-14'
  };

  return {
    title: `Updates/min: ${signalRanges[signal]}`,
    description: '',
    color: signal === 'STRONG' ? 'green' : signal === 'RISING' ? 'blue' : signal === 'WATCH' ? 'yellow' : 'gray',
    icon: '',
    signal,
    signalStrength,
    explanation: signal,
    factors,
    confidence: 100,
    details: []
  };
}