"use client";

import { PartnerOnboardingFlow } from "@/components/partner/partner-onboarding-flow";
import { useModal } from "@/components/ui/modal-provider";
import { useReferralDetection } from "@/hooks/use-referral-detection";
import { useReferral } from "@/lib/hooks/use-referral";
import { useStore } from "@/lib/store";
import { usePrivy } from "@privy-io/react-auth";
import { Suspense, useCallback, useEffect } from "react";

function PartnerOnboardingHandlerInner() {
  const { detectedCode, markReferralCodeApplied, clearStoredReferralCode } = useReferralDetection();
  const { openModal } = useModal();
  const { applyReferralByUserId } = useReferral();
  const { user, authenticated } = usePrivy();
  const userId = useStore.use.userId();

  const checkAndApplyReferral = useCallback(async (currentUserId: string) => {
    try {
      
      if (detectedCode) {
        
        
        const success = await applyReferralByUserId(detectedCode, currentUserId);
        
        if (success) {
          
          markReferralCodeApplied();
          
          
        } else {
          
          
        }
      } else {
        
      }
    } catch (error) {
      console.error(`🔗 [REFERRAL-SIMPLE] Error applying referral:`, error);
    }
  }, [detectedCode, applyReferralByUserId, markReferralCodeApplied, openModal]);

  
  useEffect(() => {
    if (!authenticated || !user?.id) return;
    
    
    
    
    checkAndApplyReferral(user.id);
  }, [authenticated, user?.id, checkAndApplyReferral]);

  return null;
}

export function PartnerOnboardingHandler() {
  return (
    <Suspense fallback={null}>
      <PartnerOnboardingHandlerInner />
    </Suspense>
  );
}