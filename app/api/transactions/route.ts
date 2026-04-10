import { NextRequest, NextResponse } from 'next/server'
import { transactionDbService } from '@/lib/services/transaction-db-service'
import { verifyPrivyToken } from '@/lib/api/privy-auth'

export async function GET(request: NextRequest) {
  try {
    const user = await verifyPrivyToken(request)
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const transactions = await transactionDbService.getTransactions(user.id, limit)
    
    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('Failed to fetch transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}