import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';

const ValidateSchema = z.object({
  referralCode: z.string().min(3).max(20)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referralCode } = ValidateSchema.parse(body);
    
    const partner = await prisma.partner.findUnique({
      where: { 
        partnerCode: referralCode.toUpperCase(),
        isActive: true 
      },
      select: {
        id: true,
        userId: true,
        partnerCode: true,
        tier: true,
        walletAddress: true,
        _count: {
          select: {
            referrals: true
          }
        }
      }
    });
    
    if (!partner) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Referral code not found or inactive' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      valid: true, 
      tier: partner.tier,
      partnerId: partner.id,
      userId: partner.userId,
      partnerCode: partner.partnerCode,
      referralCount: partner._count.referrals
    });
  } catch (error) {
    console.error('Referral validation error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}