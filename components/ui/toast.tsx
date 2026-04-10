
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from "motion/react"
import { cn } from '@/lib/utils'

export interface ToastData {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'success' | 'error' | 'warning'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastProps {
  toast: ToastData
  onRemove: (id: string) => void
}

const variantStyles = {
  default: 'bg-background border-border text-foreground',
  success: 'bg-green-500 border-green-600 text-white',
  error: 'bg-red-500 border-red-600 text-white', 
  warning: 'bg-yellow-500 border-yellow-600 text-black'
}

const variantIcons = {
  default: '📢',
  success: '✅',
  error: '❌',
  warning: '⚠️'
}

export function Toast({ toast, onRemove }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false)
  
  useEffect(() => {
    const duration = toast.duration || 5000
    
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => onRemove(toast.id), 150) 
    }, duration)
    
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])
  
  const handleRemove = () => {
    setIsExiting(true)
    setTimeout(() => onRemove(toast.id), 150)
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ 
        opacity: isExiting ? 0 : 1, 
        y: isExiting ? -50 : 0, 
        scale: isExiting ? 0.9 : 1 
      }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'relative rounded-lg border p-3 shadow-lg backdrop-blur-sm',
        'min-w-[280px] max-w-[360px] pointer-events-auto',
        variantStyles[toast.variant || 'default']
      )}
    >
      {}
      <button
        onClick={handleRemove}
        className="absolute top-2 right-2 opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Close notification"
      >
        ✕
      </button>
      
      <div className="flex items-start gap-3">
        {}
        <span className="text-lg flex-shrink-0">
          {variantIcons[toast.variant || 'default']}
        </span>
        
        {}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm mb-1">
            {toast.title}
          </h4>
          
          {toast.description && (
            <p className="text-sm opacity-90 leading-relaxed">
              {toast.description}
            </p>
          )}
          
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-sm underline hover:no-underline transition-all"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

interface ToastContainerProps {
  toasts: ToastData[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  
  const visibleToasts = toasts.slice(0, 4)
  
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm">
      <AnimatePresence mode="popLayout">
        {visibleToasts.map((toast, index) => (
          <Toast
            key={toast.id}
            toast={toast}
            onRemove={onRemove}
          />
        ))}
      </AnimatePresence>
      
      {toasts.length > 4 && (
        <div className="text-xs text-gray-500 text-center pointer-events-none">
          +{toasts.length - 4} more notifications
        </div>
      )}
    </div>
  )
}