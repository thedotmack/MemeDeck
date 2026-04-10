'use client';

import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from "motion/react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { IPhoneMockup } from 'react-device-mockup';
import PepeCompanion, { PepeCompanionRef } from './Pepe_Character';
import { PepeMessages, PepeMessagesRef } from './Pepe_Chat_UI';

interface PepeIPhoneSimpleProps {
  className?: string;
  enableSpeech?: boolean;
  context?: string;
  defaultPosition?: 'left' | 'right';
  onSlideIn?: () => void;
  onSlideOut?: () => void;
}

interface PepeIPhoneSimpleRef extends PepeCompanionRef {
  slideIn: () => void;
  slideOut: () => void;
  buzz: () => void;
  isVisible: boolean;
  addSequentialMessages: (messages: Array<{
    text: string;
    messageType: 'greeting' | 'funny' | 'staying_power' | 'trading_advice' | 'red_flag' | 'regular' | 'achievement_scratch';
    delay?: number;
  }>) => void;
}


const useResponsiveScale = () => {
  const [scale, setScale] = useState(1);
  
  useEffect(() => {
    const calculateScale = () => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      
      
      const phoneHeight = 900;
      const phoneWidth = 400;
      
      
      const heightScale = (vh * 0.875) / phoneHeight; 
      const widthScale = (vw * 0.295) / phoneWidth;    

      
      const newScale = Math.min(heightScale, widthScale, 1);
      
      setScale(newScale);
    };
    
    calculateScale();
    window.addEventListener('resize', calculateScale);
    
    return () => window.removeEventListener('resize', calculateScale);
  }, []);
  
  return scale;
};

