
import { useLiveTrading } from "@/hooks/use-live-trading";
import { audioSystem, ensureAudioInitialized } from "@/lib/audio";
import { RENT_PER_TOKEN_ACCOUNT_SOL } from "@/lib/constants/solana";
import { useTransactionToasts } from "@/lib/hooks/use-transaction-toasts";
import { tokenClosureService } from "@/lib/jupiter/accounts/token-accounts";
import { buyService } from "@/lib/jupiter/trading/buy-handler";

import { getSolPrice } from "@/lib/services/sol-price-service";
import { confirmationService } from "@/lib/services/trading/confirmation-service";
import { walletBalanceService } from "@/lib/services/wallet-balance-service";
import { useStore } from "@/lib/store";
import type { Transaction } from "@/lib/types/transaction";
import { usdToLamportsBN } from "@/lib/utils/precision";
import {
    validateBuyTransactionComplete,
    validateSellTransactionComplete,
} from "@/lib/utils/transaction-validation";
import { usePrivy } from "@privy-io/react-auth";
import {
    useSignAndSendTransaction,
    useWallets,
} from "@privy-io/react-auth/solana";
import { useCallback, useRef, useState } from "react";


type AccessTokenSource = string | (() => string | null) | null | undefined
function resolveAccessToken(source: AccessTokenSource): string | null {
  try {
    if (typeof source === 'function') {
      const v = source()
      return typeof v === 'string' && v.length > 0 ? v : null
    }
    if (typeof source === 'string') return source.length > 0 ? source : null
    return null
  } catch { return null }
}


type TransactionPhase =
  | "idle"
  | "preparing"
  | "executing"
  | "confirming"
  | "settling"
  | "completed"
  | "error";


interface BuyTransactionParams {
  type: "buy";
  amount: number;
  cardCount: number;
  tokenIds?: string[];
}

interface SellTransactionParams {
  type: "sell";
  cardId: string;
}

type TransactionParams = BuyTransactionParams | SellTransactionParams;


interface TransactionState {
  phase: TransactionPhase;
  transactionHash: string | null;
  error: string | null;
  retryCount: number;
  canRetry: boolean;

  
  progress: {
  currentStep: number;
  totalSteps: number;
    message: string;
  };

  
  isIdle: boolean;
  isPreparing: boolean;
  isExecuting: boolean;
  isConfirming: boolean;
  isSettling: boolean;
  isCompleted: boolean;
  hasError: boolean;

  
  isBuying: boolean;
  buyError: string | null;

  
  isSelling: boolean;
  sellError: string | null;
  expectedReturn: {
    amount: number;
    pnl: number;
    pnlPercent: number;
  } | null;
}


interface TransactionActions {
  executeTransaction: (params: TransactionParams) => Promise<void>;
  retryTransaction: () => Promise<void>;
  clearError: () => void;
  resetState: () => void;
}


interface UseTransactionCoordinatorReturn
  extends TransactionState,
    TransactionActions {}

const recordTransactionHistory = async (
  transaction: Omit<Transaction, "timestamp"> & { timestamp: number },
  getAccessTokenFn?: () => Promise<string | null>,
  accessToken?: string | null,
  addTransactionFn?: (transaction: Transaction) => void,
  userId?: string,
  walletAddress?: string,
) => {
  
  if (addTransactionFn) {
    const storeTransaction: Transaction = {
      txId: transaction.txId,
      timestamp: transaction.timestamp,
      orderResponse: transaction.orderResponse,
      txResponse: transaction.txResponse,
      routePlan: transaction.routePlan,
      rawApiData: {
        ...transaction.rawApiData,
        
        tokenMint: transaction.tokenMint,
        side: transaction.side,
        amount: transaction.amount,
        price: transaction.price,
        fees: transaction.fees,
  status: transaction.status,
      },
    };
    addTransactionFn(storeTransaction);
  }

  
  if (userId && walletAddress && !transaction.txId.startsWith("demo-")) {
    const dbTransaction = {
      userId,
      walletAddress,
      transactionType: transaction.rawApiData?.side || "unknown",
      tokenMint: transaction.rawApiData?.tokenMint || "unknown",
      tokenSymbol: transaction.rawApiData?.tokenSymbol,
      amountUsd: parseFloat(
        transaction.rawApiData?.requestedAmount?.toString() || "0",
      ),
      ultraOrderRequest: transaction.routePlan,
      ultraOrderResponse: transaction.orderResponse,
      metadata: {
        ...transaction.rawApiData,
        finalTransactionHash: transaction.txId.startsWith("failed-")
          ? null
          : transaction.txId,
        status: transaction.rawApiData?.error ? "failed" : "confirmed",
        errorMessage: transaction.rawApiData?.error,
        executionResponse: transaction.txResponse,
      },
    };

    
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    fetch("/api/transactions/create", {
      method: "POST",
      headers,
      body: JSON.stringify(dbTransaction),
    })
      .then(() => {})
      .catch((error) => {
        console.error(
          "[TransactionCoordinator] Failed to save transaction:",
          error,
        );
      });
  }
};

