import {
  ESTIMATED_NETWORK_FEE_SOL,
  PAPER_TRADE_MAX_SLIPPAGE,
  PAPER_TRADE_PREFIX,
  USDC_MINT
} from '@/lib/config/trading-constants';
import { getSolPrice } from '@/lib/services/sol-price-service';
import { calculateTradeFees, type FeeCalculation } from '@/lib/utils/fee-calculator';
import { buildFeeTransaction } from '@/lib/utils/fee-transaction';
import { lamportsToUsdNumber, usdToLamportsBN } from '@/lib/utils/precision';
import { address } from '@solana/kit';
import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  type ParsedAccountData
} from '@solana/web3.js';
import BN from 'bn.js';
import {
  executeUltraOrder,
  getUltraOrder,
  isUltraApiEnabled
} from '../jupiter/api/jupiter-ultra';
import { getRpc, type SolanaRpc } from './solana-rpc';
import { walletBalanceService } from './wallet-balance-service';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export interface TradeRequest {
  tokenMint: string;
  tokenSymbol: string;
  side: 'buy' | 'sell';
  amountUsd: number;
  currentTokenPrice: number;
  tokenDecimals?: number;
  tokenQuantity?: number;
  costBasis?: number;
  referralCode?: string;
}

export interface TradeResult {
  success: boolean;
  transactionHash?: string;
  signature?: string;
  actualAmountUsd?: number;
  actualTokenAmount?: number;
  fees?: number;
  error?: string;
  isLive: boolean;
  realPnl?: number;
  realPnlPercent?: number;
  finalTokenPrice?: number;
  slippageApplied?: number;
  expectedAmountUsd?: number;
  orderResponse?: any;
  txResponse?: any;
  routePlan?: any;
  rawApiData?: any;
}

export interface TradeContext {
  walletAddress: string;
  isLiveMode: boolean;
  signTransaction: (transaction: VersionedTransaction) => Promise<VersionedTransaction>;
  userId?: string;
  accessToken?: string;
  hasPartner?: boolean;
  sendTransaction: (params: { transaction: any; connection: any; address: string }) => Promise<{ signature: string }>;
}

export class TradingService {
  private rpc: SolanaRpc;
  private connection: Connection;
  private mintDecimalsCache: Map<string, number>;

  constructor() {
    this.rpc = getRpc();
    const endpoint = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com';
    this.connection = new Connection(endpoint);
    this.mintDecimalsCache = new Map();
  }

  private getBaseMint(): string {
    return SOL_MINT;
  }

  getApiStatus(): { api: 'ultra' | 'jupiter'; enabled: boolean } {
    const ultraEnabled = isUltraApiEnabled();
    return {
      api: ultraEnabled ? 'ultra' : 'jupiter',
      enabled: ultraEnabled
    };
  }

  async executeTrade(request: TradeRequest, context: TradeContext): Promise<TradeResult> {
    if (context.isLiveMode) {
      return await this.executeLiveTrade(request, context);
    }
    return this.executePaperTrade(request);
  }

  private async executeLiveTrade(request: TradeRequest, context: TradeContext): Promise<TradeResult> {
    return this.executeUltraApiTrade(request, context);
  }

