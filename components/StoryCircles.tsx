"use client"

import { cn } from "@/lib/utils"
import { motion } from "motion/react"
import Image from "next/image"
import { memo } from "react"

interface StoryCircle {
  id: string
  symbol: string
  name: string
  icon: string
  positionValue: number
  pnlPercent: number
  isActive?: boolean
}

interface StoryCirclesProps {
  cards: StoryCircle[]
  activeCardIndex?: number
  onCircleClick: (index: number) => void
}

function StoryCircles({ cards, activeCardIndex = 0, onCircleClick }: StoryCirclesProps) {
  return (
    <div className="
      fixed left-0 px-2 pb-21 sm:pb-24 bottom-0
      w-full flex items-center 
      justify-center z-50
      bg-gradient-to-t from-black/80 to-transparent
      ">
      {cards.map((card, index) => {
        const isActive = index === activeCardIndex
        const isPositive = card.pnlPercent >= 0
        
        return (
          <motion.button
            key={card.id}
            onClick={() => onCircleClick(index)}
            className={cn(
              "relative aspect-square w-1/5 mx-1 sm:w-24 touch-manipulation",
              isActive ? "z-20" : "z-10"
            )}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {}
            <div
              className={cn(
                "relative w-full h-full rounded-full overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.9),0_8px_16px_rgba(0,0,0,0.9)]",
                isActive
                  ? isPositive ? "ring-3 ring-green-500" : "ring-3 ring-red-500"
                  : isPositive ? "ring-3 ring-green-300/30 opacity-80 scale-95" : "ring-3 ring-red-300/30 opacity-80 scale-95"
              )}
            >
              {}
              <Image
                src={card.icon ? card.icon : "/card-back.webp"}
                alt={card.name}
                fill
                sizes="(max-width: 640px) 20vw, 96px"
                className={cn("object-cover", isActive ? "blur-none" : "blur-xs transform scale-115")}
              />
              
              {}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/80 to-black/100 flex flex-col justify-end p-1 md:p-2">
                <div className={cn(
                    "text-xl font-number tracking-tight text-shadow-xs/90", 
                    isActive
                      ? isPositive ? "text-green-500" : "text-red-500"
                      : isPositive ? "text-green-300 opacity-50" : "text-red-300 opacity-50"
                  )}>
                  ${card.positionValue.toFixed(2)}
                </div>
                <div className={cn(
                  "text-xs font-semibold font-number leading-tight text-shadow-xs/90 pb-2",
                  isActive
                    ? isPositive ? "text-green-500" : "text-red-500"
                    : isPositive ? "text-green-300 opacity-50" : "text-red-300 opacity-50"
                )}>
                  {isPositive ? "+" : ""}{card.pnlPercent.toFixed(1)}%
                </div>
              </div>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}

StoryCircles.displayName = "StoryCircles"

export default memo(StoryCircles)