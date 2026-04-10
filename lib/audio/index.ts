
import { confettiService } from '@/lib/celebrations/confetti-service'
import * as Tone from 'tone'


type SoundType = 'win' | 'loss' | 'trade_sent' | 'trade_confirmed' | 'trade_failed' | 'card_draw' | 'card_flip'


interface SlotMachineConfig {
  baseJingle: Array<{
    note: string
    duration: string
    time: number
    velocity: number
  }>
  bellNote: string
  bellDuration: string
  bellVelocity: number
}


const SLOT_MACHINE_SOUNDS: Record<SoundType, SlotMachineConfig> = {
  win: {
    baseJingle: [
      { note: 'C5', duration: '8n', time: 0, velocity: 0.6 },
      { note: 'E5', duration: '8n', time: 0.15, velocity: 0.6 },
      { note: 'G5', duration: '8n', time: 0.3, velocity: 0.6 },
      { note: 'C6', duration: '4n', time: 0.45, velocity: 0.7 } 
    ],
    bellNote: 'C4', 
    bellDuration: '4n',
    bellVelocity: 0.6
  },
  loss: {
    baseJingle: [
      { note: 'G4', duration: '8n', time: 0, velocity: 0.5 },
      { note: 'F4', duration: '8n', time: 0.15, velocity: 0.5 },
      { note: 'E4', duration: '8n', time: 0.3, velocity: 0.5 },
      { note: 'C4', duration: '4n', time: 0.45, velocity: 0.6 } 
    ],
    bellNote: '',
    bellDuration: '16n',
    bellVelocity: 0
  },
  trade_sent: {
    baseJingle: [
      { note: 'A4', duration: '16n', time: 0, velocity: 0.4 },
      { note: 'C5', duration: '16n', time: 0.1, velocity: 0.4 }
    ],
    bellNote: '',
    bellDuration: '16n',
    bellVelocity: 0
  },
  trade_confirmed: {
    baseJingle: [
      { note: 'E5', duration: '16n', time: 0, velocity: 0.5 },
      { note: 'G5', duration: '16n', time: 0.1, velocity: 0.5 },
      { note: 'B5', duration: '8n', time: 0.2, velocity: 0.6 }
    ],
    bellNote: '',
    bellDuration: '16n',
    bellVelocity: 0
  },
  trade_failed: {
    baseJingle: [
      { note: 'G4', duration: '16n', time: 0, velocity: 0.4 },
      { note: 'F4', duration: '16n', time: 0.1, velocity: 0.4 },
      { note: 'D4', duration: '8n', time: 0.2, velocity: 0.5 }
    ],
    bellNote: '',
    bellDuration: '16n',
    bellVelocity: 0
  },
  card_draw: {
    baseJingle: [
      { note: 'D5', duration: '32n', time: 0, velocity: 0.3 },
      { note: 'F5', duration: '32n', time: 0.05, velocity: 0.3 }
    ],
    bellNote: '',
    bellDuration: '32n',
    bellVelocity: 0
  },
  card_flip: {
    baseJingle: [
      { note: 'G5', duration: '32n', time: 0, velocity: 0.3 },
      { note: 'E5', duration: '32n', time: 0.05, velocity: 0.3 }
    ],
    bellNote: '',
    bellDuration: '32n',
    bellVelocity: 0
  }
}


const getTierBellCount = (tier: string): number => {
  const tierMap: Record<string, number> = {
    
    'small': 16,
    'decent': 18, 
    'big': 20,
    'huge': 22,
    'legendary': 24,
    'epic': 26,
    'mythical': 28,
    'godlike': 30,
    'transcendent': 32,
    
    
    'moderate': 3,
    'significant': 4,
    'major': 5,
    'devastating': 6,
    'catastrophic': 8,
    'nuclear': 10,
    'apocalyptic': 12,
    'extinction': 15,
    'total': 20
  }
  
  return tierMap[tier] || 3 
}

class AudioSystem {
  private synthBase: Tone.PolySynth | null = null
  private synthBells: Tone.PolySynth | null = null
  private reverb: Tone.Reverb | null = null
  private delay: Tone.FeedbackDelay | null = null
  private isInitialized = false

  // Background music
  private backgroundMusic: HTMLAudioElement | null = null
  private isMusicPlaying = false
  private musicVolume = 0.15
  private sfxVolume = 0.7  // Default SFX volume

