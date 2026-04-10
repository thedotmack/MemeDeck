"use client";

import MemeDeckCard from "@/components/MemeDeckCard";
import TrailText from "@/components/TrailText";
import WelcomeInstructions from "@/components/WelcomeInstructions";
import { allAnimations } from "@/lib/animations/card-animations";
import { useJupiterWebSocket } from "@/lib/jupiter/realtime/websocket";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { usePrivy } from "@privy-io/react-auth";
import type { Variants } from "motion/react";
import { AnimatePresence, motion } from "motion/react";
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import StoryCircles from "./StoryCircles";

interface CardContainerProps {
  onCardClick?: (cardId: string) => void;
  animationDuration?: number;
  flipEasing?: string;
  showActivityIndicators?: boolean;
}

function EmptyView() {
  return (
    <div className="w-full">
      <div className="h-64 flex items-center justify-center">
        <TrailText className="w-full h-full" />
      </div>
      <div className="flex-1 px-4 pb-8">
        <WelcomeInstructions />
      </div>
    </div>
  );
}


const CardContainer = forwardRef<HTMLDivElement, CardContainerProps>(
  ({ onCardClick }, ref) => {
    
    const { authenticated, ready } = usePrivy();

    
    const handSelector = useStore.use.hand();
    const hand = useMemo(() => handSelector || [], [handSelector]);
    const positions = useStore.use.positions() || {};
    const isLoading = useStore.use.isLoading() || false;
    const tutorial = useStore.use.tutorial();
    const isInTutorial = tutorial?.isActive;

    
    const setHoveredCardImage = useStore.use.setHoveredCardImage();
    const preloadHandTextures = useStore.use.preloadHandTextures();
    const cardAnimations = useStore.use.cardAnimations();
    const clearCardAnimation = useStore.use.clearCardAnimation();
    const completeCardExit = useStore.use.completeCardExit();

    
    const [selectedCardIndex, setSelectedCardIndex] = useState<number>(0);
    const previousHandLength = useRef(hand.length);
    const containerRef = useRef<HTMLDivElement>(null);
    const manualSelection = useRef(false);
    const bgTextureTimeout = useRef<NodeJS.Timeout | null>(null);
    const isScrolling = useRef(false);
    const exitAnimationTimers = useRef<Record<string, NodeJS.Timeout>>({});
    const scheduledExitTimestamps = useRef<Record<string, number>>({});
    
    
    const ANIMATION_DELAY = 200;

    const getExitDurationMs = useCallback((variant?: string) => {
      if (variant === "hinge") return 2000;
      if (variant === "slideOutUp") return 450;
      return 1000;
    }, []);

    const clearExitTimer = useCallback((cardId: string) => {
      const timer = exitAnimationTimers.current[cardId];
      if (timer) {
        clearTimeout(timer);
        delete exitAnimationTimers.current[cardId];
      }
    }, []);

    
    useJupiterWebSocket();

    
    const showEmptyView =
      ready &&
      !isLoading &&
      Array.isArray(hand) &&
      hand.length === 0 &&
      !isInTutorial;


    
    const cardsWithPositions = hand.map((card) => {
      const position = positions[card.id];
      const pnlPercent = position
        ? (position.unrealizedPnl / position.cost) * 100
        : 0;
      return {
        ...card,
        positionValue: position?.value || 0,
        pnlPercent: pnlPercent,
      };
    });

    
    const handLength = hand.length;
    useEffect(() => {
      if (handLength > 0) {
        preloadHandTextures();
      }
      
    }, [handLength, preloadHandTextures]); 

    
    useEffect(() => {
      const currentHandLength = hand.length;
      const handLengthChanged = previousHandLength.current !== currentHandLength;
      
      if (handLengthChanged && containerRef.current && currentHandLength > 0) {
        
        setTimeout(() => {
          if (containerRef.current && !isScrolling.current) {
            isScrolling.current = true;
            const container = containerRef.current;
            const scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
            container.scrollTo({
              left: scrollLeft,
              behavior: 'smooth'
            });
            
            setTimeout(() => { isScrolling.current = false; }, 300);
          }
        }, ANIMATION_DELAY);
      }
      
      previousHandLength.current = currentHandLength;
    }, [hand.length]);

    
    useEffect(() => {
      const container = containerRef.current;
      if (!container || hand.length === 0) return;

      const handleScroll = () => {
        const cardElements = container.querySelectorAll(".memedeck--card");
        const containerRect = container.getBoundingClientRect();
        const containerCenter = containerRect.left + containerRect.width / 2;

        let closestIndex = 0;
        let closestDistance = Infinity;

        cardElements.forEach((cardElement, index) => {
          const cardRect = cardElement.getBoundingClientRect();
          const cardCenter = cardRect.left + cardRect.width / 2;
          const distance = Math.abs(cardCenter - containerCenter);

          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
          }
        });

        
        if (closestIndex !== selectedCardIndex && !manualSelection.current) {
          setSelectedCardIndex(closestIndex);
        }
      };

      
      let ticking = false;
      const throttledScroll = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            handleScroll();
            ticking = false;
          });
          ticking = true;
        }
      };

      container.addEventListener('scroll', throttledScroll, { passive: true });
      
      
      handleScroll();

      return () => {
        container.removeEventListener('scroll', throttledScroll);
      };
    }, [hand.length, selectedCardIndex]);

    
    const handleCardMouseEnter = useCallback(
      (index: number) => {
        
        if (bgTextureTimeout.current) {
          clearTimeout(bgTextureTimeout.current);
          bgTextureTimeout.current = null;
        }
        
        
        manualSelection.current = true;
        
        setSelectedCardIndex(index);
        const hoveredCard = hand[index];
        if (hoveredCard?.icon) {
          setHoveredCardImage(hoveredCard.icon);
        }
        
        
        setTimeout(() => {
          manualSelection.current = false;
        }, ANIMATION_DELAY);
      },
      [hand, setHoveredCardImage]
    );

    const handleCardMouseLeave = useCallback(() => {
      
      if (bgTextureTimeout.current) {
        clearTimeout(bgTextureTimeout.current);
      }
      
      
      bgTextureTimeout.current = setTimeout(() => {
        
        
        setHoveredCardImage(null);
        
        
        if (containerRef.current && hand.length > 0 && !isScrolling.current) {
          isScrolling.current = true;
          const container = containerRef.current;
          const scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
          container.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
          });
          
          setTimeout(() => { isScrolling.current = false; }, 300);
        }
      }, ANIMATION_DELAY);
    }, [setHoveredCardImage, hand.length]);

    
    const handleStoryCircleClick = useCallback(
      (index: number) => {
        
        manualSelection.current = true;
        
        
        setSelectedCardIndex(index);
        handleCardMouseEnter(index);
        
        
        if (containerRef.current) {
          const container = containerRef.current;
          const cardElements = container.querySelectorAll(".memedeck--card");
          const targetCard = cardElements[index] as HTMLElement;
          
          if (targetCard) {
            const containerWidth = container.offsetWidth;
            const cardLeft = targetCard.offsetLeft;
            const cardWidth = targetCard.offsetWidth;
            const scrollPosition = cardLeft - (containerWidth / 2) + (cardWidth / 2);
            
            container.scrollTo({
              left: scrollPosition,
              behavior: "smooth"
            });
          }
        }
        
        
        setTimeout(() => {
          manualSelection.current = false;
        }, ANIMATION_DELAY * 2);
      },
      [handleCardMouseEnter]
    );

    
    const handleCardAnimationComplete = useCallback((cardId: string, expectedTimestamp?: number) => {
      const cardAnimation = cardAnimations?.[cardId];
      if (!cardAnimation) {
        return;
      }

      // Exit completion is timer-driven to avoid stale Motion callbacks.
      if (cardAnimation.type === "exit") {
        return;
      }

      // Ignore stale non-exit completions.
      if (cardAnimation.timestamp !== expectedTimestamp) {
        return;
      }

      if (cardAnimation.type !== "celebration") {
        // Don't clear celebration animations — the setTimeout chain manages them.
        clearCardAnimation(cardId);
      }
    }, [cardAnimations, clearCardAnimation]);

    useEffect(() => {
      const activeAnimations = cardAnimations || {};

      Object.entries(activeAnimations).forEach(([cardId, cardAnimation]) => {
        if (!cardAnimation || cardAnimation.type !== "exit") {
          return;
        }

        if (scheduledExitTimestamps.current[cardId] === cardAnimation.timestamp) {
          return;
        }

        clearExitTimer(cardId);
        scheduledExitTimestamps.current[cardId] = cardAnimation.timestamp;
        const durationMs = getExitDurationMs(cardAnimation.variant);

        exitAnimationTimers.current[cardId] = setTimeout(() => {
          const latestAnimation = useStore.getState().cardAnimations?.[cardId];
          if (!latestAnimation || latestAnimation.type !== "exit") {
            return;
          }
          if (latestAnimation.timestamp !== cardAnimation.timestamp) {
            return;
          }

          clearExitTimer(cardId);
          delete scheduledExitTimestamps.current[cardId];
          completeCardExit(cardId);
        }, durationMs + 200);
      });

      Object.keys(scheduledExitTimestamps.current).forEach((cardId) => {
        const animation = activeAnimations[cardId];
        if (!animation || animation.type !== "exit") {
          clearExitTimer(cardId);
          delete scheduledExitTimestamps.current[cardId];
        }
      });
    }, [cardAnimations, clearExitTimer, completeCardExit, getExitDurationMs]);

    useEffect(() => {
      return () => {
        Object.keys(exitAnimationTimers.current).forEach((cardId) => {
          const timer = exitAnimationTimers.current[cardId];
          if (timer) {
            clearTimeout(timer);
          }
        });
        exitAnimationTimers.current = {};
        scheduledExitTimestamps.current = {};
      };
    }, []);


    if (showEmptyView) {
      return <EmptyView />;
    }

    return (
      <div className="relative w-full h-full">
        <div
          data-testid="full-hand"
          ref={(node) => {
            containerRef.current = node;
            if (ref) {
              if (typeof ref === 'function') {
                ref(node);
              } else {
                ref.current = node;
              }
            }
          }}
          className={cn(
            "absolute inset-0 flex w-full h-full overflow-x-auto overflow-y-visible no-scrollbar",
            "snap-x snap-mandatory",
            "pt-5 sm:pt-20" 
          )}
        >
          {}
          <div className="shrink-0 w-[10vw] sm:w-[20vw]" />
          
          <div 
            className="memedeck--hand flex gap-6"
            onMouseEnter={() => {}}
            onMouseLeave={() => {}}
          >
            <AnimatePresence>
              {hand.map((card, index) => {
                const cardAnimation = cardAnimations?.[card.id];
                const animation: Variants | undefined = (cardAnimation?.variant && allAnimations[cardAnimation.variant]) || undefined;
                const animationTimestamp = cardAnimation?.timestamp;
                
                return (
                  <motion.div
                    key={card.id}
                    className={cn(
                      "memedeck--card shrink-0 snap-center md:snap-none"
                    )}
                    style={(animation as any)?.style || undefined}
                    initial={(animation as any)?.initial || {}}
                    animate={(animation as any)?.animate || {}}
                    transition={(animation as any)?.transition}
                    onAnimationComplete={() => handleCardAnimationComplete(card.id, animationTimestamp)}
                  >
                  <div className={cn(
                    "relative aspect-[11/14] w-[44vh] h-auto",
                    "bg-slate-700/30 backdrop-brightness-[1.9] backdrop-blur-xl", 
                    "drop-shadow-[0_20px_35px_rgba(0,0,0,0.7)] hover:drop-shadow-[0_30px_45px_rgba(0,0,0,1)]",
                  )}>
                    <MemeDeckCard
                      card={card}
                      onMouseEnter={() => handleCardMouseEnter(index)}
                      onMouseLeave={handleCardMouseLeave}
                      isSelected={index === selectedCardIndex}
                    />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {}
          <div className="shrink-0 w-[10vw] sm:w-[20vw]" />

          {}
        </div>

        {}
        {hand.length > 0 && (
          <StoryCircles
            cards={cardsWithPositions}
            activeCardIndex={selectedCardIndex}
            onCircleClick={handleStoryCircleClick}
          />
        )}
      </div>
    );
  }
);

CardContainer.displayName = "CardContainer";

export default memo(CardContainer);
