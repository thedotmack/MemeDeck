
interface ValidationResult {
  isValid: boolean
  error?: string
}

function validateTransactionBasics(
  tokenMint: string,
  amountUsd: number,
  currentTokenPrice: number
): ValidationResult {
  if (!tokenMint || typeof tokenMint !== 'string') {
    return {
      isValid: false,
      error: `Invalid token mint: ${tokenMint}. Must be a non-empty string.`
    }
  }

  if (!amountUsd || amountUsd <= 0 || isNaN(amountUsd)) {
    return {
      isValid: false,
      error: `Invalid amount: ${amountUsd}. Must be a positive number.`
    }
  }

  if (!currentTokenPrice || currentTokenPrice <= 0 || isNaN(currentTokenPrice)) {
    return {
      isValid: false,
      error: `Invalid token price: ${currentTokenPrice}. Must be a positive number.`
    }
  }

  return { isValid: true }
}

function validateBuyTransaction(
  selectedDrawAmount: number,
  selectedCardCount: number
): ValidationResult {
  if (!selectedDrawAmount || selectedDrawAmount <= 0 || isNaN(selectedDrawAmount)) {
    return {
      isValid: false,
      error: `Invalid draw amount: ${selectedDrawAmount}. Must be a positive number.`
    }
  }

  if (!selectedCardCount || selectedCardCount <= 0 || isNaN(selectedCardCount)) {
    return {
      isValid: false,
      error: `Invalid card count: ${selectedCardCount}. Must be a positive number.`
    }
  }

  return { isValid: true }
}

function validateSellTransaction(
  cardId: string,
  position: any,
  tokenQuantity: number,
  liveTokenPrice: number
): ValidationResult {
  if (!cardId || typeof cardId !== 'string') {
    return {
      isValid: false,
      error: `Invalid card ID: ${cardId}. Must be a non-empty string.`
    }
  }

  if (!position) {
    return {
      isValid: false,
      error: 'No position found to sell.'
    }
  }

  if (!position.value || position.value <= 0 || isNaN(position.value)) {
    return {
      isValid: false,
      error: `Invalid position value: ${position.value}. Cannot sell position with no value.`
    }
  }

  if (!position.quantity || position.quantity <= 0 || isNaN(position.quantity)) {
    return {
      isValid: false,
      error: `Invalid position quantity: ${position.quantity}. Cannot sell position with no tokens.`
    }
  }

  if (!tokenQuantity || tokenQuantity <= 0 || isNaN(tokenQuantity)) {
    return {
      isValid: false,
      error: `Invalid token quantity: ${tokenQuantity}. Must be a positive number.`
    }
  }

  if (!liveTokenPrice || liveTokenPrice <= 0 || isNaN(liveTokenPrice)) {
    return {
      isValid: false,
      error: `Invalid token price: ${liveTokenPrice}. Cannot sell without valid price.`
    }
  }

  return { isValid: true }
}

function validateTokenBalance(
  actualTokenBalance: any,
  tokenId: string
): ValidationResult {
  if (typeof actualTokenBalance !== 'number' || !actualTokenBalance || actualTokenBalance <= 0 || isNaN(actualTokenBalance)) {
    return {
      isValid: false,
      error: `No tokens to sell. On-chain balance: ${actualTokenBalance} (type: ${typeof actualTokenBalance})`
    }
  }

  return { isValid: true }
}

function validateWalletAvailability(
  authenticated: boolean,
  walletAddress?: string
): ValidationResult {
  if (!authenticated) {
    return {
      isValid: false,
      error: 'User not authenticated.'
    }
  }

  if (!walletAddress) {
    return {
      isValid: false,
      error: 'No wallet address available.'
    }
  }

  return { isValid: true }
}



function validateTokenAvailability(
  availableTokens: any[],
  selectedCardCount: number
): ValidationResult {
  if (availableTokens.length < selectedCardCount) {
    return {
      isValid: false,
      error: `Not enough tokens available. Need: ${selectedCardCount}, Available: ${availableTokens.length}`
    }
  }

  return { isValid: true }
}

export function validateBuyTransactionComplete(
  selectedDrawAmount: number,
  selectedCardCount: number,
  availableTokens: any[],
  authenticated: boolean,
  walletAddress?: string
): ValidationResult {
  
  const buyValidation = validateBuyTransaction(selectedDrawAmount, selectedCardCount)
  if (!buyValidation.isValid) return buyValidation

  
  const tokenValidation = validateTokenAvailability(availableTokens, selectedCardCount)
  if (!tokenValidation.isValid) return tokenValidation

  
  const walletValidation = validateWalletAvailability(authenticated, walletAddress)
  if (!walletValidation.isValid) return walletValidation

  return { isValid: true }
}

export function validateSellTransactionComplete(
  cardId: string,
  position: any,
  actualTokenBalance: any,
  liveTokenPrice: number,
  authenticated: boolean,
  walletAddress?: string
): ValidationResult {
  
  const walletValidation = validateWalletAvailability(authenticated, walletAddress)
  if (!walletValidation.isValid) return walletValidation

  
  const basicsValidation = validateTransactionBasics(cardId, position?.value || 0, liveTokenPrice)
  if (!basicsValidation.isValid) return basicsValidation

  
  const sellValidation = validateSellTransaction(cardId, position, actualTokenBalance, liveTokenPrice)
  if (!sellValidation.isValid) return sellValidation

  
  const balanceValidation = validateTokenBalance(actualTokenBalance, cardId)
  if (!balanceValidation.isValid) return balanceValidation

  return { isValid: true }
}