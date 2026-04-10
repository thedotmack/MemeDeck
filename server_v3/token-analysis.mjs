import dotenv from 'dotenv'
import express from 'express'
import http from 'http'
import Redis from 'ioredis'
import _ from 'lodash'
import path from 'path'
import { fileURLToPath } from 'url'
import WebSocket, { WebSocketServer } from 'ws'
import { UpdateTrackerStore } from './shared/update-tracker.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../.env') })

// Configuration for image preloading
const NEXT_JS_API_URL = process.env.NEXT_JS_API_URL || 'http://localhost:3002'
const IMAGE_PRELOAD_TIMEOUT = parseInt(
  process.env.IMAGE_PRELOAD_TIMEOUT || '5000'
)
const IMAGE_PRELOAD_DELAY = parseInt(process.env.IMAGE_PRELOAD_DELAY || '100')
const TOKEN_CACHE_TTL_SECONDS = 365 * 24 * 60 * 60 // 1 year - prevent token data loss for returning users
const ACTIVITY_API_KEY = process.env.ACTIVITY_API_KEY || ''
const STALENESS_THRESHOLD_MS = 5000 // 5 seconds with no updates = activity is dying

class TokenAnalysisService {
  constructor (port = 3005) {
    this.port = port
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      db: 1, // Use database 1 for MemeDeck to avoid conflicts
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      keyPrefix: 'memedeck:' // Add prefix to avoid key conflicts
    })
    this.jupiterProxy = null
    this.activityClients = new Set()
    this.topTokens = []
    this.tokenData = new Map()
    this.currentSubscriptions = new Set()
    this.using1hFallback = false
    this.fallbackStartTime = null
    this.updateTrackers = new UpdateTrackerStore()
    this.updatesPerMinuteInterval = null

    // Add sorting strategy option
    this.sortingStrategy = 'grouped' // 'grouped' or 'flat'
    this.groupOrder = ['STRONG', 'RISING', 'WATCH', 'FLAT'] // Customizable group priority

    // Timestamps now stored directly in Redis
  }

  async preloadSingleImage (iconUrl, width, height) {
    if (!iconUrl) return

    const proxyUrl = `${NEXT_JS_API_URL}/api/image-proxy?url=${encodeURIComponent(
      iconUrl
    )}&width=${width}&height=${height}`

    try {
      const controller = new AbortController()
      const timeout = setTimeout(
        () => controller.abort(),
        IMAGE_PRELOAD_TIMEOUT
      )

      const response = await fetch(proxyUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'TokenAnalysisService/1.0'
        }
      })

      clearTimeout(timeout)

      if (response.ok) {
        // Don't store the buffer, just trigger the cache
        await response.arrayBuffer()
        console.log(`[Image Preload] Cached ${width}x${height} for ${iconUrl}`)
      } else {
        console.warn(
          `[Image Preload] Failed to cache ${width}x${height} for ${iconUrl}: ${response.status} - URL: ${proxyUrl}`
        )
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn(
          `[Image Preload] Timeout caching ${width}x${height} for ${iconUrl} - URL: ${proxyUrl}`
        )
      } else {
        console.error(
          `[Image Preload] Error caching ${width}x${height} for ${iconUrl}: ${error.message} - URL: ${proxyUrl}`
        )
      }
    }
  }

  async preloadTokenImages (tokenData) {
    if (!tokenData.icon) return

    const sizes = [
      { width: 256, height: 256 },
      { width: 512, height: 512 },
      { width: 800, height: 600 }
    ]

    for (const size of sizes) {
      await this.preloadSingleImage(tokenData.icon, size.width, size.height)
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  async start () {
    const app = express()
    const server = http.createServer(app)

    const wss = new WebSocketServer({
      server,
      path: '/activity',
      verifyClient: (info, callback) => {
        if (!ACTIVITY_API_KEY) {
          callback(true)
          return
        }
        const url = new URL(info.req.url, 'http://localhost')
        const clientKey = url.searchParams.get('apiKey')
        if (clientKey === ACTIVITY_API_KEY) {
          callback(true)
        } else {
          console.warn('[Auth] WebSocket connection rejected: invalid API key')
          callback(false, 401, 'Unauthorized')
        }
      }
    })

    wss.on('connection', ws => {
      this.activityClients.add(ws)

      if (this.topTokens.length > 0) {
        ws.send(
          JSON.stringify({
            type: 'update',
            data: this.topTokens,
            timestamp: Date.now()
          })
        )
      }

      ws.on('close', () => {
        this.activityClients.delete(ws)
      })
    })

    // CORS is now handled by Caddy

    app.get('/api/activity/top/:limit?', async (req, res) => {
      if (ACTIVITY_API_KEY) {
        const clientKey = req.query.apiKey || req.headers['x-api-key']
        if (clientKey !== ACTIVITY_API_KEY) {
          return res.status(401).json({ success: false, error: 'Unauthorized' })
        }
      }

      const limit = parseInt(req.params.limit) || 50
      const tokens = this.topTokens.slice(0, limit)

      // Ensure enhanced fields are present
      const updatedTokens = tokens.map(token => ({
        ...token,
        oneMinGain: token.oneMinGain || 0,
        twoMinGain: token.twoMinGain || 0,
        threeMinGain: token.threeMinGain || 0,
        fourMinGain: token.fourMinGain || 0,
        fiveMinGain: token.fiveMinGain || 0,
        signal: token.signal,
        updatesPerMinute: token.updatesPerMinute || 0,
        buyPressure5m: token.buyPressure5m || 0
      }))

      res.json({
        success: true,
        activeTokens: updatedTokens,
        type: 'update',
        data: updatedTokens,
        timestamp: Date.now()
      })
    })

    this.connectToJupiterTrenchStream()
    this.startAnalysis()

    server.listen(this.port, () => {
      console.log(`Token Analysis Service running on port ${this.port}`)
      console.log(`Activity WebSocket: wss://api.memedeck.win/activity`)
      console.log(`REST API: https://memedeck.win/api/activity/top/50`)
      console.log(`Auth: ${ACTIVITY_API_KEY ? 'enabled' : 'disabled (no ACTIVITY_API_KEY set)'}`)
    })
  }

  connectToJupiterTrenchStream () {
    this.jupiterProxy = new WebSocket('wss://trench-stream.jup.ag/ws')

    this.jupiterProxy.on('open', () => {
      this.fetchAndSubscribeTopTokens()
    })

    this.jupiterProxy.on('message', data => {
      try {
  let message
  try { message = JSON.parse(data.toString()) } catch { return }

        if (message.type === 'updates' && message.data) {
          const updatePromises = message.data
            .map(update => {
              if (update.type === 'update' && update.pool) {
                return this.updateTokenData(update.pool)
              }
            })
            .filter(Boolean)

          Promise.all(updatePromises).then(async () => {
            await this.updateTopTokens()
          })
        }
      } catch (e) {
        console.error('Error processing proxy message:', e)
      }
    })

    this.jupiterProxy.on('close', () => {
      setTimeout(() => this.connectToJupiterTrenchStream(), 1000)
    })
  }

  async fetchAndSubscribeTopTokens () {
    try {
      // Check if we should retry 5m endpoint after using 1h fallback
      if (
        this.using1hFallback &&
        this.fallbackStartTime &&
        Date.now() - this.fallbackStartTime > 5 * 60 * 1000
      ) {
        const test5mResponse = await fetch(
          'https://datapi.jup.ag/v1/pools/toptrending/5m'
        )
        const test5mData = await test5mResponse.json()
        if (test5mData.pools && test5mData.pools.length > 0) {
          this.using1hFallback = false
          this.fallbackStartTime = null
        }
      }

      // 1. Get top 50 from REST
      let endpoint = this.using1hFallback ? '1h' : '5m'
      const response = await fetch(
        `https://datapi.jup.ag/v1/pools/toptrending/${endpoint}`
      )
      const data = await response.json()

      let topPools = data.pools?.slice(0, 50) || []

      // If 5m returns empty, fallback to 1h
      if (!this.using1hFallback && topPools.length === 0) {
        const fallbackResponse = await fetch(
          'https://datapi.jup.ag/v1/pools/toptrending/1h'
        )
        const fallbackData = await fallbackResponse.json()
        topPools = fallbackData.pools?.slice(0, 50) || []
        if (topPools.length > 0) {
          this.using1hFallback = true
          this.fallbackStartTime = Date.now()
        }
      }
      const poolIds = topPools.map(pool => pool.id)

      // 2. Unsubscribe from old 50 (if connected)
      if (
        this.jupiterProxy?.readyState === WebSocket.OPEN &&
        this.currentSubscriptions.size > 0
      ) {
        const unsubscribeMessage = {
          type: 'unsubscribe:pool',
          pools: Array.from(this.currentSubscriptions)
        }
        console.log('UNSUBSCRIBE:', JSON.stringify(unsubscribeMessage))
        this.jupiterProxy.send(JSON.stringify(unsubscribeMessage))
      }

      // 3. Subscribe to new 50
      if (this.jupiterProxy?.readyState === WebSocket.OPEN) {
        const subscribeMessage = {
          type: 'subscribe:pool',
          pools: poolIds
        }
        console.log('SUBSCRIBE:', JSON.stringify(subscribeMessage))
        this.jupiterProxy.send(JSON.stringify(subscribeMessage))
        this.currentSubscriptions = new Set(poolIds)
      }

      // 4. Clear old token data and keep only current top 50
      const currentTokenIds = new Set(poolIds)
      const tokensToRemove = []

      for (const [tokenId, _] of this.tokenData.entries()) {
        if (!currentTokenIds.has(tokenId)) {
          tokensToRemove.push(tokenId)
        }
      }

      // Remove old tokens from memory
      tokensToRemove.forEach(tokenId => {
        this.tokenData.delete(tokenId)
        this.updateTrackers.delete(tokenId)
      })

      console.log(
        `Flushed ${tokensToRemove.length} old tokens, keeping ${currentTokenIds.size} active tokens`
      )

      // Process initial data from the API response
      const initialPromises = topPools.map(pool => this.updateTokenData(pool))

      await Promise.all(initialPromises)
      await this.updateTopTokens()
    } catch (error) {
      console.error('Error fetching top tokens:', error)
    }
  }

  getSignalFromUpdatesPerMinute (updatesPerMinute) {
    if (updatesPerMinute >= 45) {
      return 'STRONG'
    } else if (updatesPerMinute >= 30) {
      return 'RISING'
    } else if (updatesPerMinute >= 15) {
      return 'WATCH'
    } else {
      return 'FLAT'
    }
  }

  async updateTokenData (pool) {
    const tokenId = pool.baseAsset?.id
    if (!tokenId) return

    const now = Date.now()
    let existing = this.tokenData.get(tokenId)
    let isNewToken = false

    if (!existing) {
      existing = await this.loadTokenFromRedis(tokenId)
      if (!existing) {
        isNewToken = true
        existing = {
          priceHistory: [],
          updateCount: 0,
          firstSeen: now
        }
      }
    }

    const price = pool.baseAsset?.usdPrice || 0
    const updatesPerMinute = this.updateTrackers.record(tokenId, now)
    const stats5m = pool.baseAsset?.stats5m || {}
    let volume5m = existing.volume5m || 0
    if (typeof stats5m.volumeUsd === 'number') {
      volume5m = stats5m.volumeUsd
    } else {
      const buyVol = typeof stats5m.buyVolume === 'number' ? stats5m.buyVolume : 0
      const sellVol = typeof stats5m.sellVolume === 'number' ? stats5m.sellVolume : 0
      if (buyVol !== 0 || sellVol !== 0) {
        volume5m = buyVol + sellVol
      }
    }

    existing.priceHistory.push({ price, timestamp: now })
    existing.priceHistory = existing.priceHistory.filter(
      p => p.timestamp > now - 10 * 60 * 1000
    )
    existing.updateCount++

    const gains = this.calculateGains(existing.priceHistory)

    const buyPressure5m = pool.baseAsset?.stats5m
      ? (pool.baseAsset.stats5m.buyVolume || 0) -
        (pool.baseAsset.stats5m.sellVolume || 0)
      : existing.buyPressure5m || 0

    const signal = this.getSignalFromUpdatesPerMinute(updatesPerMinute)

    const totalMoves = gains.upMoves + gains.downMoves

    const updatedToken = {
      priceHistory: existing.priceHistory,
      updateCount: existing.updateCount,
      firstSeen: existing.firstSeen,
      updatesPerMinute,
      lastUpdateTime: now,
      winRate: totalMoves > 0 ? gains.upMoves / totalMoves : 0,
  volume5m,

      tokenId,
      symbol: pool.baseAsset?.symbol || existing.symbol || 'Unknown',
      name: pool.baseAsset?.name || existing.name || 'Unknown',
      price: price ?? existing.price,
      liquidity: pool.liquidity ?? existing.liquidity,
      volume24h: pool.volume24h ?? existing.volume24h,
      icon: pool.baseAsset?.icon || existing.icon,
      createdAt: pool.createdAt || existing.createdAt,

      ...gains,
      signal,
      buyPressure5m,
      tokenBeingAnalyzed: true
    }

    this.tokenData.set(tokenId, updatedToken)

    if (isNewToken && updatedToken.icon) {
      setTimeout(() => {
        this.preloadTokenImages(updatedToken).catch(error => {
          console.error(
            `[Image Preload] Failed to preload images for ${tokenId} (${updatedToken.icon}):`,
            error
          )
        })
      }, IMAGE_PRELOAD_DELAY)
    }

    await this.saveTokenToRedis(tokenId, updatedToken)
  }

  calculateGains (priceHistory) {
    if (priceHistory.length < 2) {
      return {
        oneMinGain: 0,
        twoMinGain: 0,
        threeMinGain: 0,
        fourMinGain: 0,
        fiveMinGain: 0,
        upMoves: 0,
        downMoves: 0
      }
    }

    const now = Date.now()
    const currentPrice = priceHistory[priceHistory.length - 1].price
    const oldestTimestamp = priceHistory[0].timestamp
    const dataAge = now - oldestTimestamp

    const getPriceAt = minutesAgo => {
      const targetTime = now - minutesAgo * 60 * 1000
      const closest = priceHistory.reduce((prev, curr) =>
        Math.abs(curr.timestamp - targetTime) <
        Math.abs(prev.timestamp - targetTime)
          ? curr
          : prev
      )
      return closest.price
    }

    let upMoves = 0,
      downMoves = 0
    for (let i = 1; i < priceHistory.length; i++) {
      if (priceHistory[i].price > priceHistory[i - 1].price) upMoves++
      else if (priceHistory[i].price < priceHistory[i - 1].price) downMoves++
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
    }
  }

  startAnalysis () {
    // Initial fetch
    this.fetchAndSubscribeTopTokens()

    // Then every 15 seconds
    setInterval(() => {
      this.fetchAndSubscribeTopTokens()
    }, 15000)

    this.startUpdatesPerMinuteTicker()
  }

  startUpdatesPerMinuteTicker () {
    if (this.updatesPerMinuteInterval) {
      clearInterval(this.updatesPerMinuteInterval)
    }

    this.updatesPerMinuteInterval = setInterval(() => {
      if (this.tokenData.size === 0) return

      this.updateTopTokens({ skipCleanup: true, forceBroadcast: false }).catch(
        error => {
          console.error('[Ticker] Failed to refresh updates per minute:', error)
        }
      )
    }, 1000)
  }

  async updateTopTokens ({ skipCleanup = false, forceBroadcast = true } = {}) {
    const tokens = Array.from(this.tokenData.values())
    const now = Date.now()

    let metricsChanged = false

    for (const token of tokens) {
      let updatesPerMinute = this.updateTrackers.getUpdatesPerMinute(
        token.tokenId
      )

      // Staleness decay: if no update received recently, aggressively reduce U/m
      // The sliding window alone takes up to 60s to drain — this catches death fast
      const timeSinceLastUpdate = now - (token.lastUpdateTime || 0)
      if (timeSinceLastUpdate > STALENESS_THRESHOLD_MS && updatesPerMinute > 0) {
        // Linear decay from full value to 0 over the next 10 seconds after threshold
        const decayProgress = Math.min(1, (timeSinceLastUpdate - STALENESS_THRESHOLD_MS) / 10000)
        updatesPerMinute = Math.round(updatesPerMinute * (1 - decayProgress))
      }

      if (token.updatesPerMinute !== updatesPerMinute) {
        metricsChanged = true
        token.updatesPerMinute = updatesPerMinute
      }

      const nextSignal = this.getSignalFromUpdatesPerMinute(updatesPerMinute)
      if (token.signal !== nextSignal) {
        metricsChanged = true
        token.signal = nextSignal
      }
    }

    // Choose sorting strategy
    let sortedTokens
    if (this.sortingStrategy === 'grouped') {
      sortedTokens = this.groupedSort(tokens)
    } else {
      sortedTokens = this.flatSort(tokens)
    }

    const nextTopTokens = sortedTokens.slice(0, 50)

    const orderChanged = !_.isEqual(
      this.topTokens.map(token => ({
        tokenId: token.tokenId,
        updatesPerMinute: token.updatesPerMinute,
        signal: token.signal
      })),
      nextTopTokens.map(token => ({
        tokenId: token.tokenId,
        updatesPerMinute: token.updatesPerMinute,
        signal: token.signal
      }))
    )

    this.topTokens = nextTopTokens

    // Cleanup: Reset tokenBeingAnalyzed flag for tokens no longer in top list
    if (!skipCleanup) {
      await this.cleanupNonTopTokens()
    }

    if (
      (metricsChanged || orderChanged || forceBroadcast) &&
      this.topTokens.length > 0
    ) {
      this.broadcastToClients({
        type: 'update',
        data: this.topTokens,
        timestamp: Date.now()
      })
    }
  }

  groupedSort(tokens) {
    // Filter out bad tokens first
    const { goodTokens, badTokens } = this.separateGoodBadTokens(tokens)
    
    // Group good tokens by signal
    const grouped = _.groupBy(goodTokens, 'signal')
    
    // Sort within each group and flatten in order
    const sortedGoodTokens = _.flatMap(this.groupOrder, signal => {
      const group = grouped[signal] || []
      return _.orderBy(
        group,
        [
          'updatesPerMinute',
          'oneMinGain',
          token => (token.buyPressure5m || 0) / (token.liquidity || 1) // buy pressure strength
        ],
        ['desc', 'desc', 'desc']
      )
    })

    // Sort bad tokens by least bad first
    const sortedBadTokens = _.orderBy(
      badTokens,
      [
        'updatesPerMinute',
        'oneMinGain',
        token => (token.buyPressure5m || 0) / (token.liquidity || 1) // buy pressure strength
      ],
      ['desc', 'desc', 'desc']
    )
    
    // Combine: all good tokens first (grouped), then bad tokens
    return [...sortedGoodTokens, ...sortedBadTokens]
  }

  flatSort(tokens) {
    // Your original sorting logic
    return tokens.sort((a, b) => {
      // Push down tokens with negative metrics or bad trend
      const aHasNegativePressure = (a.buyPressure5m || 0) <= 0
      const bHasNegativePressure = (b.buyPressure5m || 0) <= 0
      const aHasNegativeGain = (a.oneMinGain || 0) <= 0
      const bHasNegativeGain = (b.oneMinGain || 0) <= 0

      const aLongerGains = [a.twoMinGain, a.threeMinGain, a.fourMinGain, a.fiveMinGain].filter(g => g !== undefined && g !== null && g !== 0)
      const bLongerGains = [b.twoMinGain, b.threeMinGain, b.fourMinGain, b.fiveMinGain].filter(g => g !== undefined && g !== null && g !== 0)
      const aHasBadTrend = aLongerGains.length >= 2 && aLongerGains.filter(g => g < 0).length >= Math.ceil(aLongerGains.length / 2)
      const bHasBadTrend = bLongerGains.length >= 2 && bLongerGains.filter(g => g < 0).length >= Math.ceil(bLongerGains.length / 2)

      const aIsBad = aHasNegativePressure || aHasNegativeGain || aHasBadTrend
      const bIsBad = bHasNegativePressure || bHasNegativeGain || bHasBadTrend

      if (aIsBad && !bIsBad) return 1
      if (!aIsBad && bIsBad) return -1

      // Sort by updates per minute (Movement) - highest priority
      if ((a.updatesPerMinute || 0) !== (b.updatesPerMinute || 0)) {
        return (b.updatesPerMinute || 0) - (a.updatesPerMinute || 0)
      }

      // Then by 1 minute gain (Price performance)
      if ((a.oneMinGain || 0) !== (b.oneMinGain || 0)) {
        return (b.oneMinGain || 0) - (a.oneMinGain || 0)
      }

      // Finally by buy pressure strength (buyPressure / liquidity)
      const aBuyPressureStrength = (a.buyPressure5m || 0) / (a.liquidity || 1)
      const bBuyPressureStrength = (b.buyPressure5m || 0) / (b.liquidity || 1)
      return bBuyPressureStrength - aBuyPressureStrength
    })
  }

  separateGoodBadTokens(tokens) {
    const goodTokens = []
    const badTokens = []

    tokens.forEach(token => {
      const hasNegativePressure = (token.buyPressure5m || 0) <= 0
      const hasNegativeGain = (token.oneMinGain || 0) <= 0

      // Check broader trend: if majority of available timeframes are negative,
      // the token is dumping even if 1m is barely positive (dead cat bounce)
      const longerGains = [token.twoMinGain, token.threeMinGain, token.fourMinGain, token.fiveMinGain]
        .filter(g => g !== undefined && g !== null && g !== 0)
      const negativeCount = longerGains.filter(g => g < 0).length
      const hasBadTrend = longerGains.length >= 2 && negativeCount >= Math.ceil(longerGains.length / 2)

      const isBad = hasNegativePressure || hasNegativeGain || hasBadTrend

      if (isBad) {
        badTokens.push(token)
      } else {
        goodTokens.push(token)
      }
    })
    
    return { goodTokens, badTokens }
  }

  broadcastToClients (message) {
    const messageStr = JSON.stringify(message)
    this.activityClients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr)
      }
    })
  }

  async saveTokenToRedis (tokenId, tokenData) {
    try {
      const key = `token:${tokenId}`
      await this.redis.setex(key, TOKEN_CACHE_TTL_SECONDS, JSON.stringify(tokenData))
    } catch (error) {
      console.error(`Error saving token ${tokenId} to Redis:`, error)
    }
  }

  async cleanupNonTopTokens() {
    try {
      // Get current top token IDs
      const topTokenIds = new Set(this.topTokens.map(token => token.tokenId))
      
      // Find all token keys in Redis
      const tokenKeys = await this.redis.keys('token:*')
      
      // Check each token and reset flag if not in top list
      const cleanupPromises = tokenKeys.map(async (key) => {
        try {
          const tokenData = await this.redis.get(key)
          if (tokenData) {
            let parsed
            try { parsed = JSON.parse(tokenData) } catch { return }
            const tokenId = parsed.tokenId
            
            // If token is marked as being analyzed but not in current top list
            if (parsed.tokenBeingAnalyzed && !topTokenIds.has(tokenId)) {
              parsed.tokenBeingAnalyzed = false
              await this.redis.setex(key, TOKEN_CACHE_TTL_SECONDS, JSON.stringify(parsed))
              console.log(`[Cleanup] Reset tokenBeingAnalyzed flag for ${tokenId.slice(-8)}`)
            }
          }
        } catch (error) {
          console.error(`Error cleaning up token ${key}:`, error)
        }
      })
      
      await Promise.all(cleanupPromises)
    } catch (error) {
      console.error('Error in cleanupNonTopTokens:', error)
    }
  }

  async loadTokenFromRedis (tokenId) {
    try {
      const key = `token:${tokenId}`
      const data = await this.redis.get(key)
  if (!data) return null
  try { return JSON.parse(data) } catch { return null }
    } catch (error) {
      console.error(`Error loading token ${tokenId} from Redis:`, error)
      return null
    }
  }

  async loadAllTokensFromRedis () {
    try {
      const keys = await this.redis.keys('token:*')
      const pipeline = this.redis.pipeline()

      keys.forEach(key => pipeline.get(key))
      const results = await pipeline.exec()

      results.forEach((result, index) => {
        if (result[1]) {
          let tokenData
          try { tokenData = JSON.parse(result[1]) } catch { return }
          const tokenId = keys[index].replace('token:', '')
          this.tokenData.set(tokenId, tokenData)
        }
      })
    } catch (error) {
      console.error('Error loading tokens from Redis:', error)
    }
  }
}

const service = new TokenAnalysisService()
service.start()