  private async executeUltraApiTrade(
    request: TradeRequest,
    context: TradeContext
  ): Promise<TradeResult> {
    const zero = new BN(0);
    const walletPublicKey = new PublicKey(context.walletAddress);
    const baseMint = this.getBaseMint();
    const hasPartner = context.hasPartner ?? false;

    const [solPrice, solBalanceLamportsRaw, sellBalanceLamports] = await Promise.all([
      getSolPrice(),
      this.connection.getBalance(walletPublicKey),
      request.side === 'sell'
        ? walletBalanceService.getTokenBalanceRaw(context.walletAddress, request.tokenMint)
        : Promise.resolve(new BN(0))
    ]);

    const solBalanceLamports = new BN(solBalanceLamportsRaw.toString());
    const grossSolLamports = usdToLamportsBN(request.amountUsd, solPrice);
    const tokenDecimals = await this.resolveTokenDecimals(request.tokenMint, request.tokenDecimals);

    let feeCalculation: FeeCalculation | null = null;
    let inputAmountLamports: BN;
    let tokensSoldLamports: BN | null = null;

    if (request.side === 'buy') {
      feeCalculation = calculateTradeFees(grossSolLamports, hasPartner);
      const netSolLamports = grossSolLamports.sub(feeCalculation.userPays);

      if (netSolLamports.lte(zero)) {
        return {
          success: false,
          error: 'Trade amount is too small after platform fees are applied.',
          isLive: true
        };
      }

      if (solBalanceLamports.lt(grossSolLamports)) {
        const requiredUsd = lamportsToUsdNumber(grossSolLamports, solPrice);
        return {
          success: false,
          error: `Insufficient SOL balance. Need at least $${requiredUsd.toFixed(2)} USD worth of SOL to cover trade and fees.`,
          isLive: true
        };
      }

      inputAmountLamports = netSolLamports;
    } else {
      const availableTokenLamports = sellBalanceLamports;

      if (availableTokenLamports.lte(zero)) {
        return {
          success: false,
          error: `No tokens found on-chain to sell. Balance: ${availableTokenLamports.toString()}`,
          isLive: true
        };
      }

      const desiredTokenLamports = this.determineSellAmountLamports(request, tokenDecimals);

      if (desiredTokenLamports.lte(zero)) {
        return {
          success: false,
          error: 'Invalid sell amount calculated from request.',
          isLive: true
        };
      }

      inputAmountLamports = availableTokenLamports.lt(desiredTokenLamports)
        ? availableTokenLamports
        : desiredTokenLamports;
      tokensSoldLamports = inputAmountLamports;

      const expectedUsd = this.tokenLamportsToUsd(inputAmountLamports, tokenDecimals, request.currentTokenPrice);

      if (expectedUsd <= 0) {
        return {
          success: false,
          error: 'Unable to price requested sell amount.',
          isLive: true
        };
      }

      const expectedSolValue = usdToLamportsBN(expectedUsd, solPrice);
      feeCalculation = calculateTradeFees(expectedSolValue, hasPartner);
    }

    const orderRequest = {
      inputMint: request.side === 'buy' ? baseMint : request.tokenMint,
      outputMint: request.side === 'buy' ? request.tokenMint : baseMint,
      amount: inputAmountLamports.toString(),
      taker: context.walletAddress
    };

    const orderResponse = await getUltraOrder(orderRequest);
    const balanceIssueMessage = "Balance Issue: You don't have enough available balance to successfully buy and sell a token. You need at least $5-ish to play.";

    const buildMissingTransactionResult = (failureDetails: string | null): TradeResult => ({
      success: false,
      error: balanceIssueMessage,
      isLive: true,
      orderResponse,
      txResponse: null,
      routePlan: orderResponse?.routePlan,
      rawApiData: {
        ...orderResponse,
        failureReason: 'ultra_order_missing_transaction',
        failureDetails
      }
    });

    if (!orderResponse?.transaction || typeof orderResponse.transaction !== 'string') {
      const failureDetails = typeof orderResponse?.error === 'string'
        ? orderResponse.error
        : orderResponse?.error?.message ?? orderResponse?.message ?? null;
      console.error('[TradingService] Ultra order response missing transaction data:', orderResponse);
      return buildMissingTransactionResult(failureDetails);
    }

    let signedTransactionBase64: string;
    try {
      const transactionBuffer = Buffer.from(orderResponse.transaction, 'base64');
      const jupiterTransaction = VersionedTransaction.deserialize(transactionBuffer);
      const signedJupiterTransaction = await context.signTransaction(jupiterTransaction);
      signedTransactionBase64 = Buffer.from(signedJupiterTransaction.serialize()).toString('base64');
    } catch (unknownError) {
      const failureDetails = (() => {
        if (
          typeof unknownError === 'object' &&
          unknownError !== null &&
          'message' in unknownError &&
          typeof (unknownError as { message?: unknown }).message === 'string'
        ) {
          return (unknownError as { message: string }).message;
        }
        return 'Failed to decode Jupiter transaction payload';
      })();
      console.error('[TradingService] Failed to decode Ultra transaction payload:', unknownError);
      return buildMissingTransactionResult(failureDetails);
    }

    const executionRequest = {
      signedTransaction: signedTransactionBase64,
      requestId: orderResponse.requestId
    };

    const executeResult = await executeUltraOrder(executionRequest);

    if (executeResult?.status === 'Failed' || (executeResult && executeResult.status !== 'Success')) {
      const tradeError = executeResult?.error || 'Jupiter trade execution failed';
      return {
        success: false,
        error: tradeError,
        isLive: true,
        orderResponse,
        txResponse: executeResult,
        routePlan: orderResponse.routePlan,
        rawApiData: {
          ...executeResult,
          requestId: orderResponse.requestId,
          swapType: orderResponse.swapType,
          priceImpactPct: orderResponse.priceImpactPct,
          slippageBps: orderResponse.slippageBps,
          failureReason: 'trade_execution_failure',
          failureDetails: tradeError
        }
      };
    }

    const actualInputLamports = executeResult.inputAmountResult
      ? this.toBN(executeResult.inputAmountResult)
      : inputAmountLamports;
    const actualOutputLamports = executeResult.outputAmountResult
      ? this.toBN(executeResult.outputAmountResult)
      : this.toBN(orderResponse.outAmount ?? '0');

    const tokenLamports = request.side === 'buy'
      ? actualOutputLamports
      : executeResult.inputAmountResult
        ? this.toBN(executeResult.inputAmountResult)
        : tokensSoldLamports ?? zero;
    const actualTokenAmount = this.bnToDecimalNumber(tokenLamports, tokenDecimals);

    const actualAmountUsd = request.side === 'buy'
      ? lamportsToUsdNumber(
          feeCalculation ? actualInputLamports.add(feeCalculation.userPays) : actualInputLamports,
          solPrice
        )
      : this.calculateActualUsdFromOutput(actualOutputLamports, baseMint, solPrice);

    const result: TradeResult = {
      success: true,
      transactionHash: executeResult.signature,
      signature: executeResult.signature,
      actualAmountUsd,
      actualTokenAmount,
      fees: feeCalculation ? feeCalculation.userPays.toNumber() / 1e9 : ESTIMATED_NETWORK_FEE_SOL,
      isLive: true,
      finalTokenPrice: request.currentTokenPrice,
      slippageApplied: orderResponse.slippageBps / 10000,
      orderResponse,
      txResponse: executeResult,
      routePlan: orderResponse.routePlan,
      rawApiData: {
        requestId: orderResponse.requestId,
        swapType: orderResponse.swapType,
        priceImpactPct: orderResponse.priceImpactPct,
        slippageBps: orderResponse.slippageBps,
        inputAmountResult: executeResult.inputAmountResult,
        outputAmountResult: executeResult.outputAmountResult
      }
    };

    void this.handlePostTradeSideEffects({
      request,
      context,
      orderRequest,
      orderResponse,
      executeResult,
      feeCalculation,
      solBalanceLamports
    });

    return result;
  }

