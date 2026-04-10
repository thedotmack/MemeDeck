const JUPITER_BASE_URL = "https://jup.ag/tokens";
const GMGN_BASE_URL = "https://gmgn.ai/sol/token";

type GlobalWithEncoder = typeof globalThis & {
  encodeURIComponent?: (uriComponent: string) => string;
};

const globalEncoder = (globalThis as GlobalWithEncoder).encodeURIComponent;

function normalizeTokenAddress(tokenAddress?: string | null): string | null {
  if (typeof tokenAddress !== "string") {
    return null;
  }

  const trimmed = tokenAddress.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function encodeTokenAddress(value: string): string {
  if (typeof globalEncoder === "function") {
    return globalEncoder(value);
  }

  return value;
}

function getJupiterTokenUrl(tokenAddress?: string | null): string {
  const normalized = normalizeTokenAddress(tokenAddress);
  if (!normalized) {
    return JUPITER_BASE_URL;
  }

  return `${JUPITER_BASE_URL}/${encodeTokenAddress(normalized)}`;
}

function getGmgnTokenUrl(tokenAddress?: string | null): string {
  const normalized = normalizeTokenAddress(tokenAddress);
  if (!normalized) {
    return GMGN_BASE_URL;
  }

  return `${GMGN_BASE_URL}/${encodeTokenAddress(normalized)}`;
}

export function createTokenExternalLinks(tokenAddress?: string | null) {
  return {
    jupiter: getJupiterTokenUrl(tokenAddress),
    gmgn: getGmgnTokenUrl(tokenAddress),
  };
}
