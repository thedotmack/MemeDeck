import { requireAuth } from '@/lib/api/privy-auth'
import { prisma } from '@/lib/db/client'
import { FanoutClient } from '@metaplex-foundation/mpl-hydra/dist/src'
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js'
import bs58 from 'bs58'
import { NextRequest, NextResponse } from 'next/server'
import { extractSolanaWalletFromPrivyUser } from '@/lib/utils/privy-wallet-extract'

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth(req)
    
    // Get user's hydra data from database
    const userData = await prisma.users.findUnique({
      where: { userId: user.id },
      select: {
        hydraWalletAddress: true,
        hydraFanoutId: true,
        privyUser: true,
      },
    })

    if (!userData?.hydraWalletAddress || !userData?.hydraFanoutId) {
      return NextResponse.json(
        { error: 'Revenue sharing not set up for this user' },
        { status: 400 }
      )
    }

    const actualWalletAddress = extractSolanaWalletFromPrivyUser(userData.privyUser)
    if (!actualWalletAddress) {
      return NextResponse.json(
        { error: 'Could not find user Solana wallet' },
        { status: 400 }
      )
    }
    
    // Initialize connection and hydra control wallet
    const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!)
    
    if (!process.env.HYDRA_CONTROL_WALLET_PRIVATE_KEY) {
      throw new Error('HYDRA_CONTROL_WALLET_PRIVATE_KEY environment variable not set')
    }
    
    const privateKeyBytes = bs58.decode(process.env.HYDRA_CONTROL_WALLET_PRIVATE_KEY)
    const hydraControlWallet = Keypair.fromSecretKey(privateKeyBytes)
    
    const hydraControlWalletWrapper = {
      publicKey: hydraControlWallet.publicKey,
      signTransaction: async (tx: Transaction) => {
        tx.partialSign(hydraControlWallet)
        return tx
      },
      signAllTransactions: async (txs: Transaction[]) => {
        txs.forEach(tx => tx.partialSign(hydraControlWallet))
        return txs
      }
    }
    
    // Create fanout client and distribution instructions
    const fanoutSdk = new FanoutClient(connection, hydraControlWalletWrapper)
    const userPublicKey = new PublicKey(actualWalletAddress)
    const fanoutId = new PublicKey(userData.hydraFanoutId)
    
    const distMember = await fanoutSdk.distributeWalletMemberInstructions({
      distributeForMint: false,
      member: userPublicKey,
      fanout: fanoutId,
      payer: userPublicKey,
    })
    
    // Build transaction
    const transaction = new Transaction()
    transaction.add(...distMember.instructions)
    
    // Set user as fee payer (same pattern as wallet creation)
    transaction.feePayer = userPublicKey
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    
    // Serialize transaction for client
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    }).toString('base64')
    
    return NextResponse.json({
      transaction: serializedTransaction
    })
  } catch (error) {
    console.error('[Hydra] Claim earnings failed:', error)
    return NextResponse.json(
      { error: 'Failed to create claim transaction' },
      { status: 500 }
    )
  }
}