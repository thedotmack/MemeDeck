import { useStore } from '@/lib/store';

export class PartnerFeeWalletService {
    async getPartnerFeeWallet(): Promise<string> {
    const store = useStore.getState();
    
    
    if (store.referrerHydraWallet) {
      console.log('[PartnerFeeWallet] Using cached referrer hydra wallet:', store.referrerHydraWallet);
      return store.referrerHydraWallet;
    }
    
    
    try {
      const accessToken = store.auth.accessToken;
      if (!accessToken) {
        console.log('[PartnerFeeWallet] No access token, falling back to platform wallet');
        return this.getPlatformWallet();
      }
      
      const response = await fetch('/api/fees/destination', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        console.warn('[PartnerFeeWallet] API call failed, falling back to platform wallet');
        return this.getPlatformWallet();
      }
      
      const referrerHydraWallet = await response.json();
      
      if (referrerHydraWallet && referrerHydraWallet !== this.getPlatformWallet()) {
        
  useStore.getState().setReferrerInfo(null, referrerHydraWallet);
        console.log('[PartnerFeeWallet] Cached referrer hydra wallet:', referrerHydraWallet);
      }
      
      return referrerHydraWallet;
      
    } catch (error) {
      console.error('[PartnerFeeWallet] Error fetching referrer wallet:', error);
      return this.getPlatformWallet();
    }
  }
  
    private getPlatformWallet(): string {
    const platformWallet = process.env.NEXT_PUBLIC_PLATFORM_FEES_WALLET_PUBLIC_KEY;
    if (!platformWallet) {
      throw new Error('Platform wallet address not configured');
    }
    return platformWallet;
  }
  
    clearCache(): void {
  useStore.getState().setReferrerInfo(null, null);
    console.log('[PartnerFeeWallet] Cache cleared');
  }
}


export const partnerFeeWalletService = new PartnerFeeWalletService();