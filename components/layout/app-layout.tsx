"use client"

import AsciiRenderer from "@/components/ascii-renderer"
import FundingModal from "@/components/funding/FundingModal"
import { TransactionHistoryModal } from "@/components/transactions/transaction-history-modal"
import { TutorialOverlay } from "@/components/tutorial/TutorialOverlay"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

interface AppLayoutProps {
  children: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  showAsciiBackground?: boolean
  asciiControls?: any
}

const LAYOUT_CLASSES = {
  root: 'relative',
  header: 'fixed top-0 left-0 right-0 z-50',
  main: 'fixed top-16 sm:top-20 bottom-16 left-0 right-0 overflow-hidden',
  footer: 'fixed bottom-0 left-0 right-0 z-50'
} as const

export default function AppLayout({ 
  children, 
  header, 
  footer, 
  className,
  showAsciiBackground = true,
  asciiControls
}: AppLayoutProps) {
  const funding = useStore.use.funding?.();
  const closeFundingModal = useStore.use.closeFundingModal?.();
  const transactionModal = useStore.use.transactionModal?.();
  const closeTransactionModal = useStore.use.closeTransactionModal?.();
  
  
  const tutorial = useStore.use.tutorial?.() || { isActive: false, isScaledView: false };
  const isInTutorial = tutorial.isActive;
  const isScaledView = tutorial.isScaledView;
  
  return (
    <div className={cn(LAYOUT_CLASSES.root, "relative", className)}>
      {}
      <div className="fixed inset-0 z-0 items-center">
        {showAsciiBackground && asciiControls && (
          <AsciiRenderer
            controls={asciiControls}
            noiseBlend={0.1}
            kenBurnsSpeed={0.0165} 
            kenBurnsIntensity={2.0} 
          />
        )}
      </div>

      {}
      {header && (
        <header className={cn(LAYOUT_CLASSES.header)}>
          {header}
        </header>
      )}
      
      <main className={cn(LAYOUT_CLASSES.main)}>
        <TutorialOverlay isScaled={isScaledView} isActive={isInTutorial}>
          {children}
        </TutorialOverlay>
      </main>
      
      {footer && (
        <footer className={cn(LAYOUT_CLASSES.footer)}>
          {footer}
        </footer>
      )}

      {}
      {funding && closeFundingModal && (
        <FundingModal 
          isOpen={funding.fundingModalOpen} 
          onClose={closeFundingModal} 
        />
      )}
      
      {transactionModal && closeTransactionModal && (
        <TransactionHistoryModal 
          isOpen={transactionModal.isOpen} 
          onClose={closeTransactionModal} 
        />
      )}
    </div>
  )
}