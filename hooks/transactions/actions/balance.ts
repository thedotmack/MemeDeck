import { walletBalanceService } from "@/lib/services/wallet-balance-service";

export const triggerBalanceUpdates = async (
  walletAddress: string,
  updateWalletBalanceFn?: (balance: number) => void,
) => {
  const tradingBalanceUSD =
    await walletBalanceService.getTradingBalanceUSD(walletAddress);

  if (updateWalletBalanceFn) {
    updateWalletBalanceFn(tradingBalanceUSD);
  }
};
