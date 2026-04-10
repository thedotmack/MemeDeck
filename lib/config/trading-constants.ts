

export const ULTRA_API_BASE_URL = 'https://ultra-api.jup.ag';

export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

export const TRADING_FEE_PERCENTAGE = 0.01;
export const ESTIMATED_NETWORK_FEE_SOL = 0;

export const PAPER_TRADE_PREFIX = 'paper_';
export const PAPER_TRADE_MAX_SLIPPAGE = 0.5;

export const SIGNIFICANT_PRICE_MOVEMENT = 5;

export const CONFIRMATION_POLLING_CONFIG = {
  // Fast, simple polling for UI responsiveness
  // 100ms per plan
  POLL_INTERVAL: 100,
  // 10s timeout per plan
  MAX_POLL_TIME: 10000,
  
  
  PROGRESS_LOG_INTERVAL: 10000,
} as const;


