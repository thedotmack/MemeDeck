import { requireAuth } from '@/lib/api/privy-auth'
import { prisma } from '@/lib/db/client'
import { BorshAccountsCoder, utils } from '@coral-xyz/anchor'
import { Fanout, FanoutClient, FanoutMembershipVoucher } from '@metaplex-foundation/mpl-hydra/dist/src'
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import bs58 from 'bs58'
import { NextRequest, NextResponse } from 'next/server'
import { extractSolanaWalletFromPrivyUser } from '@/lib/utils/privy-wallet-extract'

const HYDRA_PROGRAM_ID = new PublicKey('hyDQ4Nz1eYyegS6JfenyKwKzYxRsCWCriYSAjtzP4Vg')

export async function GET(req: NextRequest) {
  let userData: { hydraWalletAddress: string | null; hydraFanoutId: string | null; privyUser: any | null } | null = null

  try {
    const user = await requireAuth(req)

    userData = await prisma.users.findUnique({
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

    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL
    if (!rpcUrl) {
      console.error('[Hydra] NEXT_PUBLIC_RPC_URL not set; returning fallback earnings data')
      return NextResponse.json(buildFallbackResponse(userData, 'RPC URL not configured'))
    }

    const connection = new Connection(rpcUrl)

    let hydraControlWallet: Keypair | undefined

    if (process.env.HYDRA_CONTROL_WALLET_PRIVATE_KEY) {
      try {
        const privateKeyBytes = bs58.decode(process.env.HYDRA_CONTROL_WALLET_PRIVATE_KEY)
        hydraControlWallet = Keypair.fromSecretKey(privateKeyBytes)
      } catch (walletError) {
        console.error('[Hydra] Failed to decode control wallet key:', walletError)
      }
    } else {
      console.warn('[Hydra] HYDRA_CONTROL_WALLET_PRIVATE_KEY not set; using read-only Hydra client')
    }

    const readOnlyWallet = hydraControlWallet ?? Keypair.generate()

    const hydraControlWalletWrapper = {
      publicKey: readOnlyWallet.publicKey,
      signTransaction: async (tx: any) => tx,
      signAllTransactions: async (txs: any[]) => txs,
    }

    const fanoutSdk = new FanoutClient(connection, hydraControlWalletWrapper)
    const userPublicKey = new PublicKey(actualWalletAddress)
    const fanoutId = new PublicKey(userData.hydraFanoutId)

    const programAccounts = await connection.getProgramAccounts(HYDRA_PROGRAM_ID, {
      filters: [
        {
          memcmp: {
            offset: 0,
            bytes: utils.bytes.bs58.encode(
              (BorshAccountsCoder as any).accountDiscriminator('fanoutMembershipVoucher')
            ),
          },
        },
        {
          memcmp: {
            offset: 8,
            bytes: fanoutId.toBase58(),
          },
        },
      ],
    })

    const userVoucher = programAccounts.find(account => {
      const voucher = FanoutMembershipVoucher.fromAccountInfo(account.account)[0]
      return voucher.membershipKey.toString() === userPublicKey.toString()
    })

    if (!userVoucher) {
      return NextResponse.json(
        { error: 'User is not a member of this fanout' },
        { status: 400 }
      )
    }

    const userVoucherData = FanoutMembershipVoucher.fromAccountInfo(userVoucher.account)[0]

    const fanout = await fanoutSdk.fetch<Fanout>(fanoutId, Fanout)

    const [nativeAccount] = await FanoutClient.nativeAccount(fanoutId)
    const [fanoutBalance, nativeBalance] = await Promise.all([
      connection.getBalance(fanoutId),
      connection.getBalance(nativeAccount),
    ])

    const totalBalanceLamports = fanoutBalance + nativeBalance
    const totalBalanceSol = totalBalanceLamports / LAMPORTS_PER_SOL

    const userShares = Number(userVoucherData.shares)
    const totalShares = Number(fanout.totalShares)
    const shareRatio = totalShares > 0 ? userShares / totalShares : 0
    const userSharesPercent = shareRatio * 100

    const userClaimableLamports = Math.floor(totalBalanceLamports * shareRatio)
    const userClaimableSol = userClaimableLamports / LAMPORTS_PER_SOL

    const userClaimedLamports = Number(userVoucherData.totalInflow)
    const userClaimedSol = userClaimedLamports / LAMPORTS_PER_SOL

    return NextResponse.json({
      fanoutId: fanoutId.toString(),
      nativeAccount: nativeAccount.toString(),
      totalBalanceSol,
      totalBalanceLamports,
      userShares,
      totalShares,
      userSharesPercent,
      userClaimableSol,
      userClaimableLamports,
      userClaimedSol,
      userClaimedLamports,
      fallback: false,
    })
  } catch (error) {
    console.error('[Hydra] Get earnings failed:', error)

    if (userData?.hydraWalletAddress && userData.hydraFanoutId) {
      return NextResponse.json(
        buildFallbackResponse(userData, error instanceof Error ? error.message : 'Unknown error')
      )
    }

    return NextResponse.json(
      { error: 'Failed to get earnings data' },
      { status: 500 }
    )
  }
}

function buildFallbackResponse(
  userData: { hydraWalletAddress: string | null; hydraFanoutId: string | null },
  reason: string
) {
  return {
    fanoutId: userData.hydraFanoutId,
    nativeAccount: userData.hydraWalletAddress,
    totalBalanceSol: 0,
    totalBalanceLamports: 0,
    userShares: 0,
    totalShares: 0,
    userSharesPercent: 0,
    userClaimableSol: 0,
    userClaimableLamports: 0,
    userClaimedSol: 0,
    userClaimedLamports: 0,
    fallback: true,
    reason,
  }
}