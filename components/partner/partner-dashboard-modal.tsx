'use client'

import { PartnerOnboardingFlow } from '@/components/partner/partner-onboarding-flow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCreatePartnerAccount } from '@/hooks/use-partner-account'
import { getWithAuth, postWithAuth } from '@/lib/api/client'
import { useStore } from '@/lib/store'
import { FEE_ROUTING } from '@/lib/utils/fee-tiers'
import { globalToast } from '@/lib/utils/global-toast'
import { useSignAndSendTransaction, useWallets } from '@privy-io/react-auth/solana'
import { Check, Copy, DollarSign, Edit2, Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Partner {
  partnerCode: string;
  totalEarningsLamports: string;
  totalClaimedLamports: string;
  isActive: boolean;
  codeCustomized: boolean;
  _count: {
    referrals: number;
  };
}

interface Referral {
  referredWalletAddress: string;
  appliedAt: string;
  status: string;
}

interface PartnerDashboardModalProps {
  onCloseModal: () => void
}

export function PartnerDashboardModal({ onCloseModal }: PartnerDashboardModalProps) {
  const auth = useStore.use.auth() || { user: null, isAuthenticated: false }
  const { createPartnerAccount, isCreating } = useCreatePartnerAccount()
  const { signAndSendTransaction } = useSignAndSendTransaction()
  const { wallets } = useWallets()
  const embeddedWallet = wallets.find(w => w.standardWallet.name === 'Privy')
  const solPrice = useStore.use.funding().solPrice || 100
  
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [partner, setPartner] = useState<Partner | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [hasHydraWallet, setHasHydraWallet] = useState<boolean | null>(null)
  const [isClaimingEarnings, setIsClaimingEarnings] = useState(false)
  const [claimSuccess, setClaimSuccess] = useState(false)
  const [hydraEarnings, setHydraEarnings] = useState<any>(null)
  const [loadingEarnings, setLoadingEarnings] = useState(false)
  
  
  const [isEditingCode, setIsEditingCode] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [isUpdatingCode, setIsUpdatingCode] = useState(false)
  

  const user = auth.user
  const userTier = user?.tier || 'standard'
  
  
  useEffect(() => {
    const checkPartnerStatus = async () => {
      if (!auth.isAuthenticated || !auth.accessToken) return
      
      try {
        const response = await getWithAuth('/api/user/partner-status')
        if (response.ok) {
          const data = await response.json()
          setHasHydraWallet(data.hasPartnerAccount)
        } else {
          setHasHydraWallet(false)
        }
      } catch (error) {
        console.error('Failed to check partner status:', error)
        setHasHydraWallet(false)
      }
    }
    
    checkPartnerStatus()
  }, [auth.isAuthenticated, auth.accessToken])
  
  
  const feeRouting = FEE_ROUTING[userTier] || FEE_ROUTING['standard']
  const sharePercentage = feeRouting.partnerSharePercent

  
  useEffect(() => {
    const loadPartnerData = async () => {
      if (!auth.isAuthenticated || !auth.accessToken || isInitialized) return
      
      setIsInitialized(true)

      try {
        setIsLoading(true)
        
        
        const response = await getWithAuth('/api/partners')

        if (response.ok) {
          const userPartner = await response.json()
          console.log('Loaded partner data:', userPartner)
          
          setPartner(userPartner)
        } else if (response.status === 404) {
          
          
          const cleanUserId = (auth.user?.id || 'USER').replace(/[^A-Za-z0-9]/g, '').toUpperCase()
          const partnerCode = `MD${cleanUserId.slice(-6)}`
          const createResponse = await postWithAuth('/api/partners', {
            partnerCode,
            tier: 'standard',
            walletAddress: auth.user?.walletAddress 
          })
          
          if (createResponse.ok) {
            const newPartner = await createResponse.json()
            setPartner(newPartner)
          } else {
            const errorData = await createResponse.json()
            console.error('Partner creation failed:', errorData)
            setError(errorData.error || 'Failed to create partner account')
          }
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to load partner data')
        }
      } catch (err) {
        setError('Network error occurred')
        console.error('Partner data loading error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadPartnerData()
  }, [auth.isAuthenticated, auth.accessToken, auth.user?.id, auth.user?.walletAddress, isInitialized])

  // Load real Hydra earnings data
  useEffect(() => {
    const loadHydraEarnings = async () => {
      if (!hasHydraWallet || !auth.isAuthenticated || !auth.accessToken) return
      
      try {
        setLoadingEarnings(true)
        const response = await getWithAuth('/api/partners/hydra-earnings')
        if (response.ok) {
          const earnings = await response.json()
          if (earnings?.fallback) {
            console.info(
              'Hydra earnings fallback mode:',
              earnings.reason || 'Using zeroed balances'
            )
            setHydraEarnings(null)
          } else {
            setHydraEarnings(earnings)
          }
        } else if (response.status === 400) {
          const payload = await response.json().catch(() => ({}))
          console.info('Hydra earnings unavailable:', payload?.error || 'Fanout not ready')
          setHydraEarnings(null)
        } else {
          const payload = await response.json().catch(() => ({}))
          console.error('Failed to load Hydra earnings', payload?.error)
        }
      } catch (error) {
        console.error('Error loading Hydra earnings:', error)
      } finally {
        setLoadingEarnings(false)
      }
    }

    loadHydraEarnings()
  }, [hasHydraWallet, auth.isAuthenticated, auth.accessToken])

  
  if (hasHydraWallet === null) {
    return (
      <div className="p-6 bg-gray-900 text-white text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-gray-400">Loading partner status...</p>
      </div>
    )
  }
  
  
  if (!hasHydraWallet) {
    return (
      <PartnerOnboardingFlow 
        referralCode="" 
        onClose={onCloseModal}
        initialState="revenue-share-offer"
      />
    )
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-900 text-white text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-gray-400">Setting up your referral code...</p>
      </div>
    )
  }

  if (error || !partner) {
    return (
      <div className="p-6 bg-gray-900 text-white text-center">
        <p className="text-red-400 mb-4">{error || 'Failed to load referral data'}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : 'https://memedeck.win'}?ref=${partner.partnerCode}`
  
  
  // Use real Hydra data if available, otherwise fall back to database values
  const pendingSol = hydraEarnings ? hydraEarnings.userClaimableSol : 0
  const pendingUsd = pendingSol * solPrice
  
  // For display in the stats section
  const totalEarnedSol = hydraEarnings ? hydraEarnings.totalBalanceSol : 0
  const totalEarnedUsd = totalEarnedSol * solPrice

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      globalToast.success("Link Copied", "Referral link copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      globalToast.error("Copy Failed", "Unable to copy referral link")
    }
  }
  
  const startEditingCode = () => {
    setNewCode(partner.partnerCode)
    setIsEditingCode(true)
  }
  
  const cancelEditingCode = () => {
    setIsEditingCode(false)
    setNewCode('')
    setError(null)
  }
  
  const updatePartnerCode = async () => {
    if (!auth.isAuthenticated || !newCode.trim()) return
    

    const codeRegex = /^[A-Z0-9]+$/
    if (!codeRegex.test(newCode) || newCode.length < 3 || newCode.length > 20) {
      setError('Code must be 3-20 uppercase letters/numbers')
      return
    }
    
    try {
      setIsUpdatingCode(true)
      setError(null)
      
      const response = await postWithAuth('/api/partners/update-code', {
        newCode: newCode.toUpperCase()
      })
      
      if (response.ok) {
        const updatedPartner = await response.json()
        setPartner(updatedPartner)
        setIsEditingCode(false)
        setNewCode('')
        globalToast.success("Code Updated", `Your new code is ${updatedPartner.partnerCode}`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || errorData.details || 'Failed to update code')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Code update error:', err)
    } finally {
      setIsUpdatingCode(false)
    }
  }

  const handleClaimEarnings = async () => {
    if (!partner || !auth.isAuthenticated || !auth.user?.walletAddress || !hydraEarnings) return

    if (pendingSol <= 0) return
    
    // Minimum claim validation
    const MIN_CLAIM_SOL = 0.005
    if (pendingSol < MIN_CLAIM_SOL) {
      globalToast.error('Minimum claim amount is 0.005 SOL')
      return
    }

    try {
      setIsClaimingEarnings(true)
      setError(null)
      
      // Get transaction from API (same pattern as wallet creation)
      const response = await postWithAuth('/api/partners/claim-earnings', {})

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create claim transaction')
      }

      const { transaction } = await response.json()

      // Deserialize and execute transaction via Privy v3
      const txBytes = Buffer.from(transaction, 'base64')

      const receipt = await signAndSendTransaction({
        transaction: new Uint8Array(txBytes),
        wallet: embeddedWallet!,
        chain: 'solana:mainnet'
      })
      
      // Show success animation briefly
      setClaimSuccess(true)
      setTimeout(() => setClaimSuccess(false), 2000)
      
      // Refresh both partner data and Hydra earnings
      const [updatedPartnerResponse, updatedEarningsResponse] = await Promise.all([
        getWithAuth('/api/partners'),
        getWithAuth('/api/partners/hydra-earnings')
      ])
      
      if (updatedPartnerResponse.ok) {
        const updatedPartner = await updatedPartnerResponse.json()
        setPartner(updatedPartner)
      }
      
      if (updatedEarningsResponse.ok) {
        const updatedEarnings = await updatedEarningsResponse.json()
        setHydraEarnings(updatedEarnings)
      }
      
      globalToast.success('Earnings Claimed!', `Transaction: ${receipt.signature}`)
    } catch (err: any) {
      console.error('Earnings claim error:', err)
      setError(err.message || 'Failed to claim earnings')
      globalToast.error('Failed to claim earnings', err.message)
    } finally {
      setIsClaimingEarnings(false)
    }
  }

  return (
    <div className="p-6 bg-gray-900 text-white">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Your Referral Code</h2>
        <p className="text-gray-400">Share and earn on all direct user referral transactions</p>
      </div>

      <div className="space-y-4">
        {}
        <div className="text-center">
          {!isEditingCode ? (
            <div>
              <div className="relative inline-block">
                <div className="text-3xl font-mono font-bold text-green-400 bg-gray-800 rounded-lg py-3 px-12">
                  {partner.partnerCode}
                </div>
                {!partner.codeCustomized && (
                  <Button
                    onClick={startEditingCode}
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    title="Customize your code (one-time only)"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {!partner.codeCustomized && (
                <p className="text-xs text-gray-400 mt-2">
                  Click the edit icon to customize your code (one-time only)
                </p>
              )}
            </div>
          ) : (
            <div className="max-w-xs mx-auto">
              <div className="flex gap-2">
                <Input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="Enter new code"
                  className="font-mono text-center bg-gray-800 border-gray-600"
                  maxLength={20}
                  disabled={isUpdatingCode}
                />
                <Button
                  onClick={updatePartnerCode}
                  disabled={isUpdatingCode || !newCode.trim()}
                  size="sm"
                  variant="default"
                >
                  {isUpdatingCode ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  onClick={cancelEditingCode}
                  disabled={isUpdatingCode}
                  size="sm"
                  variant="outline"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {error && (
                <p className="text-red-400 text-sm mt-2">{error}</p>
              )}
              <div className="space-y-1 mt-2">
                <p className="text-xs text-gray-400">
                  3-20 uppercase letters/numbers only
                </p>
                <p className="text-xs text-yellow-500">
                  ⚠️ You can only change your code once - choose wisely!
                </p>
              </div>
            </div>
          )}
          {partner.codeCustomized && (
            <p className="text-xs text-gray-500 mt-2">
              ✓ Code customized (permanent)
            </p>
          )}
        </div>

        {}
        <div className="space-y-2">
          <label htmlFor="referral-link-input" className="text-sm text-gray-400">Referral Link:</label>
          <div className="flex gap-2">
            <input
              id="referral-link-input"
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm font-mono"
            />
            <Button onClick={copyToClipboard} variant="outline" size="sm">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {}
        <Button onClick={copyToClipboard} className="w-full bg-green-600 hover:bg-green-700">
          <Copy className="w-4 h-4 mr-2" />
          {copied ? 'Copied!' : 'Copy Referral Link'}
        </Button>

        {}
        <div className="pt-4 border-t border-gray-700">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">{partner._count?.referrals || 0}</div>
              <div className="text-xs text-gray-400">Referrals</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">0</div>
              <div className="text-xs text-gray-400">Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">
                {loadingEarnings ? '...' : `$${totalEarnedUsd.toFixed(2)}`}
              </div>
              <div className="text-xs text-gray-400">
                {hydraEarnings ? 'Available in Fanout' : 'Total Earned'}
              </div>
              {hydraEarnings && (
                <div className="text-xs text-gray-500">{totalEarnedSol} SOL</div>
              )}
            </div>
          </div>
          
          {}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Available to Claim</div>
                <div className="text-xl font-bold text-green-400">${pendingUsd.toFixed(2)}</div>
                <div className="text-sm text-gray-400">{pendingSol} SOL</div>
                {pendingSol < 0.005 && (
                  <div className="text-xs text-yellow-400 mt-1">Minimum: 0.005 SOL</div>
                )}
              </div>
              <Button 
                onClick={handleClaimEarnings} 
                disabled={isClaimingEarnings || pendingSol < 0.005}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {claimSuccess ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Claimed!
                  </>
                ) : isClaimingEarnings ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Claim Earnings
                  </>
                )}
              </Button>
            </div>
            {error && (
              <div className="text-red-400 text-sm mt-2">{error}</div>
            )}
          </div>
          
          {(partner._count?.referrals || 0) > 0 && (
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-sm text-gray-300">
                <span className="font-semibold text-blue-400">You&apos;ve referred {partner._count?.referrals || 0} {(partner._count?.referrals || 0) === 1 ? 'person' : 'people'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}