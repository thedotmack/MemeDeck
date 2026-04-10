import { LRUCache } from 'lru-cache';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';



const imageCache = new LRUCache<string, { buffer: ArrayBuffer; contentType: string }>({
  ttl: 1000 * 60 * 60 * 24 * 365,
  ttlAutopurge: true
})

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const imageUrl = searchParams.get('url')
  const width = searchParams.get('width')
  const height = searchParams.get('height')

  if (!imageUrl) {
    return new NextResponse('Missing URL parameter', { status: 400 })
  }

  
  const cacheKey = width && height ? `${imageUrl}:${width}x${height}` : imageUrl

  try {
    
    const cached = imageCache.get(cacheKey)
    if (cached) {
      
      const headers = new Headers()
      headers.set('Content-Type', cached.contentType)
      headers.set('Access-Control-Allow-Origin', '*')
      headers.set('Access-Control-Allow-Methods', 'GET')
      headers.set('Cache-Control', 'public, max-age=3600')
      headers.set('X-Cache', 'HIT')
      
      return new NextResponse(cached.buffer, { headers })
    }

    
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MemeDeck/1.0)',
      },
    })

    if (!response.ok) {
      return new NextResponse('Failed to fetch image', { status: response.status })
    }

    let buffer = await response.arrayBuffer()
    let contentType = response.headers.get('content-type') || 'image/jpeg'
    
    
    if (width && height) {
      try {
        const widthNum = parseInt(width, 10)
        const heightNum = parseInt(height, 10)
        
        
        if (widthNum > 0 && heightNum > 0 && widthNum <= 2048 && heightNum <= 2048) {
          
          const resizedBuffer = await sharp(Buffer.from(buffer))
            .resize(widthNum, heightNum, {
              fit: 'cover',
              position: 'center'
            })
            .webp({ quality: 85 }) 
            .toBuffer()
          
          buffer = resizedBuffer.buffer as ArrayBuffer
          contentType = 'image/webp'
        } else {
          console.warn('[Image Proxy] Invalid dimensions, using original image')
        }
      } catch (resizeError) {
        console.error('[Image Proxy] Resize failed, using original:', resizeError)
        
      }
    }
    
    
    imageCache.set(cacheKey, { buffer, contentType })
    
    const headers = new Headers()
    headers.set('Content-Type', contentType)
    headers.set('Access-Control-Allow-Origin', '*')
    headers.set('Access-Control-Allow-Methods', 'GET')
    headers.set('Cache-Control', 'public, max-age=3600')
    headers.set('X-Cache', 'MISS')

    return new NextResponse(buffer, { headers })
  } catch (error) {
    console.error('Image proxy error:', error)
    return new NextResponse('Failed to proxy image', { status: 500 })
  }
}