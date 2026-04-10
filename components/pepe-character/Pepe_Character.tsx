'use client';

import { ANIMATION_CONFIG, SPRITE_CONFIG } from '@/lib/pepe/animations';
import { defaultPepePersonality } from '@/lib/pepe/personality';
import { getRandomPhrase } from '@/lib/pepe/phrases';
import { DEFAULT_PEPE_VOICE, preprocessSpeechText, speakWithElevenLabs } from '@/lib/pepe/speech-utils';
import { AnimatePresence, motion } from "motion/react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import Image from 'next/image';

interface GridPosition {
  row: 1 | 2 | 3
  col: 1 | 2 | 3
  align?: 'center' | 'intersection-top' | 'intersection-left'
}

interface PepeCompanionProps {
  
  position?: 'floating' | 'fixed';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  
  
  enableSpeech?: boolean;
  enableMouseTracking?: boolean;
  enableBlinking?: boolean;
  enableDragging?: boolean;
  
  
  targetGridPosition?: GridPosition;
  returnToPositionDelay?: number;
  
  
  phrase?: string;
  context?: string;
  
  
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onSpeak?: (text: string, duration: number) => void;
  
}

export interface PepeCompanionRef {
  
  onAchievementUnlocked: (achievementName?: string) => Promise<void>;
  
  
  speak: (text: string) => void;
  stopSpeaking: () => void;
}

