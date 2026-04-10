
import BN from 'bn.js';


const LAMPORTS_PER_SOL = new BN(1_000_000_000);

export function usdToLamportsBN(usd: number, solPrice: number): BN {
  
  
  const usdBasisPoints = new BN(Math.round(usd * 100));
  const solPriceBasisPoints = new BN(Math.round(solPrice * 100));
  
  
  
  
  return usdBasisPoints.mul(LAMPORTS_PER_SOL).div(solPriceBasisPoints);
}

function lamportsToUsdCentsBN(lamports: BN, solPrice: number): BN {
  
  const solPriceBasisPoints = new BN(Math.round(solPrice * 100));
  
  
  
  
  return lamports.mul(solPriceBasisPoints).div(LAMPORTS_PER_SOL);
}

export function lamportsToUsdNumber(lamports: BN, solPrice: number): number {
  const usdCents = lamportsToUsdCentsBN(lamports, solPrice);
  return usdCents.toNumber() / 100;
}

