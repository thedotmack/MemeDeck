
import { globalToast } from './global-toast'
import { devLogger } from './dev-logger'
import { processErrorMessage } from './error-message-processor'

export interface ErrorContext {
  operation?: string
  tokenSymbol?: string
  userId?: string
  walletAddress?: string
  errorCode?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

interface ErrorReportOptions {
  showToast?: boolean
  logToConsole?: boolean
  context?: ErrorContext
}

export function reportError(
  error: Error | string,
  context?: ErrorContext,
  options: ErrorReportOptions = {}
): void {
  const {
    showToast = true,
    logToConsole = true
  } = options

  
  const errorObj = error instanceof Error ? error : new Error(error)
  
  
  const userMessage = processErrorMessage(errorObj.message, context)
  
  
  if (logToConsole) {
    devLogger.error('[error-toast-bridge]', errorObj, { context })
  }
  
  
  if (showToast) {
    globalToast.error(
      context?.operation ? `${context.operation} Failed` : 'Error',
      userMessage
    )
  }
}

