'use client';

import { useStore } from '@/lib/store';
import { Celebration3DEnhanced } from '@/components/effects/celebration-3d-enhanced';
import { formatProfit, formatLoss } from '@/lib/utils/win-detection';

export function CelebrationEnhancedOverlay() {
  const celebration = useStore.use.celebration() || {};
  const lossAnimation = useStore.use.lossAnimation() || {};
  
  
  const isWin = celebration.isActive;
  const isLoss = !isWin && lossAnimation.isActive;
  
  
  const getVariant = () => {
    if (isWin && celebration.tier) {
      
      const winTierMap = {
        'small': '3d-small',
        'decent': '3d-decent',
        'big': '3d-big',
        'huge': '3d-huge',
        'legendary': '3d-legendary',
        'epic': '3d-epic',
        'mythical': '3d-mythical',
        'godlike': '3d-godlike',
        'transcendent': '3d-transcendent'
      } as const;
      return winTierMap[celebration.tier as keyof typeof winTierMap] || '3d-small';
    }
    
    if (isLoss && lossAnimation.tier) {
      
      const lossTierMap = {
        'small': '3d-ouch',
        'moderate': '3d-bruised',
        'significant': '3d-wounded',
        'major': '3d-bleeding',
        'devastating': '3d-crushed',
        'catastrophic': '3d-shattered',
        'nuclear': '3d-obliterated',
        'apocalyptic': '3d-annihilated',
        'extinction': '3d-vaporized',
        'total_loss': '3d-rug-burning'
      } as const;
      return lossTierMap[lossAnimation.tier as keyof typeof lossTierMap] || '3d-ouch';
    }
    
    return '3d-small';
  };
  
  const isActive = isWin || isLoss;
  const percentChange = isWin ? celebration.percentGain : (isLoss ? -lossAnimation.percentLoss : 0);
  const dollarAmount = isWin ? celebration.profit : (isLoss ? -Math.abs(lossAnimation.loss) : 0);
  
  return (
    <Celebration3DEnhanced
      isActive={isActive}
      variant={getVariant()}
      percentChange={percentChange}
      dollarAmount={dollarAmount}
      intensity="normal"
    />
  );
}