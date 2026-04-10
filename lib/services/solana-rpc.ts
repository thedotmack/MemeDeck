import { createSolanaRpc } from '@solana/kit'

export function getRpc() {
  const endpoint = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com'
  return createSolanaRpc(endpoint)
}

export type SolanaRpc = ReturnType<typeof getRpc>