const triggerBalanceUpdates = async (
  walletAddress: string,
  updateWalletBalanceFn?: (balance: number) => void,
) => {
  

  

  
  const tradingBalanceUSD =
    await walletBalanceService.getTradingBalanceUSD(walletAddress);

  if (updateWalletBalanceFn) {
    
    updateWalletBalanceFn(tradingBalanceUSD);
  }
};

export function useTransactionCoordinator(): UseTransactionCoordinatorReturn {
  
  const [phase, setPhase] = useState<TransactionPhase>("idle");
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [canRetry, setCanRetry] = useState(false);
  const [expectedReturn, setExpectedReturn] = useState<{
    amount: number;
    pnl: number;
    pnlPercent: number;
  } | null>(null);
  const [progressMessage, setProgressMessage] = useState("");


  const lastTransactionRef = useRef<TransactionParams | null>(null);


  const { authenticated } = usePrivy();
  const { ready, wallets } = useWallets();
  const { signAndSendTransaction } = useSignAndSendTransaction();
  const embeddedWallet = wallets.find(
    (wallet) => wallet.standardWallet.name === "Privy",
  );

  // Adapter: wraps Privy v3 signAndSendTransaction to match the old sendTransaction interface
  const sendTransaction = async (params: { transaction: any; connection: any; address: string }) => {
    const txBytes = params.transaction.serialize();
    const result = await signAndSendTransaction({ transaction: txBytes, wallet: embeddedWallet!, chain: 'solana:mainnet' });
    return { signature: Buffer.from(result.signature).toString('base64') };
  };

  
  
  const accessTokenSelector = useStore.use.getAccessToken?.();
  const authFromStore = useStore.use.auth() ?? null;

  
  const buyToken = useStore.use.buyToken() ?? (async () => null);
  const updateWalletBalance = useStore.use.updateWalletBalance() ?? (() => {});

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    return resolveAccessToken(accessTokenSelector)
  }, [accessTokenSelector])

  
  const hand = useStore.use.hand() || [];
  const ui = useStore.use.ui() || {};
  const selectedDrawAmount = ui.selectedDrawAmount;
  const selectedCardCount = ui.selectedCardCount;
  const trading = useStore.use.trading() || {};
  const activeTrades = trading?.activeTrades || new Map();
  const startTrade = trading?.startTrade;
  const generateBatchId = trading?.generateBatchId;
  const closePosition = useStore.use.closePosition();
  const auth = useStore.use.auth() || {};
  const accessToken = auth?.accessToken;
  const userId = useStore.use.userId() || undefined;
  
  const positions = useStore.use.positions() || {};
  const getTokenData = useStore.use.getTokenData();
  const transactions = useStore.use.transactions() || {
    addTransaction: () => {},
    items: [],
  };
  const addTransaction = transactions.addTransaction;

  
  const { executeTrade } = useLiveTrading();
  const {
    notifyTransactionSent,
    notifyTransactionConfirmed,
    notifyTransactionFailed,
    notifyBatchTransactionResults,
    notifyMessage,
  } = useTransactionToasts();

  
  const isIdle = phase === "idle";
  const isPreparing = phase === "preparing";
  const isExecuting = phase === "executing";
  const isConfirming = phase === "confirming";
  const isSettling = phase === "settling";
  const isCompleted = phase === "completed";
  const hasError = phase === "error";

  
  const isBuying =
    (isExecuting || isPreparing) &&
    lastTransactionRef.current?.type === "buy" &&
    !hasError;
  const isSelling =
    (isExecuting || isPreparing || isConfirming) &&
    lastTransactionRef.current?.type === "sell" &&
    !hasError;
  const buyError = lastTransactionRef.current?.type === "buy" ? error : null;
  const sellError = lastTransactionRef.current?.type === "sell" ? error : null;

  
  const getProgress = () => {
    const stepsByPhase = {
      idle: { currentStep: 0, totalSteps: 4, message: "Ready" },
      preparing: {
        currentStep: 1,
        totalSteps: 4,
        message: "Preparing transaction...",
      },
      executing: {
        currentStep: 2,
        totalSteps: 4,
        message: "Executing on blockchain...",
      },
      confirming: {
        currentStep: 3,
        totalSteps: 4,
        message: "Waiting for confirmation...",
      },
      settling: {
        currentStep: 4,
        totalSteps: 4,
        message: "Updating portfolio...",
      },
      completed: {
        currentStep: 4,
        totalSteps: 4,
        message: "Complete",
      },
      error: {
        currentStep: 0,
        totalSteps: 4,
        message: error || "Error occurred",
      },
    } as const;
    return stepsByPhase[phase] || stepsByPhase.idle;
  };

  
  const transitionToPhase = useCallback(
    (newPhase: TransactionPhase, message?: string) => {
      setPhase(newPhase);
      if (message) setProgressMessage(message);
    },
    [],
  );

  const handleError = useCallback(
    (errorMessage: string, allowRetry: boolean = true) => {
      setError(errorMessage);
      setCanRetry(allowRetry);
      transitionToPhase("error", errorMessage);

      
      setTimeout(() => {
        transitionToPhase("idle");
        setError(null);
        setCanRetry(false);
      }, 0);
    },
    [transitionToPhase],
  );

  
  const clearError = useCallback(() => {
    setError(null);
    setCanRetry(false);
    transitionToPhase("idle");
  }, [transitionToPhase]);

  
  const resetState = useCallback(() => {
    setPhase("idle");
    setTransactionHash(null);
    setError(null);
    setRetryCount(0);
    setCanRetry(false);
    setExpectedReturn(null);
    setProgressMessage("");
    lastTransactionRef.current = null;
  }, []);


  const executeBuyTransaction = useCallback(
    async (params: BuyTransactionParams) => {

      notifyTransactionSent("tokens", "buy");

      transitionToPhase("preparing", "Fetching available tokens...");

      
      const activityTokens = buyService.getAvailableTokens();
      if (activityTokens.length === 0) {
        throw new Error("No active tokens available");
      }

      
      const currentTokenIds = hand.map((card: any) => card.id);
      const pendingTokenIds = Array.from(activeTrades.keys());

      
      const filteredTokenIds = buyService.preventDuplicateTokens(
        activityTokens.map((token: any) => token.tokenId),
        currentTokenIds,
        pendingTokenIds,
      );

      
      const availableTokens = activityTokens.filter((token: any) =>
        filteredTokenIds.includes(token.tokenId),
      );

      
      const validation = validateBuyTransactionComplete(
        params.amount,
        params.cardCount,
        availableTokens,
        authenticated,
        embeddedWallet?.address,
      );

      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      
      let selectedTokens = availableTokens.slice(0, params.cardCount);

      if (params.tokenIds && params.tokenIds.length > 0) {
        const requestedIds = new Set(params.tokenIds);
        const matchedTokens = availableTokens.filter((token: any) => requestedIds.has(token.tokenId));

        if (matchedTokens.length < params.cardCount) {
          throw new Error("Requested token(s) not available for purchase");
        }

        selectedTokens = matchedTokens.slice(0, params.cardCount);
      }
      const batchId = generateBatchId
        ? generateBatchId()
        : `batch-${Date.now()}`;
      const optimisticTradeIds: string[] = [];

      transitionToPhase("executing", "Starting transactions...");


      ensureAudioInitialized().then(() => audioSystem.playTradingSound("card_draw")).catch(() => {});


      if (startTrade) {
        selectedTokens.forEach((token) => {
          const tradeId = startTrade({
            tokenId: token.tokenId,
            operation: "buy",
            expectedAmount: params.amount,
            batchId: batchId,
          });
          optimisticTradeIds.push(tradeId);
        });
      }

      
      const batchResults = await Promise.all(
        selectedTokens.map(async (selectedToken, index) => {
          const tradeId = optimisticTradeIds[index];

          const SOL_MINT = "So11111111111111111111111111111111111111112";

          
          const solPrice = await getSolPrice();

          
          const inputAmount = usdToLamportsBN(
            params.amount,
            solPrice,
          ).toNumber();

          
          audioSystem.playTradingSound("trade_sent");


          const tradeResult = await executeTrade({
            tokenMint: selectedToken.tokenId,
            tokenSymbol: selectedToken.symbol,
            side: "buy",
            amountUsd: params.amount,
            currentTokenPrice: selectedToken.price,
          });

          
          if (!tradeResult.success) {
            const errorMessage =
              tradeResult.error || "Trade execution failed";
            console.error(
              `[TransactionCoordinator] Trade failed for ${selectedToken.symbol}:`,
              errorMessage,
            );

            
            notifyTransactionFailed(
              selectedToken.symbol,
              "buy",
              errorMessage,
            );

            throw new Error(errorMessage);
          }

          
          audioSystem.playTradingSound("trade_confirmed");


          notifyTransactionConfirmed(selectedToken.symbol, "buy");

          
          const estimatedTokenBalance =
            tradeResult.actualTokenAmount ||
            params.amount / selectedToken.price;
          const actualCost = params.amount;
          const currentValue = estimatedTokenBalance * selectedToken.price;
          const unrealizedPnl = currentValue - actualCost;

          
          const newCard = {
            id: selectedToken.tokenId,
            type: "jupiter" as const,
            name: selectedToken.name,
            symbol: selectedToken.symbol,
            icon: selectedToken.icon,
            tokenId: selectedToken.tokenId,
            priceChange24h: selectedToken.priceChange24h || 0,
            usdPrice: selectedToken.price || 0,
            volume24h: selectedToken.volume24h,
            liquidity: selectedToken.liquidity,
            dex: selectedToken.dex,
            faceUp: true,
            memeScore: selectedToken.memeScore,
            price: selectedToken.price || 0,
          };

          const newPosition = {
            tokenId: selectedToken.tokenId,
            tokenName: selectedToken.name,
            tokenSymbol: selectedToken.symbol,
            quantity: estimatedTokenBalance,
            entryPrice: actualCost / estimatedTokenBalance,
            currentPrice: selectedToken.price || 0,
            cost: actualCost,
            value: currentValue,
            unrealizedPnl: unrealizedPnl,
            tokenDecimals: 6, 
          };

          
          useStore.setState((state: any) => ({
            hand: [...state.hand, newCard],
            walletBalance: state.walletBalance - actualCost,
            positions: { ...state.positions, [newCard.id]: newPosition },
            cardAnimations: {
              ...state.cardAnimations,
              [newCard.id]: {
                type: "entry",
                variant: "slideInLeft",
                timestamp: Date.now(),
              },
            },
          }));

          return {
            success: true,
            tokenId: selectedToken.tokenId,
            symbol: selectedToken.symbol,
            tokenName: selectedToken.name,
            tradeResult,
            amount: params.amount,
            tokenPrice: selectedToken.price || 0,
          };
        }),
      );

      
      console.log("[TransactionCoordinator] Batch results:", batchResults);

      const successful = batchResults.filter((result) => result?.success);
      const failed = batchResults.filter((result) => !result?.success);

      console.log("[TransactionCoordinator] Successful:", successful.length, "Failed:", failed.length);

      
      notifyBatchTransactionResults(
        batchId,
        successful.length,
        failed.length,
        batchResults.length,
      );

      if (successful.length > 0) {
        transitionToPhase(
          "completed",
          `${successful.length} card(s) purchased successfully`,
        );

        
        if (embeddedWallet) {
          setTimeout(
            () =>
              triggerBalanceUpdates(
                embeddedWallet.address,
                updateWalletBalance,
              ),
            0,
          );
        }

        
        for (const result of successful) {
          if (result?.success && result?.tradeResult) {
            const {
              tokenId,
              symbol,
              tokenName,
              tradeResult,
              amount,
              tokenPrice,
            } = result;

            recordTransactionHistory(
              {
                txId:
                  tradeResult.signature ||
                  tradeResult.transactionHash ||
                  `buy-${tokenId}-${Date.now()}`,
                timestamp: Date.now(),
                orderResponse: tradeResult.orderResponse,
                txResponse: tradeResult.txResponse,
                routePlan: tradeResult.routePlan,
                rawApiData: {
                  ...tradeResult.rawApiData,
                  tokenMint: tokenId,
                  tokenSymbol: symbol,
                  side: "buy",
                  amount: tradeResult.actualTokenAmount || 0,
                  price: tradeResult.finalTokenPrice || tokenPrice,
                  fees: tradeResult.fees || 0,
                  status: "confirmed",
                  
                  requestedAmount: amount,
                },
              },
              getAccessToken,
              accessToken,
              addTransaction,
              userId as string | undefined,
              embeddedWallet?.address,
            );

            
          }
        }

        resetState(); 
      } else {
        throw new Error("All transactions failed");
      }
    },
    [
      hand,
      activeTrades,
      startTrade,
      generateBatchId,
      authenticated,
      ready,
      embeddedWallet,
      executeTrade,
      transitionToPhase,
      handleError,
      resetState,
      notifyTransactionSent,
    ],
  );

  
  const executeSellTransaction = useCallback(
    async (params: SellTransactionParams) => {
      if (!authenticated) {
        
        closePosition(params.cardId);
        return;
      }

      transitionToPhase("preparing", "Preparing sell order...");

      
      const position = positions[params.cardId];
      if (!position) {
        throw new Error("Position not found");
      }

      const card = hand.find((c: any) => c.id === params.cardId);
      if (!card) {
        throw new Error("Card not found");
      }

      
      const tokenData = getTokenData ? getTokenData(params.cardId) : null;
      const liveTokenPrice =
        tokenData?.usdPrice || card.usdPrice || card.price || 0;

      
      const validation = validateSellTransactionComplete(
        params.cardId,
        position,
        position.quantity,
        liveTokenPrice,
        authenticated,
        embeddedWallet?.address,
      );

      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      
      const expectedPnl = position.value - position.cost;
      const expectedPnlPercent =
        position.cost > 0 ? (expectedPnl / position.cost) * 100 : 0;

      setExpectedReturn({
        amount: position.value,
        pnl: expectedPnl,
        pnlPercent: expectedPnlPercent,
      });

      transitionToPhase("executing", `Selling ${card.symbol}...`);


      ensureAudioInitialized().then(() => audioSystem.playTradingSound("trade_sent")).catch(() => {});



      const actualTokenMint = card.tokenId || card.id || params.cardId;
      const tradeResult = await executeTrade({
        tokenMint: actualTokenMint,
        tokenSymbol: card.symbol,
        side: "sell",
        amountUsd: position.value,
        currentTokenPrice: liveTokenPrice,
        tokenQuantity: position.quantity,
        costBasis: position.cost,
        tokenDecimals: position.tokenDecimals || card.tokenDecimals || null,
      });

      
      if (!tradeResult.success) {
        const errorMessage = tradeResult.error || "Trade execution failed";
        console.error(
          `[TransactionCoordinator] Sell trade failed for ${card.symbol}:`,
          errorMessage,
        );

        
        notifyTransactionFailed(card.symbol, "sell", errorMessage);

        throw new Error(errorMessage);
      }

      
      audioSystem.playTradingSound("trade_confirmed");


      const actualPnl =
        (tradeResult.actualAmountUsd || position.value) - position.cost;

      

      
      notifyTransactionConfirmed(card.symbol, "sell", actualPnl);

      
      if (embeddedWallet?.address && (tradeResult.signature || tradeResult.transactionHash)) {
        transitionToPhase("confirming", `Confirming ${card.symbol} sale...`);

        const realTransactionHash = tradeResult.signature || tradeResult.transactionHash || "";

        // Await balance-based confirmation: SOLD when token disappears
        const confirmResult = await confirmationService.confirmSellTransaction(
          {
            transactionHash: realTransactionHash,
            tokenMint: actualTokenMint,
            walletAddress: embeddedWallet.address,
            operation: "sell",
          }
        );

        if (confirmResult.confirmed) {
          // SOLD → remove from UI and continue to settle/completed
          await closePosition(params.cardId);
        } else {
          console.error("[TransactionCoordinator] Sell confirmation failed:", confirmResult.error);
          // Don't remove the card; let the UI reset, user can retry if needed
          transitionToPhase("completed", `${card.symbol} sell submitted`);
        }
      }

      
      setTimeout(() => {
        recordTransactionHistory(
          {
            txId: tradeResult.signature || tradeResult.transactionHash || "",
            timestamp: Date.now(),
            orderResponse: tradeResult.orderResponse,
            txResponse: tradeResult.txResponse,
            routePlan: tradeResult.routePlan,
            rawApiData: {
              ...tradeResult.rawApiData,
              tokenMint: params.cardId,
              tokenSymbol: card.symbol,
              side: "sell",
              amount: tradeResult.actualTokenAmount || position.quantity,
              price: liveTokenPrice,
              fees: tradeResult.fees || 0,
              status: "confirmed",
              
              requestedAmount: position.value,
            },
          },
          getAccessToken,
          accessToken,
          addTransaction,
          userId as string | undefined,
          embeddedWallet?.address,
        );
      }, 0);

      

  transitionToPhase("settling", "Updating portfolio...");

      
      if (embeddedWallet) {
        setTimeout(
          () =>
            triggerBalanceUpdates(
              embeddedWallet.address,
              updateWalletBalance,
            ),
          0,
        );
      }

      
  transitionToPhase("completed", `${card.symbol} sold successfully`);

      if (embeddedWallet) {
        
        const sendTransactionWrapper = async (params: {
          transaction: any;
          connection: any;
        }) => {
          const receipt = await sendTransaction({
            transaction: params.transaction,
            connection: params.connection,
            address: embeddedWallet.address,
          });
          return { signature: receipt.signature };
        };

        const closureResult =
          await tokenClosureService.closeEmptyTokenAccounts(
            embeddedWallet.address,
            embeddedWallet,
            
            async () => (await getAccessToken()) || "",
            sendTransactionWrapper,
          );

        if (closureResult.success && closureResult.closedAccounts! > 0) {
          const reclaimedSOL = (
            closureResult.closedAccounts! * RENT_PER_TOKEN_ACCOUNT_SOL
          ).toFixed(3);


          notifyMessage(
            `💰 Bonus: ${reclaimedSOL} SOL`,
            `Closed ${closureResult.closedAccounts} empty token accounts`,
          );
        }
      }

  resetState();
    },
    [
      authenticated,
      hand,
      embeddedWallet,
      executeTrade,
      closePosition,
      transitionToPhase,
      handleError,
      resetState,
      notifyTransactionConfirmed,
      accessToken,
      sendTransaction,
    ],
  );


  const executeTransaction = useCallback(
    async (params: TransactionParams) => {
      if (phase !== "idle" && phase !== "error") {
        console.warn(
          "[TransactionCoordinator] Transaction already in progress",
        );
        return;
      }

      
      if (error) clearError();

      
      lastTransactionRef.current = params;
      setRetryCount(0);

      
      if (params.type === "buy") {
        await executeBuyTransaction(params).catch((error) => {
          console.error("[TransactionCoordinator] Buy transaction failed:", error);
          handleError(error.message || "Buy transaction failed");
          throw error; 
        });
      } else if (params.type === "sell") {
        await executeSellTransaction(params).catch((error) => {
          console.error("[TransactionCoordinator] Sell transaction failed:", error);
          handleError(error.message || "Sell transaction failed");
          throw error; 
        });
      } else {
        handleError("Invalid transaction type");
      }
    },
    [
      phase,
      error,
      clearError,
      executeBuyTransaction,
      executeSellTransaction,
      handleError,
    ],
  );

  
  const retryTransaction = useCallback(async () => {
    if (!lastTransactionRef.current || !canRetry) {
      console.warn(
        "[TransactionCoordinator] No transaction to retry or retry not allowed",
      );
      return;
    }

    setRetryCount((prev) => prev + 1);
    clearError();

    await executeTransaction(lastTransactionRef.current);
  }, [canRetry, clearError, executeTransaction]);

  const progress = getProgress();

  return {
    
    phase,
    transactionHash,
    error,
    retryCount,
    canRetry,
    progress,

    
    isIdle,
    isPreparing,
    isExecuting,
    isConfirming,
    isSettling,
    isCompleted,
    hasError,

    
    isBuying,
    isSelling,
    buyError,
    sellError,
    expectedReturn,

    
    executeTransaction,
    retryTransaction,
    clearError,
    resetState,
  };
}
