"use client"

import { useState, useRef, useEffect } from "react"
import { Settings, RotateCcw, HelpCircle, Eye, EyeOff } from "lucide-react"



export const defaultAsciiControls = {
  frequency: 3.5, 
  speed: 0.12, 
  value: 0.8, 
  colorStart: "#0060ee", 
  colorMid: "#8744bb", 
  colorEnd: "#10d3da", 
  audioIntensity: 1.0, 
}


interface SettingsDropdownProps {
  controls: {
    frequency: number
    speed: number
    value: number
    colorStart: string
    colorMid: string
    colorEnd: string
    audioIntensity: number
  }
  setControls: (controls: any) => void
  isBackgroundVisible: boolean
  onToggleBackground: () => void
  onOpenHelp: () => void
}


function SettingsDropdown({
  controls,
  setControls,
  isBackgroundVisible,
  onToggleBackground,
  onOpenHelp,
}: SettingsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const toggleDropdown = () => {
    
    setIsOpen(!isOpen)
  }

  
  const resetToDefaults = () => {
    
    setControls(defaultAsciiControls)
  }

  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="bg-gray-900/70 backdrop-blur-xs rounded-lg p-1.5 border border-blue-500/30 text-white hover:bg-gray-700/80 transition-colors"
        title="Settings"
      >
        <Settings size={18} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-gray-900/90 backdrop-blur-xs rounded-lg p-3 border border-blue-500/30 text-white z-50 shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-blue-300">Settings</h3>
            <button
              onClick={resetToDefaults}
              className="text-xs flex items-center text-blue-300 hover:text-blue-100 transition-colors"
              title="Reset to defaults"
            >
              <RotateCcw size={12} className="mr-1" />
              Reset
            </button>
          </div>

          {}
          <div className="mb-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Background</span>
              <button
                onClick={() => {
                  onToggleBackground()
                  
                }}
                className="bg-gray-800 hover:bg-gray-700 rounded-lg p-1.5 border border-blue-500/30 text-white transition-colors"
                title={isBackgroundVisible ? "Hide Background" : "Show Background"}
              >
                {isBackgroundVisible ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm">Help</span>
              <button
                onClick={() => {
                  onOpenHelp()
                  
                }}
                className="bg-gray-800 hover:bg-gray-700 rounded-lg p-1.5 border border-blue-500/30 text-white transition-colors"
                title="Open Help"
              >
                <HelpCircle size={18} />
              </button>
            </div>
          </div>

          <div className="border-t border-blue-500/30 pt-3 mb-3">
            <h4 className="text-sm font-medium text-blue-300 mb-2">Background Settings</h4>
            {!isBackgroundVisible && (
              <div className="mb-3 p-2 bg-red-900/30 border border-red-500/30 rounded text-xs text-red-300">
                Background is currently hidden. Toggle visibility to see changes.
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <label htmlFor="ascii-pattern-size" className="text-xs">Pattern Size</label>
                <span className="text-xs text-blue-300">{controls.frequency.toFixed(2)}</span>
              </div>
              <input
                id="ascii-pattern-size"
                type="range"
                min="1"
                max="10"
                step="0.1"
                value={controls.frequency}
                onChange={(e) => setControls({ ...controls, frequency: Number.parseFloat(e.target.value) })}
                className="w-full h-2 bg-blue-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label htmlFor="ascii-animation-speed" className="text-xs">Animation Speed</label>
                <span className="text-xs text-blue-300">{controls.speed.toFixed(2)}</span>
              </div>
              <input
                id="ascii-animation-speed"
                type="range"
                min="0.01"
                max="0.2"
                step="0.01"
                value={controls.speed}
                onChange={(e) => setControls({ ...controls, speed: Number.parseFloat(e.target.value) })}
                className="w-full h-2 bg-blue-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label htmlFor="ascii-base-brightness" className="text-xs">Base Brightness</label>
                <span className="text-xs text-blue-300">{controls.value.toFixed(2)}</span>
              </div>
              <input
                id="ascii-base-brightness"
                type="range"
                min="0.2"
                max="0.8"
                step="0.05"
                value={controls.value}
                onChange={(e) => setControls({ ...controls, value: Number.parseFloat(e.target.value) })}
                className="w-full h-2 bg-blue-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {}
            <div>
              <div className="flex justify-between mb-1">
                <label htmlFor="ascii-audio-reactivity" className="text-xs">Audio Reactivity</label>
                <span className="text-xs text-blue-300">{controls.audioIntensity.toFixed(2)}</span>
              </div>
              <input
                id="ascii-audio-reactivity"
                type="range"
                min="0"
                max="1.0"
                step="0.05"
                value={controls.audioIntensity}
                onChange={(e) => setControls({ ...controls, audioIntensity: Number.parseFloat(e.target.value) })}
                className="w-full h-2 bg-blue-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs">None</span>
                <span className="text-xs">Max</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="ascii-color-start" className="block mb-1 text-xs">Start Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    id="ascii-color-start"
                    type="color"
                    value={controls.colorStart}
                    onChange={(e) => setControls({ ...controls, colorStart: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <span className="text-xs">{controls.colorStart}</span>
                </div>
              </div>

              <div>
                <label htmlFor="ascii-color-mid" className="block mb-1 text-xs">Middle Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    id="ascii-color-mid"
                    type="color"
                    value={controls.colorMid}
                    onChange={(e) => setControls({ ...controls, colorMid: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <span className="text-xs">{controls.colorMid}</span>
                </div>
              </div>

              <div>
                <label htmlFor="ascii-color-end" className="block mb-1 text-xs">End Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    id="ascii-color-end"
                    type="color"
                    value={controls.colorEnd}
                    onChange={(e) => setControls({ ...controls, colorEnd: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <span className="text-xs">{controls.colorEnd}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
