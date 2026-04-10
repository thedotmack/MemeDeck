'use client'

import { useEffect, useRef } from 'react'
import { ensureAudioInitialized, audioSystem } from '@/lib/audio'

export function AudioInitializer() {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return

    const handleFirstInteraction = async () => {
      if (!initialized.current) {
        try {
          await ensureAudioInitialized()
          initialized.current = true
          // Auto-start background music after init
          setTimeout(() => audioSystem.playBackgroundMusic(), 500)
        } catch (error) {
          console.warn('Audio initialization failed:', error)
        }
      }
      
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('keydown', handleFirstInteraction)
      document.removeEventListener('touchstart', handleFirstInteraction)
    }

    
    document.addEventListener('click', handleFirstInteraction)
    document.addEventListener('keydown', handleFirstInteraction) 
    document.addEventListener('touchstart', handleFirstInteraction, { passive: true })

    return () => {
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('keydown', handleFirstInteraction)
      document.removeEventListener('touchstart', handleFirstInteraction)
    }
  }, [])

  return null
}