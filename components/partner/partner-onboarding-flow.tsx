'use client'

import { Button } from '@/components/ui/button'
import { useCreatePartnerAccount } from '@/hooks/use-partner-account'
import { useStore } from '@/lib/store'
import { FEE_ROUTING } from '@/lib/utils/fee-tiers'
import { ArrowRight, CheckCircle, Coins, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface Props {
  referralCode: string
  onClose: () => void
  initialState?: ModalState
}

type ModalState = 'referral-success' | 'revenue-share-offer' | 'hydra-creating' | 'hydra-success'

/* ─── Extracted sub-components ─── */

interface ReferralSuccessContentProps {
  referralCode: string
  onClose: () => void
  onContinue: () => void
}

function ReferralSuccessContent({ referralCode, onClose, onContinue }: ReferralSuccessContentProps) {
  return (
    <>
      <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold mb-2">Welcome to MemeDeck!</h2>
      <p className="text-gray-400 mb-4">
        You just saved 10% on trading fees by signing up with your friend&apos;s referral code
      </p>

      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="text-sm text-gray-400 mb-1">Referral Code Used:</div>
        <div className="text-xl font-mono font-bold text-green-400">{referralCode}</div>
      </div>

      <div className="space-y-2 text-sm text-gray-300 mb-6">
        <p>✅ 10% discount on all trading fees</p>
        <p>✅ Helping your friend earn referral rewards</p>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={onClose}
          variant="outline"
          className="flex-1"
        >
          Maybe Later
        </Button>
        <Button
          onClick={onContinue}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          Continue <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </>
  )
}

interface RevenueShareOfferContentProps {
  sharePercentage: number
  error: string | null
  isCreating: boolean
  onClose: () => void
  onActivate: () => void
}

function RevenueShareOfferContent({ sharePercentage, error, isCreating, onClose, onActivate }: RevenueShareOfferContentProps) {
  return (
    <>
      <Coins className="w-16 h-16 text-blue-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold mb-2">Earn Revenue from Your Referrals</h2>
      <p className="text-gray-400 mb-4">
        Want to earn revenue when people you refer trade on MemeDeck?
      </p>

      <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 mb-6">
        <div className="text-sm text-blue-200 mb-2">Your Revenue Share:</div>
        <div className="text-3xl font-bold text-blue-400">{sharePercentage}%</div>
        <div className="text-xs text-blue-300 mt-1">of platform fees from your referrals</div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Account Setup Cost:</span>
          <span className="text-white">~0.005 SOL</span>
        </div>
        <div className="text-xs text-gray-500">Fully refundable when you close the account</div>
      </div>

      <div className="space-y-2 text-sm text-gray-300 mb-6">
        <p>✅ Automatic revenue distribution on-chain</p>
        <p>✅ Claim your earnings anytime</p>
        <p>✅ Higher tier = higher revenue share</p>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={onClose}
          variant="outline"
          className="flex-1"
        >
          Maybe Later
        </Button>
        <Button
          onClick={onActivate}
          disabled={isCreating}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          Activate Revenue Share
        </Button>
      </div>
    </>
  )
}

function HydraCreatingContent() {
  return (
    <>
      <Loader2 className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-spin" />
      <h2 className="text-2xl font-bold mb-2">Creating Revenue Share Account</h2>
      <p className="text-gray-400 mb-6">
        Creating revenue share account...
      </p>

      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="text-sm text-gray-400">Setting up automatic revenue sharing</div>
        <div className="text-xs text-gray-500 mt-2">
          This may take 10-15 seconds
        </div>
      </div>
    </>
  )
}

interface HydraSuccessContentProps {
  sharePercentage: number
  onClose: () => void
}

function HydraSuccessContent({ sharePercentage, onClose }: HydraSuccessContentProps) {
  return (
    <>
      <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold mb-2">Revenue Sharing Activated!</h2>
      <p className="text-gray-400 mb-4">
        You&apos;ll now earn {sharePercentage}% of platform fees from your referrals
      </p>

      <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4 mb-6">
        <div className="text-sm text-green-200 mb-1">✅ Referral Benefits Active</div>
        <div className="text-sm text-green-200">✅ Revenue Sharing Enabled</div>
      </div>

      <Button onClick={onClose} className="w-full bg-green-600 hover:bg-green-700">
        Start Trading
      </Button>
    </>
  )
}

export function PartnerOnboardingFlow({ referralCode, onClose, initialState = 'referral-success' }: Props) {
  const [modalState, setModalState] = useState<ModalState>(initialState)
  const [error, setError] = useState<string | null>(null)
  const { createPartnerAccount, isCreating } = useCreatePartnerAccount()
  const userTier = useStore.use.auth().user?.tier || 'standard'
  
  
  const feeRouting = FEE_ROUTING[userTier] || FEE_ROUTING['standard']
  const sharePercentage = feeRouting.partnerSharePercent

  const handleActivateRevenueShare = async () => {
    setError(null) 
    setModalState('hydra-creating')
    
    try {
      const signature = await createPartnerAccount()
      if (signature) {
        setModalState('hydra-success')
      } else {
        setError('Failed to activate revenue sharing. Please try again.')
        setModalState('revenue-share-offer')
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
      setModalState('revenue-share-offer')
    }
  }

  const renderContent = () => {
    switch (modalState) {
      case 'referral-success':
        return (
          <ReferralSuccessContent
            referralCode={referralCode}
            onClose={onClose}
            onContinue={() => setModalState('revenue-share-offer')}
          />
        )
      case 'revenue-share-offer':
        return (
          <RevenueShareOfferContent
            sharePercentage={sharePercentage}
            error={error}
            isCreating={isCreating}
            onClose={onClose}
            onActivate={handleActivateRevenueShare}
          />
        )
      case 'hydra-creating':
        return <HydraCreatingContent />
      case 'hydra-success':
        return (
          <HydraSuccessContent
            sharePercentage={sharePercentage}
            onClose={onClose}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="p-6 bg-gray-900 text-white text-center max-w-md mx-auto">
      {renderContent()}
    </div>
  )
}