import { requireAuth } from '@/lib/api/privy-auth'
import { prisma } from '@/lib/db/client'
import { PartnerAccountService } from '@/lib/services/partner-account-service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    
    const user = await requireAuth(req)
    
    
    const userData = await prisma.users.findUnique({
      where: { userId: user.id },
      select: { 
        hydraWalletAddress: true,
        hydraFanoutId: true,
        privyUser: true
      }
    })
    
    if (!userData?.hydraWalletAddress) {
      return NextResponse.json(
        { error: 'No revenue sharing wallet found' },
        { status: 404 }
      )
    }
    
    
    let walletAddress: string | null = null
    if (userData.privyUser && typeof userData.privyUser === 'object' && 'wallet' in userData.privyUser) {
      const w = (userData.privyUser as { wallet?: unknown }).wallet
      if (w && typeof w === 'object' && 'address' in w) {
        const addr = (w as { address?: unknown }).address
        if (typeof addr === 'string' && addr.length > 0) walletAddress = addr
      }
    }
    if (!walletAddress) {
      return NextResponse.json({ error: 'User wallet address not found' }, { status: 400 })
    }
    
    
    const partnerService = new PartnerAccountService()
  const signature = await partnerService.closeRevenueShareWallet(walletAddress)
    
    
    await prisma.users.update({
      where: { userId: user.id },
      data: {
        hydraWalletAddress: null,
        hydraFanoutId: null,
        revSharePercentage: 0,
        feeTier: 'default'
      }
    })
    
    return NextResponse.json({
      success: true,
      signature,
      message: 'Revenue sharing account closed and rent refunded'
    })
  } catch (error) {
    console.error('[Hydra] Wallet close failed:', error)
    return NextResponse.json(
      { error: 'Failed to close revenue share wallet' },
      { status: 500 }
    )
  }
}