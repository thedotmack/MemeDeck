'use client'

import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from "motion/react"
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

export function Modal({ open, onOpenChange, children, className }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transform-gpu"
          />
          
          {}
          <motion.button
            initial={{ opacity: 0, scale: 0.5, rotateZ: -90 }}
            animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotateZ: 90 }}
            transition={{ duration: 0.3, ease: "backOut" }}
            onClick={() => onOpenChange(false)}
            className="fixed right-6 top-6 z-[70] p-3 rounded-full bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <X className="w-6 h-6" />
          </motion.button>
          
          {}
          <motion.div
            initial={{ 
              opacity: 0, 
            }}
            animate={{ 
              opacity: 1, 
            }}
            exit={{ 
              opacity: 0, 
            }}
            transition={{ 
              type: "spring",
              damping: 50,
              stiffness: 200,
              duration: 0.4
            }}
            className={cn(
              "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
              "overflow-hidden rounded-lg shadow-2xl",
              className
            )}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}