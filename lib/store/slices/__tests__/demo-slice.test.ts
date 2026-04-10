import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

import type { ActivityToken } from '@/lib/jupiter/realtime/activity-websocket'
import { createDemoSlice, type DemoSlice } from '../demo-slice'

interface DemoTestState extends DemoSlice {
  hand: any[]
  walletBalance: number
  positions: Record<string, any>
  isDemoMode: boolean
  ui: {
    selectedDrawAmount: number
    selectedCardCount: number
  }
  tokenPrices: Record<string, number>
  cardAnimations: Record<string, any>
  discardPile: any[]
}

const createDemoTestStore = () =>
  create<DemoTestState>()(
    immer((set, get, store) => ({
      hand: [],
      walletBalance: 500,
      positions: {},
      isDemoMode: true,
      ui: { selectedDrawAmount: 100, selectedCardCount: 1 },
      tokenPrices: {},
      cardAnimations: {},
      discardPile: [],
      ...createDemoSlice(set as any, get as any, store as any),
    })),
  )

const fetchMock = vi.fn()
let originalFetch: typeof global.fetch

beforeAll(() => {
  originalFetch = global.fetch
  global.fetch = fetchMock as unknown as typeof global.fetch
})

afterAll(() => {
  global.fetch = originalFetch
})

beforeEach(() => {
  fetchMock.mockReset()
})

describe('demo.openPosition', () => {
  it('adds provided activity token without fetching when overrides supplied', async () => {
    const store = createDemoTestStore()

    const token: ActivityToken = {
      tokenId: 'token-1',
      symbol: 'AAA',
      name: 'Alpha',
      price: 10,
      oneMinGain: 0.05,
      twoMinGain: 0.1,
      threeMinGain: 0.12,
      fourMinGain: 0.2,
      fiveMinGain: 0.25,
      buyPressure5m: 0.3,
      volume24h: 1000,
      liquidity: 5000,
      icon: '/token-1.png',
      updatesPerMinute: 5,
      winRate: 0.6,
      signal: 'STRONG',
      tokenBeingAnalyzed: false,
      firstSeen: Date.now(),
      createdAt: new Date().toISOString(),
    }

    await store.getState().demo.openPosition({
      primaryToken: token,
      amountOverride: 50,
      cardCountOverride: 1,
      tokenId: token.tokenId,
    })

    const state = store.getState()
    expect(state.hand).toHaveLength(1)
    expect(state.hand[0]?.id).toBe('token-1')
    expect(state.walletBalance).toBeCloseTo(450)
    expect(state.positions['token-1']).toBeDefined()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fetches activity tokens and prioritizes requested token id', async () => {
    const store = createDemoTestStore()

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        activeTokens: [
          {
            tokenId: 'token-2',
            symbol: 'BBB',
            name: 'Beta',
            price: 8,
            winRate: 0.4,
            volume24h: 800,
            liquidity: 4000,
          },
          {
            tokenId: 'token-3',
            symbol: 'CCC',
            name: 'Gamma',
            price: 5,
            winRate: 0.7,
            volume24h: 1200,
            liquidity: 6000,
          },
        ],
      }),
    })

    await store.getState().demo.openPosition({
      tokenId: 'token-3',
      amountOverride: 20,
      cardCountOverride: 1,
    })

    const state = store.getState()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(state.hand).toHaveLength(1)
    expect(state.hand[0]?.id).toBe('token-3')
    expect(state.walletBalance).toBeCloseTo(480)
    expect(state.positions['token-3']).toBeDefined()
  })
})
