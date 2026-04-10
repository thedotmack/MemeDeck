import { StateCreator } from 'zustand'
import { Transaction, getTransactionStatus } from '@/lib/types/transaction'

export interface TransactionSlice {
  transactions: {
    items: Transaction[]
    isLoading: boolean
    
    
    addTransaction: (tx: Transaction) => void
    updateTransaction: (txId: string, updates: Partial<Transaction>) => void
    removeTransaction: (txId: string) => void
    
    
    getByStatus: (status: 'pending' | 'confirmed' | 'failed') => Transaction[]
    getByToken: (tokenId: string) => Transaction[]
  }
}

export const createTransactionSlice: StateCreator<
  any,
  [['zustand/immer', never], ['zustand/persist', unknown]],
  [],
  TransactionSlice
> = (set, get) => ({
  transactions: {
    items: [],
    isLoading: false,
    
    addTransaction: (tx: Transaction) => {
set((state: any) => {
        state.transactions.items.unshift(tx)
      })
    },
    
    updateTransaction: (txId: string, updates: Partial<Transaction>) => {
      set((state: any) => {
        const tx = state.transactions.items.find((t: Transaction) => t.txId === txId)
        if (tx) {
          Object.assign(tx, updates)
        }
      })
    },
    
    removeTransaction: (txId: string) => {
      set((state: any) => {
        const index = state.transactions.items.findIndex((t: Transaction) => t.txId === txId)
        if (index > -1) {
          state.transactions.items.splice(index, 1)
        }
      })
    },
    
    getByStatus: (status: 'pending' | 'confirmed' | 'failed') => {
      return get().transactions.items.filter((tx: Transaction) => getTransactionStatus(tx) === status)
    },
    
    getByToken: (tokenId: string) => {
      return get().transactions.items.filter((tx: Transaction) => 
        tx.orderResponse?.tokenId === tokenId || 
        tx.rawApiData?.mint === tokenId
      )
    }
  }
})