import type { Transaction as DbTransaction } from '@prisma/client'

export interface DatabaseLinkedTrade {
  buyTx: DbTransaction
  sellTx: DbTransaction
  pnl: number
  pnlPercent: number
  holdingTime: number
  tokenSymbol?: string
  tokenMint: string
  
  
  ultraOrderResponse?: unknown
  executionResponse?: unknown
}

