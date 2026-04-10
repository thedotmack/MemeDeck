import { getSolPrice } from "@/lib/services/sol-price-service";
import { confirmationService } from "@/lib/services/trading/confirmation-service";
import { playSound } from "./actions/audio";
import { debouncedBalanceUpdate } from "./actions/debounced-balance";
import { recordTransactionHistory, RecordTxDeps } from "./actions/record-transaction";

type SellDeps = {
  executeTrade: (args: any) => Promise<any>;
  embeddedWalletAddress?: string;
  closePosition: (cardId: string) => void;
  sendTransactionWrapper?: (params: { transaction: any; connection: any }) => Promise<{ signature: string }>
  tokenClosureService?: {
    closeEmptyTokenAccounts: (
      walletAddress: string,
      embeddedWallet: any,
      getAccessToken: () => Promise<string>,
      sendTransaction: (params: { transaction: any; connection: any }) => Promise<{ signature: string }>,
    ) => Promise<{ success: boolean; closedAccounts?: number }>
  };
  getAccessToken?: () => Promise<string | null>;
  accessToken?: string | null;
  addTransaction?: RecordTxDeps["addTransactionFn"];
  userId?: string;
  updateWalletBalance?: (balance: number) => void;
};

export async function runSellFlow(
  params: {
    cardId: string;
    card: any;
    position: any;
    liveTokenPrice: number;
    embeddedWallet?: any;
  },
  deps: SellDeps,
) {
  const {
    executeTrade,
    embeddedWalletAddress,
    closePosition,
    sendTransactionWrapper,
    tokenClosureService,
    getAccessToken,
    accessToken,
    addTransaction,
    userId,
    updateWalletBalance,
  } = deps;

  playSound("trade_sent");

  const actualTokenMint = (() => {
    const candidates = [
      { value: params.card?.tokenId, source: "params.card.tokenId" },
      { value: params.card?.id, source: "params.card.id" },
      { value: params.cardId, source: "params.cardId" },
    ];
    const validCandidate = candidates.find(
      (c) => c.value && typeof c.value === "string",
    );
    if (!validCandidate) {
      console.error(
        "[TransactionCoordinator] No valid token ID found in sell params:",
        {
          cardTokenId: params.card?.tokenId,
          cardId: params.card?.id,
          cardIdParam: params.cardId,
        },
      );
      throw new Error("No valid token ID found for sell operation");
    }
    if (validCandidate.source !== "params.card.tokenId") {
      console.warn(
        `[TransactionCoordinator] Using fallback token ID from ${validCandidate.source}:`,
        validCandidate.value,
      );
    }
    return validCandidate.value as string;
  })();
  const tradeResult = await executeTrade({
    tokenMint: actualTokenMint,
    tokenSymbol: params.card.symbol,
    side: "sell",
    amountUsd: params.position.value,
    currentTokenPrice: params.liveTokenPrice,
    tokenQuantity: params.position.quantity,
    costBasis: params.position.cost,
    tokenDecimals: params.position.tokenDecimals || params.card.tokenDecimals || null,
  });

  if (!tradeResult.success) {
    return { success: false, error: tradeResult.error || "Trade execution failed" };
  }

  playSound("trade_confirmed");

  const actualPnl = (tradeResult.actualAmountUsd || params.position.value) - params.position.cost;

  if (embeddedWalletAddress && (tradeResult.signature || tradeResult.transactionHash)) {
    const realTransactionHash = tradeResult.signature || tradeResult.transactionHash || "";

    const confirmationHandle = confirmationService.confirmSOLIncrease(
      {
        transactionHash: realTransactionHash,
        walletAddress: embeddedWalletAddress,
        operation: "sell",
        expectedAmount: await getSolPrice().then((solPrice) => params.position.value / solPrice),
      },
      {
        onConfirmed: () => {
          try {
            closePosition(params.cardId);
          } catch (error) {
            console.warn(
              "[TransactionCoordinator] Position already closed or component unmounted",
            );
          }
        },
        onFailed: (error) => {
          console.error("[TransactionCoordinator] SOL confirmation failed for sell:", error);
        },
      },
    );

    // If supported, expose cancel handle to caller for cleanup
    if (confirmationHandle && typeof (confirmationHandle as any).cancel === "function") {
      (tradeResult as any).confirmationHandle = confirmationHandle;
    }
  }

  await recordTransactionHistory(
    {
      txId: tradeResult.signature || tradeResult.transactionHash || "",
      timestamp: Date.now(),
      orderResponse: tradeResult.orderResponse,
      txResponse: tradeResult.txResponse,
      routePlan: tradeResult.routePlan,
      rawApiData: {
        ...tradeResult.rawApiData,
  tokenMint: actualTokenMint,
        tokenSymbol: params.card.symbol,
        side: "sell",
        amount: tradeResult.actualTokenAmount || params.position.quantity,
        price: params.liveTokenPrice,
        fees: tradeResult.fees || 0,
        status: "confirmed",
        requestedAmount: params.position.value,
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

  if (embeddedWalletAddress && updateWalletBalance) {
    debouncedBalanceUpdate(embeddedWalletAddress, updateWalletBalance);
  }

  if (params.embeddedWallet && tokenClosureService && sendTransactionWrapper) {
    const closureResult = await tokenClosureService.closeEmptyTokenAccounts(
      embeddedWalletAddress!,
      params.embeddedWallet,
      async () => (await (getAccessToken?.())) || "",
      sendTransactionWrapper,
    );

    if (closureResult.success && (closureResult.closedAccounts || 0) > 0) {
      // Notify handled by caller via toasts
    }
  }

  return { success: true, tradeResult, actualPnl };
}
