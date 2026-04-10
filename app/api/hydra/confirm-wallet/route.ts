import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/privy-auth'
import { prisma } from '@/lib/db/client'
import { Connection, PublicKey } from '@solana/web3.js'

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    
    const { 
      hydraWalletAddress, 
      fanoutId, 
      sharePercentage, 
      userTier, 
      transactionSignature 
    } = await req.json()
    
    if (!hydraWalletAddress || !fanoutId || typeof sharePercentage !== 'number' || !userTier) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify the account actually exists on-chain before writing to DB
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL
    if (!rpcUrl) {
      throw new Error('NEXT_PUBLIC_RPC_URL not configured')
    }
    
    const connection = new Connection(rpcUrl)
    const fanoutPublicKey = new PublicKey(fanoutId)
    
    // Check if the Fanout account exists
    const accountInfo = await connection.getAccountInfo(fanoutPublicKey)
    
    if (!accountInfo) {
      return NextResponse.json(
        { error: 'Fanout account not found on-chain. Transaction may have failed or not confirmed yet.' },
        { status: 404 }
      )
    }

    // Write to DB now that we confirmed it's on-chain
    await prisma.users.update({
      where: { userId: user.id },
      data: {
        hydraWalletAddress,
        hydraFanoutId: fanoutId,
        revSharePercentage: sharePercentage,
        feeTier: userTier
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Hydra] Wallet confirmation failed:', error)
    return NextResponse.json(
      { error: 'Failed to confirm revenue share wallet' },
      { status: 500 }
    )
  }
}
