import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/privy-auth'
import { prisma } from '@/lib/db/client'

export async function GET(req: NextRequest) {
  try {
    
    const user = await requireAuth(req)
    
    
    const currentUserData = await prisma.users.findUnique({
      where: { userId: user.id },
      select: { referredBy: true }
    })
    
    
    if (!currentUserData?.referredBy) {
      return NextResponse.json({
        referredByUserId: null,
        referredByCode: null,
        feeDestination: process.env.NEXT_PUBLIC_PLATFORM_FEES_WALLET_PUBLIC_KEY!
      })
    }
    
    
    const referrerData = await prisma.users.findUnique({
      where: { userId: currentUserData.referredBy },
      select: { 
        userId: true,
        hydraWalletAddress: true
      }
    });
    
    if (!referrerData) {
      
      return NextResponse.json({
        referredByUserId: currentUserData.referredBy,
        referredByCode: null,
        feeDestination: process.env.NEXT_PUBLIC_PLATFORM_FEES_WALLET_PUBLIC_KEY!
      })
    }
    
    
    const referredByCode = referrerData.userId.slice(0, 6).toUpperCase()
    
    
    const feeDestination = referrerData.hydraWalletAddress || 
                          process.env.NEXT_PUBLIC_PLATFORM_FEES_WALLET_PUBLIC_KEY!
    
    return NextResponse.json({
      referredByUserId: referrerData.userId,
      referredByCode: referredByCode,
      feeDestination: feeDestination
    })
    
  } catch (error) {
    console.error('[User] Referred-by lookup failed:', error)
    return NextResponse.json({
      referredByUserId: null,
      referredByCode: null, 
      feeDestination: process.env.NEXT_PUBLIC_PLATFORM_FEES_WALLET_PUBLIC_KEY!
    }, { status: 200 })
  }
}