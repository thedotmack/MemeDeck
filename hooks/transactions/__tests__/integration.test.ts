import { describe, expect, it, vi } from 'vitest';
import { runBuyFlow } from '../buy';
import { runSellFlow } from '../sell';

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

vi.mock('@/lib/services/trading/confirmation-service', () => ({
  confirmationService: {
    confirmSOLIncrease: vi.fn((args, handlers) => {
      handlers.onConfirmed?.({ ok: true });
      return { cancel: vi.fn() } as any;
    }),
  },
}));

describe('Transaction Coordinator Integration', () => {
  it('completes a buy-then-sell cycle (mocked)', async () => {
    const token = { tokenId: 'T1', symbol: 'TKN', price: 2 };

    const buyRes = await runBuyFlow({
      executeTrade: vi.fn().mockResolvedValue({ success: true, signature: 'buy1', actualTokenAmount: 5 }),
      availableTokens: [token],
      selectedCount: 1,
      amountUsd: 10,
      addTransaction: vi.fn(),
      getAccessToken: vi.fn().mockResolvedValue('at'),
      accessToken: 'at',
      userId: 'u1',
    });

    expect(buyRes.successful.length).toBe(1);

    const sellRes = await runSellFlow(
      {
        cardId: token.tokenId,
        card: { id: token.tokenId, tokenId: token.tokenId, symbol: token.symbol },
        position: { quantity: 5, value: 10, cost: 8, tokenDecimals: 6 },
        liveTokenPrice: 2,
      },
      {
        executeTrade: vi.fn().mockResolvedValue({ success: true, signature: 'sell1', actualAmountUsd: 12 }),
        embeddedWalletAddress: 'wallet1',
        closePosition: vi.fn(),
        sendTransactionWrapper: vi.fn().mockResolvedValue({ signature: 'sig1' }),
        tokenClosureService: {
          closeEmptyTokenAccounts: vi.fn().mockResolvedValue({ success: true, closedAccounts: 1 }),
        },
        getAccessToken: vi.fn().mockResolvedValue('at'),
        accessToken: 'at',
        addTransaction: vi.fn(),
        userId: 'u1',
        updateWalletBalance: vi.fn(),
      },
    );

    expect(sellRes.success).toBe(true);
  });
});
