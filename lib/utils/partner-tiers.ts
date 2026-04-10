
export const PARTNER_SHARE_LEVELS: Record<string, number> = {
  
  standard: 10,
  
  
  premium: 33
};

export type PartnerTier = keyof typeof PARTNER_SHARE_LEVELS; 

export function getPartnerSharePercent(tier: PartnerTier): number {
  return PARTNER_SHARE_LEVELS[tier] || PARTNER_SHARE_LEVELS.standard;
}