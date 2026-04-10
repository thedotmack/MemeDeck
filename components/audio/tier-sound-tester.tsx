"use client"

import React from "react";
import { Button } from "@/components/ui/button";
import { audioSystem } from "@/lib/audio";

const winTiers = ['small', 'decent', 'big', 'huge', 'legendary', 'epic', 'mythical', 'godlike', 'transcendent']
const lossTiers = ['small', 'moderate', 'significant', 'major', 'devastating', 'catastrophic', 'nuclear', 'apocalyptic', 'extinction', 'total']


const getBellCount = (tier: string): number => {
  const tierMap: Record<string, number> = {
    
    'small': 16, 'decent': 18, 'big': 20, 'huge': 22, 'legendary': 24,
    'epic': 26, 'mythical': 28, 'godlike': 30, 'transcendent': 32,
    
    'moderate': 3, 'significant': 4, 'major': 5, 'devastating': 6,
    'catastrophic': 8, 'nuclear': 10, 'apocalyptic': 12, 'extinction': 15, 'total': 20
  }
  return tierMap[tier] || 3
}

export default function TierSoundTester() {
  const playSound = async (tier: string, isWin: boolean) => {
    await audioSystem.initialize()
    audioSystem.playForTier(tier, isWin)
  }

  return (
    <div className="grid grid-cols-2 gap-6 p-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold mb-4 text-green-400">🎰 Win Slots (9 tiers)</h2>
        <div className="space-y-2">
          {winTiers.map((tier, idx) => {
            const bellCount = getBellCount(tier)
            return (
              <Button
                key={`win-${tier}`}
                className="w-full justify-between bg-green-900/20 hover:bg-green-800/30 border-green-600/20"
                onClick={() => playSound(tier, true)}
              >
                <div className="flex items-center">
                  <span className="font-mono text-sm mr-3">{(idx + 1).toString().padStart(2, '0')}</span>
                  <span>Win: {tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
                </div>
                <div className="text-xs text-green-300">
                  🎵 + {bellCount} 🔔
                </div>
              </Button>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4 text-red-400">🎰 Loss Slots (10 tiers)</h2>
        <div className="space-y-2">
          {lossTiers.map((tier, idx) => {
            const bellCount = getBellCount(tier)
            return (
              <Button
                key={`loss-${tier}`}
                className="w-full justify-between bg-red-900/20 hover:bg-red-800/30 border-red-600/20"
                onClick={() => playSound(tier, false)}
              >
                <div className="flex items-center">
                  <span className="font-mono text-sm mr-3">{(idx + 1).toString().padStart(2, '0')}</span>
                  <span>Loss: {tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
                </div>
                <div className="text-xs text-red-300">
                  🎵 only
                </div>
              </Button>
            )
          })}
        </div>
      </div>

      <div className="col-span-2 mt-6 p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-500/20">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          🎰 Slot Machine Audio System
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div>
            <h4 className="font-semibold text-white mb-2">🎵 Base Jingles</h4>
            <ul className="space-y-1">
              <li>• <strong>Win:</strong> C5 → E5 → G5 → C6 (ascending + resolution)</li>
              <li>• <strong>Loss:</strong> G4 → F4 → E4 → C4 (descending + resolution)</li>
              <li>• <strong>Duration:</strong> ~0.8 seconds each</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">🔔 Progressive Bells</h4>
            <ul className="space-y-1">
              <li>• <strong>Tier 1:</strong> 16 bells (2 bars) → <strong>Tier 9:</strong> 32 bells (max)</li>
              <li>• <strong>Timing:</strong> Start alongside jingle, 150ms intervals (slower tempo)</li>
              <li>• <strong>Sound:</strong> C4 bell tone - same note as resolution, lower octave (wins only)</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 bg-black/20 rounded text-xs text-gray-400 font-mono">
          Example: Transcendent Win = &quot;🎵 C5-E5-G5-C6&quot; (with simultaneous) &quot;🔔×32&quot; (32 bells at C4, progressive delay feedback)
        </div>
      </div>
    </div>
  );
}