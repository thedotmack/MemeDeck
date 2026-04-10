import { requireAuth } from '@/lib/api/privy-auth';
import { prisma } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    
    const auth = await requireAuth(request);
    const userId = auth.id;
    
    
    const partner = await prisma.partner.findUnique({
      where: { userId }
    });
    
    if (!partner) {
      return NextResponse.json({ referrals: [] });
    }
    
    
    const referrals = await prisma.referral.findMany({
      where: { referrerId: partner.id },
      orderBy: { appliedAt: 'desc' }
    });
    
    return NextResponse.json({ referrals });
  } catch (error) {
    console.error('Get referrals error:', error);
  
  if (error instanceof Error && (error.message.includes('Authentication') || error.message.includes('Access denied'))) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}