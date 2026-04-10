// Shared token processing utilities - extracted from token-analysis.mjs
// This ensures exact same logic is used across TokenAnalysisService and jupiter-proxy

import { UpdateTrackerStore } from './update-tracker.mjs';

export class TokenMetricsCalculator {
  constructor(redis) {
    this.redis = redis;
    // In-memory price history for real-time calculations
    this.priceHistory = new Map(); // tokenId -> array of {price, timestamp}
    this.updateTrackers = new UpdateTrackerStore();
  }

  /**
   * Add price point and update Redis timestamps (exact same as token-analysis.mjs:324-330)
   */
  async addPricePoint(tokenId, price, timestamp = Date.now()) {
    // Add to in-memory history
    if (!this.priceHistory.has(tokenId)) {
      this.priceHistory.set(tokenId, []);
    }
    
    const history = this.priceHistory.get(tokenId);
    history.push({ price, timestamp });
    
    // Keep only last 10 minutes of data (same as token-analysis.mjs:347-349)
    const cutoff = timestamp - (10 * 60 * 1000);
    this.priceHistory.set(tokenId, history.filter(p => p.timestamp > cutoff));

    // Record timestamp in sliding window tracker
    this.updateTrackers.record(tokenId, timestamp);
  }

  /**
   * Calculate percentage gains (exact same as token-analysis.mjs:400-461)
   */
  calculateGains(priceHistory) {
    if (priceHistory.length < 2) {
      return {
        oneMinGain: 0,
        twoMinGain: 0,
        threeMinGain: 0,
        fourMinGain: 0,
        fiveMinGain: 0,
        upMoves: 0,
        downMoves: 0
      };
    }

    const now = Date.now();
    const currentPrice = priceHistory[priceHistory.length - 1].price;
    const oldestTimestamp = priceHistory[0].timestamp;
    const dataAge = now - oldestTimestamp;

    const getPriceAt = minutesAgo => {
      const targetTime = now - minutesAgo * 60 * 1000;
      const closest = priceHistory.reduce((prev, curr) =>
        Math.abs(curr.timestamp - targetTime) <
        Math.abs(prev.timestamp - targetTime)
          ? curr
          : prev
      );
      return closest.price;
    };

    let upMoves = 0,
      downMoves = 0;
    for (let i = 1; i < priceHistory.length; i++) {
      if (priceHistory[i].price > priceHistory[i - 1].price) upMoves++;
      else if (priceHistory[i].price < priceHistory[i - 1].price) downMoves++;
    }

    return {
      oneMinGain:
        dataAge >= 60 * 1000
          ? ((currentPrice - getPriceAt(1)) / getPriceAt(1)) * 100
          : ((currentPrice - priceHistory[0].price) / priceHistory[0].price) *
            100,
      twoMinGain:
        dataAge >= 2 * 60 * 1000
          ? ((currentPrice - getPriceAt(2)) / getPriceAt(2)) * 100
          : undefined,
      threeMinGain:
        dataAge >= 3 * 60 * 1000
          ? ((currentPrice - getPriceAt(3)) / getPriceAt(3)) * 100
          : undefined,
      fourMinGain:
        dataAge >= 4 * 60 * 1000
          ? ((currentPrice - getPriceAt(4)) / getPriceAt(4)) * 100
          : undefined,
      fiveMinGain:
        dataAge >= 5 * 60 * 1000
          ? ((currentPrice - getPriceAt(5)) / getPriceAt(5)) * 100
          : undefined,
      upMoves,
      downMoves
    };
  }

  /**
   * Get signal from updates per minute (exact same as token-analysis.mjs:303-313)
   */
  getSignalFromUpdatesPerMinute(updatesPerMinute) {
    if (updatesPerMinute >= 45) {
      return 'STRONG';
    } else if (updatesPerMinute >= 30) {
      return 'RISING';
    } else if (updatesPerMinute >= 15) {
      return 'WATCH';
    } else {
      return 'FLAT';
    }
  }

  /**
   * Get current updates per minute from Redis (exact same as token-analysis.mjs:353-354)
   */
  async getUpdatesPerMinute(tokenId) {
    return this.updateTrackers.getUpdatesPerMinute(tokenId);
  }

  /**
   * Calculate buy pressure from pool data (exact same as token-analysis.mjs:356-359)
   */
  calculateBuyPressure5m(pool, existingBuyPressure = 0) {
    return pool.baseAsset?.stats5m
      ? (pool.baseAsset.stats5m.buyVolume || 0) -
        (pool.baseAsset.stats5m.sellVolume || 0)
      : existingBuyPressure;
  }