  private async handlePostTradeSideEffects(params: {
    request: TradeRequest;
    context: TradeContext;
    orderRequest: any;
    orderResponse: any;
    executeResult: any;
    feeCalculation: FeeCalculation | null;
    solBalanceLamports: BN;
  }): Promise<void> {
    const {
      request,
      context,
      orderRequest,
      orderResponse,
      executeResult,
      feeCalculation,
      solBalanceLamports
    } = params;

    try {
      let transactionId: string | null = null;

      if (context.userId && context.isLiveMode && context.accessToken) {
        try {
          const createResponse = await fetch('/api/transactions/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${context.accessToken}`
            },
            body: JSON.stringify({
              walletAddress: context.walletAddress,
              transactionType: request.side === 'buy' ? 'buy' : 'sell',
              tokenMint: request.tokenMint,
              tokenSymbol: request.tokenSymbol,
              amountUsd: request.amountUsd,
              ultraOrderRequest: orderRequest,
              ultraOrderResponse: orderResponse,
              status: 'confirmed',
              finalTransactionHash: executeResult.signature,
              executionRequest: {
                signedTransaction: '[REDACTED]',
                requestId: orderResponse.requestId
              },
              executionResponse: executeResult,
              confirmedAt: new Date().toISOString(),
              metadata: {
                requestId: orderResponse.requestId,
                priceImpactPct: orderResponse.priceImpactPct,
                slippageBps: orderResponse.slippageBps,
                swapType: orderResponse.swapType,
                referralCode: request.referralCode
              }
            })
          });

          if (createResponse.ok) {
            const data = await createResponse.json();
            transactionId = data.transactionId ?? null;
          }
        } catch (error) {
          console.error('[TradingService] Background transaction logging failed:', error);
        }
      }

