import { verifyPrivyToken } from '@/lib/api/privy-auth'
import { transactionDbService } from '@/lib/services/transaction-db-service'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  context: any
) {
  const { params } = context as { params: { transactionId: string } }
  try {
    const user = await verifyPrivyToken(request)
    const body = await request.json()
    
    await transactionDbService.updateTransaction(params.transactionId, body)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update transaction:', error)
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    )
  }
}