import { createJupiterProxyHandler } from '@/lib/api/jupiter-proxy-handler'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const endpoint = path.join('/')
  const handler = createJupiterProxyHandler(endpoint)
  return handler(request, { params: {} })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const endpoint = path.join('/')
  const handler = createJupiterProxyHandler(endpoint)
  return handler(request, { params: {} })
}