const PepePhone = forwardRef<PepeIPhoneSimpleRef, PepeIPhoneSimpleProps>(({
  className,
  enableSpeech = true,
  context,
  defaultPosition = 'right',
  onSlideIn,
  onSlideOut
}, ref) => {
  const [isVisible, setIsVisible] = useState(true); // Default visible for demos
  const [hasNewMessage, setHasNewMessage] = useState(false);
  
  const pepeRef = useRef<PepeCompanionRef>(null);
  const messagesRef = useRef<PepeMessagesRef>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  
  const scale = useResponsiveScale();

  
  const pepeEvent = useStore.use.pepeEvent();
  
  
  const ui = useStore.use.ui() || {};
  const achievementNotification = ui.achievementNotification;
  
  
  const audio = useStore.use.audio() || {};
  const speechEnabled = audio.speechEnabled;
  const setAudio = useStore.use.setAudio();

  
  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    };
    
    window.addEventListener('click', initAudio, { once: true });
    return () => window.removeEventListener('click', initAudio);
  }, []);


  const playNotificationSound = useCallback(() => {
    if (!audioContextRef.current) return;
    
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    
    oscillator.frequency.setValueAtTime(587.33, audioContextRef.current.currentTime); 
    gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.3);
    
    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + 0.3);
    
    
    setTimeout(() => {
      const oscillator2 = audioContextRef.current!.createOscillator();
      const gainNode2 = audioContextRef.current!.createGain();
      
      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContextRef.current!.destination);
      
      oscillator2.frequency.setValueAtTime(880, audioContextRef.current!.currentTime); 
      gainNode2.gain.setValueAtTime(0.1, audioContextRef.current!.currentTime);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current!.currentTime + 0.2);
      
      oscillator2.start(audioContextRef.current!.currentTime);
      oscillator2.stop(audioContextRef.current!.currentTime + 0.2);
    }, 150);
  }, []);

  const buzz = useCallback(async () => {
    
    playNotificationSound();
    
    
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
    
    
    setHasNewMessage(true);
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    notificationTimeoutRef.current = setTimeout(() => setHasNewMessage(false), 3000);
  }, [playNotificationSound]);

  const slideIn = useCallback(() => {
    setIsVisible(true);
    onSlideIn?.();
    buzz();
  }, [onSlideIn, buzz]);

  const slideOut = useCallback(() => {
    setIsVisible(false);
    onSlideOut?.();
  }, [onSlideOut]);

  
  const handleAchievementEvent = useCallback((achievementData: any) => {
    if (!isVisible) slideIn();
    
    
    const achievementName = typeof achievementData === 'string' 
      ? achievementData 
      : achievementData?.achievementName || 'Achievement Unlocked';
    
    const achievementMessage = typeof achievementData === 'object' && achievementData?.message
      ? achievementData.message
      : `🏆 Achievement Unlocked: ${achievementName}!`;
    
    
    const isScratchReveal = achievementData?.scratchToReveal === true;
    
    
    const messageOptions = {
      messageType: (isScratchReveal ? 'achievement_scratch' : 'trading_advice') as 'achievement_scratch' | 'trading_advice',
      priority: 'high' as const,
      achievementData: isScratchReveal ? {
        achievementId: achievementData?.achievementId || '',
        achievementName: achievementName,
        imagePath: achievementData?.imagePath
      } : undefined
    };
    
    messagesRef.current?.addMessage(achievementMessage, messageOptions);
    

    pepeRef.current?.onAchievementUnlocked(achievementName);
    buzz();
  }, [isVisible, slideIn, buzz]);


  const pepeEventIsActive = pepeEvent?.isActive;
  const pepeEventContext = pepeEvent?.context;
  const pepeEventData = pepeEvent?.data;


  useEffect(() => {
    if (!pepeEventIsActive || !pepeEventContext) {
      return;
    }


    if (pepeEventContext === 'achievement_unlocked' && pepeEventData) {
      
      handleAchievementEvent(pepeEventData);
    }
  }, [pepeEventIsActive, pepeEventContext, pepeEventData, handleAchievementEvent]); 

  
  useEffect(() => {
    if (achievementNotification && isVisible) {
      slideOut();
    }
  }, [achievementNotification, isVisible, slideOut]);

  
  useImperativeHandle(ref, () => ({
    
    slideIn,
    slideOut,
    buzz,
    isVisible,
    
    
    addSequentialMessages: (messages) => {
      if (!isVisible) slideIn();
      messagesRef.current?.addSequentialMessages(messages);
      buzz();
    },
    
    onAchievementUnlocked: async (achievementData: any) => {
      handleAchievementEvent(achievementData);
    },
    speak: (text: string) => {
      if (!isVisible) slideIn();
      pepeRef.current?.speak(text);
      buzz();
    },
    stopSpeaking: () => {
      pepeRef.current?.stopSpeaking();
    }
  }), [isVisible, slideIn, slideOut, buzz, handleAchievementEvent]); 

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            "fixed bottom-4 z-[10000]",
            defaultPosition === 'right' ? 'right-4' : 'left-4',
            className
          )}
          initial={{ x: defaultPosition === 'right' ? '120%' : '-120%' }}
          animate={{ x: 0 }}
          exit={{ x: defaultPosition === 'right' ? '120%' : '-120%' }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div 
            className="relative"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'bottom center'
            }}
          >
            {}
            <IPhoneMockup 
              screenWidth={400} 
              screenType="island"
              frameColor="#111111"
              hideStatusBar={true}
              hideNavBar={true}
            >
              <div className="w-full h-full bg-black flex flex-col relative">
                {}
                <div className="h-48 bg-gradient-to-b from-green-900/50 to-gray-900 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-[url('/frames/squarezies.webp')] opacity-10" />
                  <div className="relative">
                    <PepeCompanion
                      ref={pepeRef}
                      position="fixed"
                      size="large"
                      enableSpeech={speechEnabled}
                      enableMouseTracking={true}
                      enableBlinking={true}
                      enableDragging={false}
                      context={context}
                      className="!static scale-80"
                      onSpeak={(text, duration) => {
                        messagesRef.current?.addMessage(text, { duration });
                      }}
                    />
                  </div>
                </div>

                {}
                <div className="h-full mb-36 overflow-y-auto">
                  <PepeMessages
                    ref={messagesRef}
                    onMicToggle={(enabled) => {
                      setAudio({ speechEnabled: enabled });
                    }}
                    initialMicEnabled={speechEnabled}
                  />
                </div>
              </div>
            </IPhoneMockup>

            {}
            <button
              onClick={slideOut}
              className="absolute -top-2 -right-2 z-20 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-colors"
            >
              ✕
            </button>

            {}
            <AnimatePresence>
              {hasNewMessage && (
                <motion.div
                  key="new-message-badge"
                  className="absolute top-4 right-4 z-20"
                  initial={{ scale: 0.01, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.01, opacity: 0 }}
                >
                  <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold animate-pulse">
                    !
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
      
    </AnimatePresence>
  );
});

PepePhone.displayName = 'Pepe_Notifications_UI';

export default PepePhone;