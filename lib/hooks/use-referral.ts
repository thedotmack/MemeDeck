export function useReferral() {
  
  
  const applyReferralByUserId = async (referralCode: string, userId: string): Promise<boolean> => {
    try {
      console.log(`🔗 [REFERRAL-USER] Applying referral code ${referralCode} for user ${userId}`);
      
      const response = await fetch('/api/referrals/apply-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          referralCode, 
          userId 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`🔗 [REFERRAL-USER] Successfully applied referral ${referralCode}:`, data);
        return true;
      } else {
        const error = await response.json();
        console.log(`🔗 [REFERRAL-USER] Failed to apply referral ${referralCode}:`, error.error);
        return false;
      }
    } catch (error) {
      console.error(`🔗 [REFERRAL-USER] Network error applying referral:`, error);
      return false;
    }
  };

  return {
    applyReferralByUserId
  };
}