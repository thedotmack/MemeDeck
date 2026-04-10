import WebSocket from 'ws';
import { WebSocketServer } from 'ws';
import http from 'http';
import Redis from 'ioredis';
import { TokenMetricsCalculator, transformSearchDataToStandard } from './shared/token-utils.mjs';

class JupiterProxy {
  constructor(port = 3004) {
    this.port = port;
    this.jupiterWs = null;
    this.clients = new Map();
    this.subscriptions = new Set();
    this.broadcastInterval = null;
    this.lastSentData = new Map(); // tokenId -> last sent data for change detection
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      db: 1, // Use database 1 for MemeDeck to avoid conflicts
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      keyPrefix: 'memedeck:' // Add prefix to avoid key conflicts
    });
    
    // Add metrics calculator for subscription enhancements
    this.metricsCalculator = new TokenMetricsCalculator(this.redis);
    this.enhancedTokens = new Set(); // Track tokens we've enhanced from search API
  }

  hasDataChanged(tokenId, newData) {
    const lastData = this.lastSentData.get(tokenId);
    
    if (!lastData) return true; // First time, always send
    
    // Check if key values changed
    return (
      lastData.usdPrice !== newData.usdPrice ||
      lastData.oneMinGain !== newData.oneMinGain ||
      lastData.twoMinGain !== newData.twoMinGain ||
      lastData.threeMinGain !== newData.threeMinGain ||
      lastData.fourMinGain !== newData.fourMinGain ||
      lastData.fiveMinGain !== newData.fiveMinGain ||
      lastData.signal !== newData.signal ||
      lastData.updatesPerMinute !== newData.updatesPerMinute ||
      lastData.buyPressure5m !== newData.buyPressure5m
    );
  }

  updateLastSentData(tokenId, data) {
    this.lastSentData.set(tokenId, {
      usdPrice: data.usdPrice,
      oneMinGain: data.oneMinGain,
      twoMinGain: data.twoMinGain,
      threeMinGain: data.threeMinGain,
      fourMinGain: data.fourMinGain,
      fiveMinGain: data.fiveMinGain,
      signal: data.signal,
      updatesPerMinute: data.updatesPerMinute,
      buyPressure5m: data.buyPressure5m
    });
  }

  async enrichMessage(update) {
    if (!update.pool?.baseAsset?.id) return update;
    
    const tokenId = update.pool.baseAsset.id;
    const enhancedData = await this.getEnhancedTokenData(tokenId);
    
    if (!enhancedData) return update;
    
    return {
      ...update,
      pool: {
        ...update.pool,
        baseAsset: {
          ...update.pool.baseAsset,
          symbol: enhancedData.symbol || update.pool.baseAsset.symbol || 'Unknown',
          name: enhancedData.name || update.pool.baseAsset.name || 'Unknown',
          usdPrice: enhancedData.price || update.pool.baseAsset.usdPrice,
          firstSeen: enhancedData.firstSeen,
          createdAt: enhancedData.createdAt,
          oneMinGain: enhancedData.oneMinGain,
          twoMinGain: enhancedData.twoMinGain,
          threeMinGain: enhancedData.threeMinGain,
          fourMinGain: enhancedData.fourMinGain,
          fiveMinGain: enhancedData.fiveMinGain,
          signal: enhancedData.signal,
          recentPerformance: enhancedData.recentPerformance,
          upMoves: enhancedData.upMoves,
          downMoves: enhancedData.downMoves,
          winRate: enhancedData.winRate,
          updatesPerMinute: enhancedData.updatesPerMinute,
          buyPressure5m: enhancedData.buyPressure5m,
          icon: enhancedData.icon || update.pool.baseAsset.icon,
          originalIcon: enhancedData.originalIcon
        },
        liquidity: enhancedData.liquidity || update.pool.liquidity,
        volume24h: enhancedData.volume24h || update.pool.volume24h
      }
    };
  }

  async sendInitialData(ws, clientId) {
    try {
      if (ws.readyState !== WebSocket.OPEN) return;
      
      const client = this.clients.get(clientId);
      if (!client || client.subscriptions.size === 0) return;
      
      console.log(`[Initial Data] Sending data for ${client.subscriptions.size} subscribed tokens to client ${clientId}`);
      
      const initialUpdates = [];
      
      for (const tokenId of client.subscriptions) {
        const enhancedData = await this.getEnhancedTokenData(tokenId);
        if (enhancedData) {
          const enrichedUpdate = {
            type: 'update',
            pool: {
              id: tokenId,
              baseAsset: {
                id: tokenId,
                symbol: enhancedData.symbol || 'Unknown',
                name: enhancedData.name || 'Unknown',
                usdPrice: enhancedData.price,
                firstSeen: enhancedData.firstSeen,
                createdAt: enhancedData.createdAt,
                oneMinGain: enhancedData.oneMinGain,
                twoMinGain: enhancedData.twoMinGain,
                threeMinGain: enhancedData.threeMinGain,
                fourMinGain: enhancedData.fourMinGain,
                fiveMinGain: enhancedData.fiveMinGain,
                signal: enhancedData.signal,
                recentPerformance: enhancedData.recentPerformance,
                upMoves: enhancedData.upMoves,
                downMoves: enhancedData.downMoves,
                winRate: enhancedData.winRate,
                updatesPerMinute: enhancedData.updatesPerMinute,
                buyPressure5m: enhancedData.buyPressure5m,
                icon: enhancedData.icon,
                originalIcon: enhancedData.originalIcon
              },
              liquidity: enhancedData.liquidity,
              volume24h: enhancedData.volume24h
            }
          };
          
          initialUpdates.push(enrichedUpdate);
          
          // Store as last sent to avoid immediate re-sending
          this.updateLastSentData(tokenId, {
            usdPrice: enhancedData.price,
            oneMinGain: enhancedData.oneMinGain,
            twoMinGain: enhancedData.twoMinGain,
            threeMinGain: enhancedData.threeMinGain,
            fourMinGain: enhancedData.fourMinGain,
            fiveMinGain: enhancedData.fiveMinGain,
            signal: enhancedData.signal,
            updatesPerMinute: enhancedData.updatesPerMinute,
            buyPressure5m: enhancedData.buyPressure5m
          });
        }
      }
      
      if (initialUpdates.length > 0) {
        const message = {
          type: 'updates',
          data: initialUpdates
        };
        
        ws.send(JSON.stringify(message));
        console.log(`[Initial Data] Sent ${initialUpdates.length} token updates to client ${clientId}`);
      }
      
    } catch (error) {
      console.error(`[Initial Data] Error sending initial data to client ${clientId}:`, error);
    }
  }

  async broadcastEnhancedData() {
    try {
      if (this.subscriptions.size === 0) return;
      
      // Get all subscribed tokens for all clients
      const allTokens = new Set();
      this.clients.forEach(({ subscriptions }) => {
        subscriptions.forEach(token => allTokens.add(token));
      });
      
      if (allTokens.size === 0) return;
      
      // Create enriched updates for all tokens and check for changes
      const changedUpdates = [];
      for (const tokenId of allTokens) {
        const enhancedData = await this.getEnhancedTokenData(tokenId);
        if (enhancedData) {
          const newData = {
            usdPrice: enhancedData.price,
            oneMinGain: enhancedData.oneMinGain,
            twoMinGain: enhancedData.twoMinGain,
            threeMinGain: enhancedData.threeMinGain,
            fourMinGain: enhancedData.fourMinGain,
            fiveMinGain: enhancedData.fiveMinGain,
            signal: enhancedData.signal,
            updatesPerMinute: enhancedData.updatesPerMinute,
            buyPressure5m: enhancedData.buyPressure5m
          };
          
          if (this.hasDataChanged(tokenId, newData)) {
            const enrichedUpdate = {
              type: 'update',
              pool: {
                id: tokenId,
                baseAsset: {
                  id: tokenId,
                  symbol: enhancedData.symbol || 'Unknown',
                  name: enhancedData.name || 'Unknown',
                  usdPrice: enhancedData.price,
                  firstSeen: enhancedData.firstSeen,
                  createdAt: enhancedData.createdAt,
                  oneMinGain: enhancedData.oneMinGain,
                  twoMinGain: enhancedData.twoMinGain,
                  threeMinGain: enhancedData.threeMinGain,
                  fourMinGain: enhancedData.fourMinGain,
                  fiveMinGain: enhancedData.fiveMinGain,
                  signal: enhancedData.signal,
                  recentPerformance: enhancedData.recentPerformance,
                  upMoves: enhancedData.upMoves,
                  downMoves: enhancedData.downMoves,
                  winRate: enhancedData.winRate,
                  updatesPerMinute: enhancedData.updatesPerMinute,
                  buyPressure5m: enhancedData.buyPressure5m,
                  icon: enhancedData.icon,
                  originalIcon: enhancedData.originalIcon
                },
                liquidity: enhancedData.liquidity,
                volume24h: enhancedData.volume24h
              }
            };
            
            changedUpdates.push(enrichedUpdate);
            this.updateLastSentData(tokenId, newData);
          }
        }
      }
      
      // Only broadcast if there are actual changes
      if (changedUpdates.length > 0) {
        this.clients.forEach(({ ws, subscriptions }) => {
          if (ws.readyState === WebSocket.OPEN) {
            // Filter updates to only include tokens this client is subscribed to
            const clientUpdates = changedUpdates.filter(update => 
              subscriptions.has(update.pool.id)
            );
            
            if (clientUpdates.length > 0) {
              const message = {
                type: 'updates',
                data: clientUpdates
              };
              ws.send(JSON.stringify(message));
            }
          }
        });
      }
    } catch (error) {
      console.error('Error broadcasting enhanced data:', error);
    }
  }

  async getEnhancedTokenData(tokenId) {
    try {
      const key = `token:${tokenId}`;
      const tokenData = await this.redis.get(key);
      
      if (!tokenData) {
        return null;
      }
      
      return JSON.parse(tokenData);
    } catch (error) {
      console.error(`Error fetching enhanced data for ${tokenId}:`, error);
      return null;
    }
  }

  async refreshTokenFromSearch(tokenId) {
    try {
      // Check if token is already being analyzed by token-analysis service
      const existingData = await this.getEnhancedTokenData(tokenId);
      if (existingData && existingData.tokenBeingAnalyzed) {
        console.log(`[Enhancement] ⏭️ Skipping ${tokenId.slice(-8)} - already enhanced by token-analysis`);
        return;
      }

      console.log(`[Enhancement] Refreshing ${tokenId} from search API`);
      
      // Fetch from Jupiter search API
      const response = await fetch(`https://lite-api.jup.ag/ultra/v1/search?query=${tokenId}`);
      
      if (!response.ok) {
        console.error(`[Enhancement] API returned ${response.status}: ${response.statusText}`);
        return;
      }
      
      const responseText = await response.text();
      let searchResults;
      
      try {
        searchResults = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`[Enhancement] Invalid JSON response: ${responseText.slice(0, 100)}...`);
        return;
      }
      
      if (searchResults.length > 0) {
        const searchData = searchResults[0];
        
        // Transform to standard format
        const baseTokenData = transformSearchDataToStandard(searchData);
        
        // Get existing token data for price history
        const existingData = await this.getEnhancedTokenData(tokenId);
        
        // Create a mock pool object for the metrics calculator
        const mockPool = {
          baseAsset: {
            id: tokenId,
            symbol: baseTokenData.symbol,
            name: baseTokenData.name,
            usdPrice: baseTokenData.price,
            icon: baseTokenData.icon,
            stats5m: searchData.stats5m
          },
          liquidity: baseTokenData.liquidity,
          volume24h: baseTokenData.volume24h,
          createdAt: baseTokenData.createdAt
        };
        
        // Process with metrics calculator to get percentage changes and signals
        const enhancedTokenData = await this.metricsCalculator.processTokenUpdate(
          tokenId, 
          mockPool, 
          existingData
        );
        
        // Save to Redis with 1-year TTL (same as token-analysis.mjs)
        const key = `token:${tokenId}`;
        await this.redis.setex(key, 365 * 24 * 60 * 60, JSON.stringify(enhancedTokenData));
        
        this.enhancedTokens.add(tokenId);
        console.log(`[Enhancement] ✅ Enhanced ${enhancedTokenData.symbol || tokenId.slice(-8)} - signal: ${enhancedTokenData.signal}, ${enhancedTokenData.updatesPerMinute} upm`);
        
      } else {
        console.log(`[Enhancement] ⚠️ No search results for ${tokenId.slice(-8)}`);
      }
      
    } catch (error) {
      console.error(`[Enhancement] ❌ Failed to refresh ${tokenId.slice(-8)}:`, error.message);
    }
  }

  async sendCurrentTokenStates(ws, tokenIds) {
    try {
      const updates = [];
      
      for (const tokenId of tokenIds) {
        const enhancedData = await this.getEnhancedTokenData(tokenId);
        if (enhancedData) {
          const enrichedUpdate = {
            type: 'update',
            pool: {
              id: tokenId,
              baseAsset: {
                id: tokenId,
                symbol: enhancedData.symbol || 'Unknown',
                name: enhancedData.name || 'Unknown',
                usdPrice: enhancedData.price,
                firstSeen: enhancedData.firstSeen,
                createdAt: enhancedData.createdAt,
                oneMinGain: enhancedData.oneMinGain,
                twoMinGain: enhancedData.twoMinGain,
                threeMinGain: enhancedData.threeMinGain,
                fourMinGain: enhancedData.fourMinGain,
                fiveMinGain: enhancedData.fiveMinGain,
                signal: enhancedData.signal,
                recentPerformance: enhancedData.recentPerformance,
                upMoves: enhancedData.upMoves,
                downMoves: enhancedData.downMoves,
                winRate: enhancedData.winRate,
                updatesPerMinute: enhancedData.updatesPerMinute,
                buyPressure5m: enhancedData.buyPressure5m,
                icon: enhancedData.icon,
                originalIcon: enhancedData.originalIcon
              },
              liquidity: enhancedData.liquidity,
              volume24h: enhancedData.volume24h
            }
          };
          
          updates.push(enrichedUpdate);
        }
      }
      
      if (updates.length > 0 && ws.readyState === WebSocket.OPEN) {
        const message = {
          type: 'updates',
          data: updates
        };
        ws.send(JSON.stringify(message));
      }
    } catch (error) {
      console.error('Error sending current token states:', error);
    }
  }

  async handleMetadataRequest(res, url) {
    try {
      const tokensParam = url.searchParams.get('tokens');
      
      if (!tokensParam) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Missing tokens parameter. Use ?tokens=mint1,mint2,mint3' 
        }));
        return;
      }
      
      const tokenMints = tokensParam.split(',').map(t => t.trim()).filter(Boolean);
      
      if (tokenMints.length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'No valid token mints provided' 
        }));
        return;
      }
      
      console.log(`[Metadata API] Fetching metadata for ${tokenMints.length} tokens:`, tokenMints.map(t => t.slice(-8)));
      
      const metadataResults = {};
      
      // Process tokens in batches for better performance
      for (const tokenMint of tokenMints) {
        let tokenData = await this.getEnhancedTokenData(tokenMint);
        
        // If not in cache, try to refresh from Jupiter search
        if (!tokenData) {
          console.log(`[Metadata API] Token ${tokenMint.slice(-8)} not in cache, refreshing from Jupiter...`);
          await this.refreshTokenFromSearch(tokenMint);
          tokenData = await this.getEnhancedTokenData(tokenMint);
        }
        
        if (tokenData) {
          metadataResults[tokenMint] = {
            tokenId: tokenMint,
            symbol: tokenData.symbol || 'Unknown',
            name: tokenData.name || 'Unknown',
            icon: tokenData.icon || null,
            price: tokenData.price || 0,
            priceChange24h: tokenData.oneMinGain || 0,
            volume24h: tokenData.volume24h || 0,
            liquidity: tokenData.liquidity || 0,
            signal: tokenData.signal || 'FLAT',
            updatesPerMinute: tokenData.updatesPerMinute || 0
          };
        } else {
          // Fallback for unknown tokens - use reasonable defaults instead of truncated mint
          console.log(`[Metadata API] No data found for ${tokenMint.slice(-8)}, using fallback`);
          metadataResults[tokenMint] = {
            tokenId: tokenMint,
            symbol: 'Unknown',
            name: 'Unknown Token',
            icon: '/digital-token.webp',
            price: 0,
            priceChange24h: 0,
            volume24h: 0,
            liquidity: 0,
            signal: 'FLAT',
            updatesPerMinute: 0
          };
        }
      }
      
      console.log(`[Metadata API] Successfully fetched metadata for ${Object.keys(metadataResults).length} tokens`);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: metadataResults,
        timestamp: Date.now()
      }));
      
    } catch (error) {
      console.error('[Metadata API] Error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Internal server error fetching token metadata'
      }));
    }
  }

  start() {
    const server = http.createServer(async (req, res) => {
      // Enable CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }
      
      // Parse URL and handle API routes
      const url = new URL(req.url, `http://localhost:${this.port}`);
      
      if (url.pathname === '/api/jupiter-proxy/metadata' && req.method === 'GET') {
        await this.handleMetadataRequest(res, url);
      } else {
        // Default 404 for unknown routes
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });
    
    const wss = new WebSocketServer({ 
      server,
      path: '/jupiter'
    });

    wss.on('connection', (ws) => {
      const clientId = Date.now().toString();
      this.clients.set(clientId, { ws, subscriptions: new Set() });

      ws.on('message', async (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'subscribe:pool' && msg.pools) {
            // Enhance subscribed tokens with search data (always refresh)
            for (const tokenId of msg.pools) {
              await this.refreshTokenFromSearch(tokenId);
            }
            
            // Clear old subscriptions for this client
            this.clients.get(clientId).subscriptions.clear();
            
            // Add new subscriptions
            msg.pools.forEach(pool => {
              this.clients.get(clientId).subscriptions.add(pool);
            });
            
            // Send current state of subscribed tokens immediately
            await this.sendCurrentTokenStates(ws, msg.pools);
            
            // Rebuild global subscriptions from scratch
            this.rebuildSubscriptions();
          } else if (msg.type === 'unsubscribe:pool') {
            // Clear all subscriptions for this client
            this.clients.get(clientId).subscriptions.clear();
            this.rebuildSubscriptions();
          }
        } catch (e) {
          console.error('Message parse error:', e);
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        this.rebuildSubscriptions();
      });

      // Send initial data for currently subscribed tokens
      setTimeout(() => {
        this.sendInitialData(ws, clientId);
      }, 100); // Small delay to ensure client is ready
    });

    this.connectToJupiter();

    // Start interval broadcasting of enhanced data
    this.broadcastInterval = setInterval(() => {
      this.broadcastEnhancedData();
    }, 1000); // Broadcast every second

    server.listen(this.port, () => {
      console.log(`Jupiter Proxy running on port ${this.port}`);
      console.log(`WebSocket endpoint: wss://ws.memedeck.win/jupiter`);
      console.log(`HTTP API endpoint: /api/jupiter-proxy/metadata`);
      console.log(`Broadcasting enhanced data every second with change detection`);
    });
  }

  connectToJupiter() {
    this.jupiterWs = new WebSocket('wss://trench-stream.jup.ag/ws');

    this.jupiterWs.on('open', () => {
      if (this.subscriptions.size > 0) {
        this.updateJupiterSubscription();
      }
    });

    this.jupiterWs.on('message', async (data) => {
      const message = data.toString();
      try {
        const parsed = JSON.parse(message);
        
        // Enrich pool updates with token analysis data and apply change detection
        if (parsed.type === 'updates' && parsed.data) {
          const changedUpdates = [];
          
          for (let update of parsed.data) {
            if (update.type === 'update' && update.pool?.baseAsset?.id) {
              const tokenId = update.pool.baseAsset.id;
              
              // Always enrich the message using our central function
              const enrichedUpdate = await this.enrichMessage(update);
              
              // Check if this update has meaningful changes
              const newData = {
                usdPrice: enrichedUpdate.pool.baseAsset.usdPrice,
                oneMinGain: enrichedUpdate.pool.baseAsset.oneMinGain,
                twoMinGain: enrichedUpdate.pool.baseAsset.twoMinGain,
                threeMinGain: enrichedUpdate.pool.baseAsset.threeMinGain,
                fourMinGain: enrichedUpdate.pool.baseAsset.fourMinGain,
                fiveMinGain: enrichedUpdate.pool.baseAsset.fiveMinGain,
                signal: enrichedUpdate.pool.baseAsset.signal,
                updatesPerMinute: enrichedUpdate.pool.baseAsset.updatesPerMinute,
                buyPressure5m: enrichedUpdate.pool.baseAsset.buyPressure5m
              };
              
              if (this.hasDataChanged(tokenId, newData)) {
                changedUpdates.push(enrichedUpdate);
                this.updateLastSentData(tokenId, newData);
              }
            }
          }
          
          // Only forward updates that have actual changes
          if (changedUpdates.length > 0) {
            this.clients.forEach(({ ws, subscriptions }) => {
              if (ws.readyState === WebSocket.OPEN) {
                // Filter updates to only include tokens this client is subscribed to
                const clientUpdates = changedUpdates.filter(update => 
                  update.pool?.baseAsset?.id && subscriptions.has(update.pool.baseAsset.id)
                );
                
                if (clientUpdates.length > 0) {
                  const clientMessage = {
                    type: 'updates',
                    data: clientUpdates
                  };
                  ws.send(JSON.stringify(clientMessage));
                }
              }
            });
          }
        } else {
          // For non-update messages, forward as-is
          this.clients.forEach(({ ws }) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(parsed));
            }
          });
        }
      } catch (e) {
        // If not JSON, still forward
        this.clients.forEach(({ ws }) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(message);
          }
        });
      }
    });

    this.jupiterWs.on('close', () => {
      setTimeout(() => this.connectToJupiter(), 5000);
    });

    this.jupiterWs.on('error', (err) => {
      console.error('Jupiter error:', err.message);
    });
  }

  updateJupiterSubscription() {
    if (this.jupiterWs?.readyState === WebSocket.OPEN) {
      // First unsubscribe from everything
      const unsubMsg = {
        type: 'unsubscribe:pool',
        pools: []  // Empty array unsubscribes from all
      };
      this.jupiterWs.send(JSON.stringify(unsubMsg));
      
      // Then subscribe to new set
      if (this.subscriptions.size > 0) {
        const subMsg = {
          type: 'subscribe:pool',
          pools: Array.from(this.subscriptions)
        };
        this.jupiterWs.send(JSON.stringify(subMsg));
      }
    }
  }

  rebuildSubscriptions() {
    this.subscriptions.clear();
    this.clients.forEach(({ subscriptions }) => {
      subscriptions.forEach(pool => this.subscriptions.add(pool));
    });
    this.updateJupiterSubscription();
  }
}

const proxy = new JupiterProxy();
proxy.start();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down Jupiter Proxy...');
  if (proxy.broadcastInterval) {
    clearInterval(proxy.broadcastInterval);
  }
  if (proxy.jupiterWs) {
    proxy.jupiterWs.close();
  }
  if (proxy.redis) {
    proxy.redis.disconnect();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down Jupiter Proxy...');
  if (proxy.broadcastInterval) {
    clearInterval(proxy.broadcastInterval);
  }
  if (proxy.jupiterWs) {
    proxy.jupiterWs.close();
  }
  if (proxy.redis) {
    proxy.redis.disconnect();
  }
  process.exit(0);
});