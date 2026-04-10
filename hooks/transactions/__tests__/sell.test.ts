import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runSellFlow } from '../sell';

vi.mock('@/lib/services/sol-price-service', () => ({
  getSolPrice: vi.fn().mockResolvedValue(200),
}));

vi.mock('@/lib/services/trading/confirmation-service', () => ({
  confirmationService: {
    confirmSOLIncrease: vi.fn((args, handlers) => {
      // Immediately call onConfirmed for test
      handlers.onConfirmed?.({ ok: true });
    }),
  },
}));

vi.mock('../actions/audio', () => ({
  playSound: vi.fn(),
}));

vi.mock('../actions/balance', () => ({
  triggerBalanceUpdates: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../actions/record-transaction', () => ({
  recordTransactionHistory: vi.fn().mockResolvedValue(undefined),
}));

describe('runSellFlow', () => {
  const card = { id: 'T1', tokenId: 'T1', symbol: 'TKN' };
  const position = { quantity: 5, value: 10, cost: 8, tokenDecimals: 6 };

  const depsBase = {
    executeTrade: vi.fn(),
    embeddedWalletAddress: 'wallet1',
    closePosition: vi.fn(),
    sendTransactionWrapper: vi.fn().mockResolvedValue({ signature: 'sig1' }),
    tokenClosureService: {
      closeEmptyTokenAccounts: vi.fn().mockResolvedValue({ success: true, closedAccounts: 2 }),
    },
    getAccessToken: vi.fn().mockResolvedValue('at'),
    accessToken: 'at',
    addTransaction: vi.fn(),
    userId: 'u1',
    updateWalletBalance: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('happy path: executes trade, confirms, records, updates balance, returns success', async () => {
    const executeTrade = vi.fn().mockResolvedValue({ success: true, signature: 'sig1', actualAmountUsd: 12 });

    const res = await runSellFlow(
      { cardId: 'T1', card, position, liveTokenPrice: 2, embeddedWallet: {} },
      { ...depsBase, executeTrade },
    );

    expect(res.success).toBe(true);
    expect(res.actualPnl).toBe(4);
  });

  it('failure path: trade error returns failed', async () => {
    const executeTrade = vi.fn().mockResolvedValue({ success: false, error: 'oops' });

    const res = await runSellFlow(
      { cardId: 'T1', card, position, liveTokenPrice: 2, embeddedWallet: {} },
      { ...depsBase, executeTrade },
    );

    expect(res.success).toBe(false);
    expect(res.error).toBe('oops');
  });
});
