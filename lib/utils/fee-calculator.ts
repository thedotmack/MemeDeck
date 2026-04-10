import BN from 'bn.js';
import { getFeeRouting, type FeeRouting } from './fee-routing';

export interface FeeCalculation {
  grossAmount: BN;
  platformFee: BN;
  referrerShare: BN;
  userDiscount: BN; 
  netPlatformFee: BN;
  userPays: BN;
}

export function calculateTradeFees(
  tradeAmount: BN,
  hasPartner: boolean = false
): FeeCalculation {
  const feeRouting = getFeeRouting(hasPartner);
  
  
  
  const platformFeeBP = new BN(Math.round(feeRouting.userPlatformFee * 10000));
  const referrerShareBP = new BN(0); 
  const basisPointDivisor = new BN(10000);
  
  
  const platformFee = tradeAmount.mul(platformFeeBP).div(basisPointDivisor);
  const referrerShare = new BN(0); 
  const userDiscount = new BN(0); 
  const netPlatformFee = platformFee; 
  const userPays = platformFee; 
  
  return {
    grossAmount: tradeAmount,
    platformFee,
    referrerShare,
    userDiscount,
    netPlatformFee,
    userPays
  };
}