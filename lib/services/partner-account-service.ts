import { getPartnerSharePercent, type PartnerTier } from '@/lib/utils/partner-tiers'
import { FanoutClient, MembershipModel } from '@metaplex-foundation/mpl-hydra/dist/src'
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js'
import bs58 from 'bs58'

export class PartnerAccountService {
  private connection: Connection
  private hydraControlWallet: Keypair
  private hydraControlWalletWrapper: any
  private platformWalletPublicKey: PublicKey
  
  constructor() {
    try {
      if (!process.env.NEXT_PUBLIC_RPC_URL) {
        throw new Error('NEXT_PUBLIC_RPC_URL environment variable not set')
      }
      this.connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL)
      
      if (!process.env.HYDRA_CONTROL_WALLET_PRIVATE_KEY) {
        throw new Error('HYDRA_CONTROL_WALLET_PRIVATE_KEY environment variable not set')
      }
      
      
      const privateKeyBytes = bs58.decode(process.env.HYDRA_CONTROL_WALLET_PRIVATE_KEY)
      this.hydraControlWallet = Keypair.fromSecretKey(privateKeyBytes)
      
      this.hydraControlWalletWrapper = {
        publicKey: this.hydraControlWallet.publicKey,
        signTransaction: async (tx: Transaction) => {
          tx.partialSign(this.hydraControlWallet)
          return tx
        },
        signAllTransactions: async (txs: Transaction[]) => {
          txs.forEach(tx => tx.partialSign(this.hydraControlWallet))
          return txs
        }
      }
      
      if (!process.env.PLATFORM_WALLET_PUBLIC_KEY) {
        throw new Error('PLATFORM_WALLET_PUBLIC_KEY environment variable not set')
      }
      this.platformWalletPublicKey = new PublicKey(process.env.PLATFORM_WALLET_PUBLIC_KEY)
      
      console.log('[Hydra] PartnerAccountService initialized successfully')
    } catch (error) {
      console.error('[Hydra] PartnerAccountService initialization failed:', error)
      throw error
    }
  }
  
  async createRevenueShareWallet(
    userId: string,
    userPublicKey: string,
    partnerTier: PartnerTier = 'standard'
  ) {
    
  const fanoutSdk = new FanoutClient(this.connection, this.hydraControlWalletWrapper)
    
    
    const referrerSharePercentage = getPartnerSharePercent(partnerTier)
    const platformSharePercentage = 100 - referrerSharePercentage
    
    
    const walletName = `md-${userPublicKey.slice(0, 21)}`
    const fanoutId = (await FanoutClient.fanoutKey(walletName))[0]
    const [nativeAccountId] = await FanoutClient.nativeAccount(fanoutId)
    
    const transaction = new Transaction()
    
    
    transaction.add(
      ...(await fanoutSdk.initializeFanoutInstructions({
        totalShares: 100,
        name: walletName,
        membershipModel: MembershipModel.Wallet,
      })).instructions
    )
    
    
    transaction.add(
      ...(await fanoutSdk.addMemberWalletInstructions({
        fanout: fanoutId,
        fanoutNativeAccount: nativeAccountId,
        membershipKey: this.platformWalletPublicKey,
        shares: platformSharePercentage,
      })).instructions
    )
    
    
    transaction.add(
      ...(await fanoutSdk.addMemberWalletInstructions({
        fanout: fanoutId,
        fanoutNativeAccount: nativeAccountId,
        membershipKey: new PublicKey(userPublicKey),
        shares: referrerSharePercentage,
      })).instructions
    )
    
    
    transaction.feePayer = new PublicKey(userPublicKey)
    transaction.recentBlockhash = (
      await this.connection.getLatestBlockhash()
    ).blockhash
    
    
    transaction.partialSign(this.hydraControlWallet)
    
    return {
      transaction: transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      }).toString('base64'),
      hydraWalletAddress: nativeAccountId.toString(),
      fanoutId: fanoutId.toString(),
      sharePercentage: referrerSharePercentage
    }
  }

  async closeRevenueShareWallet(
    userPublicKey: string
  ): Promise<string> {
    try {
      
      const walletName = `md-${userPublicKey.slice(0, 21)}`
      const fanoutId = (await FanoutClient.fanoutKey(walletName))[0]
      const [nativeAccountId] = await FanoutClient.nativeAccount(fanoutId)
      
  const fanoutSdk = new FanoutClient(this.connection, this.hydraControlWalletWrapper)
      const transaction = new Transaction()
      
      
      try {
        
        const distPlatform = await fanoutSdk.distributeWalletMemberInstructions({
          distributeForMint: false,
          member: this.platformWalletPublicKey,
          fanout: fanoutId,
          payer: this.hydraControlWallet.publicKey,
        })
        transaction.add(...distPlatform.instructions)
        
        
        const distUser = await fanoutSdk.distributeWalletMemberInstructions({
          distributeForMint: false,
          member: new PublicKey(userPublicKey),
          fanout: fanoutId,
          payer: this.hydraControlWallet.publicKey,
        })
        transaction.add(...distUser.instructions)
      } catch (error) {
        
        console.log('[Hydra] No funds to distribute before closing')
      }
      
      
      
      transaction.add(
        ...(await fanoutSdk.removeMemberInstructions({
          fanout: fanoutId,
          member: new PublicKey(userPublicKey),
          destination: new PublicKey(userPublicKey),
        })).instructions
      )
      transaction.add(
        ...(await fanoutSdk.removeMemberInstructions({
          fanout: fanoutId,
          member: this.platformWalletPublicKey,
          destination: this.platformWalletPublicKey,
        })).instructions
      )
      
      
      
      transaction.feePayer = this.hydraControlWallet.publicKey
      transaction.recentBlockhash = (
        await this.connection.getLatestBlockhash()
      ).blockhash
      
      const signature = await this.connection.sendTransaction(
        transaction,
        [this.hydraControlWallet]
      )
      
      console.log(`[Hydra] Closed wallet and refunded rent for ${userPublicKey}: ${signature}`)
      return signature
    } catch (error) {
      console.error('[Hydra] Failed to close wallet:', error)
      throw error
    }
  }

  async updateMemberShares(
    fanoutId: string,
    userPublicKey: string,
    newTier: PartnerTier
  ): Promise<number> {
    
  const fanoutSdk = new FanoutClient(this.connection, this.hydraControlWalletWrapper)
    const fanoutPK = new PublicKey(fanoutId)
    const userPK = new PublicKey(userPublicKey)
    
    
    const newReferrerShare = getPartnerSharePercent(newTier)
    const newPlatformShare = 100 - newReferrerShare
    
    const transaction = new Transaction()
    
    
    transaction.add(
      ...(await fanoutSdk.removeMemberInstructions({
        fanout: fanoutPK,
        member: userPK,
        destination: userPK,
      })).instructions
    )
    
    
    const [nativeAccountId] = await FanoutClient.nativeAccount(fanoutPK)
    transaction.add(
      ...(await fanoutSdk.addMemberWalletInstructions({
        fanout: fanoutPK,
        fanoutNativeAccount: nativeAccountId,
        membershipKey: userPK,
        shares: newReferrerShare,
      })).instructions
    )
    
    
    transaction.add(
      ...(await fanoutSdk.removeMemberInstructions({
        fanout: fanoutPK,
        member: this.platformWalletPublicKey,
        destination: this.platformWalletPublicKey,
      })).instructions
    )
    
    transaction.add(
      ...(await fanoutSdk.addMemberWalletInstructions({
        fanout: fanoutPK,
        fanoutNativeAccount: nativeAccountId,
        membershipKey: this.platformWalletPublicKey,
        shares: newPlatformShare,
      })).instructions
    )
    
    
    transaction.feePayer = this.hydraControlWallet.publicKey
    transaction.recentBlockhash = (
      await this.connection.getLatestBlockhash()
    ).blockhash
    
    const signature = await this.connection.sendTransaction(
      transaction,
      [this.hydraControlWallet]
    )
    
    console.log(`[Hydra] Updated tier for ${userPublicKey}: ${signature}`)
    return newReferrerShare
  }
}