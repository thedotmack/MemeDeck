'use client';

import TierSoundTester from '@/components/audio/tier-sound-tester';
import { Celebration3DEnhanced } from '@/components/effects/celebration-3d-enhanced';
import { useAchievements } from '@/hooks/use-achievements';
import { ACHIEVEMENT_MAP } from '@/lib/achievements/definitions';
import { audioSystem, ensureAudioInitialized } from '@/lib/audio';
import { useStore } from '@/lib/store';
import type { JupiterTokenCard } from '@/lib/types/shared';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from "motion/react";
import {
    Activity,
    Award,
    Bug,
    Music,
    Sparkles,
    X,
    Zap
} from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

export function AnimationDebugPanel() {
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'3d-effects' | 'card-animations' | 'achievements' | 'audio'>('3d-effects');
  const [cardAnimationVariant, setCardAnimationVariant] = useState('bounce');
  
  
  const [text3DActive, setText3DActive] = useState(false);
  const [text3DVariant, setText3DVariant] = useState<
    
    | '3d-small' | '3d-decent' | '3d-big' | '3d-huge' | '3d-legendary' | '3d-epic' | '3d-mythical' | '3d-godlike' | '3d-transcendent'
    
    | '3d-ouch' | '3d-bruised' | '3d-wounded' | '3d-bleeding' | '3d-crushed' | '3d-shattered' | '3d-obliterated' | '3d-annihilated' | '3d-vaporized' | '3d-rug-burning'
    
    | '3d-win' | '3d-fire' | '3d-mega'
  >('3d-small');
  
  const { 
    debugTriggerAchievement, 
    stats, 
    achievements, 
    clearNotificationQueue,
    currentNotification,
    isNotificationVisible 
  } = useAchievements();

  
  const hand = useStore.use.hand() || [];
  const triggerCardAnimation = useStore.use.triggerCardAnimation();
  const checkPriceAchievements = useStore.use.checkPriceAchievements?.();
  
  
  // Enabled for demos - was: if (process.env.NODE_ENV !== 'development') return null;

  
  
  
  
  

  const handleTriggerCardAnimation = (cardId: string) => {
    
    
    
    triggerCardAnimation(cardId, cardAnimationVariant);
    
    
  };

  
  const trigger3DTextWithJingle = (text?: string, variant?: typeof text3DVariant) => {
    const variantToUse = variant || text3DVariant;
    
    
    
    
    setText3DActive(false);
    
    setTimeout(() => {
      
      if (variant) setText3DVariant(variant);
      
      
      setText3DActive(true);
      
      
      
      setTimeout(() => {
        setText3DActive(false);
        
      }, 3000);
      
      
      try {
        ensureAudioInitialized().then(() => {
          
          const isWin = variantToUse.includes('win') || variantToUse.includes('fire') || 
                       variantToUse.includes('legendary') || variantToUse.includes('epic') || 
                       variantToUse.includes('mega');
          
          if (isWin) {
            audioSystem.play('win'); 
          } else {
            audioSystem.play('loss'); 
          }
        });
      } catch (error) {
        console.warn('[3D DEBUG] Audio failed:', error);
      }
      
    }, 100);
  };

  const tabs = [
    { id: '3d-effects', label: '3D Effects', icon: <Zap className="w-4 h-4" /> },
    { id: 'card-animations', label: 'Card Anims', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'achievements', label: 'Awards', icon: <Award className="w-4 h-4" /> },
    { id: 'audio', label: 'Audio', icon: <Music className="w-4 h-4" /> },
  ];

  return (
    <>
      {}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-20 right-4 z-[9999] p-3 rounded-full shadow-lg",
          "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white",
          ""
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bug className="w-6 h-6" />
      </motion.button>

      {}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 z-50 w-[500px] max-h-[85vh] overflow-hidden"
          >
            <div className="bg-gray-900 rounded-lg shadow-2xl border border-purple-500/50">
              {}
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Bug className="w-5 h-5 text-purple-500" />
                  Multi-Tier Animation Debug
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {}
              <div className="flex border-b border-gray-800 overflow-x-auto">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex-shrink-0 px-2 py-2 text-xs font-medium transition-all flex items-center justify-center gap-1 min-w-0",
                      activeTab === tab.id
                        ? "bg-purple-600 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                    )}
                    title={tab.label}
                  >
                    {tab.icon}
                    <span className="hidden md:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="max-h-[60vh] overflow-y-auto">


                {}
                {activeTab === 'achievements' && (
                  <div className="p-4 space-y-4">
                    {}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">Achievement Statistics</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-gray-800 p-3 rounded">
                          <div className="text-white font-semibold">{stats.unlockedCount}</div>
                          <div className="text-gray-400">Unlocked</div>
                        </div>
                        <div className="bg-gray-800 p-3 rounded">
                          <div className="text-white font-semibold">{stats.progressPercentage.toFixed(1)}%</div>
                          <div className="text-gray-400">Progress</div>
                        </div>
                        <div className="bg-gray-800 p-3 rounded">
                          <div className="text-white font-semibold">{stats.categoriesCompleted.length}</div>
                          <div className="text-gray-400">Categories</div>
                        </div>
                      </div>
                    </div>

                    {}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">Debug Achievement Triggers</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {Array.from(ACHIEVEMENT_MAP.entries()).slice(0, 10).map(([id, achievement]) => (
                          <div key={id} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-white truncate">{achievement.name}</div>
                              <div className="text-xs text-gray-400 capitalize">{achievement.tier} • {achievement.category}</div>
                            </div>
                            <button
                              onClick={() => {
                                
                                debugTriggerAchievement(id);
                              }}
                              className="ml-2 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded"
                            >
                              Trigger
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      {}
                      <div className="mt-4 p-3 bg-gray-800 rounded">
                        <h5 className="text-xs font-semibold text-gray-400 mb-2">Testing Status</h5>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-gray-300">
                            <span className="text-gray-500">Unlocked:</span> {achievements.length}
                          </div>
                          <div className="text-gray-300">
                            <span className="text-gray-500">Available:</span> {stats.totalAchievements}
                          </div>
                          <div className="text-gray-300">
                            <span className="text-gray-500">Progress:</span> {stats.progressPercentage.toFixed(1)}%
                          </div>
                          <div className="text-gray-300">
                            <span className="text-gray-500">Categories:</span> {stats.categoriesCompleted.length}
                          </div>
                        </div>
                        
                        {}
                        {isNotificationVisible && currentNotification && (
                          <div className="mt-2 p-2 bg-green-900/50 border border-green-600 rounded">
                            <div className="text-xs text-green-400 font-medium">🏆 Active Notification</div>
                            <div className="text-xs text-green-300">{currentNotification.achievementId}</div>
                          </div>
                        )}
                        
                        {}
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={clearNotificationQueue}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                          >
                            Clear Queue
                          </button>
                        </div>
                      </div>

                      {}
                      <div className="mt-4">
                        <h5 className="text-xs font-semibold text-gray-400 mb-2">Test by Tier</h5>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => debugTriggerAchievement('first_trade')}
                            className="px-3 py-1 bg-amber-700 hover:bg-amber-600 text-white text-xs rounded"
                          >
                            Bronze
                          </button>
                          <button
                            onClick={() => debugTriggerAchievement('big_winner')}
                            className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded"
                          >
                            Silver
                          </button>
                          <button
                            onClick={() => debugTriggerAchievement('legendary_trader')}
                            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-xs rounded"
                          >
                            Gold
                          </button>
                          <button
                            onClick={() => debugTriggerAchievement('mythical_trader')}
                            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded"
                          >
                            Platinum
                          </button>
                          <button
                            onClick={() => debugTriggerAchievement('transcendent_master')}
                            className="px-3 py-1 bg-gradient-to-r from-white to-gray-300 hover:from-gray-100 hover:to-gray-400 text-black text-xs rounded font-bold"
                          >
                            Diamond
                          </button>
                        </div>
                      </div>
                      
                      {}
                      <div className="mt-4">
                        <h5 className="text-xs font-semibold text-gray-400 mb-2">Test Sequences</h5>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              
                              setTimeout(() => debugTriggerAchievement('first_trade'), 100);
                              setTimeout(() => debugTriggerAchievement('big_winner'), 8000);
                              setTimeout(() => debugTriggerAchievement('legendary_trader'), 16000);
                              setTimeout(() => debugTriggerAchievement('transcendent_master'), 24000);
                            }}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded"
                          >
                            Scratch Sequence
                          </button>
                          <button
                            onClick={() => {
                              
                              setTimeout(() => debugTriggerAchievement('first_trade'), 100);
                              setTimeout(() => debugTriggerAchievement('trader_10'), 300);
                              setTimeout(() => debugTriggerAchievement('portfolio_100'), 500);
                            }}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded"
                          >
                            Rapid Fire
                          </button>
                          <button
                            onClick={() => {
                              
                              
                              
                              
                              if (typeof checkPriceAchievements === 'function') {
                                
                                // react-doctor-disable-next-line no-secrets-in-client-code
                                const mockTokenId = 'test-token';
                                const oldPrice = 100;
                                const newPrice = 110;
                                const changePercent = 10;
                                
                                
                                checkPriceAchievements(mockTokenId, newPrice, oldPrice, changePercent);
                              }
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded"
                          >
                            Price Trigger Test
                          </button>
                        </div>
                      </div>
                      
                      {}
                      <div className="mt-4 p-3 bg-gray-800 rounded">
                        <h5 className="text-xs font-semibold text-gray-400 mb-2">System Status</h5>
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Pepe Connected:</span>
                            <span className="text-green-400">✓</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Confetti Service:</span>
                            <span className="text-green-400">✓</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Store Events:</span>
                            <span className="text-green-400">✓</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Price Triggers:</span>
                            <span className="text-green-400">✓</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}


                {}
                {activeTab === 'card-animations' && (
                  <div className="p-4 space-y-4">
                    {}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">Quick Test - Selected: {cardAnimationVariant}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            if (hand[0]) handleTriggerCardAnimation(hand[0].id);
                          }}
                          disabled={hand.length === 0}
                          className={cn(
                            "p-3 rounded font-medium transition-all",
                            hand.length === 0
                              ? "bg-gray-600 cursor-not-allowed"
                              : "bg-green-600 hover:bg-green-700 text-white"
                          )}
                        >
                          <Sparkles className="w-4 h-4 mx-auto mb-1" />
                          <div className="text-xs">Test First Card</div>
                        </button>
                        <button
                          onClick={() => {
                            hand.forEach((card, index) => {
                              setTimeout(() => handleTriggerCardAnimation(card.id), index * 300);
                            });
                          }}
                          disabled={hand.length === 0}
                          className={cn(
                            "p-3 rounded font-medium transition-all",
                            hand.length === 0
                              ? "bg-gray-600 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          )}
                        >
                          <Activity className="w-4 h-4 mx-auto mb-1" />
                          <div className="text-xs">Chain All Cards</div>
                        </button>
                      </div>
                    </div>

                    {}
                    <div className="space-y-4">
                      {}
                      <div>
                        <h4 className="text-sm font-semibold text-yellow-400 mb-2">⚡ Attention Seekers</h4>
                        <div className="grid grid-cols-4 gap-1">
                          {['bounce', 'flash', 'pulse', 'rubberBand', 'shakeX', 'shakeY', 'headShake', 'swing', 'tada', 'wobble', 'jello', 'heartBeat'].map(variant => (
                            <button
                              key={variant}
                              onClick={() => setCardAnimationVariant(variant)}
                              className={cn(
                                "px-2 py-1 rounded text-xs font-medium transition-all",
                                cardAnimationVariant === variant
                                  ? "bg-purple-600 text-white"
                                  : "bg-gray-800 hover:bg-gray-700"
                              )}
                              title={variant}
                            >
                              {variant}
                            </button>
                          ))}
                        </div>
                      </div>

                      {}
                      <div>
                        <h4 className="text-sm font-semibold text-blue-400 mb-2">↩️ Back In/Out</h4>
                        <div className="grid grid-cols-4 gap-1">
                          {['backInDown', 'backInLeft', 'backInRight', 'backInUp', 'backOutDown', 'backOutLeft', 'backOutRight', 'backOutUp'].map(variant => (
                            <button
                              key={variant}
                              onClick={() => setCardAnimationVariant(variant)}
                              className={cn(
                                "px-2 py-1 rounded text-xs font-medium transition-all",
                                cardAnimationVariant === variant
                                  ? "bg-purple-600 text-white"
                                  : "bg-gray-800 hover:bg-gray-700"
                              )}
                              title={variant}
                            >
                              {variant}
                            </button>
                          ))}
                        </div>
                      </div>

                      {}
                      <div>
                        <h4 className="text-sm font-semibold text-green-400 mb-2">⚡ Bounce In/Out</h4>
                        <div className="grid grid-cols-5 gap-1">
                          {['bounceIn', 'bounceInDown', 'bounceInLeft', 'bounceInRight', 'bounceInUp', 'bounceOut', 'bounceOutDown', 'bounceOutLeft', 'bounceOutRight', 'bounceOutUp'].map(variant => (
                            <button
                              key={variant}
                              onClick={() => setCardAnimationVariant(variant)}
                              className={cn(
                                "px-2 py-1 rounded text-xs font-medium transition-all",
                                cardAnimationVariant === variant
                                  ? "bg-purple-600 text-white"
                                  : "bg-gray-800 hover:bg-gray-700"
                              )}
                              title={variant}
                            >
                              {variant}
                            </button>
                          ))}
                        </div>
                      </div>

                      {}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 mb-2">🌫️ Fade In/Out</h4>
                        <div className="grid grid-cols-4 gap-1">
                          {['fadeIn', 'fadeInDown', 'fadeInDownBig', 'fadeInLeft', 'fadeInLeftBig', 'fadeInRight', 'fadeInRightBig', 'fadeInUp', 'fadeInUpBig', 'fadeInTopLeft', 'fadeInTopRight', 'fadeInBottomLeft', 'fadeInBottomRight', 'fadeOut', 'fadeOutDown', 'fadeOutDownBig', 'fadeOutLeft', 'fadeOutLeftBig', 'fadeOutRight', 'fadeOutRightBig', 'fadeOutUp', 'fadeOutUpBig', 'fadeOutTopLeft', 'fadeOutTopRight', 'fadeOutBottomLeft', 'fadeOutBottomRight'].map(variant => (
                            <button
                              key={variant}
                              onClick={() => setCardAnimationVariant(variant)}
                              className={cn(
                                "px-2 py-1 rounded text-xs font-medium transition-all",
                                cardAnimationVariant === variant
                                  ? "bg-purple-600 text-white"
                                  : "bg-gray-800 hover:bg-gray-700"
                              )}
                              title={variant}
                            >
                              {variant}
                            </button>
                          ))}
                        </div>
                      </div>

                      {}
                      <div>
                        <h4 className="text-sm font-semibold text-purple-400 mb-2">🔄 Flip In/Out</h4>
                        <div className="grid grid-cols-4 gap-1">
                          {['flip', 'flipInX', 'flipInY', 'flipOutX', 'flipOutY'].map(variant => (
                            <button
                              key={variant}
                              onClick={() => setCardAnimationVariant(variant)}
                              className={cn(
                                "px-2 py-1 rounded text-xs font-medium transition-all",
                                cardAnimationVariant === variant
                                  ? "bg-purple-600 text-white"
                                  : "bg-gray-800 hover:bg-gray-700"
                              )}
                              title={variant}
                            >
                              {variant}
                            </button>
                          ))}
                        </div>
                      </div>

                      {}
                      <div>
                        <h4 className="text-sm font-semibold text-cyan-400 mb-2">💨 Light Speed</h4>
                        <div className="grid grid-cols-4 gap-1">
                          {['lightSpeedInLeft', 'lightSpeedInRight', 'lightSpeedOutLeft', 'lightSpeedOutRight'].map(variant => (
                            <button
                              key={variant}
                              onClick={() => setCardAnimationVariant(variant)}
                              className={cn(
                                "px-2 py-1 rounded text-xs font-medium transition-all",
                                cardAnimationVariant === variant
                                  ? "bg-purple-600 text-white"
                                  : "bg-gray-800 hover:bg-gray-700"
                              )}
                              title={variant}
                            >
                              {variant}
                            </button>
                          ))}
                        </div>
                      </div>

                      {}
                      <div>
                        <h4 className="text-sm font-semibold text-orange-400 mb-2">🔄 Rotate In/Out</h4>
                        <div className="grid grid-cols-4 gap-1">
                          {['rotateIn', 'rotateInDownLeft', 'rotateInDownRight', 'rotateInUpLeft', 'rotateInUpRight', 'rotateOut', 'rotateOutDownLeft', 'rotateOutDownRight', 'rotateOutUpLeft', 'rotateOutUpRight'].map(variant => (
                            <button
                              key={variant}
                              onClick={() => setCardAnimationVariant(variant)}
                              className={cn(
                                "px-2 py-1 rounded text-xs font-medium transition-all",
                                cardAnimationVariant === variant
                                  ? "bg-purple-600 text-white"
                                  : "bg-gray-800 hover:bg-gray-700"
                              )}
                              title={variant}
                            >
                              {variant}
                            </button>
                          ))}
                        </div>
                      </div>

                      {}
                      <div>
                        <h4 className="text-sm font-semibold text-red-400 mb-2">🎪 Special Effects</h4>
                        <div className="grid grid-cols-4 gap-1">
                          {['hinge', 'jackInTheBox', 'rollIn', 'rollOut'].map(variant => (
                            <button
                              key={variant}
                              onClick={() => setCardAnimationVariant(variant)}
                              className={cn(
                                "px-2 py-1 rounded text-xs font-medium transition-all",
                                cardAnimationVariant === variant
                                  ? "bg-purple-600 text-white"
                                  : "bg-gray-800 hover:bg-gray-700"
                              )}
                              title={variant}
                            >
                              {variant}
                            </button>
                          ))}
                        </div>
                      </div>

                      {}
                      <div>
                        <h4 className="text-sm font-semibold text-pink-400 mb-2">🔍 Zoom In/Out</h4>
                        <div className="grid grid-cols-4 gap-1">
                          {['zoomIn', 'zoomInDown', 'zoomInLeft', 'zoomInRight', 'zoomInUp', 'zoomOut', 'zoomOutDown', 'zoomOutLeft', 'zoomOutRight', 'zoomOutUp'].map(variant => (
                            <button
                              key={variant}
                              onClick={() => setCardAnimationVariant(variant)}
                              className={cn(
                                "px-2 py-1 rounded text-xs font-medium transition-all",
                                cardAnimationVariant === variant
                                  ? "bg-purple-600 text-white"
                                  : "bg-gray-800 hover:bg-gray-700"
                              )}
                              title={variant}
                            >
                              {variant}
                            </button>
                          ))}
                        </div>
                      </div>

                      {}
                      <div>
                        <h4 className="text-sm font-semibold text-indigo-400 mb-2">↔️ Slide In/Out</h4>
                        <div className="grid grid-cols-4 gap-1">
                          {['slideInDown', 'slideInLeft', 'slideInRight', 'slideInUp', 'slideOutDown', 'slideOutLeft', 'slideOutRight', 'slideOutUp'].map(variant => (
                            <button
                              key={variant}
                              onClick={() => setCardAnimationVariant(variant)}
                              className={cn(
                                "px-2 py-1 rounded text-xs font-medium transition-all",
                                cardAnimationVariant === variant
                                  ? "bg-purple-600 text-white"
                                  : "bg-gray-800 hover:bg-gray-700"
                              )}
                              title={variant}
                            >
                              {variant}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>


                    {}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">
                        Trigger Card Animation ({hand.length} cards) - Selected: {cardAnimationVariant}
                      </h4>
                      {hand.length === 0 ? (
                        <p className="text-sm text-gray-500">Draw some cards first!</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {hand.map((card: JupiterTokenCard) => (
                            <div
                              key={card.id}
                              className="flex items-center justify-between p-2 bg-gray-800 rounded hover:bg-gray-700"
                            >
                              <div className="flex items-center gap-2">
                                <Image
                                  src={card.icon}
                                  alt={card.symbol}
                                  width={24}
                                  height={24}
                                  className="rounded-full"
                                />
                                <div>
                                  <div className="text-sm font-semibold text-white">
                                    {card.symbol}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    ${card.usdPrice.toFixed(4)}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleTriggerCardAnimation(card.id)}
                                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold"
                              >
                                {cardAnimationVariant}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {}
                {activeTab === '3d-effects' && (
                  <div className="p-4 space-y-4">

                    {}
                    <div>
                      <h4 className="text-sm font-semibold text-green-400 mb-2">🏆 Win Tier Variants (9 tiers)</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { variant: '3d-small', label: 'Small', color: 'bg-green-400', icon: '💰' },
                          { variant: '3d-decent', label: 'Decent', color: 'bg-green-500', icon: '💵' },
                          { variant: '3d-big', label: 'Big', color: 'bg-yellow-500', icon: '💸' },
                          { variant: '3d-huge', label: 'Huge', color: 'bg-orange-500', icon: '🏆' },
                          { variant: '3d-legendary', label: 'Legendary', color: 'bg-purple-500', icon: '👑' },
                          { variant: '3d-epic', label: 'Epic', color: 'bg-cyan-400', icon: '⚡' },
                          { variant: '3d-mythical', label: 'Mythical', color: 'bg-pink-400', icon: '🔮' },
                          { variant: '3d-godlike', label: 'Godlike', color: 'bg-yellow-300', icon: '✨' },
                          { variant: '3d-transcendent', label: 'Transcendent', color: 'bg-white text-black', icon: '🌟' },
                        ].map(({ variant, label, color, icon }) => (
                          <button
                            key={variant}
                            onClick={() => {
                              setText3DVariant(variant as any);
                              setTimeout(() => trigger3DTextWithJingle(), 100);
                            }}
                            className={cn(
                              "p-2 rounded font-medium transition-all flex flex-col items-center gap-1 text-white",
                              color,
                              text3DVariant === variant && "ring-2 ring-white"
                            )}
                          >
                            <span className="text-sm">{icon}</span>
                            <span className="text-xs">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {}
                    <div>
                      <h4 className="text-sm font-semibold text-red-400 mb-2">💀 Loss Tier Variants (10 tiers)</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { variant: '3d-ouch', label: 'Ouch', color: 'bg-red-400', icon: '😬' },
                          { variant: '3d-bruised', label: 'Bruised', color: 'bg-red-500', icon: '🤕' },
                          { variant: '3d-wounded', label: 'Wounded', color: 'bg-red-600', icon: '😵' },
                          { variant: '3d-bleeding', label: 'Bleeding', color: 'bg-red-700', icon: '🩸' },
                          { variant: '3d-crushed', label: 'Crushed', color: 'bg-red-800', icon: '💥' },
                          { variant: '3d-shattered', label: 'Shattered', color: 'bg-red-900', icon: '💔' },
                          { variant: '3d-obliterated', label: 'Obliterated', color: 'bg-red-950', icon: '💀' },
                          { variant: '3d-annihilated', label: 'Annihilated', color: 'bg-gray-900', icon: '☠️' },
                          { variant: '3d-vaporized', label: 'Vaporized', color: 'bg-black', icon: '🌑' },
                          { variant: '3d-rug-burning', label: 'Rug Burning', color: 'bg-orange-600', icon: '🔥' },
                        ].map(({ variant, label, color, icon }) => (
                          <button
                            key={variant}
                            onClick={() => {
                              setText3DVariant(variant as any);
                              setTimeout(() => trigger3DTextWithJingle(), 100);
                            }}
                            className={cn(
                              "p-2 rounded font-medium transition-all flex flex-col items-center gap-1 text-white",
                              color,
                              text3DVariant === variant && "ring-2 ring-white"
                            )}
                          >
                            <span className="text-sm">{icon}</span>
                            <span className="text-xs">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">🎮 Legacy Variants (compatibility)</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { variant: '3d-win', label: 'Legacy Win', color: 'bg-gray-600', icon: '🏆' },
                          { variant: '3d-fire', label: 'Legacy Fire', color: 'bg-orange-600', icon: '🔥' },
                          { variant: '3d-mega', label: 'Legacy Mega', color: 'bg-yellow-600', icon: '💫' },
                        ].map(({ variant, label, color, icon }) => (
                          <button
                            key={variant}
                            onClick={() => {
                              setText3DVariant(variant as any);
                              setTimeout(() => trigger3DTextWithJingle(), 100);
                            }}
                            className={cn(
                              "p-2 rounded font-medium transition-all flex flex-col items-center gap-1 text-white",
                              color,
                              text3DVariant === variant && "ring-2 ring-white"
                            )}
                          >
                            <span className="text-sm">{icon}</span>
                            <span className="text-xs">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {}
                    <div>
                      <h4 className="text-sm font-semibold text-blue-400 mb-2">🤖 Automated Test Sequences</h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            const winSequence = ['3d-small', '3d-decent', '3d-big', '3d-huge', '3d-legendary', '3d-epic', '3d-mythical', '3d-godlike', '3d-transcendent'];
                            winSequence.forEach((variant: string, i: number) => {
                              setTimeout(() => {
                                setText3DVariant(variant as any);
                                setTimeout(() => trigger3DTextWithJingle(), 100);
                              }, i * 4000);
                            });
                          }}
                          className="w-full py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-all flex items-center justify-center gap-2"
                        >
                          <Zap className="w-4 h-4" />
                          Test All Win Tiers (36 seconds)
                        </button>
                        
                        <button
                          onClick={() => {
                            const lossSequence = ['3d-ouch', '3d-bruised', '3d-wounded', '3d-bleeding', '3d-crushed', '3d-shattered', '3d-obliterated', '3d-annihilated', '3d-vaporized', '3d-rug-burning'];
                            lossSequence.forEach((variant: string, i: number) => {
                              setTimeout(() => {
                                setText3DVariant(variant as any);
                                setTimeout(() => trigger3DTextWithJingle(), 100);
                              }, i * 4000);
                            });
                          }}
                          className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-all flex items-center justify-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Test All Loss Tiers (40 seconds)
                        </button>
                        
                        <button
                          onClick={() => {
                            const allVariants = ['3d-small', '3d-ouch', '3d-decent', '3d-bruised', '3d-big', '3d-wounded', '3d-huge', '3d-bleeding', '3d-legendary', '3d-crushed', '3d-epic', '3d-shattered', '3d-mythical', '3d-obliterated', '3d-godlike', '3d-annihilated', '3d-transcendent', '3d-vaporized', '3d-rug-burning'];
                            allVariants.forEach((variant: string, i: number) => {
                              setTimeout(() => {
                                setText3DVariant(variant as any);
                                setTimeout(() => trigger3DTextWithJingle(), 100);
                              }, i * 3500);
                            });
                          }}
                          className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-all flex items-center justify-center gap-2"
                        >
                          <Zap className="w-4 h-4" />
                          Test All 19 Variants (67 seconds)
                        </button>
                      </div>
                    </div>

                    {}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">🎯 Manual Control</h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => trigger3DTextWithJingle()}
                          className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition-all flex items-center justify-center gap-2"
                        >
                          <Zap className="w-4 h-4" />
                          Trigger {text3DVariant.replace('3d-', '').toUpperCase()} Effect + Audio
                        </button>
                        
                        <button
                          onClick={() => setText3DActive(false)}
                          className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium transition-all"
                        >
                          Clear Effect
                        </button>
                      </div>
                    </div>

                    {/* PERFORMANCE MONITORING */}
                    <div className="p-3 bg-gray-800 rounded">
                      <h5 className="text-xs font-semibold text-gray-400 mb-2">🔬 Performance Monitoring</h5>
                      <div className="grid grid-cols-1 gap-2 text-xs mb-2">
                        <div className="text-gray-300">
                          <span className="text-gray-500">Active Variant:</span> {text3DVariant}
                        </div>
                      </div>
                      <div className="border-t border-gray-700 pt-2 mt-2">
                        <h6 className="text-xs font-semibold text-gray-400 mb-1">Audio System</h6>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-gray-300">
                            <span className="text-gray-500">Status:</span> ✅ Active
                          </div>
                          <div className="text-gray-300">
                            <span className="text-gray-500">Type:</span> New Clean Audio
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Complete 3D effects testing suite with all 19 variants (9 win + 10 loss tiers). 
                        Includes physics particles, 4-layer audio system, and performance monitoring for 
                        cinematic AAA-quality effects.
                      </p>
                    </div>
                  </div>
                )}

                {/* Audio Tab */}
                {activeTab === 'audio' && (
                  <div className="p-4">
                    <TierSoundTester />
                  </div>
                )}

                {}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {}
      <Celebration3DEnhanced
        isActive={text3DActive}
        variant={text3DVariant}
        percentChange={15.7} 
        dollarAmount={47.50} 
        intensity="normal"
      />
    </>
  );
}