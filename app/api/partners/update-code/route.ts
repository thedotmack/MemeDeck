import { requireAuth } from '@/lib/api/privy-auth';
import { prisma } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const UpdatePartnerCodeSchema = z.object({
  newCode: z.string().min(3).max(20).regex(/^[A-Z0-9]+$/, 'Code must be uppercase alphanumeric only')
});

export async function POST(request: NextRequest) {
  try {
    
    const auth = await requireAuth(request);
    const userId = auth.id;
    
    const body = await request.json();
    const data = UpdatePartnerCodeSchema.parse(body);
    
    
    const partner = await prisma.partner.findUnique({
      where: { userId }
    });
    
    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }
    
    
    if (partner.codeCustomized) {
      return NextResponse.json({ error: 'You can only customize your code once' }, { status: 403 });
    }
    
    
    const existingCode = await prisma.partner.findUnique({
      where: { partnerCode: data.newCode }
    });
    
    if (existingCode && existingCode.id !== partner.id) {
      return NextResponse.json({ error: 'This code is already taken' }, { status: 400 });
    }
    
    
    const updatedPartner = await prisma.partner.update({
      where: { userId },
      data: { 
        partnerCode: data.newCode,
        codeCustomized: true
      }
    });
    
    
    const serializedPartner = {
      ...updatedPartner,
      totalEarningsLamports: updatedPartner.totalEarningsLamports.toString(),
      totalClaimedLamports: updatedPartner.totalClaimedLamports.toString()
    };
    
    return NextResponse.json(serializedPartner);
  } catch (error) {
    console.error('Update partner code error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid code format', 
        details: error.issues[0]?.message || 'Code must be 3-20 uppercase letters/numbers'
      }, { status: 400 });
    }
  const message = typeof error === 'object' && error && 'message' in error ? (error as { message?: unknown }).message : undefined
  if (typeof message === 'string' && (message.includes('Authentication') || message.includes('Access denied'))) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}