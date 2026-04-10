import type { Transaction } from "@/lib/types/transaction";

export type RecordTxDeps = {
  getAccessTokenFn?: () => Promise<string | null>;
  accessToken?: string | null;
  addTransactionFn?: (transaction: Transaction) => void;
  userId?: string;
  walletAddress?: string;
};

// Extended transaction shape to improve type safety for optional enriched fields
interface ExtendedTransaction extends Transaction {
  tokenMint?: string;
  side?: "buy" | "sell";
  amount?: number;
  price?: number;
  fees?: number;
  status?: "confirmed" | "failed" | "pending";
  tokenSymbol?: string;
  requestedAmount?: number;
  error?: string;
}

// Helper to detect demo/test transactions
const isDemoTransaction = (transaction: any): boolean => {
  try {
    const txId: string = transaction?.txId || "";
    return (
      typeof txId === "string" &&
      (txId.startsWith("demo-") ||
        txId.startsWith("test-"))
    ) || Boolean((transaction?.rawApiData as any)?.isDemoMode === true);
  } catch {
    return false;
  }
};

export const recordTransactionHistory = async (
  transaction: Omit<ExtendedTransaction, "timestamp"> & { timestamp: number },
  deps: RecordTxDeps = {},
) => {
  const {
    // kept for signature parity; not used directly here but preserved for compatibility
    getAccessTokenFn,
    accessToken,
    addTransactionFn,
    userId,
    walletAddress,
  } = deps;

  // Local state store write (if provided)
  if (addTransactionFn) {
    const enrichedRaw: any = { ...transaction.rawApiData };
    if (transaction.tokenMint !== undefined) enrichedRaw.tokenMint = transaction.tokenMint;
    if (transaction.side !== undefined) enrichedRaw.side = transaction.side;
    if (transaction.amount !== undefined) enrichedRaw.amount = transaction.amount;
    if (transaction.price !== undefined) enrichedRaw.price = transaction.price;
    if (transaction.fees !== undefined) enrichedRaw.fees = transaction.fees;
    if (transaction.status !== undefined) enrichedRaw.status = transaction.status;

    const storeTransaction: Transaction = {
      txId: transaction.txId,
      timestamp: transaction.timestamp,
      orderResponse: transaction.orderResponse,
      txResponse: transaction.txResponse,
      routePlan: transaction.routePlan,
      rawApiData: enrichedRaw,
    };
    addTransactionFn(storeTransaction);
  }

  // Remote persistence
  if (userId && walletAddress && !isDemoTransaction(transaction)) {
    const dbTransaction = {
      userId,
      walletAddress,
      transactionType: transaction.side || (transaction.rawApiData as any)?.side || "unknown",
      tokenMint: transaction.tokenMint || (transaction.rawApiData as any)?.tokenMint || "unknown",
      tokenSymbol: transaction.tokenSymbol || (transaction.rawApiData as any)?.tokenSymbol,
      amountUsd: parseFloat(
        (transaction.requestedAmount ?? (transaction.rawApiData as any)?.requestedAmount)?.toString?.() || "0",
      ),
      ultraOrderRequest: transaction.routePlan,
      ultraOrderResponse: transaction.orderResponse,
      metadata: {
        ...transaction.rawApiData,
        finalTransactionHash: transaction.txId.startsWith("failed-")
          ? null
          : transaction.txId,
        status: transaction.error || (transaction.rawApiData as any)?.error ? "failed" : "confirmed",
        errorMessage: transaction.error || (transaction.rawApiData as any)?.error,
        executionResponse: transaction.txResponse,
      },
    };

    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    // Validate critical fields before sending
    if (!dbTransaction.userId || !dbTransaction.walletAddress) {
      console.error(
        "[TransactionCoordinator] Missing required fields for transaction recording",
      );
      return;
    }
    if (!dbTransaction.tokenMint || dbTransaction.tokenMint === "unknown") {
      console.error(
        "[TransactionCoordinator] Invalid tokenMint for transaction recording",
      );
      return;
    }

    // 10 second timeout via AbortController for broad runtime support
    let abortController: AbortController | undefined;
    if (typeof AbortController !== "undefined") {
      abortController = new AbortController();
      setTimeout(() => abortController?.abort(), 10_000);
    }
    const requestConfig: RequestInit = {
      method: "POST",
      headers,
      body: JSON.stringify(dbTransaction),
      signal: abortController?.signal,
    };

    const maxRetries = 3;
    let retryCount = 0;

    const attemptRequest = async (): Promise<void> => {
      try {
        const response = await fetch("/api/transactions/create", requestConfig);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        console.log("[TransactionCoordinator] Transaction recorded successfully");
      } catch (error: any) {
        retryCount++;
        if (retryCount <= maxRetries && error?.name !== "AbortError") {
          console.warn(
            `[TransactionCoordinator] Transaction recording failed (attempt ${retryCount}/${maxRetries}), retrying...`,
            error,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)),
          );
          return attemptRequest();
        }
        console.error(
          "[TransactionCoordinator] Failed to save transaction after all retries:",
          error,
        );
      }
    };

    attemptRequest();
  }
};
