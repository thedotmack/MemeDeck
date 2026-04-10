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
    
    
    if (currentUserData?.referredBy) {
      const referrerData = await prisma.users.findUnique({
        where: { userId: currentUserData.referredBy },
        select: { hydraWalletAddress: true }
      });
      
      
      if (referrerData?.hydraWalletAddress) {
        return NextResponse.json(referrerData.hydraWalletAddress)
      }
    }
    
    
    const platformWallet = process.env.NEXT_PUBLIC_PLATFORM_FEES_WALLET_PUBLIC_KEY!
    return NextResponse.json(platformWallet)
    
  } catch (error) {
    console.error('[Fees] Fee destination lookup failed:', error)
    
    
    const platformWallet = process.env.NEXT_PUBLIC_PLATFORM_FEES_WALLET_PUBLIC_KEY!
    return NextResponse.json(platformWallet)
  }
}