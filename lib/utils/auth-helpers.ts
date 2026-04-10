
import type { AuthState } from '../store/store-types';

export function normalizeUserObject(user: any): AuthState['user'] {
  if (!user) return null;
  
  return {
    id: user.id,
    username: user.username || user.email?.address || user.id,
    walletAddress: user.walletAddress || null,
    portfolioValue: user.portfolioValue || 0,
    solBalance: user.solBalance || 0,
    isLiveMode: user.isLiveMode || false,
    tier: user.tier && user.tier !== 'null' && user.tier !== 'default' ? user.tier : 'standard',
    
    
  };
}

export function createInitialUserObject(
  id: string,
  walletAddress: string | null,
  options: {
    username?: string;
    portfolioValue?: number;
    solBalance?: number;
    isLiveMode?: boolean;
    tier?: 'default' | 'referred' | 'premium';
  } = {}
): NonNullable<AuthState['user']> {
  return {
    id,
    username: options.username || id,
    walletAddress,
    portfolioValue: options.portfolioValue || 0,
    solBalance: options.solBalance || 0,
    isLiveMode: options.isLiveMode || false,
    tier: options.tier && options.tier !== 'null' && options.tier !== 'default' ? options.tier : 'standard',
  };
}