      if (!feeCalculation || feeCalculation.userPays.lte(new BN(0))) {
        return;
      }

      if (!context.isLiveMode || !context.signTransaction || !context.userId) {
        return;
      }

      if (solBalanceLamports.lte(feeCalculation.userPays)) {
        console.warn('[TradingService] Skipping fee transaction - insufficient SOL remaining to cover platform fee.');
        return;
      }

      try {
        const { partnerFeeWalletService } = await import('./partner-fee-wallet-service');
        const feeDestination = await partnerFeeWalletService.getPartnerFeeWallet();

        const feeTransaction = buildFeeTransaction({
          userWallet: context.walletAddress,
          destinationWallet: feeDestination,
          amountLamports: feeCalculation.userPays.toString()
        });

        const message = TransactionMessage.decompile(feeTransaction.message, {
          addressLookupTableAccounts: []
        });
        const { blockhash } = await this.connection.getLatestBlockhash();
        message.recentBlockhash = blockhash;
        const finalFeeTransaction = new VersionedTransaction(message.compileToV0Message());

        const receipt = await context.sendTransaction({
          transaction: finalFeeTransaction,
          connection: this.connection,
          address: context.walletAddress
        });

        if (context.accessToken && transactionId) {
          try {
            await fetch('/api/transactions/update-fee-receipt', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${context.accessToken}`
              },
              body: JSON.stringify({
                transactionId,
                feeReceipt: receipt.signature,
                feeTransactionId: receipt.signature,
                feeAmountLamports: feeCalculation.userPays.toString()
              })
            });
          } catch (error) {
            console.error('[TradingService] Fee receipt update failed:', error);
          }
        }
      } catch (error: any) {
        if (error?.name === 'TransactionExpiredTimeoutError' || error?.message?.includes('timeout')) {
          console.log('[TradingService] Fee transaction timeout (trade still successful)');
        } else {
          console.error('[TradingService] Fee transaction processing failed:', error);
        }
      }
    } catch (error) {
      console.error('[TradingService] Post-trade side effects failed:', error);
    }
  }

  private executePaperTrade(request: TradeRequest): TradeResult {
    const mockTransactionHash = `${PAPER_TRADE_PREFIX}${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 11)}`;
    const slippagePercent = Math.random() * PAPER_TRADE_MAX_SLIPPAGE;
    const actualAmountUsd = request.amountUsd * (1 - slippagePercent / 100);

    return {
      success: true,
      transactionHash: mockTransactionHash,
      actualAmountUsd,
      actualTokenAmount: actualAmountUsd / request.currentTokenPrice,
      fees: 0,
      isLive: false
    };
  }

  private calculateActualUsdFromOutput(
    outputAmount: string | number | BN,
    outputMint: string,
    currentSolPrice: number
  ): number {
    const lamports = this.toBN(outputAmount);

    if (outputMint === USDC_MINT) {
      return this.bnToDecimalNumber(lamports, 6);
    }

    if (outputMint === SOL_MINT) {
      const solAmount = this.bnToDecimalNumber(lamports, 9);
      return solAmount * currentSolPrice;
    }

    return this.bnToDecimalNumber(lamports, 6);
  }

  private async resolveTokenDecimals(tokenMint: string, provided?: number): Promise<number> {
    if (typeof provided === 'number' && Number.isFinite(provided)) {
      return provided;
    }

    const cached = this.mintDecimalsCache.get(tokenMint);
    if (cached !== undefined) {
      return cached;
    }

    const decimals = await this.fetchTokenDecimalsFromChain(tokenMint);
    this.mintDecimalsCache.set(tokenMint, decimals);
    return decimals;
  }

  private async fetchTokenDecimalsFromChain(tokenMint: string): Promise<number> {
    try {
      const accountInfo = await this.connection.getParsedAccountInfo(new PublicKey(tokenMint));
      const parsed = accountInfo.value?.data as ParsedAccountData | null;
      const decimals = parsed?.parsed?.info?.decimals;
      if (typeof decimals === 'number') {
        return decimals;
      }
    } catch (error) {
      console.error('[TradingService] Failed to fetch parsed token decimals:', error);
    }

    try {
      const mintAddress = address(tokenMint);
      const accountInfo = await this.rpc
        .getAccountInfo(mintAddress, { commitment: 'confirmed', encoding: 'base64' })
        .send();

      const data = accountInfo.value?.data;
      if (Array.isArray(data) && typeof data[0] === 'string') {
        const decoded = Buffer.from(data[0], 'base64');
        if (decoded.length > 44) {
          return decoded[44];
        }
      }
    } catch (error) {
      console.error('[TradingService] Fallback token decimals fetch failed:', error);
    }

    return 9;
  }

  private determineSellAmountLamports(request: TradeRequest, tokenDecimals: number): BN {
    if (typeof request.tokenQuantity === 'number') {
      const quantityLamports = this.convertTokenQuantityToLamports(request.tokenQuantity, tokenDecimals);
      if (quantityLamports.gt(new BN(0))) {
        return quantityLamports;
      }
    }

    if (request.amountUsd <= 0 || request.currentTokenPrice <= 0) {
      return new BN(0);
    }

    return this.convertUsdToTokenLamports(request.amountUsd, request.currentTokenPrice, tokenDecimals);
  }

  private convertUsdToTokenLamports(amountUsd: number, tokenPriceUsd: number, tokenDecimals: number): BN {
    if (amountUsd <= 0 || tokenPriceUsd <= 0) {
      return new BN(0);
    }

    const SCALE = 1_000_000_000;
    const usdScaled = new BN(Math.round(amountUsd * SCALE));
    const priceScaled = new BN(Math.round(tokenPriceUsd * SCALE));

    if (priceScaled.lte(new BN(0))) {
      return new BN(0);
    }

    const factor = new BN(10).pow(new BN(tokenDecimals));
    return usdScaled.mul(factor).div(priceScaled);
  }

  private convertTokenQuantityToLamports(quantity: number, tokenDecimals: number): BN {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return new BN(0);
    }

    const SCALE = 1_000_000_000;
    const quantityScaled = new BN(Math.round(quantity * SCALE));
    const factor = new BN(10).pow(new BN(tokenDecimals));
    return quantityScaled.mul(factor).div(new BN(SCALE));
  }

  private tokenLamportsToUsd(amountLamports: BN, tokenDecimals: number, tokenPriceUsd: number): number {
    if (tokenPriceUsd <= 0) {
      return 0;
    }

    const SCALE = 1_000_000_000;
    const priceScaled = new BN(Math.round(tokenPriceUsd * SCALE));
    const factor = new BN(10).pow(new BN(tokenDecimals));
    const usdScaled = amountLamports.mul(priceScaled).div(factor);
    return this.bnToDecimalNumber(usdScaled, 9);
  }

  private bnToDecimalNumber(amount: BN, decimals: number): number {
    if (amount.isZero()) {
      return 0;
    }

    const base = new BN(10).pow(new BN(decimals));
    const { div, mod } = amount.divmod(base);
    const fractional = mod.toString().padStart(decimals, '0').replace(/0+$/, '');
    const numericString = fractional.length > 0 ? `${div.toString()}.${fractional}` : div.toString();
    return Number(numericString);
  }

  private toBN(value: string | number | BN): BN {
    if (BN.isBN(value)) {
      return value as BN;
    }

    if (typeof value === 'string') {
      return new BN(value);
    }

    if (typeof value === 'number') {
      return new BN(Math.trunc(value));
    }

    return new BN(0);
  }
}

export const tradingService = new TradingService();

