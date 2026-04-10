"use client"

import { usePrivy } from "@privy-io/react-auth"
import { useWallets } from "@privy-io/react-auth/solana"
import { motion } from "motion/react"
import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import NumberFlowInput from "@/components/ui/number-flow-input"
import { useTransactionCoordinator } from "@/hooks/use-transaction-coordinator"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { playSound } from "@/hooks/transactions/actions/audio"


interface AppFooterProps {
  customContent?: React.ReactNode
  className?: string
}



export default function AppFooter({ className }: AppFooterProps) {
  const { authenticated } = usePrivy()
  const { ready, wallets } = useWallets()
  const embeddedWallet = wallets.find(wallet => wallet.standardWallet.name === 'Privy')
  
  const isDemoMode = useStore.use.isDemoMode() ?? false
  const hand = useStore.use.hand() || []
  const demoFromStore = useStore.use.demo();
  const demo = useMemo(() => demoFromStore || { canOpenPosition: () => false, maxPositions: 5 }, [demoFromStore])
  const ui = useStore.use.ui() || {}
  const auth = useStore.use.auth() || {}
  const walletBalance = useStore.use.walletBalance() || 0
  
  
  const selectedDrawAmount = ui.selectedDrawAmount || 5
  const selectedCardCount = ui.selectedCardCount || 1
  const solBalance = auth.user?.solBalance || 0
  
  
  const setSelectedDrawAmount = useStore.use.setSelectedDrawAmount() ?? (() => {})
  const setSelectedCardCountSelector = useStore.use.setSelectedCardCount();
  const setSelectedCardCount = useMemo(() => setSelectedCardCountSelector ?? (() => {}), [setSelectedCardCountSelector])

  
  const [solPrice, setSolPrice] = useState<number | null>(null)


  
  
  const { executeTransaction, isBuying, phase } = useTransactionCoordinator()

  const isLiveMode = authenticated
  const totalCost = selectedCardCount * selectedDrawAmount
  
  
  const hasInsufficientFunds = useMemo(() => {
    const insufficient = !isLiveMode 
      ? totalCost > walletBalance
      : (solPrice === null ? false : totalCost > (solBalance * solPrice));
    
    return insufficient;
  }, [isLiveMode, totalCost, solBalance, solPrice, walletBalance])

  
  const maxAffordableCards = useMemo(() => {
    if (!isLiveMode) {
      
      return Math.min(
        demo.maxPositions - hand.length,
        Math.floor((walletBalance || 0) / selectedDrawAmount)
      )
    }
    
    
    if (solPrice === 0) return 0 
    
    const availableSol = solBalance 
    const maxCards = Math.floor((availableSol * (solPrice || 0)) / selectedDrawAmount)
    return Math.min(demo.maxPositions - hand.length, maxCards)
  }, [isLiveMode, demo.maxPositions, hand.length, walletBalance, solBalance, solPrice, selectedDrawAmount])

  
  useEffect(() => {
    if (selectedCardCount > maxAffordableCards && maxAffordableCards > 0) {
      setSelectedCardCount(maxAffordableCards)
    }
  }, [selectedDrawAmount, maxAffordableCards, selectedCardCount, setSelectedCardCount]); 


  
  const buttonState = useMemo(() => {
    if (isBuying || phase === 'preparing' || phase === 'executing') return 'processing'
    if (hasInsufficientFunds) return 'insufficient'
    return 'ready'
  }, [isBuying, phase, hasInsufficientFunds])

  
  const isButtonDisabled = useMemo(() => {
    const disabled = isLiveMode 
      ? (isBuying || phase === 'preparing' || phase === 'executing' || hasInsufficientFunds)
      : (!demo.canOpenPosition() || hasInsufficientFunds);
    
    return disabled;
  }, [isLiveMode, isBuying, phase, hasInsufficientFunds, demo])

  
  const buttonText = useMemo(() => {
    if (isLiveMode) {
      switch (buttonState) {
        case 'processing':
          return 'BUYING...'
        case 'insufficient':
          return 'INSUFFICIENT FUNDS'
        default:
          return `${selectedCardCount} x $${Math.round(selectedDrawAmount)}`
      }
    } else {
      return hasInsufficientFunds || !demo.canOpenPosition()
        ? 'CHANGE AMOUNT'
        : `${selectedCardCount} x $${Math.round(selectedDrawAmount)}`
    }
  }, [isLiveMode, buttonState, selectedCardCount, selectedDrawAmount, hasInsufficientFunds, demo])

  
  const handleButtonClick = () => {
    if (isLiveMode) {
      executeTransaction({
        type: 'buy',
        amount: selectedDrawAmount,
        cardCount: selectedCardCount
      })
    } else {
      playSound("card_draw")
      demo.openPosition({
        amountOverride: selectedDrawAmount,
        cardCountOverride: selectedCardCount,
      })
    }
  }


  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.8, delay: 0.5 }} 
      className={cn(
        "flex-shrink-0 px-4 py-3",
        "",
        "bg-black/60 backdrop-blur-sm border-t border-gray-800",
        className
      )}
    >
      <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto" data-testid="draw-controls">
        {}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm font-medium hidden sm:block">Amount:</span>
          <NumberFlowInput
            value={selectedDrawAmount}
            onChange={setSelectedDrawAmount}
            min={1}
            max={10000}
            step={1}
            prefix="$"
            format={{ minimumFractionDigits: 0, maximumFractionDigits: 0 }}
            className="h-10"
            useUSDDenominations={false}
          />
        </div>

        {}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm font-medium hidden sm:block">Cards:</span>
          <NumberFlowInput
            value={selectedCardCount}
            onChange={setSelectedCardCount}
            min={1}
            max={5}
            step={1}
            format={{ minimumFractionDigits: 0, maximumFractionDigits: 0 }}
            className="h-10"
          />
        </div>

        {}
        <div className="flex-1 max-w-xs">
          <Button
            data-testid="draw-button"
            onClick={handleButtonClick}
            disabled={isButtonDisabled}
            className={cn(
              "w-full h-10 text-xl font-bold shadow-xl transition-all duration-300",
              "transform hover:scale-105 border disabled:transform-none",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              
              isLiveMode ? (
                buttonState === 'processing' ? (
                  "bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white border-blue-400/30 hover:shadow-blue-500/50"
                ) : (
                  "bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 text-white border-green-400/30 hover:shadow-green-500/50"
                )
              ) : (
                "bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 text-white border-blue-400/30 hover:shadow-blue-500/50"
              )
            )}
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}