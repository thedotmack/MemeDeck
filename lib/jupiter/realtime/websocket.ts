"use client"

import { useStore } from '@/lib/store';
import { isJupiterMessage } from '@/lib/types/guards';
import { useEffect, useMemo, useRef, useState } from 'react';

const JUPITER_PROXY_WEBSOCKET_URL = process.env.NEXT_PUBLIC_JUPITER_STREAM_WS_URL || "ws://localhost:3004/jupiter"


let globalWebSocket: WebSocket | null = null;
let isConnecting = false;
let connectionCallbacks: Array<(ws: WebSocket) => void> = [];
let messageHandlers: Array<(data: any) => void> = [];
let currentSubscriptions = new Set<string>();

function getOrCreateWebSocket(): Promise<WebSocket> {
  if (globalWebSocket && globalWebSocket.readyState === WebSocket.OPEN) {
    return Promise.resolve(globalWebSocket);
  }

  if (isConnecting) {
    
    return new Promise((resolve) => {
      connectionCallbacks.push(resolve);
    });
  }

  isConnecting = true;
  
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(JUPITER_PROXY_WEBSOCKET_URL);
    
    ws.onopen = () => {
      globalWebSocket = ws;
      isConnecting = false;
      
      
      connectionCallbacks.forEach(callback => callback(ws));
      connectionCallbacks = [];
      resolve(ws);
    };
    
    ws.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data);
        if (!isJupiterMessage(raw)) return;
        messageHandlers.forEach(handler => handler(raw));
      } catch {  }
    };
    
    ws.onclose = () => {
      globalWebSocket = null;
      isConnecting = false;
      currentSubscriptions.clear();
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      isConnecting = false;
      reject(error);
    };
  });
}

function subscribeToTokens(tokens: string[]) {
  if (!globalWebSocket || globalWebSocket.readyState !== WebSocket.OPEN) return;
  
  
  const newTokensSet = new Set(tokens);
  const currentTokensArray = Array.from(currentSubscriptions);
  
  const same = currentTokensArray.length === tokens.length && 
    currentTokensArray.every(id => newTokensSet.has(id)) &&
    tokens.every(id => currentSubscriptions.has(id));
    
  if (same) return; 
  
  
  if (currentSubscriptions.size > 0) {
    globalWebSocket.send(JSON.stringify({
      type: 'unsubscribe:pool',
      pools: Array.from(currentSubscriptions)
    }));
  }
  
  
  if (tokens.length > 0) {
    globalWebSocket.send(JSON.stringify({
      type: 'subscribe:pool',
      pools: tokens
    }));
  }
  
  currentSubscriptions.clear();
  tokens.forEach(token => currentSubscriptions.add(token));
}

