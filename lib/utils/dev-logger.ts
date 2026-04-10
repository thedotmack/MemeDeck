
import { reportError } from './error-toast-bridge'
import type { ErrorContext } from './error-toast-bridge'

const isDevelopment = process.env.NODE_ENV === 'development'

interface LogOptions {
  showToast?: boolean
  context?: ErrorContext
}

export const devLogger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },
  error: (message: string, error?: any, options?: LogOptions) => {
    
    console.error(message, error)
    
    
    if (options?.showToast) {
      const errorMessage = error?.message || error?.toString() || message
      reportError(errorMessage, options.context, {
        showToast: true,
        logToConsole: false 
      })
    }
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args)
    }
  }
}