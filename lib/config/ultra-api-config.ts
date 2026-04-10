
export interface UltraOrderParams {
  inputMint: string;
  outputMint: string;
  amount: number | string;
  taker?: string;
}

export interface UltraOrderResponse {
  transaction: string;
  requestId: string;
  swapType: 'aggregator' | 'rfq';
  inAmount: string;
  outAmount: string;
  routePlan: any[];
  priceImpactPct: number;
  slippageBps: number;
  feeMint?: string; 
  message?: string;
  error?: string | {
    message?: string;
    code?: number | string;
    details?: unknown;
    [key: string]: unknown;
  };
}

export interface UltraExecuteParams {
  signedTransaction: string;
  requestId: string;
}

export interface UltraExecuteResponse {
  status: 'Success' | 'Failed';
  signature: string;
  inputAmountResult?: string;
  outputAmountResult?: string;
  error?: string;
}

export interface UltraBalanceResponse {
  [tokenMint: string]: {
    amount: string;
    uiAmount: number;
    slot: number;
    isFrozen: boolean;
  };
}

export const ULTRA_ERROR_CODES = {
  ULTRA_ENDPOINT: {
    UNKNOWN: -1,
    SUCCESS: 0
  },
  AGGREGATOR_SWAP: {
    UNKNOWN: -1000,
    INSUFFICIENT_BALANCE: -1001,
    SLIPPAGE_EXCEEDED: -1002,
    ROUTE_NOT_FOUND: -1003,
    TRANSACTION_FAILED: -1004
  },
  RFQ_SWAP: {
    UNKNOWN: -2000,
    INSUFFICIENT_BALANCE: -2001,
    SLIPPAGE_EXCEEDED: -2002,
    QUOTE_EXPIRED: -2003,
    TRANSACTION_FAILED: -2004
  }
};