export const useJupiterWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const handlerRef = useRef<((data: any) => void) | null>(null);
  
  
  const handFromStore = useStore.use.hand();
  const hand = useMemo(() => handFromStore || [], [handFromStore]);
  const updateTokenPrice = useStore.use.updateTokenPrice();
  const updateTokenPool = useStore.use.updateTokenPool();
  
  
  const tokenIds = useMemo(() => {
    const handIds = hand.map(card => card.id);
    
    
    
    return Array.from(new Set(handIds));
  }, [hand]);

  
  const handleMessage = (message: any) => {
    
    if (message.type === 'prices' && Array.isArray(message.data)) {
      message.data.forEach((priceData: any) => {
        if (priceData.assetId && typeof priceData.price === 'number') {
          updateTokenPrice(priceData.assetId, priceData.price, 'websocket');
        }
      });
      return;
    }
    
    
    if (message.type === 'updates' && Array.isArray(message.data)) {
      message.data.forEach((update: any) => {
        if (update.type === 'update' && update.pool?.baseAsset) {
          const pool = update.pool;
          const baseAsset = pool.baseAsset;
          const tokenId = baseAsset.id;
          
          updateTokenPool(tokenId, {
            id: tokenId,
            symbol: baseAsset.symbol || '',
            name: baseAsset.name || '',
            icon: baseAsset.icon,
            usdPrice: baseAsset.usdPrice || 0,
            liquidity: pool.liquidity,
            volume24h: pool.volume24h,
            fdv: baseAsset.fdv,
            mcap: baseAsset.mcap,
            stats5m: baseAsset.stats5m,
            stats1h: baseAsset.stats1h,
            stats24h: baseAsset.stats24h,
            holderCount: baseAsset.holderCount,
            organicScore: baseAsset.organicScore,
            organicScoreLabel: baseAsset.organicScoreLabel,
            launchpad: baseAsset.launchpad,
            graduatedAt: baseAsset.graduatedAt,
            rawPoolData: pool,
            firstSeen: baseAsset.firstSeen || null,
            signal: baseAsset.signal || null,
            gains: baseAsset.gains || {
              oneMin: baseAsset.oneMinGain || null,
              twoMin: baseAsset.twoMinGain || null,
              threeMin: baseAsset.threeMinGain || null,
              fourMin: baseAsset.fourMinGain || null,
              fiveMin: baseAsset.fiveMinGain || null
            },
            momentum: baseAsset.momentum || {
              upMoves: baseAsset.upMoves || 0,
              downMoves: baseAsset.downMoves || 0,
              winRate: baseAsset.winRate || 0
            },
            updatesPerMinute: baseAsset.updatesPerMinute || 0,
            buyPressure5m: baseAsset.buyPressure5m || 0
          });
        }
      });
      return;
    }
    

    if (message.type === 'pool_update' && message.data) {
      const pool = message.data;
      const baseAsset = pool.baseAsset;
      const tokenId = baseAsset?.id;
      
      if (tokenId && baseAsset) {
        updateTokenPool(tokenId, {
          id: tokenId,
          symbol: baseAsset.symbol || '',
          name: baseAsset.name || '',
          icon: baseAsset.icon,
          usdPrice: baseAsset.usdPrice || 0,
          liquidity: pool.liquidity,
          volume24h: pool.volume24h,
          fdv: baseAsset.fdv,
          mcap: baseAsset.mcap,
          stats5m: baseAsset.stats5m,
          stats1h: baseAsset.stats1h,
          stats24h: baseAsset.stats24h,
          holderCount: baseAsset.holderCount,
          organicScore: baseAsset.organicScore,
          organicScoreLabel: baseAsset.organicScoreLabel,
          launchpad: baseAsset.launchpad,
          graduatedAt: baseAsset.graduatedAt,
          rawPoolData: pool,
          firstSeen: baseAsset.firstSeen || null,
          signal: baseAsset.signal || null,
          gains: baseAsset.gains || null,
          momentum: baseAsset.momentum || null
        });
      }
    }
  };


  useEffect(() => {

    const stableHandler = (data: any) => {
      if (handlerRef.current) {
        handlerRef.current(data);
      }
    };
    
    const connectAndRegister = async () => {
      try {
        const ws = await getOrCreateWebSocket();
        setIsConnected(ws.readyState === WebSocket.OPEN);
        setIsLoading(false);
        

        messageHandlers.push(stableHandler);
        
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        setIsConnected(false);
        setIsLoading(false);
      }
    };
    
    connectAndRegister();
    
    
    return () => {
      const index = messageHandlers.indexOf(stableHandler);
      if (index > -1) {
        messageHandlers.splice(index, 1);
      }
    };
  }, []); 
  
  
  handlerRef.current = handleMessage;
  
  
  useEffect(() => {
    if (isConnected) {
      subscribeToTokens(tokenIds);
    }
  }, [tokenIds, isConnected]);

  return {
    isConnected,
    isLoading,
    websocket: globalWebSocket,
    subscribedTokens: Array.from(currentSubscriptions),
  };
};