  async initialize(): Promise<void> {
    if (this.isInitialized || typeof window === 'undefined') return

    try {
      
      if (Tone.context.state !== 'running') {
        await Tone.start()
      }

      
      this.reverb = new Tone.Reverb({
        decay: 1.5,
        wet: 0.25,
        preDelay: 0.01
      })
      
      this.delay = new Tone.FeedbackDelay({
        delayTime: '8n',
        feedback: 0.15,
        wet: 0.25
      })

      
      this.synthBase = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.4,
          release: 0.4
        },
        volume: -10
      }).chain(this.delay, this.reverb, Tone.Destination)

      
      this.synthBells = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'triangle' 
        },
        envelope: {
          attack: 0.001,
          decay: 0.8,   
          sustain: 0.05, 
          release: 1.2   
        },
        volume: -15 
      }).chain(this.delay, this.reverb, Tone.Destination)

      this.isInitialized = true
      
    } catch (error) {
      console.warn('[AUDIO] Failed to initialize audio:', error)
    }
  }

  
  playSlotMachine(soundType: SoundType, tier: string): void {
    if (!this.isInitialized || !this.synthBase || !this.synthBells) {
      console.warn('[AUDIO] Audio system not initialized')
      return
    }

    const config = SLOT_MACHINE_SOUNDS[soundType]
    if (!config) {
      console.warn(`[AUDIO] Unknown sound type: ${soundType}`)
      return
    }

    const now = Tone.now()
    const bellCount = getTierBellCount(tier)
    
    
    const feedbackAmount = Math.min(0.15 + (bellCount - 16) * 0.01, 0.30) 
    if (this.delay) {
      this.delay.feedback.value = feedbackAmount
    }
    
    
    if (soundType === 'win' && typeof window !== 'undefined') {
      
      try {
  
  confettiService.triggerConfetti(tier as keyof typeof import('@/lib/config/win-tiers').CONFETTI_CONFIGS, { x: 0.5, y: 0.5 })
      } catch (error) {
        console.warn('Failed to trigger confetti:', error)
      }
    }
    
    
    config.baseJingle.forEach(({ note, duration, time, velocity }) => {
      this.synthBase!.triggerAttackRelease(note, duration, now + time, velocity)
    })

    
    if (config.bellNote && bellCount > 0) {
      const bellInterval = 0.15 
      
      for (let i = 0; i < bellCount; i++) {
        const bellTime = now + (i * bellInterval) 
        this.synthBells!.triggerAttackRelease(
          config.bellNote, 
          config.bellDuration, 
          bellTime, 
          config.bellVelocity
        )
      }
    }

    
  }

  
  play(soundType: SoundType): void {
    this.playSlotMachine(soundType, 'small') 
  }

  
  playForTier(tier: string, isWin: boolean): void {
    const soundType: SoundType = isWin ? 'win' : 'loss'
    this.playSlotMachine(soundType, tier)
  }
  
  
  playTradingSound(soundType: 'trade_sent' | 'trade_confirmed' | 'trade_failed' | 'card_draw' | 'card_flip'): void {
    if (!this.isInitialized || !this.synthBase) {
      console.warn('[AUDIO] Audio system not initialized')
      return
    }

    const config = SLOT_MACHINE_SOUNDS[soundType]
    if (!config) {
      console.warn(`[AUDIO] Unknown sound type: ${soundType}`)
      return
    }

    const now = Tone.now()
    
    
    config.baseJingle.forEach(({ note, duration, time, velocity }) => {
      this.synthBase!.triggerAttackRelease(note, duration, now + time, velocity)
    })

    
  }

  // Background music methods
  private initBackgroundMusic(): void {
    if (typeof window === 'undefined' || this.backgroundMusic) return

    try {
      this.backgroundMusic = new Audio('/sounds/background-music-chill.mp3')
      this.backgroundMusic.loop = true
      this.backgroundMusic.volume = 0

      this.backgroundMusic.addEventListener('play', () => {
        this.isMusicPlaying = true
      })

      this.backgroundMusic.addEventListener('pause', () => {
        this.isMusicPlaying = false
      })

      this.backgroundMusic.load()
    } catch (error) {
      console.warn('[AUDIO] Failed to init background music:', error)
    }
  }

  async playBackgroundMusic(volume?: number): Promise<void> {
    if (typeof window === 'undefined') return

    if (!this.backgroundMusic) {
      this.initBackgroundMusic()
    }

    if (!this.backgroundMusic || this.isMusicPlaying) return

    const targetVolume = volume ?? this.musicVolume

    try {
      this.backgroundMusic.volume = 0
      await this.backgroundMusic.play()

      // Fade in
      let currentVolume = 0
      const fadeInterval = setInterval(() => {
        currentVolume += 0.01
        if (currentVolume >= targetVolume) {
          currentVolume = targetVolume
          clearInterval(fadeInterval)
        }
        if (this.backgroundMusic) {
          this.backgroundMusic.volume = currentVolume
        }
      }, 50)
    } catch (error) {
      console.warn('[AUDIO] Failed to play background music:', error)
    }
  }

  pauseBackgroundMusic(): void {
    if (!this.backgroundMusic || !this.isMusicPlaying) return
    this.backgroundMusic.pause()
  }

  toggleBackgroundMusic(): boolean {
    if (this.isMusicPlaying) {
      this.pauseBackgroundMusic()
    } else {
      this.playBackgroundMusic()
    }
    return this.isMusicPlaying
  }

  setBackgroundMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume))
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.musicVolume
    }
  }

  isBackgroundMusicPlaying(): boolean {
    return this.isMusicPlaying
  }

  setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume))
    // Convert 0-1 to dB scale (-60 to 0)
    const dbVolume = volume === 0 ? -Infinity : 20 * Math.log10(volume) - 10
    if (this.synthBase) {
      this.synthBase.volume.value = dbVolume
    }
    if (this.synthBells) {
      this.synthBells.volume.value = dbVolume - 5  // Bells slightly quieter
    }
  }

  dispose(): void {
    this.pauseBackgroundMusic()
    this.backgroundMusic = null
    this.synthBase?.dispose()
    this.synthBells?.dispose()
    this.reverb?.dispose()
    this.delay?.dispose()
    this.isInitialized = false
  }
}


export const audioSystem = new AudioSystem()


let initPromise: Promise<void> | null = null
export const ensureAudioInitialized = async () => {
  if (!initPromise) {
    initPromise = audioSystem.initialize()
  }
  await initPromise
}