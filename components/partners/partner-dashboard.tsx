'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { getWithAuth, postWithAuth } from '@/lib/api/client';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Copy, 
  Check,
  ExternalLink,
  Loader2,
  AlertCircle,
  Share2,
  Gift,
  Calendar,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/lib/store';
import { formatDistanceToNow } from 'date-fns';

interface Partner {
  id: string;
  partnerCode: string;
  tier: string;
  totalEarningsLamports: string;
  totalClaimedLamports: string;
  isActive: boolean;
  createdAt: string;
}

interface Referral {
  id: string;
  referredWalletAddress: string;
  referralCode: string;
  appliedAt: string;
  status: string;
}

interface EarningsClaim {
  id: string;
  amountLamports: string;
  status: string;
  claimedAt?: string;
  createdAt: string;
}

interface PartnerDashboardProps {
  
}

export function PartnerDashboard({}: PartnerDashboardProps) {
  const { user } = usePrivy();
  const auth = useStore.use.auth() || { user: null, isAuthenticated: false, accessToken: null };
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  
  const [partner, setPartner] = useState<Partner | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [earningsClaims, setEarningsClaims] = useState<EarningsClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  
  const [desiredCode, setDesiredCode] = useState('');
  const [isPartner, setIsPartner] = useState(false);


  useEffect(() => {
    const loadPartnerData = async () => {
      if (!auth.isAuthenticated || !auth.accessToken) return;

      try {
        setIsLoading(true);
        setError(null);


        const partnerResponse = await getWithAuth('/api/partners');

        if (partnerResponse.ok) {
          const userPartner = await partnerResponse.json();

          setPartner(userPartner);
          setIsPartner(true);

          
          const referralsResponse = await getWithAuth('/api/referrals');

          if (referralsResponse.ok) {
            const referralsData = await referralsResponse.json();
            setReferrals(referralsData.referrals || []);
          }

          
          const claimsResponse = await getWithAuth('/api/partners/claims');

          if (claimsResponse.ok) {
            const claimsData = await claimsResponse.json();
            setEarningsClaims(claimsData.claims || []);
          }
        } else if (partnerResponse.status === 404) {
          setIsPartner(false);
        } else {
          const errorData = await partnerResponse.json();
          setError(errorData.error || 'Failed to load partner data');
        }
      } catch (err) {
        setError('Network error occurred');
        console.error('Partner dashboard error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPartnerData();
  }, [auth.isAuthenticated, auth.accessToken]);

  
  const lamportsToUsd = (lamports: string) => {
    const solPrice = 100; 
    const solAmount = parseInt(lamports) / 1_000_000_000;
    return solAmount * solPrice;
  };

  const handleCopyCode = async () => {
    if (!partner) return;
    
    try {
      await navigator.clipboard.writeText(partner.partnerCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const handleCopyLink = async () => {
    if (!partner) return;
    
    const referralLink = `${typeof window !== 'undefined' ? window.location.origin : 'https://memedeck.win'}?ref=${partner.partnerCode}`;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleRegisterAsPartner = async () => {
    if (!auth.isAuthenticated || !desiredCode.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await postWithAuth('/api/partners', {
        partnerCode: desiredCode.trim(),
        tier: 'standard'
      });

      if (response.ok) {
        const newPartner = await response.json();
        setPartner(newPartner);
        setIsPartner(true);
        setDesiredCode('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to register as partner');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Partner registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimEarnings = async () => {
    if (!partner) return;

    const pendingAmount = lamportsToUsd(partner.totalEarningsLamports) - lamportsToUsd(partner.totalClaimedLamports);
    if (pendingAmount <= 0) return;

    try {
      setIsLoading(true);
      
      const response = await postWithAuth('/api/partners/claim-earnings', {
        amountLamports: (parseInt(partner.totalEarningsLamports) - parseInt(partner.totalClaimedLamports)).toString()
      });

      if (response.ok) {
        
        window.location.reload();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to claim earnings');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Earnings claim error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !partner) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading partner dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!isPartner) {
    return (
      <div className="max-w-md mx-auto p-6">
        <Card className="p-6">
          <div className="text-center mb-6">
            <Gift className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Become a Partner</h2>
            <p className="text-gray-600">
              Join our referral program and earn on every trade your referrals make
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="partnerCode">Choose Your Partner Code</Label>
              <Input
                id="partnerCode"
                value={desiredCode}
                onChange={(e) => setDesiredCode(e.target.value)}
                placeholder="e.g., CRYPTO2024"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                This will be your unique referral code
              </p>
            </div>

            <Button 
              onClick={handleRegisterAsPartner}
              disabled={!desiredCode.trim() || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                'Register as Partner'
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!partner) return null;

  const totalEarnedUsd = lamportsToUsd(partner.totalEarningsLamports);
  const totalClaimedUsd = lamportsToUsd(partner.totalClaimedLamports);
  const pendingUsd = totalEarnedUsd - totalClaimedUsd;
  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : 'https://memedeck.win'}?ref=${partner.partnerCode}`;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Partner Dashboard</h1>
        <p className="text-gray-600">Track your referral performance and earnings</p>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Referrals</p>
              <p className="text-2xl font-bold">{referrals.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Earned</p>
              <p className="text-2xl font-bold">${totalEarnedUsd.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available to Claim</p>
              <p className="text-2xl font-bold">${pendingUsd.toFixed(2)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Partner Tier</p>
              <Badge variant={partner.tier === 'premium' ? 'default' : 'secondary'}>
                {partner.tier.toUpperCase()}
              </Badge>
            </div>
            <Activity className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Share2 className="w-5 h-5 mr-2" />
          Your Referral Tools
        </h2>
        
        <div className="space-y-4">
          <div>
            <Label>Partner Code</Label>
            <div className="flex gap-2 mt-1">
              <Input value={partner.partnerCode} readOnly className="font-mono" />
              <Button onClick={handleCopyCode} variant="outline" size="sm">
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label>Referral Link</Label>
            <div className="flex gap-2 mt-1">
              <Input value={referralLink} readOnly className="font-mono text-sm" />
              <Button onClick={handleCopyLink} variant="outline" size="sm">
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {}
      {pendingUsd > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Claim Earnings
          </h2>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available to claim</p>
              <p className="text-2xl font-bold text-green-600">${pendingUsd.toFixed(2)}</p>
            </div>
            <Button onClick={handleClaimEarnings} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Claim Earnings'
              )}
            </Button>
          </div>
        </Card>
      )}

      {}
      {referrals.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Recent Referrals ({referrals.length})
          </h2>
          
          <div className="space-y-3">
            {referrals.slice(0, 5).map((referral) => (
              <div key={referral.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-mono text-sm">
                      {referral.referredWalletAddress.slice(0, 6)}...{referral.referredWalletAddress.slice(-4)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Joined {formatDistanceToNow(new Date(referral.appliedAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <Badge variant={referral.status === 'active' ? 'default' : 'secondary'}>
                  {referral.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}