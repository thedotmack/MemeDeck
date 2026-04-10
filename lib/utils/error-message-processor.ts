
import { ErrorContext } from './error-toast-bridge'

enum ErrorCategory {
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  WALLET_CONNECTION = 'wallet_connection',
  NETWORK_ERROR = 'network_error',
  TRANSACTION_FAILED = 'transaction_failed',
  VALIDATION_ERROR = 'validation_error',
  SLIPPAGE_ERROR = 'slippage_error',
  TOKEN_NOT_FOUND = 'token_not_found',
  UNKNOWN = 'unknown'
}

function categorizeError(errorMessage: string): ErrorCategory {
  const lowerMessage = errorMessage.toLowerCase()
  
  if (lowerMessage.includes('insufficient') || lowerMessage.includes('not enough')) {
    return ErrorCategory.INSUFFICIENT_FUNDS
  }
  
  if (lowerMessage.includes('wallet') || lowerMessage.includes('connect') || lowerMessage.includes('privy')) {
    return ErrorCategory.WALLET_CONNECTION
  }
  
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('timeout')) {
    return ErrorCategory.NETWORK_ERROR
  }
  
  if (lowerMessage.includes('transaction') || lowerMessage.includes('swap')) {
    return ErrorCategory.TRANSACTION_FAILED
  }
  
  if (lowerMessage.includes('invalid') || lowerMessage.includes('validation')) {
    return ErrorCategory.VALIDATION_ERROR
  }
  
  if (lowerMessage.includes('slippage') || lowerMessage.includes('price change')) {
    return ErrorCategory.SLIPPAGE_ERROR
  }
  
  if (lowerMessage.includes('token not found') || lowerMessage.includes('mint not found')) {
    return ErrorCategory.TOKEN_NOT_FOUND
  }
  
  return ErrorCategory.UNKNOWN
}

export function processErrorMessage(errorMessage: string, context?: ErrorContext): string {
  const category = categorizeError(errorMessage)
  
  switch (category) {
    case ErrorCategory.INSUFFICIENT_FUNDS:
      if (errorMessage.toLowerCase().includes('sol')) {
        return 'Insufficient SOL for transaction fees. Please add SOL to your wallet.'
      }
      return 'Insufficient balance. Please check your wallet.'
      
    case ErrorCategory.WALLET_CONNECTION:
      if (errorMessage.includes('not authenticated')) {
        return 'Please connect your wallet to continue.'
      }
      return 'Wallet connection issue. Please try reconnecting.'
      
    case ErrorCategory.NETWORK_ERROR:
      if (errorMessage.includes('timeout')) {
        return 'Request timed out. Please try again.'
      }
      return 'Network error. Please check your connection.'
      
    case ErrorCategory.TRANSACTION_FAILED:
      if (errorMessage.includes('rejected')) {
        return 'Transaction was rejected. Please try again.'
      }
      if (errorMessage.includes('failed to send')) {
        return 'Failed to send transaction. Please try again.'
      }
      return 'Transaction failed. Please try again.'
      
    case ErrorCategory.VALIDATION_ERROR:
      if (errorMessage.includes('amount')) {
        return 'Invalid amount entered. Please check and try again.'
      }
      if (errorMessage.includes('token')) {
        return 'Invalid token selected. Please try another.'
      }
      return 'Invalid input. Please check and try again.'
      
    case ErrorCategory.SLIPPAGE_ERROR:
      return 'Price changed significantly. Please try again with updated prices.'
      
    case ErrorCategory.TOKEN_NOT_FOUND:
      return context?.tokenSymbol 
        ? `Token ${context.tokenSymbol} not found. It may have been delisted.`
        : 'Token not found. It may have been delisted.'
        
    case ErrorCategory.UNKNOWN:
    default:
      
      if (errorMessage.length > 100) {
        
        return 'An unexpected error occurred. Please try again.'
      }
      
      return errorMessage
  }
}