  /**
   * Process a token update with all metrics (combines logic from token-analysis.mjs:315-398)
   */
  async processTokenUpdate(tokenId, pool, existingToken = null) {
    const now = Date.now();
    const price = pool.baseAsset?.usdPrice || 0;

    // Get or create token data
    let tokenData = existingToken || {
      priceHistory: [],
      updateCount: 0,
      firstSeen: now
    };

  // Add price point and record timestamp
  await this.addPricePoint(tokenId, price, now);

    // Update in-memory price history 
    const history = this.priceHistory.get(tokenId) || [];
    tokenData.priceHistory = history;
    tokenData.updateCount++;

    // Calculate gains using current price history
    const gains = this.calculateGains(history);
    
    // Get updates per minute from Redis
    const updatesPerMinute = await this.getUpdatesPerMinute(tokenId);
  const stats5m = pool.baseAsset?.stats5m || {};
  let volume5m = tokenData.volume5m || 0;
    if (typeof stats5m.volumeUsd === 'number') {
      volume5m = stats5m.volumeUsd;
    } else {
      const buyVol = typeof stats5m.buyVolume === 'number' ? stats5m.buyVolume : 0;
      const sellVol = typeof stats5m.sellVolume === 'number' ? stats5m.sellVolume : 0;
      if (buyVol !== 0 || sellVol !== 0) {
        volume5m = buyVol + sellVol;
      }
    }
    
    // Calculate buy pressure
  const buyPressure5m = this.calculateBuyPressure5m(pool, tokenData.buyPressure5m);
  tokenData.volume5m = volume5m;
  tokenData.buyPressure5m = buyPressure5m;
    
    // Generate signal
    const signal = this.getSignalFromUpdatesPerMinute(updatesPerMinute);
    const totalMoves = gains.upMoves + gains.downMoves;

    // Return complete enhanced token data
    return {
      priceHistory: tokenData.priceHistory,
      updateCount: tokenData.updateCount,
      firstSeen: tokenData.firstSeen,
      updatesPerMinute,
      winRate: totalMoves > 0 ? gains.upMoves / totalMoves : 0,
      volume5m,

      tokenId,
      symbol: pool.baseAsset?.symbol || tokenData.symbol || 'Unknown',
      name: pool.baseAsset?.name || tokenData.name || 'Unknown',
      price: price || tokenData.price,
      liquidity: pool.liquidity ?? tokenData.liquidity,
      volume24h: pool.volume24h ?? tokenData.volume24h,
      icon: pool.baseAsset?.icon || tokenData.icon,
      createdAt: pool.createdAt || tokenData.createdAt,

      ...gains,
      signal,
      buyPressure5m
    };
  }
}

/**
 * Transform Jupiter search API response to standard token format
 */
export function transformSearchDataToStandard(searchData) {
  return {
    symbol: searchData.symbol,
    name: searchData.name,
    price: searchData.usdPrice,
    liquidity: searchData.liquidity,
    volume24h: (searchData.stats24h?.buyVolume || 0) + (searchData.stats24h?.sellVolume || 0),
    fdv: searchData.fdv,
    holderCount: searchData.holderCount,
    organicScore: searchData.organicScore,
    stats24h: searchData.stats24h,
    icon: searchData.icon,
    createdAt: searchData.firstPool?.createdAt,
    // Percentage gains will be calculated by TokenMetricsCalculator
    oneMinGain: 0,
    twoMinGain: 0,
    threeMinGain: 0,
    fourMinGain: 0,
    fiveMinGain: 0,
    signal: 'FLAT',
    updatesPerMinute: 0,
    buyPressure5m: 0,
    upMoves: 0,
    downMoves: 0,
    winRate: 0
  };
}

/**
 * Dead token detection algorithm based on API analysis
 */
export function isDeadToken(tokenData) {
  const criteria = [
    tokenData.organicScore === 0,
    (tokenData.liquidity || 0) < 5000,
    (tokenData.holderCount || 0) < 50,
    tokenData.stats24h?.volumeChange === -100,
    (tokenData.fdv || 0) < 10000
  ];
  
  // Token is dead if it meets 3+ criteria
  return criteria.filter(Boolean).length >= 3;
}

export function categorizeDead(tokenData) {
  if (tokenData.organicScore === 0 && 
      (tokenData.liquidity || 0) < 1000 && 
      tokenData.stats24h?.volumeChange === -100) {
    return 'completely-dead';
  }
  
  if (isDeadToken(tokenData)) {
    return 'low-activity';
  }
  
  return 'active';
}