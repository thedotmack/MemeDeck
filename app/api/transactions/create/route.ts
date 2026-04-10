import { NextRequest, NextResponse } from 'next/server'
import { transactionDbService } from '@/lib/services/transaction-db-service'
import { verifyPrivyToken } from '@/lib/api/privy-auth'

export async function POST(request: NextRequest) {
  try {
    const user = await verifyPrivyToken(request)
    const body = await request.json()
    
    const transactionId = await transactionDbService.createTransaction({
      userId: user.id,
      walletAddress: body.walletAddress,
      transactionType: body.transactionType,
      tokenMint: body.tokenMint,
      tokenSymbol: body.tokenSymbol,
      amountUsd: body.amountUsd,
      ultraOrderRequest: body.ultraOrderRequest,
      ultraOrderResponse: body.ultraOrderResponse,
      metadata: body.metadata,
      
      status: body.status,
      finalTransactionHash: body.finalTransactionHash,
      executionRequest: body.executionRequest,
      executionResponse: body.executionResponse,
      confirmedAt: body.confirmedAt ? new Date(body.confirmedAt) : undefined
    })
    
    return NextResponse.json({ transactionId })
  } catch (error) {
    console.error('Failed to create transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}