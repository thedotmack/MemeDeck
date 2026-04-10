import { usePrivy } from "@privy-io/react-auth";
import { useSignAndSendTransaction, useSignTransaction, useWallets } from "@privy-io/react-auth/solana";
import { VersionedTransaction } from "@solana/web3.js";
import { useCallback, useState } from "react";

import {
    TradeRequest,
    TradeResult,
    tradingService,
} from "@/lib/services/trading-service";
import { useStore } from "@/lib/store";

interface UseLiveTradingReturn {
  executeTrade: (request: TradeRequest) => Promise<TradeResult>;
  isExecuting: boolean;
  canTrade: boolean;
  lastTradeResult: TradeResult | null;
  error: string | null;
  clearError: () => void;
}

export function useLiveTrading(): UseLiveTradingReturn {
  const { authenticated } = usePrivy();
  const { ready, wallets } = useWallets();
  const { signAndSendTransaction } = useSignAndSendTransaction();
  const { signTransaction } = useSignTransaction();
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastTradeResult, setLastTradeResult] = useState<TradeResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  
  const userIdValue = useStore.use.userId?.() || null;
  
  
  const getAccessTokenAsync = useCallback(async () => {
    try {
      const accessToken = useStore.getState().getAccessToken();
      return accessToken;
    } catch (error) {
      console.error('Failed to get access token from store:', error);
      return null;
    }
  }, []);

  
  const embeddedWallet = wallets.find(wallet => wallet.standardWallet.name === 'Privy');
  const walletAddress = embeddedWallet?.address;

  // Adapter: wraps Privy v3 signAndSendTransaction to match the old sendTransaction interface
  const sendTransaction = async (params: { transaction: any; connection: any; address: string }) => {
    const txBytes = params.transaction.serialize();
    const result = await signAndSendTransaction({ transaction: txBytes, wallet: embeddedWallet!, chain: 'solana:mainnet' });
    return { signature: Buffer.from(result.signature).toString('base64') };
  };

  // Adapter: wraps Privy v3 useSignTransaction for sign-only (used by Jupiter Ultra API)
  const signTransactionOnly = async (transaction: VersionedTransaction): Promise<VersionedTransaction> => {
    const txBytes = transaction.serialize();
    const result = await signTransaction({ transaction: txBytes, wallet: embeddedWallet!, chain: 'solana:mainnet' });
    return VersionedTransaction.deserialize(result.signedTransaction);
  };
  const canTrade = authenticated && ready && !!walletAddress && !!embeddedWallet;

  const executeTrade = useCallback(
    async (request: TradeRequest): Promise<TradeResult> => {
      if (!canTrade || !walletAddress) {
        const failedResult: TradeResult = {
          success: false,
          error: "Wallet not connected or user not authenticated",
          isLive: authenticated,
        };
        setLastTradeResult(failedResult);
        return failedResult;
      }

      setIsExecuting(true);
      setError(null);
      
      const accessToken = await getAccessTokenAsync();
      const result = await tradingService.executeTrade(request, {
        walletAddress,
        isLiveMode: authenticated,
        signTransaction: signTransactionOnly,
        userId: userIdValue || undefined,
        accessToken: accessToken || undefined,
        sendTransaction
      });
      
      setLastTradeResult(result);

      
      if (!result.success && result.error) {
        setError(result.error);
      }

      setIsExecuting(false);
      return result;
    },
  [canTrade, walletAddress, authenticated, embeddedWallet, wallets, userIdValue, getAccessTokenAsync]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    executeTrade,
    isExecuting,
    canTrade,
    lastTradeResult,
    error,
    clearError,
  };
}
