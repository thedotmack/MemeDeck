import { requireAuth } from '@/lib/api/privy-auth';
import { prisma } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPartnerSharePercent } from '@/lib/utils/partner-tiers';


const CreatePartnerSchema = z.object({
  partnerCode: z.string().min(3).max(20).regex(/^[A-Z0-9]+$/),
  tier: z.enum(['standard', 'premium']).default('standard'),
  walletAddress: z.string().min(32).optional() 
});

export async function POST(request: NextRequest) {
  try {
    
    const auth = await requireAuth(request);
    const userId = auth.id;
    
    const body = await request.json();
    const data = CreatePartnerSchema.parse(body);
    
    
    try {
      const partner = await prisma.partner.create({
        data: {
          userId,
          partnerCode: data.partnerCode,
          tier: data.tier,
          walletAddress: data.walletAddress || null
        }
      });
      
      
      const serializedPartner = {
        ...partner,
        totalEarningsLamports: partner.totalEarningsLamports.toString(),
        totalClaimedLamports: partner.totalClaimedLamports.toString(),
        codeCustomized: partner.codeCustomized
      };
      
      return NextResponse.json(serializedPartner, { status: 201 });
      
    } catch (dbError: any) {
      console.error('[Partners] DB Error creating partner:', dbError);
      
      const code = typeof dbError === 'object' && dbError && 'code' in dbError ? (dbError as { code?: unknown }).code : undefined
      const target = typeof dbError === 'object' && dbError && 'meta' in dbError && (dbError as { meta?: { target?: unknown } }).meta
        ? (dbError as { meta?: { target?: unknown } }).meta!.target
        : undefined
      if (code === 'P2002') {
  if (typeof target === 'string' && target.includes('userId')) {
          
          const existingPartner = await prisma.partner.findUnique({
            where: { userId }
          });
          if (!existingPartner) {
            return NextResponse.json({ error: 'Partner not found after duplicate detection', details: dbError.message }, { status: 500 });
          }
          const serializedPartner = {
            ...existingPartner,
            totalEarningsLamports: existingPartner.totalEarningsLamports.toString(),
            totalClaimedLamports: existingPartner.totalClaimedLamports.toString(),
            codeCustomized: existingPartner.codeCustomized
          };
          return NextResponse.json(serializedPartner, { status: 200 });
  } else if (typeof target === 'string' && target.includes('partnerCode')) {
          return NextResponse.json({ error: 'Partner code already exists' }, { status: 400 });
        }
      }
      return NextResponse.json({ error: 'Database error creating partner', details: dbError.message }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Partner creation error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
  const message = typeof error === 'object' && error && 'message' in error ? (error as { message?: unknown }).message : undefined
  if (typeof message === 'string' && (message.includes('Authentication') || message.includes('Access denied'))) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    
    const auth = await requireAuth(request);
    const userId = auth.id;
    
    
    const partner = await prisma.partner.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            userId: true,
            privyUser: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            referrals: true,
            feeTransactions: true
          }
        }
      }
    });
    
    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }
    
    
    
    const referralTransactions = await prisma.transaction.findMany({
      where: {
        user: {
          referredBy: partner.userId
        },
        feeAmountLamports: {
          not: null
        },
        status: 'confirmed'
      },
      select: {
        feeAmountLamports: true,
        user: {
          select: {
            feeTier: true
          }
        }
      }
    });
    
    
    let calculatedEarningsLamports = BigInt(0);
    for (const tx of referralTransactions) {
      if (!tx.feeAmountLamports) continue;
      
      
      const partnerTier = tx.user.feeTier as any;
      const partnerSharePercent = getPartnerSharePercent(partnerTier || 'standard');
      
      
      const referrerSharePercent = partnerSharePercent / 100; 
      const referrerShare = BigInt(Math.floor(Number(tx.feeAmountLamports) * referrerSharePercent));
      
      calculatedEarningsLamports += referrerShare;
    }
    
    
    const calculatedClaimedLamports = BigInt(0);
    
    
    const serializedPartner = {
      ...partner,
      totalEarningsLamports: calculatedEarningsLamports.toString(),
      totalClaimedLamports: calculatedClaimedLamports.toString(),
      codeCustomized: partner.codeCustomized
    };
    
    return NextResponse.json(serializedPartner);
  } catch (error: any) {
    console.error('Partner lookup error:', error);
  const message = typeof error === 'object' && error && 'message' in error ? (error as { message?: unknown }).message : undefined
  if (typeof message === 'string' && (message.includes('Authentication') || message.includes('Access denied'))) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}