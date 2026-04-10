import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { calculateTradeFees } from '@/lib/utils/fee-calculator';
import BN from 'bn.js';
import { prisma } from '@/lib/db/client';

const StatusSchema = z.object({
  userId: z.string().min(1)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = StatusSchema.parse(body);
    
    console.log(`🔗 [STATUS] Checking referral status for user ID: ${userId}`);
    
    let referral = null;
    
    const user = await prisma.users.findUnique({
      where: { userId },
      select: { referredBy: true }
    });
    
    if (user?.referredBy) {
      
      const partner = await prisma.partner.findUnique({
        where: { userId: user.referredBy },
        select: { partnerCode: true, tier: true }
      });
      
      if (partner) {
        referral = {
          referrer: {
            partnerCode: partner.partnerCode,
            tier: partner.tier
          },
          appliedAt: new Date()
        };
      }
    }
    
    const hasReferral = !!referral;
    const tier = referral ? referral.referrer.tier : 'default';
    
    
    let discountPercentage = 0;
    if (hasReferral) {
      const oneSOLLamports = new BN(1_000_000_000);
      
      const fees = calculateTradeFees(oneSOLLamports, hasReferral);
      discountPercentage = (fees.userDiscount.toNumber() / 1_000_000_000) * 100;
    }
    
    return NextResponse.json({
      hasReferral,
      tier,
      discount: discountPercentage,
      referralCode: referral?.referrer.partnerCode || null,
      appliedAt: referral?.appliedAt || null
    });
  } catch (error) {
    console.error('Referral status lookup error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        hasReferral: false, 
        tier: 'default', 
        discount: 0,
        error: 'Invalid request data' 
      }, { status: 400 });
    }
    return NextResponse.json({ 
      hasReferral: false, 
      tier: 'default', 
      discount: 0,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}