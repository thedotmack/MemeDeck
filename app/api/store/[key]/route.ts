import { requireAuth } from '@/lib/api/privy-auth';
import { prisma } from '@/lib/db/client';
import { isRecord } from '@/lib/types/guards';
import { PrivyClient } from '@privy-io/node';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';


const StoreDataSchema = z.object({ referredBy: z.string().max(64).optional() }).catchall(z.unknown())


interface PersistedPrivyUser {
  id?: string
  wallet?: { address?: string | null } | null
  [k: string]: unknown
}
function sanitizePrivyUser(u: unknown): PersistedPrivyUser {
  if (!isRecord(u)) return {}
  const walletRaw = 'wallet' in u ? (u as Record<string, unknown>).wallet : undefined
  const wallet = isRecord(walletRaw) ? walletRaw as { address?: string | null } : undefined
  return {
    id: typeof (u as Record<string, unknown>).id === 'string' ? (u as Record<string, unknown>).id as string : undefined,
    wallet: wallet ? { address: typeof wallet.address === 'string' ? wallet.address : null } : null,
    ...(u as Record<string, unknown>)
  }
}

const privy = new PrivyClient({
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  try {
    const authResult = await requireAuth(request)
    const userId = authResult.id
    const { key } = await params

    if (!process.env.DATABASE_URL) {
      console.error('[Store] CRITICAL: DATABASE_URL is MISSING!');
      return new NextResponse('Database configuration error', { status: 500 })
    }

    const user = await prisma.users.findUnique({
      where: { userId },
      select: { 
        storeData: true,
        referredBy: true
      }
    })

    if (!user) {
      
      const fullUser = await privy.users()._get(userId) as any
  const privyUser = sanitizePrivyUser(fullUser)
      await prisma.users.create({
        data: {
          userId,
          privyUser: JSON.parse(JSON.stringify(privyUser)),
          storeData: {},
        },
      })
      return new NextResponse(JSON.stringify({}))
    }

    
  const storeData = (user.storeData && typeof user.storeData === 'object') ? { ...(user.storeData as Record<string, unknown>) } : {}
    if (user.referredBy) {
      storeData.referredBy = user.referredBy
    }

    return new NextResponse(JSON.stringify(storeData))
  } catch (error) {
    console.error('Store GET error:', error)
    return new NextResponse(null, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  try {
    const authResult = await requireAuth(request)
    const userId = authResult.id
    const { key } = await params
    const body = await request.text() 

    
    
    
    

  let jsonUnknown: unknown
  try { jsonUnknown = JSON.parse(body) } catch { return new NextResponse('Invalid JSON', { status: 400 }) }
  const parsed = StoreDataSchema.safeParse(jsonUnknown)
  if (!parsed.success) return new NextResponse('Invalid store data', { status: 400 })
  const data = parsed.data

    
    const fullUser = await privy.users()._get(userId) as any

    
  const referredBy = 'referredBy' in data ? (data.referredBy ?? null) : null
    
    
    
    
    
    

    
    const existingUser = await prisma.users.findUnique({
      where: { userId },
      select: { referredBy: true }
    })

    
    let referralToSync = null
    if (!existingUser?.referredBy) {
      try {
        
        const walletAddress = fullUser.wallet?.address
        
        if (walletAddress) {
          console.log(`🔗 [REFERRAL] Checking for pending referral sync for wallet: ${walletAddress}`)
          
          const pendingReferral = await prisma.referral.findFirst({
            where: { 
              referredWalletAddress: walletAddress 
            },
            include: {
              referrer: {
                select: { userId: true, partnerCode: true }
              }
            }
          })
          
          if (pendingReferral) {
            referralToSync = pendingReferral.referrer.userId
            console.log(`🔗 [REFERRAL] Found pending referral for wallet ${walletAddress}: ${pendingReferral.referrer.partnerCode}`)
          }
        }
      } catch (error) {
        console.error('🔗 [REFERRAL] Error checking pending referral sync:', error)
      }
    }

    
    const isTestUser = userId === 'did:privy:cmds0uqoc00gnji0bc1s9tymc'
    
    
    const finalReferredBy = referredBy || referralToSync || existingUser?.referredBy || null
    
    console.log(`🔗 [STORE-DEBUG] Final referredBy decision for user ${userId}:`, {
      storeReferredBy: referredBy,
      referralToSync,
      existingReferredBy: existingUser?.referredBy,
      finalReferredBy,
      isTestUser,
      willUpdate: !existingUser || !existingUser?.referredBy || isTestUser || referralToSync
    });
    
  const sanitized = sanitizePrivyUser(fullUser)
  const result = await prisma.users.upsert({
      where: { userId },
      update: {
    privyUser: JSON.parse(JSON.stringify(sanitized)),
    storeData: JSON.parse(JSON.stringify({ ...data })),
        
        ...((finalReferredBy && (!existingUser?.referredBy || isTestUser || referralToSync)) ? { referredBy: finalReferredBy } : {})
      },
      create: {
        userId,
    privyUser: JSON.parse(JSON.stringify(sanitized)),
    storeData: JSON.parse(JSON.stringify({ ...data })),
        referredBy: finalReferredBy
      }
    })
    
    console.log(`🔗 [STORE-DEBUG] Database upsert result for user ${userId}:`, {
      operation: existingUser ? 'update' : 'create',
      savedReferredBy: result.referredBy
    });

    
    if (referralToSync && !existingUser?.referredBy) {
      console.log(`🔗 [REFERRAL] Successfully synced pending referral to Users table for user ${userId}`)
    }

    return new NextResponse('OK')
  } catch (error) {
    console.error('Store POST error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  try {
    const authResult = await requireAuth(request)
    const userId = authResult.id
    const { key } = await params

    
    await prisma.users.update({
      where: { userId },
      data: {
        storeData: {},
        updatedAt: new Date()
      }
    })

    return new NextResponse('OK')
  } catch (error) {
    console.error('Store DELETE error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}