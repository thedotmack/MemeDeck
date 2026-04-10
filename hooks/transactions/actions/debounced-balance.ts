import { triggerBalanceUpdates } from "./balance";

let balanceUpdateTimeout: NodeJS.Timeout | null = null;

export const debouncedBalanceUpdate = (
  walletAddress: string,
  updateFunction: (balance: number) => void,
  delay: number = 2000,
) => {
  if (balanceUpdateTimeout) {
    clearTimeout(balanceUpdateTimeout);
  }

  balanceUpdateTimeout = setTimeout(async () => {
    try {
      await triggerBalanceUpdates(walletAddress, updateFunction);
    } finally {
      balanceUpdateTimeout = null;
    }
  }, delay);
};
