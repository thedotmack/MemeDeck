import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/privy-auth';


export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const userId = auth.id;
    
    const body = await request.json();
    const { referredBy } = body;
    
    
    console.log(`[TEST] Setting referredBy to ${referredBy} for user ${userId}`);
    
    return NextResponse.json({ 
      success: true, 
      userId,
      referredBy,
      message: 'This would be set in the store. Use browser dev tools to manually set: useStore.setState({ referredBy: "some-user-id" })'
    });
  } catch (error) {
    console.error('Test referral set error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}