






export interface Transaction {
  
  txId: string
  timestamp: number

  
  orderResponse?: any    
  txResponse?: any       
  routePlan?: any        
  rawApiData?: any       

  
  type?: 'buy' | 'sell'            
  side?: 'buy' | 'sell'            
  tokenId?: string                 
  tokenSymbol?: string             
  tokenName?: string               
  tokenMint?: string               
  amount?: number                  
  tokenAmount?: number             
  price?: number                   
  fee?: number                     
  fees?: number                    
  pnl?: number                     
  status?: 'pending' | 'executing' | 'confirming' | 'confirmed' | 'failed' 
}

type TransactionStatus = 'pending' | 'executing' | 'confirming' | 'confirmed' | 'failed'


export function getTransactionStatus(tx: Transaction): TransactionStatus {
  
  if (tx.txResponse?.error || tx.rawApiData?.error) return 'failed'
  if (tx.txResponse?.confirmed || tx.rawApiData?.status === 'confirmed') return 'confirmed'
  return 'pending'
}


