export function extractSolanaWalletFromPrivyUser(privyUser: any): string | null {
  if (!privyUser) return null
  
  // Handle stringified JSON
  let parsedUser = privyUser
  if (typeof privyUser === 'string') {
    try {
      parsedUser = JSON.parse(privyUser)
    } catch (e) {
      console.error('[PrivyExtract] Failed to parse privyUser JSON:', e)
      return null
    }
  }

  // Look for Solana wallet in linked accounts
  if (parsedUser.linked_accounts && Array.isArray(parsedUser.linked_accounts)) {
    const solanaAccount = parsedUser.linked_accounts.find(
      (account: any) => 
        (account.type === 'wallet' && account.chain_type === 'solana') ||
        (account.type === 'solana_wallet') ||
        (account.wallet_client_type === 'privy' && account.chain_type === 'solana')
    )
    
    if (solanaAccount && solanaAccount.address) {
      return solanaAccount.address
    }
  }
  
  // Try direct properties as fallback
  if (parsedUser.wallet?.address) {
    return parsedUser.wallet.address
  }
  
  if (parsedUser.custom_metadata?.solana_address) {
    return parsedUser.custom_metadata.solana_address
  }

  return null
}
