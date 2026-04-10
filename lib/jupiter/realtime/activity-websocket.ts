"use client"

import { isJupiterActivityMessage } from '@/lib/types/guards';

const ACTIVITY_WEBSOCKET_URL = process.env.NEXT_PUBLIC_TOKEN_ANALYSIS_WS_URL || "ws://localhost:3005/activity"

export interface ActivityToken {
  tokenId: string
  symbol: string
  name: string
  price: number
  icon?: string
  liquidity?: number
  volume24h?: number
  createdAt?: string
  oneMinGain?: number
  twoMinGain?: number
  threeMinGain?: number
  fourMinGain?: number
  fiveMinGain?: number
  updatesPerMinute?: number
  signal?: 'STRONG' | 'RISING' | 'WATCH' | 'FLAT'
  buyPressure5m?: number
  winRate?: number
  tokenBeingAnalyzed?: boolean
  firstSeen?: number
}

interface ActivityMessage {
  type: 'update'
  data: ActivityToken[]
  timestamp: number
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error'


let globalActivityWebSocket: WebSocket | null = null;
let isConnecting = false;
let connectionCallbacks: Array<(ws: WebSocket) => void> = [];
let messageHandlers: Array<(message: ActivityMessage) => void> = [];
let reconnectAttempts = 0;
let reconnectTimeoutId: NodeJS.Timeout | null = null;
let connectionStateHandlers: Array<(state: ConnectionState) => void> = [];


let lastUpdateTime = 0;
let pendingUpdate: ActivityToken[] | null = null;
let updateTimeoutId: NodeJS.Timeout | null = null;

const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 100; 
const THROTTLE_DELAY = 1000; 

function notifyConnectionState(state: ConnectionState) {
  connectionStateHandlers.forEach(handler => handler(state));
}

function scheduleReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('Max reconnection attempts reached for activity WebSocket');
    notifyConnectionState('error');
    return;
  }
  
  console.log(`Reconnecting to activity WebSocket instantly (attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
  
  reconnectTimeoutId = setTimeout(() => {
    reconnectAttempts++;
    getOrCreateActivityWebSocket().catch(() => {
      
      scheduleReconnect();
    });
  }, RECONNECT_DELAY);
}

function clearReconnectTimeout() {
  if (reconnectTimeoutId) {
    clearTimeout(reconnectTimeoutId);
    reconnectTimeoutId = null;
  }
}

function throttledTokenUpdate(tokens: ActivityToken[], onUpdate: (tokens: ActivityToken[]) => void) {
  const now = Date.now();
  
  
  pendingUpdate = tokens;
  
  
  if (now - lastUpdateTime >= THROTTLE_DELAY) {
    lastUpdateTime = now;
    onUpdate(tokens);
    pendingUpdate = null;
    
    
    if (updateTimeoutId) {
      clearTimeout(updateTimeoutId);
      updateTimeoutId = null;
    }
    return;
  }
  
  
  if (!updateTimeoutId) {
    const remainingTime = THROTTLE_DELAY - (now - lastUpdateTime);
    updateTimeoutId = setTimeout(() => {
      if (pendingUpdate) {
        lastUpdateTime = Date.now();
        onUpdate(pendingUpdate);
        pendingUpdate = null;
      }
      updateTimeoutId = null;
    }, remainingTime);
  }
}

async function tryRestFallback(): Promise<ActivityToken[]> {
  try {
    const response = await fetch('https://data.cmem.ai/api/activity/top/50');
    const data = await response.json();
    
    if (data.success && Array.isArray(data.activeTokens)) {
      return data.activeTokens.map((token: any) => ({
        tokenId: token.id || token.tokenId,
        symbol: token.symbol || '',
        name: token.name || '',
        price: token.price || 0,
        icon: token.icon,
        liquidity: token.liquidity,
        volume24h: token.volume24h,
        createdAt: token.createdAt,
        oneMinGain: token.oneMinGain,
        twoMinGain: token.twoMinGain,
        threeMinGain: token.threeMinGain,
        fourMinGain: token.fourMinGain,
        fiveMinGain: token.fiveMinGain,
        updatesPerMinute: token.updatesPerMinute,
        signal: token.signal,
        buyPressure5m: token.buyPressure5m,
        winRate: token.winRate,
        tokenBeingAnalyzed: token.tokenBeingAnalyzed,
        firstSeen: token.firstSeen
      }));
    }
    
    throw new Error('Invalid REST response format');
  } catch (error) {
    console.error('REST fallback failed:', error);
    return [];
  }
}

function loadCachedTokens(): ActivityToken[] {
  try {
    const cached = localStorage.getItem('activity_tokens_cache');
    const cacheTimestamp = localStorage.getItem('activity_tokens_cache_timestamp');
    
    if (cached && cacheTimestamp) {
      const timestamp = parseInt(cacheTimestamp, 10);
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      
      if (now - timestamp < oneHour) {
        return JSON.parse(cached);
      }
    }
  } catch (error) {
    console.warn('Failed to load cached tokens:', error);
  }
  
  return [];
}

function cacheTokens(tokens: ActivityToken[]) {
  try {
    localStorage.setItem('activity_tokens_cache', JSON.stringify(tokens));
    localStorage.setItem('activity_tokens_cache_timestamp', Date.now().toString());
  } catch (error) {
    console.warn('Failed to cache tokens:', error);
  }
}

function getOrCreateActivityWebSocket(): Promise<WebSocket> {
  if (globalActivityWebSocket && globalActivityWebSocket.readyState === WebSocket.OPEN) {
    return Promise.resolve(globalActivityWebSocket);
  }

  if (isConnecting) {
    
    return new Promise((resolve) => {
      connectionCallbacks.push(resolve);
    });
  }

  isConnecting = true;
  notifyConnectionState('connecting');
  
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(ACTIVITY_WEBSOCKET_URL);
    
    ws.onopen = () => {
      globalActivityWebSocket = ws;
      isConnecting = false;
      reconnectAttempts = 0; 
      clearReconnectTimeout();
      notifyConnectionState('connected');
      
      console.log('Activity WebSocket connected');
      
      
      connectionCallbacks.forEach(callback => callback(ws));
      connectionCallbacks = [];
      resolve(ws);
    };
    
    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (!isJupiterActivityMessage(parsed)) return;
        const normalized: ActivityMessage = {
          type: 'update',
          timestamp: parsed.timestamp,
          data: parsed.data.map(t => {
            const token: ActivityToken = {
              tokenId: typeof t.tokenId === 'string' ? t.tokenId : (typeof (t as any).id === 'string' ? (t as any).id : ''),
              symbol: typeof t.symbol === 'string' ? t.symbol : '',
              name: typeof t.name === 'string' ? t.name : '',
              price: typeof t.price === 'number' ? t.price : 0,
            }
            
            if (typeof t.icon === 'string') token.icon = t.icon
            
            if (typeof t.oneMinGain === 'number') token.oneMinGain = t.oneMinGain
            if (typeof t.twoMinGain === 'number') token.twoMinGain = t.twoMinGain
            if (typeof t.threeMinGain === 'number') token.threeMinGain = t.threeMinGain
            if (typeof t.fourMinGain === 'number') token.fourMinGain = t.fourMinGain
            if (typeof t.fiveMinGain === 'number') token.fiveMinGain = t.fiveMinGain
            if (typeof t.buyPressure5m === 'number') token.buyPressure5m = t.buyPressure5m
            if (typeof t.liquidity === 'number') token.liquidity = t.liquidity
            if (typeof t.volume24h === 'number') token.volume24h = t.volume24h
            if (typeof t.updatesPerMinute === 'number') token.updatesPerMinute = t.updatesPerMinute
            if (typeof t.winRate === 'number') token.winRate = t.winRate
            if (typeof t.firstSeen === 'number') token.firstSeen = t.firstSeen
            if (typeof t.createdAt === 'string') token.createdAt = t.createdAt
            if (t.signal === 'STRONG' || t.signal === 'RISING' || t.signal === 'WATCH' || t.signal === 'FLAT') token.signal = t.signal
            if (typeof t.tokenBeingAnalyzed === 'boolean') token.tokenBeingAnalyzed = t.tokenBeingAnalyzed
            return token
          })
        }
        const message = normalized;
        if (Array.isArray(message.data)) {
          
          cacheTokens(message.data);
          
          
          messageHandlers.forEach(handler => handler(message));
        }
      } catch (error) {
        console.warn('Failed to parse activity WebSocket message:', error);
      }
    };
    
    ws.onclose = (event) => {
      console.log('Activity WebSocket closed:', event.code, event.reason);
      globalActivityWebSocket = null;
      isConnecting = false;
      notifyConnectionState('disconnected');
      
      
      if (event.code !== 1000) {
        scheduleReconnect();
      }
    };
    
    ws.onerror = (error) => {
      console.error('Activity WebSocket error:', error);
      isConnecting = false;
      notifyConnectionState('error');
      reject(error);
    };
  });
}

function registerActivityMessageHandler(handler: (message: ActivityMessage) => void): () => void {
  messageHandlers.push(handler);
  
  
  return () => {
    const index = messageHandlers.indexOf(handler);
    if (index > -1) {
      messageHandlers.splice(index, 1);
    }
  };
}

function registerConnectionStateHandler(handler: (state: ConnectionState) => void): () => void {
  connectionStateHandlers.push(handler);
  
  
  return () => {
    const index = connectionStateHandlers.indexOf(handler);
    if (index > -1) {
      connectionStateHandlers.splice(index, 1);
    }
  };
}

export function initializeActivityWebSocket({
  onTokenUpdate,
  onConnectionChange,
  onError
}: {
  onTokenUpdate: (tokens: ActivityToken[]) => void
  onConnectionChange: (state: ConnectionState) => void
  onError?: (error: string) => void
}): { cleanup: () => void } {
  
  
  const unregisterMessageHandler = registerActivityMessageHandler((message) => {
    throttledTokenUpdate(message.data, onTokenUpdate);
  });
  
  const unregisterConnectionHandler = registerConnectionStateHandler((state) => {
    onConnectionChange(state);
    
    
    if (state === 'error' || state === 'disconnected') {
      
      tryRestFallback().then(tokens => {
        if (tokens.length > 0) {
          onTokenUpdate(tokens);
        } else {
          
          const cachedTokens = loadCachedTokens();
          if (cachedTokens.length > 0) {
            onTokenUpdate(cachedTokens);
          } else if (onError) {
            onError('Unable to load token data. Please check your connection.');
          }
        }
      });
    }
  });
  
  
  getOrCreateActivityWebSocket()
    .then(() => {
      console.log('Activity WebSocket initialization completed');
    })
    .catch((error) => {
      console.error('Failed to initialize activity WebSocket:', error);
      if (onError) {
        onError('Failed to connect to live data stream');
      }
    });
  
  
  return {
    cleanup: () => {
      unregisterMessageHandler();
      unregisterConnectionHandler();
      clearReconnectTimeout();
      
      
      if (updateTimeoutId) {
        clearTimeout(updateTimeoutId);
        updateTimeoutId = null;
      }
      pendingUpdate = null;
      
      
      if (messageHandlers.length === 0 && globalActivityWebSocket) {
        globalActivityWebSocket.close(1000);
        globalActivityWebSocket = null;
      }
    }
  };
}

