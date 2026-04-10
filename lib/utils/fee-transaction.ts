import { Transaction, SystemProgram, PublicKey, VersionedTransaction, TransactionMessage, ComputeBudgetProgram } from '@solana/web3.js';
import BN from 'bn.js';


interface SimplifiedFeeTransactionParams {
  userWallet: string;
  destinationWallet: string;  
  amountLamports: string;
}


interface BuildFeeTransactionParams {
  userWallet: string;
  platformWallet: string;
  partnerPoolWallet?: string;
  platformAmountLamports: string; 
  partnerAmountLamports?: string;
  connection?: any; 
  useVersionedTransaction?: boolean;
}

export function buildFeeTransaction(params: SimplifiedFeeTransactionParams | BuildFeeTransactionParams): VersionedTransaction {
  const instructions = [];
  
  
  
  instructions.push(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 10_000 })
  );
  
  
  
  instructions.push(
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 })
  );
  
  
  if ('destinationWallet' in params) {
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(params.userWallet),
        toPubkey: new PublicKey(params.destinationWallet),
        lamports: new BN(params.amountLamports).toNumber()
      })
    );
  } else {
    
    
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(params.userWallet),
        toPubkey: new PublicKey(params.platformWallet),
        lamports: new BN(params.platformAmountLamports).toNumber()
      })
    );
    
    
    if (params.partnerPoolWallet && params.partnerAmountLamports) {
      instructions.push(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(params.userWallet),
          toPubkey: new PublicKey(params.partnerPoolWallet),
          lamports: new BN(params.partnerAmountLamports).toNumber()
        })
      );
    }
  }

  
  const messageV0 = new TransactionMessage({
    payerKey: new PublicKey(params.userWallet),
    recentBlockhash: '',
    instructions,
  }).compileToV0Message();
  
  return new VersionedTransaction(messageV0);
}

export function validateFeeTransaction(params: BuildFeeTransactionParams): void {

  try {
    new PublicKey(params.userWallet);
    new PublicKey(params.platformWallet);
    if (params.partnerPoolWallet) {
      new PublicKey(params.partnerPoolWallet);
    }
  } catch (error) {
    throw new Error('Invalid wallet address format');
  }

  
  try {
    const platformAmount = new BN(params.platformAmountLamports);
    if (platformAmount.lte(new BN(0))) {
      throw new Error('Platform fee amount must be greater than 0');
    }

    if (params.partnerAmountLamports) {
      const partnerAmount = new BN(params.partnerAmountLamports);
      if (partnerAmount.lte(new BN(0))) {
        throw new Error('Partner fee amount must be greater than 0');
      }
    }
  } catch (error) {
    throw new Error('Invalid lamports amount format');
  }
}