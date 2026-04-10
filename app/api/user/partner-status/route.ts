import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/privy-auth'
import { prisma } from '@/lib/db/client'

export async function GET(req: NextRequest) {
  try {
    
    const user = await requireAuth(req)
    
    
    const userData = await prisma.users.findUnique({
      where: { userId: user.id },
      select: { 
        hydraWalletAddress: true,
        revSharePercentage: true
      }
    })
    
    
    const hasPartnerAccount = !!userData?.hydraWalletAddress
    
    if (!hasPartnerAccount) {
      return NextResponse.json({
        hasPartnerAccount: false,
        partnerWallet: null,
        referralCode: null,
        revenueSharePercentage: 0,
        totalEarnings: 0
      })
    }
    
    
    const referralCode = user.id.slice(0, 6).toUpperCase()
    
    
    
    const totalEarnings = 0
    
    return NextResponse.json({
      hasPartnerAccount: true,
      partnerWallet: userData.hydraWalletAddress,
      referralCode: referralCode,
      revenueSharePercentage: userData.revSharePercentage || 0,
      totalEarnings: totalEarnings
    })
    
  } catch (error: any) {
    console.error('[Partner] Partner status lookup failed:', error)
    return NextResponse.json({
      hasPartnerAccount: false,
      partnerWallet: null,
      referralCode: null,
      revenueSharePercentage: 0,
      totalEarnings: 0,
      error: 'Failed to look up partner status',
      details: error.message
    }, { status: 500 })
  }
}