"use client"

import { useState, useEffect, useRef } from 'react'
import { Volume2, VolumeX, Volume1, Music, Music2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/lib/store'
import { audioSystem } from '@/lib/audio'

// Helper to get volume icon based on level
function getVolumeIcon(volume: number, enabled: boolean) {
  if (!enabled || volume === 0) return VolumeX
  if (volume < 0.5) return Volume1
  return Volume2
}

interface VolumeSliderProps {
  value: number
  onChange: (value: number) => void
  enabled: boolean
  onToggle: () => void
  label: string
  icon: 'music' | 'sfx'
}

function VolumeSlider({ value, onChange, enabled, onToggle, label, icon }: VolumeSliderProps) {
  const Icon = icon === 'music' ? (enabled ? Music : Music2) : getVolumeIcon(value, enabled)

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-900/80 rounded-lg min-w-[180px]">
      <button
        onClick={onToggle}
        className="p-1.5 rounded hover:bg-gray-800 transition-colors"
        title={enabled ? `Mute ${label}` : `Unmute ${label}`}
      >
        <Icon className="h-4 w-4" />
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={enabled ? value : 0}
        onChange={(e) => onChange(Number.parseFloat(e.target.value))}
        disabled={!enabled}
        className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <span className="text-xs text-gray-400 w-8 text-right">
        {enabled ? Math.round(value * 100) : 0}%
      </span>
    </div>
  )
}

export default function AudioControls() {
  const [isExpanded, setIsExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Store state
  const audio = useStore.use.audio()
  const setMusicVolume = useStore.use.setMusicVolume()
  const setSfxVolume = useStore.use.setSfxVolume()
  const toggleMusic = useStore.use.toggleMusic()
  const toggleSfx = useStore.use.toggleSfx()

  // Sync store volume to audioSystem
  useEffect(() => {
    audioSystem.setBackgroundMusicVolume(audio.musicEnabled ? audio.musicVolume : 0)
  }, [audio.musicVolume, audio.musicEnabled])

  useEffect(() => {
    audioSystem.setSfxVolume(audio.sfxEnabled ? audio.sfxVolume : 0)
  }, [audio.sfxVolume, audio.sfxEnabled])

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
      }
    }
    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isExpanded])

  // Determine main icon state
  const allMuted = !audio.musicEnabled && !audio.sfxEnabled
  const MainIcon = allMuted ? VolumeX : Volume2

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1"
        title="Audio settings"
      >
        <MainIcon className="h-4 w-4" />
      </Button>

      {isExpanded && (
        <div className="absolute right-0 top-full mt-2 flex flex-col gap-2 p-2 bg-gray-900/95 backdrop-blur-sm rounded-lg border border-gray-700 shadow-xl z-50">
          <VolumeSlider
            value={audio.musicVolume}
            onChange={setMusicVolume}
            enabled={audio.musicEnabled}
            onToggle={toggleMusic}
            label="Music"
            icon="music"
          />
          <VolumeSlider
            value={audio.sfxVolume}
            onChange={setSfxVolume}
            enabled={audio.sfxEnabled}
            onToggle={toggleSfx}
            label="SFX"
            icon="sfx"
          />
        </div>
      )}
    </div>
  )
}
