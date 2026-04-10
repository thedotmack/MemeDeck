
import { ULTRA_API_BASE_URL } from '@/lib/config/trading-constants';
import {
  ULTRA_ERROR_CODES,
  UltraExecuteParams,
  UltraExecuteResponse,
  UltraOrderParams,
  UltraOrderResponse
} from '@/lib/config/ultra-api-config';


const ULTRA_ENDPOINTS = {
  order: '/order',
  execute: '/execute'
};

class UltraApiError extends Error {
  constructor(
    message: string,
    public code?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'UltraApiError';
  }
}

export async function getUltraOrder(params: UltraOrderParams): Promise<UltraOrderResponse> {

  const url = new URL(`${ULTRA_API_BASE_URL}${ULTRA_ENDPOINTS.order}`);
  
  
  url.searchParams.append('inputMint', params.inputMint);
  url.searchParams.append('outputMint', params.outputMint);
  url.searchParams.append('amount', params.amount.toString());
  // url.searchParams.append('excludeRouters', 'jupiterz');
  
  if (params.taker) {
    url.searchParams.append('taker', params.taker);
  }
  
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[Ultra API] Order request failed:`, {
        status: response.status,
        statusText: response.statusText,
        url: url.toString(),
        errorData
      });
      throw new UltraApiError(
        `Ultra API order request failed: ${response.status} ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const data = await response.json();
    
    return data as UltraOrderResponse;
  } catch (error) {
    if (error instanceof UltraApiError) {
      throw error;
    }
    throw new UltraApiError(
      `Ultra API order request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ULTRA_ERROR_CODES.ULTRA_ENDPOINT.UNKNOWN,
      error
    );
  }
}

export async function executeUltraOrder(params: UltraExecuteParams): Promise<UltraExecuteResponse> {

  const url = `${ULTRA_API_BASE_URL}${ULTRA_ENDPOINTS.execute}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        signedTransaction: params.signedTransaction,
        requestId: params.requestId
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new UltraApiError(
        `Ultra API execute request failed: ${response.status} ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const data = await response.json();
    return data as UltraExecuteResponse;
  } catch (error) {
    if (error instanceof UltraApiError) {
      throw error;
    }
    throw new UltraApiError(
      `Ultra API execute request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ULTRA_ERROR_CODES.ULTRA_ENDPOINT.UNKNOWN,
      error
    );
  }
}

export function isUltraApiEnabled(): boolean {
  return true;
}
