import { isPythPriceMessage, safeJsonParse } from '@/lib/types/guards';
import { HermesClient } from '@pythnetwork/hermes-client';
import { useStore } from '../store';

const SOL_PRICE_FEED_ID = '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d';

let cachedPrice = 200;
let priceTimestamp = 0;
let hermesClient: HermesClient | null = null;
let eventSource: EventSource | null = null;
let isConnected = false;

let isReconnecting = false;
let retryCount = 0;
let maxRetries = 10;
let reconnectTimer: NodeJS.Timeout | null = null;

function cleanupEventSource() {
  if (eventSource) {
    eventSource.onmessage = null;
    eventSource.onerror = null;
    eventSource.onopen = null;
    eventSource.close();
    eventSource = null;
  }
  
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  
  isConnected = false;
}

function getReconnectDelay(): number {
  const baseDelay = 500;
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), 10000);
  const jitter = Math.random() * 500;
  return delay + jitter;
}

async function testPythConnection() {
  if (!hermesClient) return;
  
  try {
        const priceUpdates = await hermesClient.getLatestPriceUpdates([SOL_PRICE_FEED_ID]);
        
    if (priceUpdates && priceUpdates.parsed && priceUpdates.parsed.length > 0) {
      const solUpdate = priceUpdates.parsed[0];
      if (solUpdate && solUpdate.price) {
        const price = Number(solUpdate.price.price);
        const expo = Number(solUpdate.price.expo);
        const solPrice = price * Math.pow(10, expo);
                
        if (solPrice > 0) {
          cachedPrice = solPrice;
          priceTimestamp = Date.now();
          updateStore(solPrice);
        }
      }
    }
  } catch (error) {
      }
}

function initializePythConnection() {
  if (hermesClient) {
        return;
  }
  
  try {
    hermesClient = new HermesClient('https://hermes.pyth.network/', {
      timeout: 10000,
    });
        
    testPythConnection();
    startPriceStream();
    
  } catch (error) {
      }
}

function attemptReconnect(error?: any) {
  if (isReconnecting) return;
  
  if (retryCount >= maxRetries) {
        isReconnecting = false;
    return;
  }
  
  isReconnecting = true;
  retryCount++;
  
  const delay = getReconnectDelay();
  const errorType = error?.name || error?.type || 'unknown';
  
  
  
  reconnectTimer = setTimeout(() => {
    isReconnecting = false;
    startPriceStream();
  }, delay);
}

async function startPriceStream() {
  cleanupEventSource();
  
  try {
        
    
        
    
    const streamUrl = `https://hermes.pyth.network/v2/updates/price/stream?ids[]=${SOL_PRICE_FEED_ID}&parsed=true`;
        
    eventSource = new EventSource(streamUrl);
    
        
    
    retryCount = 0;
    isConnected = true;
    isReconnecting = false;
    
        
    
    eventSource.onopen = () => {
            retryCount = 0;
    };
    
    
    eventSource.onmessage = (event) => {
      try {
        const updateRaw = safeJsonParse(event.data, isPythPriceMessage);
        if (!updateRaw) return; 
        if (updateRaw.parsed && Array.isArray(updateRaw.parsed)) {
          
          const cleanId = SOL_PRICE_FEED_ID.replace('0x', '');
          const solUpdate = updateRaw.parsed.find((p: any) => {
            const updateId = p.id?.replace('0x', '');
            return updateId === cleanId;
          });
          
                    
          if (solUpdate && solUpdate.price) {
            const price = Number(solUpdate.price.price);
            const expo = Number(solUpdate.price.expo);
            
            if (price && expo !== undefined) {

              const solPrice = price * Math.pow(10, expo);
                            
              if (solPrice > 0) {
                cachedPrice = solPrice;
                priceTimestamp = Date.now();
                                

                updateStore(solPrice);
              }
            }
          }
        }
      } catch (parseError) {

      }
    };
    

    eventSource.onerror = (error) => {
            isConnected = false;
      

      if (error.type === 'error' && error.eventPhase === EventSource.CLOSED) {
        
      }
      
      
      if (!isReconnecting) {
        attemptReconnect(error);
      }
    };
    
  } catch (error) {
        isConnected = false;
    
    
    if (error instanceof Error && error.name === 'AbortError') {
      
    }
    
    
    if (!isReconnecting) {
      attemptReconnect(error);
    }
  }
}

function updateStore(price: number) {
  if (typeof window !== 'undefined') {
    try {
      const store = useStore.getState();
      if (store.setSolPrice) {
        store.setSolPrice(price);
      }
    } catch (error) {
      
    }
  }
}


export function isCachedPriceFresh(): boolean {
  const age = Date.now() - priceTimestamp;
  return age < 30000; 
}




if (typeof window !== 'undefined') {
    initializePythConnection();
} else {
  }

