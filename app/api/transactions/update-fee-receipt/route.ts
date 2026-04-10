import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/privy-auth'
import { prisma } from '@/lib/db/client'

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const { transactionId, feeReceipt, feeTransactionId, feeAmountLamports } = await req.json()
    
    if (!transactionId || !feeReceipt) {
      return NextResponse.json(
        { error: 'Missing transactionId or feeReceipt' },
        { status: 400 }
      )
    }
    
    
    await prisma.transaction.update({
      where: { 
        id: transactionId,
        userId: user.id 
      },
      data: { 
        feeReceipt: feeReceipt,
        feeTransactionId: feeTransactionId,
        feeAmountLamports: feeAmountLamports ? BigInt(feeAmountLamports) : undefined
      }
    })
    
    console.log(`[Transactions] Fee receipt updated for transaction ${transactionId}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Transactions] Fee receipt update failed:', error)
    return NextResponse.json(
      { error: 'Failed to update fee receipt' },
      { status: 500 }
    )
  }
}