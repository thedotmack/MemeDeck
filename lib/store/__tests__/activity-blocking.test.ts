import { beforeEach, describe, expect, it } from "vitest";

import type { ActivityToken } from "@/lib/jupiter/realtime/activity-websocket";
import { buyService } from "@/lib/jupiter/trading/buy-handler";
import { useStore } from "@/lib/store";

const BLOCK_STORAGE_KEY = "memedeck-blocked-hot-tokens";

type MutableLocalStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

describe("Activity blocking", () => {
  let memoryStorage: Record<string, string>;

  const createToken = (overrides: Partial<ActivityToken>): ActivityToken => ({
    tokenId: overrides.tokenId ?? "AAA",
    symbol: overrides.symbol ?? "AAA",
    name: overrides.name ?? "Token AAA",
    price: overrides.price ?? 1,
    icon: overrides.icon,
    liquidity: overrides.liquidity,
    volume24h: overrides.volume24h,
    createdAt: overrides.createdAt,
    oneMinGain: overrides.oneMinGain,
    twoMinGain: overrides.twoMinGain,
    threeMinGain: overrides.threeMinGain,
    fourMinGain: overrides.fourMinGain,
    fiveMinGain: overrides.fiveMinGain,
    updatesPerMinute: overrides.updatesPerMinute,
    signal: overrides.signal,
    buyPressure5m: overrides.buyPressure5m,
    winRate: overrides.winRate,
    tokenBeingAnalyzed: overrides.tokenBeingAnalyzed,
    firstSeen: overrides.firstSeen,
  });

  beforeEach(() => {
    memoryStorage = {};
    const localStorageMock: MutableLocalStorage = {
      getItem: (key) => (key in memoryStorage ? memoryStorage[key] : null),
      setItem: (key, value) => {
        memoryStorage[key] = value;
      },
      removeItem: (key) => {
        delete memoryStorage[key];
      },
      clear: () => {
        memoryStorage = {};
      },
    };
    (globalThis as any).localStorage = localStorageMock;

    useStore.setState((state) => {
      state.activity.tokens = [];
      state.activity.blockedTokens = [];
    });
  });

  it("toggles blocked tokens and persists", () => {
    const toggleBlockedToken = useStore.getState().toggleBlockedToken;

    toggleBlockedToken("AAA");
    expect(useStore.getState().activity.blockedTokens).toContain("AAA");
    expect(memoryStorage[BLOCK_STORAGE_KEY]).toContain("AAA");

    toggleBlockedToken("AAA");
    expect(useStore.getState().activity.blockedTokens).not.toContain("AAA");
    expect(memoryStorage[BLOCK_STORAGE_KEY]).toEqual("[]");
  });

  it("filters blocked tokens out of available tokens", () => {
    useStore.setState((state) => {
      state.activity.tokens = [
        createToken({ tokenId: "AAA", symbol: "AAA", name: "Token AAA" }),
        createToken({ tokenId: "BBB", symbol: "BBB", name: "Token BBB" }),
      ];
      state.activity.blockedTokens = ["AAA"];
    });

    const result = buyService.getAvailableTokens();
    expect(result.map((token) => token.tokenId)).toEqual(["BBB"]);
  });

  it("throws when all available tokens are blocked", () => {
    useStore.setState((state) => {
      state.activity.tokens = [createToken({ tokenId: "AAA", symbol: "AAA" })];
      state.activity.blockedTokens = ["AAA"];
    });

    expect(() => buyService.getAvailableTokens()).toThrow(/No tokens available/);
  });
});
