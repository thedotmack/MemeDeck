import { prisma } from '@/lib/db/client';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const ApplyReferralByUserSchema = z.object({
  referralCode: z.string().min(3).max(20),
  userId: z.string().min(1)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referralCode, userId } = ApplyReferralByUserSchema.parse(body);
    
    console.log(`🔗 [REFERRAL-USER-API] Processing referral application:`, {
      referralCode: referralCode.toUpperCase(),
      userId
    });
    
    
    const partner = await prisma.partner.findUnique({
      where: { 
        partnerCode: referralCode.toUpperCase(), 
        isActive: true 
      }
    });
    
    if (!partner) {
      console.log(`🔗 [REFERRAL-USER-API] Invalid referral code: ${referralCode}`);
      return NextResponse.json({ error: 'Invalid or inactive referral code' }, { status: 404 });
    }
    
    
    if (partner.userId === userId) {
      console.log(`🔗 [REFERRAL-USER-API] Self-referral attempt blocked for user: ${userId}`);
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
    }
    
    
    const existingUser = await prisma.users.findUnique({
      where: { userId },
      select: { referredBy: true }
    });
    
    if (existingUser?.referredBy) {
      console.log(`🔗 [REFERRAL-USER-API] User ${userId} already has referral: ${existingUser.referredBy}`);
      return NextResponse.json({ 
        error: 'User already has a referral',
        existingReferralCode: existingUser.referredBy
      }, { status: 400 });
    }
    
    
  const updateResult = await prisma.users.upsert({
      where: { userId },
      update: {
        referredBy: partner.userId
      },
      create: {
        userId,
        referredBy: partner.userId,
    
    privyUser: {},
    storeData: Prisma.JsonNull
      }
    });
    
    console.log(`🔗 [REFERRAL-USER-API] Successfully updated Users.referredBy for user ${userId} → ${partner.userId}`);
    
    return NextResponse.json({
      success: true,
      tier: partner.tier,
      referrerUserId: partner.userId,
      partnerCode: partner.partnerCode,
      appliedAt: new Date()
    }, { status: 201 });
    
  } catch (error) {
    console.error('🔗 [REFERRAL-USER-API] Apply referral by user ID error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}