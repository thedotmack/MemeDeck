import { prisma } from '@/lib/db/client'
import { NextRequest, NextResponse } from 'next/server'

type TxRow = {
  id: string
  userId: string
  tokenMint: string
  transactionType: string
  status: string
  amountUsd: any
  createdAt: any
  ultraOrderRequest: any | null
  ultraOrderResponse: any | null
  executionResponse: any | null
}

function toNumber(val: any, fallback = 0): number {
  if (val == null) return fallback
  const n = Number(val as any)
  return Number.isFinite(n) ? n : fallback
}

function parseBigIntish(val: any): number {
  if (val == null) return 0
  if (typeof val === 'string') return Number(val)
  if (typeof val === 'number') return val
  // Some JSON may wrap numbers; last resort stringify
  try { return Number(String(val)) } catch { return 0 }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    // Fetch recent transactions for this user
  const txs: TxRow[] = await prisma.transaction.findMany({
      where: {
        userId,
        status: 'confirmed'
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        userId: true,
        tokenMint: true,
        transactionType: true,
        status: true,
        amountUsd: true,
        createdAt: true,
        ultraOrderRequest: true,
        ultraOrderResponse: true,
        executionResponse: true,
      }
    }) as unknown as TxRow[]

    // Group by tokenMint
  const groups = new Map<string, TxRow[]>()
  for (const tx of txs as any[]) {
      if (!tx.tokenMint) continue
      const arr = groups.get(tx.tokenMint) || []
      arr.push(tx)
      groups.set(tx.tokenMint, arr)
    }

    // Compute totalCost using simple running average method over history
    // Assumptions:
    // - outputAmountResult / outAmount are in base units; assume 1e6 decimals if unknown
    // - ultraOrderRequest.amount for sells is the input token amount (base units)
    // - amountUsd is the USD paid/received for the trade
    const SIX_DEC = 1e6
    const result: { [mint: string]: { totalCost: number; buyCount: number; sellCount: number; basisPrice?: number } } = {}

    for (const [mint, arr] of groups) {
  // Token quantity in UI units
  let qty = 0
  // USD cost basis tied to current remaining quantity
  let cost = 0
      let buys = 0
      let sells = 0
      let firstBuyPrice: number | undefined

      for (const tx of arr as any[]) {
        const type = String(tx.transactionType || '').toLowerCase()
        if (type === 'buy') {
          // Tokens received (UI units)
          const outAmount = parseBigIntish(
            tx.executionResponse?.outputAmountResult ?? tx.ultraOrderResponse?.outAmount
          )
          const tokens = outAmount / SIX_DEC
          const usd = toNumber(tx.amountUsd, 0)
          if (tokens > 0 && usd > 0) {
            qty += tokens
            cost += usd
            buys += 1
            if (firstBuyPrice === undefined) {
              firstBuyPrice = usd / tokens
            }
          }
        } else if (type === 'sell') {
          // Tokens sent (UI units)
          const inAmount = parseBigIntish(
            tx.executionResponse?.inputAmountResult ?? tx.ultraOrderRequest?.amount
          )
          const tokensSold = inAmount / SIX_DEC
          if (tokensSold > 0 && qty > 0) {
            const sellQty = Math.min(tokensSold, qty)
            const avg = qty > 0 ? cost / qty : 0
            cost -= avg * sellQty
            qty -= sellQty
            sells += 1
          }
        }
      }

      // Return the remaining cost tied to remaining qty
      result[mint] = {
        totalCost: Math.max(0, Math.round(cost * 100) / 100),
        buyCount: buys,
        sellCount: sells,
        basisPrice: firstBuyPrice,
      }
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('[user/cost-basis] Failed to compute cost basis:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to compute cost basis' },
      { status: 500 }
    )
  }
}