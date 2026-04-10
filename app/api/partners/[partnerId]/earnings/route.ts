import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ partnerId: string }> }
) {
  const { partnerId } = await context.params;
  
  if (!partnerId) {
    return NextResponse.json({ error: 'Partner ID is required' }, { status: 400 });
  }
  
  try {
    
    
    
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      include: {
        referrals: {
          select: {
            id: true,
            referredWalletAddress: true,
            appliedAt: true,
            status: true
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
        amountUsd: true,
        createdAt: true,
        user: {
          select: {
            feeTier: true
          }
        }
      }
    });
    
    
    let totalReferrerShareLamports = BigInt(0);
    const transactionDetails = referralTransactions.map(tx => {
      if (!tx.feeAmountLamports) return null;
      
      
      const partnerTier = tx.user.feeTier as keyof typeof import('@/lib/utils/partner-tiers').PARTNER_SHARE_LEVELS;
      const { getPartnerSharePercent } = require('@/lib/utils/partner-tiers');
      const partnerSharePercent = getPartnerSharePercent(partnerTier || 'standard');
      
      
      const referrerSharePercent = partnerSharePercent / 100; 
      const referrerShare = BigInt(Math.floor(Number(tx.feeAmountLamports) * referrerSharePercent));
      
      totalReferrerShareLamports += referrerShare;
      
      return {
        feeAmountLamports: tx.feeAmountLamports.toString(),
        referrerShareLamports: referrerShare.toString(),
        amountUsd: tx.amountUsd,
        createdAt: tx.createdAt,
        tier: partnerTier
      };
    }).filter(Boolean);
    
    const totalEarningsLamports = totalReferrerShareLamports;
    
    return NextResponse.json({
      partner: {
        id: partner.id,
        partnerCode: partner.partnerCode,
        tier: partner.tier,
        walletAddress: partner.walletAddress,
        isActive: partner.isActive,
        createdAt: partner.createdAt
      },
      earnings: {
        totalEarningsLamports: totalEarningsLamports.toString()
      },
      stats: {
        totalReferrals: partner.referrals.length,
        totalTransactions: transactionDetails.length
      },
      recentTransactions: transactionDetails.slice(0, 50),
      referrals: partner.referrals
    });
  } catch (error) {
    console.error('Partner earnings lookup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}