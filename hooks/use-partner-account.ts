import { useStore } from '@/lib/store'
import { globalToast } from '@/lib/utils/global-toast'
import { useSignAndSendTransaction, useWallets } from '@privy-io/react-auth/solana'
import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js'
import { useState } from 'react'

export function useCreatePartnerAccount() {
  const [isCreating, setIsCreating] = useState(false)
  const { signAndSendTransaction } = useSignAndSendTransaction()
  const { wallets } = useWallets()
  const embeddedWallet = wallets.find(w => w.standardWallet.name === 'Privy')
  const userId = useStore.use.userId() ?? null
  const auth = useStore.use.auth() ?? { user: null }
  const walletAddress = auth.user?.walletAddress
  const userTier = auth.user?.tier || 'standard'
  const accessToken = auth.accessToken ?? null
  const setAuth = useStore.use.setAuth() ?? (() => {})
  
  const createPartnerAccount = async () => {
    console.log('[Hydra] createPartnerAccount called with:', {
      walletAddress,
      accessToken: accessToken ? 'present' : 'missing',
      userId,
      userTier
    })
    
    if (!walletAddress || !accessToken || !userId) {
      const message = 'Please ensure you are authenticated with a connected wallet'
      globalToast.error(message)
      throw new Error(message)
    }
    
    setIsCreating(true)
    
    try {
      // Fetch FRESH balance from RPC to avoid stale store values
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com';
      const connection = new Connection(rpcUrl);
      const balance = await connection.getBalance(new PublicKey(walletAddress));
      const solBalance = balance / 1_000_000_000;
      
      console.log(`[Hydra] Fresh SOL balance: ${solBalance} SOL`);
      
      if (solBalance < 0.005) {
        const message = 'You need at least 0.005 SOL to create a revenue sharing account'
        globalToast.error('Insufficient SOL balance', message)
        throw new Error(`Insufficient SOL balance. ${message}`)
      }
      
      const response = await fetch('/api/hydra/create-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          userPublicKey: walletAddress,
          userTier
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        console.error('[Hydra] API Error Response:', error)
        const detailedError = error.details ? `${error.error}: ${error.details}` : (error.error || 'Failed to create wallet')
        throw new Error(detailedError)
      }
      
      const { transaction, hydraWalletAddress, fanoutId, sharePercentage, alreadyExists } = await response.json()
      
      let signatureStr = 'already-exists'
      
      if (!alreadyExists) {
        const txBytes = Buffer.from(transaction, 'base64')

        const receipt = await signAndSendTransaction({
          transaction: new Uint8Array(txBytes),
          wallet: embeddedWallet!,
          chain: 'solana:mainnet'
        })

        signatureStr = Buffer.from(receipt.signature).toString('base64')
      }

      // Confirm with backend to update DB
      const confirmResponse = await fetch('/api/hydra/confirm-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          hydraWalletAddress,
          fanoutId,
          sharePercentage,
          userTier,
          transactionSignature: signatureStr
        })
      })

      if (!confirmResponse.ok) {
        const error = await confirmResponse.json()
        throw new Error(error.error || 'Failed to confirm wallet on-chain')
      }

      setAuth({
        user: auth.user ? {
          ...auth.user,
          hydraWalletAddress
        } : null
      })

      if (alreadyExists) {
        globalToast.success('Revenue sharing account recovered!')
      } else {
        globalToast.success('Revenue sharing activated!', `Transaction: ${signatureStr}`)
      }
      return signatureStr
    } catch (error: any) {
      console.error('[Hydra] Wallet creation failed:', error)
      globalToast.error('Failed to create revenue share wallet', error.message)
      throw error 
    } finally {
      setIsCreating(false)
    }
  }
  
  return {
    createPartnerAccount,
    isCreating
  }
}