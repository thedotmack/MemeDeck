import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runBuyFlow } from '../buy';

vi.mock('@/lib/services/sol-price-service', () => ({
  getSolPrice: vi.fn().mockResolvedValue(200),
}));

vi.mock('../actions/audio', () => ({
  playSound: vi.fn(),
}));

vi.mock('../actions/balance', () => ({
  triggerBalanceUpdates: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../actions/debounced-balance', () => ({
  debouncedBalanceUpdate: vi.fn(),
}));

vi.mock('../actions/record-transaction', () => ({
  recordTransactionHistory: vi.fn().mockResolvedValue(undefined),
}));

describe('runBuyFlow', () => {
  const token = { tokenId: 'T1', symbol: 'TKN', price: 1, name: 'Token' };
  const depsBase = {
    executeTrade: vi.fn(),
    startTrade: vi.fn().mockReturnValue('trade-1'),
    generateBatchId: vi.fn().mockReturnValue('batch-123'),
    availableTokens: [token],
    selectedCount: 1,
    amountUsd: 10,
    embeddedWalletAddress: 'wallet1',
    updateWalletBalance: vi.fn(),
    addTransaction: vi.fn(),
    getAccessToken: vi.fn().mockResolvedValue('at'),
    accessToken: 'at',
    userId: 'u1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('happy path: executes trade, records tx, updates balance, returns success', async () => {
    const executeTrade = vi.fn().mockResolvedValue({ success: true, signature: 'sig1', actualTokenAmount: 10 });

    const res = await runBuyFlow({ ...depsBase, executeTrade });

    expect(res.batchId).toBe('batch-123');
    expect(res.results).toHaveLength(1);
    expect(res.successful).toHaveLength(1);
    expect(res.failed).toHaveLength(0);
  });

  it('failure path: trade error returns failed array', async () => {
    const executeTrade = vi.fn().mockResolvedValue({ success: false, error: 'oops' });
    const res = await runBuyFlow({ ...depsBase, executeTrade });

    expect(res.successful).toHaveLength(0);
    expect(res.failed).toHaveLength(1);
    expect(res.results[0]).toMatchObject({ success: false });
    expect((res.results[0] as any).error).toContain('oops');
  });

  it('handles network rejection gracefully', async () => {
    const executeTrade = vi.fn().mockRejectedValue(new Error('Network timeout'));
    const res = await runBuyFlow({ ...depsBase, executeTrade });
    expect(res.failed.length).toBe(1);
    expect(res.failed[0].error).toContain('Network timeout');
  });

  it('handles partial batch failures with controlled concurrency', async () => {
    const tokens = [
      { tokenId: 'A', symbol: 'A', price: 1 },
      { tokenId: 'B', symbol: 'B', price: 1 },
      { tokenId: 'C', symbol: 'C', price: 1 },
    ];
    const executeTrade = vi
      .fn()
      .mockResolvedValueOnce({ success: true, signature: 'tx1' })
      .mockResolvedValueOnce({ success: false, error: 'rate limit' })
      .mockResolvedValueOnce({ success: true, signature: 'tx3' });
    const res = await runBuyFlow({ ...depsBase, availableTokens: tokens, selectedCount: 3, executeTrade });
    expect(res.successful.length).toBe(2);
    expect(res.failed.length).toBe(1);
  });

  it('ensures unique batch IDs without provided generator', async () => {
    const executeTrade = vi.fn().mockResolvedValue({ success: true, signature: 'sig' });
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const res = await runBuyFlow({ ...depsBase, generateBatchId: undefined, executeTrade });
      ids.add(res.batchId);
    }
    expect(ids.size).toBe(100);
  });
});
