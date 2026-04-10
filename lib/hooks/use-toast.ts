
import { useState, useCallback } from 'react'
import type { ToastData } from '@/components/ui/toast'

interface ToastOptions {
  title: string
  description?: string
  variant?: 'default' | 'success' | 'error' | 'warning'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface UseToastReturn {
  toasts: ToastData[]
  toast: (options: ToastOptions) => void
  removeToast: (id: string) => void
  clearAllToasts: () => void
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<ToastData[]>([])
  
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])
  
  const toast = useCallback((options: ToastOptions) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    
    const newToast: ToastData = {
      id,
      ...options
    }
    
    setToasts(prev => {
      
      
      const existingToast = prev.find(t => 
        t.title === newToast.title && 
        t.description === newToast.description
      )
      if (existingToast) {
        return prev 
      }
      
      
      const updatedToasts = [...prev, newToast]
      return updatedToasts.length > 6 ? updatedToasts.slice(-6) : updatedToasts
    })
    
    
    const duration = options.duration || 5000
    setTimeout(() => {
      removeToast(id)
    }, duration)
    
    return id
  }, [removeToast])
  
  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])
  
  return {
    toasts,
    toast,
    removeToast,
    clearAllToasts
  }
}