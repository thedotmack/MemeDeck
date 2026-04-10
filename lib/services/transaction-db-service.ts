import { prisma } from '@/lib/db/client'

interface CreateTransactionParams {
  userId: string
  walletAddress: string
  transactionType: 'buy' | 'sell' | 'swap'
  tokenMint: string
  tokenSymbol?: string
  amountUsd: number
  ultraOrderRequest?: any
  ultraOrderResponse?: any
  metadata?: any
  feeTransactionId?: string
  feeAmountLamports?: bigint
  
  status?: 'pending' | 'confirmed' | 'failed' | 'cancelled'
  finalTransactionHash?: string
  executionRequest?: any
  executionResponse?: any
  confirmedAt?: Date
}

interface UpdateTransactionParams {
  status?: 'pending' | 'confirmed' | 'failed' | 'cancelled'
  finalTransactionHash?: string
  errorMessage?: string
  executionRequest?: any
  executionResponse?: any
  confirmedAt?: Date
  feeTransactionId?: string
  feeAmountLamports?: bigint
}

export const transactionDbService = {
  
  async createTransaction(params: CreateTransactionParams): Promise<string> {
    const transaction = await prisma.transaction.create({
      data: {
        userId: params.userId,
        walletAddress: params.walletAddress,
        transactionType: params.transactionType,
        tokenMint: params.tokenMint,
        tokenSymbol: params.tokenSymbol,
        amountUsd: params.amountUsd,
        ultraOrderRequest: params.ultraOrderRequest,
        ultraOrderResponse: params.ultraOrderResponse,
        metadata: params.metadata,
        feeTransactionId: params.feeTransactionId,
        feeAmountLamports: params.feeAmountLamports,
        
        status: params.status || 'pending',
        finalTransactionHash: params.finalTransactionHash,
        executionRequest: params.executionRequest,
        executionResponse: params.executionResponse,
        confirmedAt: params.confirmedAt,
      }
    })
    
    return transaction.id
  },

  
  async updateTransaction(transactionId: string, updates: UpdateTransactionParams): Promise<void> {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: updates
    })
  },

  
  async getTransactions(userId: string, limit: number = 50): Promise<any[]> {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
    
    return transactions
  },

  
  async getTransaction(transactionId: string): Promise<any | null> {
    return await prisma.transaction.findUnique({
      where: { id: transactionId }
    })
  }
}