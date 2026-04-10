import { NextRequest } from 'next/server';
import { PrivyClient } from '@privy-io/node';

const privy = new PrivyClient({
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
});

export interface AuthenticatedUser {
  id: string;
  walletAddress?: string;
}

export async function verifyPrivyToken(request: NextRequest): Promise<AuthenticatedUser> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const claims = await privy.utils().auth().verifyAuthToken(token);
    return {
      id: claims.user_id,
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Invalid or expired token');
  }
}

function verifyUserAccess(authenticatedUserId: string, requestedUserId: string): void {
  if (authenticatedUserId !== requestedUserId) {
    throw new Error('Access denied: user ID mismatch');
  }
}

export async function requireAuth(request: NextRequest, userId?: string): Promise<AuthenticatedUser> {
  const user = await verifyPrivyToken(request);
  
  if (userId) {
    verifyUserAccess(user.id, userId);
  }
  
  return user;
}

