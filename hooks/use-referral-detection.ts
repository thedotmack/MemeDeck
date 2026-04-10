import { isStoredReferralCode, type StoredReferralCode } from '@/lib/types/guards';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';



const REFERRAL_CODE_TTL = 30 * 24 * 60 * 60 * 1000; 
const STORAGE_KEY = 'memedeck_referral_code';

export function useReferralDetection() {
  const searchParams = useSearchParams();
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  
  useEffect(() => {
    
    const ref = searchParams?.get('ref');
    if (ref) {
      storeReferralCode(ref);
      setDetectedCode(ref);
      
      
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('ref');
      window.history.replaceState({}, '', cleanUrl.toString());
      return;
    }
    

    const stored = getStoredReferralCode();
    if (stored && !stored.appliedAt) {
      setDetectedCode(stored.code);
      setIsExpired(false);
    } else if (stored && isReferralCodeExpired(stored)) {
      clearStoredReferralCode();
      setIsExpired(true);
    }
  }, [searchParams]);
  
  const storeReferralCode = (code: string) => {
    const referralData: StoredReferralCode = {
      code: code.toUpperCase(),
      detectedAt: Date.now()
    };
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(referralData));
    } catch (error) {
      console.warn('Failed to store referral code:', error);
    }
  };
  
  const getStoredReferralCode = (): StoredReferralCode | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return isStoredReferralCode(parsed) ? parsed : null;
    } catch (error) {
      console.warn('Failed to retrieve referral code:', error);
      return null;
    }
  };
  
  const isReferralCodeExpired = (stored: StoredReferralCode): boolean => {
    const now = Date.now();
    return (now - stored.detectedAt) > REFERRAL_CODE_TTL;
  };
  
  const clearStoredReferralCode = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear referral code:', error);
    }
  };
  
  const markReferralCodeApplied = () => {
    const stored = getStoredReferralCode();
    if (stored) {
      stored.appliedAt = Date.now();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      } catch (error) {
        console.warn('Failed to mark referral code as applied:', error);
      }
    }
  };
  
  return { 
    detectedCode, 
    isExpired,
    markReferralCodeApplied,
    clearStoredReferralCode
  };
}