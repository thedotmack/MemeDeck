import { NextResponse } from 'next/server'

export function createJupiterProxyHandler(endpoint: string) {
  return async function handler(
    request: Request,
    context?: { params?: Record<string, string> | Promise<Record<string, string>> }
  ) {
    try {
      let resolvedParams: Record<string, string> = {}
      if (context?.params) {
        resolvedParams = context.params instanceof Promise 
          ? await context.params 
          : context.params
      }

      let finalEndpoint = endpoint
      for (const [key, value] of Object.entries(resolvedParams)) {
        finalEndpoint = finalEndpoint.replace(`[${key}]`, value)
      }

      
      const requestUrl = new URL(request.url)
      const queryParams = requestUrl.searchParams.toString()
      const proxyBaseUrl = process.env.JUPITER_PROXY_BASE_URL || 'http://localhost:3004'
      const url = `${proxyBaseUrl}/api/jupiter-proxy/${finalEndpoint}${queryParams ? `?${queryParams}` : ''}`
      
      const fetchOptions: RequestInit = {
        method: request.method,
      }

      if (request.method === 'POST') {
        const body = await request.json()
        fetchOptions.headers = {
          'Content-Type': 'application/json',
        }
        fetchOptions.body = JSON.stringify(body)
      }

      const response = await fetch(url, fetchOptions)
      const data = await response.json()
      
      return NextResponse.json(data)
    } catch (error) {
      console.error(`Failed to fetch ${endpoint} from Jupiter proxy:`, error)
      return NextResponse.json(
        { success: false, error: `Failed to fetch ${endpoint}` },
        { status: 500 }
      )
    }
  }
}