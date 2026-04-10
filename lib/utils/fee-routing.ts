
export interface FeeRouting {
  userPlatformFee: number; 
}

export const FEE_ROUTING: Record<string, FeeRouting> = {
  
  platform: {
    userPlatformFee: 0.01 
  },
  
  partner: {
    userPlatformFee: 0.009 
  }
};

type FeeDestination = keyof typeof FEE_ROUTING;

export function getFeeRouting(hasPartner: boolean): FeeRouting {
  const destination: FeeDestination = hasPartner ? 'partner' : 'platform';
  return FEE_ROUTING[destination];
}