const PepeCompanion = forwardRef<PepeCompanionRef, PepeCompanionProps>(({
  position = 'floating',
  size = 'medium',
  className = '',
  enableSpeech = true,
  enableMouseTracking = true,
  enableBlinking = true,
  enableDragging = true,
  targetGridPosition,
  returnToPositionDelay = 3000,
  phrase,
  context,
  onSpeechStart,
  onSpeechEnd,
  onSpeak
}, ref) => {

  const [currentFrame, setCurrentFrame] = useState<string>(SPRITE_CONFIG.sequence[0]);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [floatOffset, setFloatOffset] = useState(0);
  

  const [facingDirection, setFacingDirection] = useState<'left' | 'right'>('right');
  const [headRotation, setHeadRotation] = useState(0);
  const [eyeOffset, setEyeOffset] = useState({
    left: { x: 0, y: 0 },
    right: { x: 0, y: 0 }
  });
  const [speechBubbleText, setSpeechBubbleText] = useState<string | null>(null);
  
  
  const idleTimerRef = useRef<number | null>(null);
  
  
  const [position2D, setPosition2D] = useState({ x: 0, y: 0 });
  const [targetPosition, setTargetPosition] = useState<{ x: number, y: number } | null>(null);
  const [hasBeenMoved, setHasBeenMoved] = useState(false);
  const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0, top: 0, bottom: 0 });
  const returnTimerRef = useRef<number | null>(null);
  
  
  
  const animationRef = useRef<number | null>(null);
  const blinkTimeoutRef = useRef<number | null>(null);
  const pepeDivRef = useRef<HTMLDivElement>(null);

  

  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateConstraintsAndPosition = () => {
        
        const newConstraints = {
          left: 0,
          right: window.innerWidth - 128, 
          top: 0,
          bottom: window.innerHeight - 160 
        };
        setDragConstraints(newConstraints);

        
        if (targetGridPosition) {
          const { innerWidth, innerHeight } = window;
          const cellWidth = innerWidth / 3;
          const cellHeight = innerHeight / 3;
          
          const baseX = (targetGridPosition.col - 1) * cellWidth;
          const baseY = (targetGridPosition.row - 1) * cellHeight;
          
          let x = baseX;
          let y = baseY;
          
          switch (targetGridPosition.align) {
            case 'center':
              x = baseX + cellWidth / 2 - 64;
              y = baseY + cellHeight / 2 - 80;
              break;
            case 'intersection-top':
              x = baseX + cellWidth / 2 - 64;
              y = baseY - 80;
              break;
            case 'intersection-left':
              x = baseX - 64;
              y = baseY + cellHeight / 2 - 80;
              break;
            default:
              x = baseX + cellWidth / 2 - 64;
              y = baseY + cellHeight / 2 - 80;
          }
          
          
          x = Math.max(newConstraints.left, Math.min(newConstraints.right, x));
          y = Math.max(newConstraints.top, Math.min(newConstraints.bottom, y));
          
          setTargetPosition({ x, y });
          
          
          if (!hasBeenMoved) {
            setPosition2D({ x, y });
          }
        } else if (!hasBeenMoved) {
          
          const paddingX = window.innerWidth * 0.1;
          const paddingY = window.innerHeight * 0.15;
          const defaultPosition = {
            x: window.innerWidth - 128 - paddingX,
            y: window.innerHeight - 160 - paddingY
          };
          setPosition2D(defaultPosition);
        }
      };

      updateConstraintsAndPosition();
      
      
      const timer = setTimeout(() => {
        setHasLoaded(true);
      }, 100);

      window.addEventListener('resize', updateConstraintsAndPosition);
      return () => {
        window.removeEventListener('resize', updateConstraintsAndPosition);
        clearTimeout(timer);
      };
    }
  }, [targetGridPosition, hasBeenMoved]);

  
  const sizeConfig = {
    small: { width: 'w-48', height: 'h-48' },
    medium: { width: 'w-60', height: 'h-60' },
    large: { width: 'w-72', height: 'h-72' }
  };

  

  const performBlink = () => {
    
    setIsBlinking(true);
    setTimeout(() => {
      setIsBlinking(false);
    }, ANIMATION_CONFIG.blinkDuration);
  };

  const scheduleNextBlink = useCallback(() => {
    const nextBlinkIn = Math.random() * 
      (ANIMATION_CONFIG.blinkInterval.max - ANIMATION_CONFIG.blinkInterval.min) + 
      ANIMATION_CONFIG.blinkInterval.min;
    
    blinkTimeoutRef.current = window.setTimeout(() => {
      
      if (!isSpeaking && currentFrame === SPRITE_CONFIG.sequence[0]) {
        performBlink();
      }
      scheduleNextBlink();
    }, nextBlinkIn);
  }, [isSpeaking, currentFrame]);

  
  useEffect(() => {
    if (!enableBlinking) return;
    
    scheduleNextBlink();
    return () => {
      if (blinkTimeoutRef.current) {
        clearTimeout(blinkTimeoutRef.current);
      }
    };
  }, [enableBlinking, scheduleNextBlink]);

  
  useEffect(() => {
    let animationFrame: number;
    let startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      
      const float = Math.sin(elapsed * 0.001) * 6; 
      setFloatOffset(float);
      
      animationFrame = requestAnimationFrame(animate);
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  
  useEffect(() => {
    if (!enableMouseTracking) return;

    const handleMouseMove = (e: MouseEvent) => {
      
      
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      
      
      if (pepeDivRef.current) {
        const rect = pepeDivRef.current.getBoundingClientRect();
        const pepeCenterX = rect.left + rect.width / 2;
        const pepeCenterY = rect.top + rect.height / 2;
        
        
        const deltaX = e.clientX - pepeCenterX;
        const deltaY = e.clientY - pepeCenterY;
        
        
        setFacingDirection(deltaX < 0 ? 'left' : 'right');
        
        
        let headTilt = 0;
        
        
        if (typeof window !== 'undefined') {
          const normalizedX = (deltaX / window.innerWidth) * 2;
          const normalizedY = (deltaY / window.innerHeight) * 2;
          
          
          const angle = Math.atan2(normalizedY, Math.abs(normalizedX));
          headTilt = angle * (180 / Math.PI) * 0.3; 
          
          
          
          headTilt = Math.max(-20, Math.min(20, headTilt));
          
          setHeadRotation(headTilt);
          
          
          
          const maxEyeMovement = 12;
          
          
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          const normalizedDistance = Math.min(distance / 500, 1);
          
          
          const baseX = (deltaX / 50) * (1 + normalizedDistance * 0.5);
          const baseY = (deltaY / 50) * (1 + normalizedDistance * 0.5);
          
          
          
          const crossEyedZone = 100; 
          const crossEyedFactor = Math.max(0, 1 - (Math.abs(deltaX) / crossEyedZone));
          
          
          const convergenceAmount = 8; 
          const eyeConvergence = convergenceAmount * crossEyedFactor;
          
          let leftEyeX = baseX;
          let rightEyeX = baseX;
          
          
          if (Math.abs(deltaX) < crossEyedZone) {
            leftEyeX = baseX + eyeConvergence; 
            rightEyeX = baseX - eyeConvergence; 
          }
          
          
          leftEyeX = Math.max(-maxEyeMovement, Math.min(maxEyeMovement, leftEyeX));
          rightEyeX = Math.max(-maxEyeMovement, Math.min(maxEyeMovement, rightEyeX));
          const eyeY = Math.max(-maxEyeMovement, Math.min(maxEyeMovement, baseY));
          
          
          if (deltaX < 0) {
            
            const temp = leftEyeX;
            leftEyeX = -rightEyeX;
            rightEyeX = -temp;
          }
          
          setEyeOffset({
            left: { x: leftEyeX, y: eyeY },
            right: { x: rightEyeX, y: eyeY }
          });
        }
      }
      
      
      idleTimerRef.current = window.setTimeout(() => {
        
        
        const returnToNeutral = () => {
          setHeadRotation((current) => {
            if (Math.abs(current) < 0.5) {
              return 0;
            }
            return current * 0.85; 
          });
          
          
          setEyeOffset((current) => ({
            left: {
              x: Math.abs(current.left.x) < 0.5 ? 0 : current.left.x * 0.85,
              y: Math.abs(current.left.y) < 0.5 ? 0 : current.left.y * 0.85
            },
            right: {
              x: Math.abs(current.right.x) < 0.5 ? 0 : current.right.x * 0.85,
              y: Math.abs(current.right.y) < 0.5 ? 0 : current.right.y * 0.85
            }
          }));
        };
        
        
        const interval = setInterval(() => {
          returnToNeutral();
        }, 40); 
        
        
        setTimeout(() => clearInterval(interval), 500);
      }, 2000); 
    };

    document.addEventListener('mousemove', handleMouseMove);
    
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      if (returnTimerRef.current) {
        clearTimeout(returnTimerRef.current);
      }
    };
  }, [enableMouseTracking]);

  const playPhrase = useCallback(async (phrase: string) => {

    const processedText = preprocessSpeechText(phrase);


    const estimatedDuration = Math.max(2000, phrase.length * 60);
    if (onSpeak) {
      onSpeak(phrase, estimatedDuration);
    }

    // Always show speech bubble with the phrase text
    setSpeechBubbleText(phrase);

    // Auto-hide speech bubble after estimated duration + buffer
    setTimeout(() => {
      setSpeechBubbleText(null);
    }, estimatedDuration + 1000);

    if (!enableSpeech) return;


    setIsSpeaking(true);
    onSpeechStart?.();
    
    try {
      
      await speakWithElevenLabs(
        processedText,
        DEFAULT_PEPE_VOICE.id,
        (frameType) => {
          
          const sequence = SPRITE_CONFIG.sequence;
          
          switch (frameType) {
            case 'open':
              setCurrentFrame(sequence[1]); 
              break;
            case 'mid':
              setCurrentFrame(sequence[3]); 
              break;
            case 'closed':
              setCurrentFrame(sequence[0]); 
              break;
          }
        },
        () => {
          
          setIsSpeaking(false);
          setCurrentFrame(SPRITE_CONFIG.sequence[0]);
          onSpeechEnd?.();
        }
      );
    } catch (error) {
      console.error('ElevenLabs TTS failed:', error);
      
      
      setIsSpeaking(false);
      setCurrentFrame(SPRITE_CONFIG.sequence[0]);
      onSpeechEnd?.();
    }
  }, [enableSpeech, onSpeak, onSpeechStart, onSpeechEnd]);

  
  useEffect(() => {
    if (phrase && enableSpeech) {
      playPhrase(phrase);
    }
  }, [phrase, enableSpeech, playPhrase]);



  

  


  const stopSpeaking = useCallback(() => {
    // Always clear speech bubble
    setSpeechBubbleText(null);

    if (!enableSpeech) return;


    setIsSpeaking(false);
    setCurrentFrame(SPRITE_CONFIG.sequence[0]);


    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    onSpeechEnd?.();
  }, [enableSpeech, onSpeechEnd]);

  
  const getContextualPhrase = () => {
    if (context) {
      return defaultPepePersonality.getContextualResponse(context);
    }
    return getRandomPhrase();
  };

  
  useImperativeHandle(ref, () => ({
    onAchievementUnlocked: async (achievementName?: string) => {
      if (!enableSpeech) return;
      const achievementPhrase = achievementName 
        ? `Achievement Unlocked: ${achievementName}!` 
        : 'Achievement Unlocked!';
      playPhrase(achievementPhrase);
    },
    
    speak: (text: string) => {
      playPhrase(text);
    },
    
    stopSpeaking: () => {
      stopSpeaking();
    }
  }), [enableSpeech, playPhrase, stopSpeaking]);


  
  const handleDragStart = () => {
    setHasBeenMoved(true);
    
    if (returnTimerRef.current) {
      clearTimeout(returnTimerRef.current);
      returnTimerRef.current = null;
    }
  };

  const handleDragEnd = () => {
    
    if (targetPosition && returnToPositionDelay > 0) {
      returnTimerRef.current = window.setTimeout(() => {
        setPosition2D(targetPosition);
      }, returnToPositionDelay);
    }
  };

  const handleDoubleClick = async () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    
    const randomPhrase = getContextualPhrase();
    playPhrase(randomPhrase);
  };

  return (
    <>
      <motion.div
        ref={pepeDivRef}
        className={`${sizeConfig[size].width} ${sizeConfig[size].height} ${enableDragging ? 'cursor-grab' : 'cursor-pointer'} ${className}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 9999
        }}
        initial={{ opacity: 1 }}
        animate={{
          x: position2D.x,
          y: position2D.y,
          scaleX: facingDirection === 'left' ? -1 : 1,
          opacity: 1,
        }}
        transition={{
          x: { type: "spring", stiffness: 300, damping: 30 },
          y: { type: "spring", stiffness: 300, damping: 30 },
          scaleX: {
            duration: 0.1,
            ease: "linear"
          },
          opacity: {
            duration: 1.2,
            ease: "easeOut"
          }
        }}
        drag={enableDragging}
        dragConstraints={dragConstraints}
        dragElastic={0.3}
        dragMomentum={true}
        dragTransition={{ 
          power: 0.3,
          timeConstant: 400,
          bounceStiffness: 300,
          bounceDamping: 40
        }}
        whileDrag={{ 
          scale: 1.05,
          cursor: 'grabbing',
          zIndex: 10000
        }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDoubleClick={handleDoubleClick}
        title={isSpeaking ? "Double-click to stop" : "Double-click for wisdom"}
      >
      <motion.div
        className="relative w-full h-full"
        animate={{
          scale: isSpeaking ? 1.05 : 1,
          rotate: headRotation,
          y: floatOffset
        }}
        transition={{
          scale: {
            duration: 0.3
          },
          rotate: {
            duration: 0.05,
            ease: "linear"
          },
          y: {
            duration: 0,
            ease: "linear"
          }
        }}
      >
        {}
        <Image
          src={SPRITE_CONFIG.basePath + currentFrame}
          alt="Pepe Trading Companion"
          fill
          sizes="240px"
          className="object-contain pointer-events-none"
          style={{
            objectPosition: 'center 55%' 
          }}
        />
        
        {}
        {!isBlinking && (
          <>
            {}
            <Image
              src="/eyes/eyes-base.webp"
              alt="Eyes base"
              fill
              sizes="240px"
              className="object-contain pointer-events-none"
              style={{
                objectPosition: 'center 55%'
              }}
            />
            
            {}
            <Image
              src="/eyes/eyes-pupil-left.webp"
              alt="Left pupil"
              fill
              sizes="240px"
              className="object-contain pointer-events-none"
              style={{
                transform: `translate(${eyeOffset.left.x}px, ${eyeOffset.left.y}px)`,
                objectPosition: 'center 55%'
              }}
            />
            
            {}
            <Image
              src="/eyes/eyes-pupil-right.webp"
              alt="Right pupil"
              fill
              sizes="240px"
              className="object-contain pointer-events-none"
              style={{
                transform: `translate(${eyeOffset.right.x}px, ${eyeOffset.right.y}px)`,
                objectPosition: 'center 55%'
              }}
            />
            
            {}
            <Image
              src="/eyes/eyes-frame.webp"
              alt="Eyes frame"
              fill
              sizes="240px"
              className="object-contain pointer-events-none"
              style={{
                objectPosition: 'center 55%'
              }}
            />
          </>
        )}
        
        {}
        <AnimatePresence>
          {isBlinking && SPRITE_CONFIG.blinkOverlays[currentFrame as keyof typeof SPRITE_CONFIG.blinkOverlays] && (
            <motion.img
              src={SPRITE_CONFIG.basePath + SPRITE_CONFIG.blinkOverlays[currentFrame as keyof typeof SPRITE_CONFIG.blinkOverlays]}
              alt="Eyes closed"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              style={{
                objectPosition: 'center 55%'
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>
      
      {}
      {isSpeaking && (
        <motion.div
          className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full pointer-events-none"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}

      {/* Speech Bubble */}
      <AnimatePresence>
        {speechBubbleText && (
          <motion.div
            className="absolute -top-4 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative bg-white text-black px-4 py-2 rounded-xl max-w-[280px] shadow-lg">
              <p className="text-sm font-medium leading-snug">{speechBubbleText}</p>
              {/* Speech bubble tail */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
                <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
    
    </>
  );
});

PepeCompanion.displayName = 'Pepe_Character';

export default PepeCompanion;