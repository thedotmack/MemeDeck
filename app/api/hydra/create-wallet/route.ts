import { NextRequest, NextResponse } from 'next/server'
import { PartnerAccountService } from '@/lib/services/partner-account-service'
import { requireAuth } from '@/lib/api/privy-auth'
import { prisma } from '@/lib/db/client'
import { Connection } from '@solana/web3.js'
import { FanoutClient } from '@metaplex-foundation/mpl-hydra/dist/src'

export async function POST(req: NextRequest) {
  try {
    
    const user = await requireAuth(req)
    
    const { userPublicKey, userTier } = await req.json()
    console.log(`[Hydra] Processing request for user ${user.id} with wallet ${userPublicKey}`);
    
    if (!process.env.DATABASE_URL) {
      console.error('[Hydra] CRITICAL: DATABASE_URL environment variable is MISSING at runtime!');
      return NextResponse.json(
        { error: 'Server configuration error: Database URL missing' },
        { status: 500 }
      )
    } else if (!process.env.DATABASE_URL.startsWith('postgresql://') && !process.env.DATABASE_URL.startsWith('postgres://')) {
      console.error('[Hydra] CRITICAL: DATABASE_URL has INVALID PROTOCOL!');
      return NextResponse.json(
        { error: 'Server configuration error: Database URL protocol invalid' },
        { status: 500 }
      )
    }
    
    const existingUser = await prisma.users.findUnique({
      where: { userId: user.id },
      select: { hydraWalletAddress: true }
    })
    
    if (existingUser?.hydraWalletAddress) {
      console.log(`[Hydra] User ${user.id} already has wallet: ${existingUser.hydraWalletAddress}`);
      return NextResponse.json(
        { error: 'User already has revenue sharing enabled' },
        { status: 400 }
      )
    }
    
    // Recovery check: Check if PDA already exists on-chain
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL
      if (rpcUrl) {
        const connection = new Connection(rpcUrl)
        // CRITICAL: Must use the EXACT same derivation as PartnerAccountService
        // PartnerAccountService uses: `md-${userPublicKey.slice(0, 21)}`
        const walletName = `md-${userPublicKey.slice(0, 21)}`
        const [fanoutId] = await FanoutClient.fanoutKey(walletName)
        const [nativeAccountId] = await FanoutClient.nativeAccount(fanoutId)
        
        console.log(`[Hydra] Checking recovery for ${walletName} (Fanout: ${fanoutId.toString()})`);
        const accountInfo = await connection.getAccountInfo(fanoutId)
        
        if (accountInfo) {
          console.log(`[Hydra] Recovery triggered: Account exists on-chain at ${fanoutId.toString()}`);
          return NextResponse.json({
            alreadyExists: true,
            hydraWalletAddress: nativeAccountId.toString(),
            fanoutId: fanoutId.toString(),
            sharePercentage: 10,
            userTier: userTier || 'standard'
          })
        }
      }
    } catch (e) {
      console.warn('[Hydra] PDA recovery check failed:', e)
    }

    const partnerService = new PartnerAccountService()
    const result = await partnerService.createRevenueShareWallet(
      user.id,
      userPublicKey,
      userTier
    )
    
    console.log(`[Hydra] Successfully built creation transaction for ${userPublicKey}`);
    return NextResponse.json({
      transaction: result.transaction,
      hydraWalletAddress: result.hydraWalletAddress,
      fanoutId: result.fanoutId,
      sharePercentage: result.sharePercentage,
      userTier: userTier || 'standard'
    })
  } catch (error: any) {
    console.error('[Hydra] Wallet creation failed:', error)
    return NextResponse.json(
      { error: 'Failed to create revenue share wallet', details: error.message },
      { status: 500 }
    )
  }
}