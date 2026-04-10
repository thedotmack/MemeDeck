'use client'

import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from "motion/react"
import { X } from 'lucide-react'
import React, { createContext, useCallback, useContext, useState } from 'react'

interface ModalConfig {
  id: string
  content: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closable?: boolean
  onClose?: () => void
}

interface ModalContextType {
  openModal: (config: Omit<ModalConfig, 'id'>) => string
  closeModal: (id: string) => void
  closeAllModals: () => void
}

const ModalContext = createContext<ModalContextType | null>(null)

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modals, setModals] = useState<ModalConfig[]>([])

  const openModal = useCallback((config: Omit<ModalConfig, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const modalConfig: ModalConfig = {
      ...config,
      id,
      closable: config.closable ?? true
    }
    
    setModals(prev => [...prev, modalConfig])
    return id
  }, [])

  const closeModal = useCallback((id: string) => {
    setModals(prev => {
      const modal = prev.find(m => m.id === id)
      if (modal?.onClose) {
        modal.onClose()
      }
      return prev.filter(m => m.id !== id)
    })
  }, [])

  const closeAllModals = useCallback(() => {
    setModals(prev => {
      prev.forEach(modal => {
        if (modal.onClose) {
          modal.onClose()
        }
      })
      return []
    })
  }, [])

  const getSizeClasses = (size?: ModalConfig['size']) => {
    switch (size) {
      case 'sm': return 'max-w-sm'
      case 'md': return 'max-w-md'
      case 'lg': return 'max-w-lg'
      case 'xl': return 'max-w-4xl'
      case 'full': return 'max-w-[95vw] max-h-[95vh]'
      default: return 'max-w-2xl'
    }
  }

  return (
    <ModalContext.Provider value={{ openModal, closeModal, closeAllModals }}>
      {children}
      
      {}
      {}
      <AnimatePresence>
        {modals.map((modal, index) => (
          <motion.div
            key={`backdrop-${modal.id}`}
            onClick={() => modal.closable && closeModal(modal.id)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            style={{ zIndex: 1000 }}
          />
        ))}
      </AnimatePresence>
      
      {}
      <AnimatePresence>
        {modals.map((modal, index) => (
          <motion.div
            key={`modal-${modal.id}`}
            className={cn(
              "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
              "w-full overflow-hidden rounded-lg shadow-2xl",
              getSizeClasses(modal.size),
              modal.className
            )}
            style={{ zIndex: 9001 + index * 10 }}
          >
            {}
            {modal.closable && (
              <button
                onClick={() => closeModal(modal.id)}
                className="absolute right-4 top-4 z-10 p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-700/50"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            
            {modal.content}
          </motion.div>
        ))}
      </AnimatePresence>
    </ModalContext.Provider>
  )
}