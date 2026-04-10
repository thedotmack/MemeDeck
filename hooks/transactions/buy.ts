import { getSolPrice } from "@/lib/services/sol-price-service";
import { usdToLamportsBN } from "@/lib/utils/precision";
import { playSound } from "./actions/audio";
import { debouncedBalanceUpdate } from "./actions/debounced-balance";
import { recordTransactionHistory, RecordTxDeps } from "./actions/record-transaction";

type BuyDeps = {
  executeTrade: (args: any) => Promise<any>;
  startTrade?: (args: any) => string;
  generateBatchId?: () => string;
  availableTokens: any[];
  selectedCount: number;
  amountUsd: number;
  embeddedWalletAddress?: string;
  updateWalletBalance?: (balance: number) => void;
  addTransaction?: RecordTxDeps["addTransactionFn"];
  getAccessToken?: () => Promise<string | null>;
  accessToken?: string | null;
  userId?: string;
};

export async function runBuyFlow(deps: BuyDeps) {
  const {
    executeTrade,
    startTrade,
    generateBatchId,
    availableTokens,
    selectedCount,
    amountUsd,
    embeddedWalletAddress,
    updateWalletBalance,
    addTransaction,
    getAccessToken,
    accessToken,
    userId,
  } = deps;

  const selectedTokens = availableTokens.slice(0, selectedCount);
  function generateSecureBatchId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `batch-${timestamp}-${random}`;
  }
  const batchId = generateBatchId ? generateBatchId() : generateSecureBatchId();
  const optimisticTradeIds: string[] = [];

  playSound("card_draw");

  if (startTrade) {
    selectedTokens.forEach((token) => {
      const tradeId = startTrade({
        tokenId: token.tokenId,
        operation: "buy",
        expectedAmount: amountUsd,
        batchId,
      });
      optimisticTradeIds.push(tradeId);
    });
  }

  async function processWithConcurrencyLimit<T, R>(
    items: T[],
    processor: (item: T, index: number) => Promise<R>,
    concurrencyLimit: number = 3,
  ): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += concurrencyLimit) {
      const batch = items.slice(i, i + concurrencyLimit);
      const batchResults = await Promise.all(
        batch.map((item, batchIndex) => processor(item, i + batchIndex)),
      );
      results.push(...batchResults);
    }
    return results;
  }

  const results = await processWithConcurrencyLimit(
    selectedTokens,
    async (selectedToken, index) => {
      const tradeId = optimisticTradeIds[index];

      const solPrice = await getSolPrice();
      const inputAmount = usdToLamportsBN(amountUsd, solPrice).toNumber();

      playSound("trade_sent");

      let tradeResult: any;
      try {
        tradeResult = await executeTrade({
          tokenMint: selectedToken.tokenId,
          tokenSymbol: selectedToken.symbol,
          side: "buy",
          amountUsd,
          currentTokenPrice: selectedToken.price,
        });
      } catch (e: any) {
        const contextualError = `Buy trade failed for ${selectedToken.symbol} (${selectedToken.tokenId}): ${e?.message || e}`;
        console.error("[TransactionCoordinator]", contextualError, {
          token: selectedToken,
          error: e,
          amountUsd,
          index,
        });
        return { success: false, error: contextualError, token: selectedToken };
      }

      if (!tradeResult.success) {
        const errorMessage = tradeResult.error || "Trade execution failed";
        const contextualError = `Buy trade failed for ${selectedToken.symbol} (${selectedToken.tokenId}): ${errorMessage}`;
        console.error("[TransactionCoordinator]", contextualError, {
          token: selectedToken,
          tradeResult,
          amountUsd,
          index,
        });
        return { success: false, error: contextualError, token: selectedToken };
      }

      playSound("trade_confirmed");

      const estimatedTokenBalance =
        tradeResult.actualTokenAmount || amountUsd / (selectedToken.price || 1);
      const actualCost = amountUsd;
      const currentValue = estimatedTokenBalance * (selectedToken.price || 0);
      const unrealizedPnl = currentValue - actualCost;

      // Optimistic store updates are expected to be done by caller if desired.

      // Persist transaction
      await recordTransactionHistory(
        {
          txId:
            tradeResult.signature ||
            tradeResult.transactionHash ||
            `buy-${selectedToken.tokenId}-${Date.now()}`,
          timestamp: Date.now(),
          orderResponse: tradeResult.orderResponse,
          txResponse: tradeResult.txResponse,
          routePlan: tradeResult.routePlan,
          rawApiData: {
            ...tradeResult.rawApiData,
            tokenMint: selectedToken.tokenId,
            tokenSymbol: selectedToken.symbol,
            side: "buy",
            amount: tradeResult.actualTokenAmount || 0,
            price: tradeResult.finalTokenPrice || selectedToken.price || 0,
            fees: tradeResult.fees || 0,
            status: "confirmed",
            requestedAmount: amountUsd,
          },
        },
        {
          getAccessTokenFn: getAccessToken,
          accessToken,
          addTransactionFn: addTransaction,
          userId,
          walletAddress: embeddedWalletAddress,
        },
      );

      return {
        success: true,
        token: selectedToken,
        tradeResult,
        amount: amountUsd,
      };
    },
    3,
  );

  if (embeddedWalletAddress && updateWalletBalance) {
    debouncedBalanceUpdate(embeddedWalletAddress, updateWalletBalance);
  }

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  return { batchId, results, successful, failed };
}
