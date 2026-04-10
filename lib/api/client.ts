
import { useStore } from '@/lib/store';

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  
  const auth = useStore.getState().auth
  
  if (!auth?.accessToken) {
    throw new Error('No access token available')
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${auth.accessToken}`,
    ...options.headers,
  }

  return fetch(url, {
    ...options,
    headers,
  })
}

export async function getWithAuth(url: string): Promise<Response> {
  return fetchWithAuth(url, { method: 'GET' })
}

export async function postWithAuth(url: string, data?: any): Promise<Response> {
  return fetchWithAuth(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

