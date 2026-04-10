
import type { WinTier, LossTier } from '@/lib/types/celebrations';
import { WIN_TIERS } from '@/lib/config/win-tiers';
import { LOSS_TIERS } from '@/lib/config/loss-tiers';

export function determineWinTier(percentGain: number): WinTier | null {
  
  const tiers: WinTier[] = ['transcendent', 'godlike', 'mythical', 'epic', 'legendary', 'huge', 'big', 'decent', 'small', 'lil'];
  
  for (const tier of tiers) {
    if (percentGain >= WIN_TIERS[tier].threshold) {
      return tier;
    }
  }
  
  return null;
}

export function determineLossTier(percentLoss: number): LossTier | null {
  
  const absLoss = Math.abs(percentLoss);
  
  
  const tiers: LossTier[] = ['total_loss', 'extinction', 'apocalyptic', 'nuclear', 'catastrophic', 'devastating', 'major', 'significant', 'moderate', 'small'];
  
  for (const tier of tiers) {
    if (absLoss >= LOSS_TIERS[tier].threshold) {
      return tier;
    }
  }
  
  return null;
}

export function formatProfit(profit: number): string {
  if (profit < 0.01) {
    return `+$${profit.toFixed(4)}`;
  } else if (profit < 1) {
    return `+$${profit.toFixed(3)}`;
  } else if (profit < 10) {
    return `+$${profit.toFixed(2)}`;
  } else if (profit < 100) {
    return `+$${profit.toFixed(1)}`;
  } else {
    return `+$${Math.floor(profit)}`;
  }
}

export function formatLoss(loss: number): string {
  const absLoss = Math.abs(loss);
  if (absLoss < 0.01) {
    return `-$${absLoss.toFixed(4)}`;
  } else if (absLoss < 1) {
    return `-$${absLoss.toFixed(3)}`;
  } else if (absLoss < 10) {
    return `-$${absLoss.toFixed(2)}`;
  } else if (absLoss < 100) {
    return `-$${absLoss.toFixed(1)}`;
  } else {
    return `-$${Math.floor(absLoss)}`;
  }
}

