"use client";

import React, { createContext, useContext, ReactNode, useEffect } from 'react'
import { useToast } from '@/lib/hooks/use-toast'
import { ToastContainer } from '@/components/ui/toast'
import { registerGlobalToast } from '@/lib/utils/global-toast'
import type { ToastData } from '@/components/ui/toast'

interface ToastContextType {
  toasts: ToastData[]
  toast: (options: {
    title: string
    description?: string
    variant?: 'default' | 'success' | 'error' | 'warning'
    duration?: number
    action?: {
      label: string
      onClick: () => void
    }
  }) => void
  removeToast: (id: string) => void
  clearAllToasts: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToastContext() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const toastManager = useToast()
  
  
  useEffect(() => {
    registerGlobalToast(toastManager.toast)
  }, [toastManager.toast])
  
  return (
    <ToastContext.Provider value={toastManager}>
      {children}
      <ToastContainer 
        toasts={toastManager.toasts} 
        onRemove={toastManager.removeToast}
      />
    </ToastContext.Provider>
  )
}