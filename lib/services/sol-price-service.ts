import { ULTRA_API_BASE_URL } from '@/lib/config/trading-constants';
import { useStore } from '@/lib/store';

export async function getSolPrice(): Promise<number> {
  try {
    const store = useStore.getState();
    const { funding } = store;
    
    if (funding.solPrice && funding.solPrice > 0) {
      return funding.solPrice;
    }
    
    const response = await fetch(`${ULTRA_API_BASE_URL}/search?query=So11111111111111111111111111111111111111112`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    const price = data?.usdPrice || (Array.isArray(data) && data[0]?.usdPrice);
    
    if (!price || typeof price !== 'number' || price <= 0) {
      throw new Error('Invalid SOL price received from API');
    }

    store.setSolPrice(price);
    return price;
  } catch (error) {
    const store = useStore.getState();
    const fallbackPrice = store.funding.solPrice || 180;
    return fallbackPrice;
  }
}