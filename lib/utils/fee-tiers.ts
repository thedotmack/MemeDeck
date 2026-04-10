
interface FeeRouting {
  userPlatformFee: number;
  destination: 'platform' | 'hydra';
  partnerSharePercent: number;
}

export const FEE_ROUTING: Record<string, FeeRouting> = {
  
  default: {
    userPlatformFee: 0.01, 
    destination: 'platform',
    partnerSharePercent: 0 
  },
  
  standard: {
    userPlatformFee: 0.009, 
    destination: 'hydra', 
    partnerSharePercent: 10 
  },
  
  premium: {
    userPlatformFee: 0.009, 
    destination: 'hydra',
    partnerSharePercent: 33 
  }
};

export type UserTier = keyof typeof FEE_ROUTING;

