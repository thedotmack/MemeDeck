"use client"
import { defaultAsciiControls } from "@/components/ascii-renderer/options-dropdown"
import CardContainer from "@/components/CardContainer"
import { CelebrationEnhancedOverlay } from "@/components/celebrations/celebration-enhanced-overlay"
import AppFooter from "@/components/layout/app-footer"
import AppHeader from "@/components/layout/app-header"
import AppLayout from "@/components/layout/app-layout"
import PepePhone from "@/components/pepe-character/Pepe_Notifications_UI"
import PepeCompanion from "@/components/pepe-character/Pepe_Character"
import { AnimationDebugPanel } from "@/components/animations/animation-debug-panel"
import { useStore } from "@/lib/store"
import { useCallback, useState } from "react"

export default function Home() {
  
  const [asciiControls, setAsciiControls] = useState(defaultAsciiControls)
  const [showAsciiBackground, setShowAsciiBackground] = useState(true)
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)
  
  
  const isDemoMode = useStore.use.isDemoMode() ?? false
  const userId = useStore.use.userId() ?? null

  
  const toggleAsciiBackground = useCallback(() => {
    setShowAsciiBackground((prev) => !prev)
  }, [])

  
  const openHelp = useCallback(() => {
    setIsHelpModalOpen(true)
  }, [])

  return (
    <AppLayout
      showAsciiBackground={showAsciiBackground}
      asciiControls={asciiControls}
      header={
        <AppHeader />
      }
      footer={<AppFooter />}
    >
    <CardContainer key={`${userId}-${isDemoMode}`} />
    
    <CelebrationEnhancedOverlay />
    {/* Phone hidden for demo */}
    {/* <PepePhone enableSpeech={true} context="watching" defaultPosition="right" /> */}

    {/* Floating Pepe Head - draggable, follows mouse, double-click to talk */}
    <div className="hidden md:block">
      <PepeCompanion
        position="floating"
        size="small"
        enableSpeech={true}
        enableMouseTracking={true}
        enableBlinking={true}
        enableDragging={true}
        context="demo"
      />
    </div>

    {/* Debug Panel - click bug icon bottom left */}
    <AnimationDebugPanel />

    </AppLayout>
  )
}
