"use client"

import { Camera, Mesh, Plane, Program, Renderer, RenderTarget, Texture, Transform } from "ogl"
import { useCallback, useEffect, useRef } from "react"


import { useStore } from "@/lib/store"


const VIGNETTE_CENTER_SIZE = 0.4    
const VIGNETTE_FADE_END = 0.6       
const VIGNETTE_DARKNESS = 0.8       


const vertexShaderSource = `#version 300 es

in vec2 uv;
in vec2 position;

out vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const fragmentShaderSource = `#version 300 es

precision mediump float;

uniform float uFrequency;
uniform float uTime;
uniform float uSpeed;
uniform float uValue;
uniform vec3 uColorStart;
uniform vec3 uColorMid;
uniform vec3 uColorEnd;
uniform sampler2D uCurrentTexture;
uniform sampler2D uPrevTexture;
uniform float uCrossfade;
uniform bool uHasPrevTexture;
uniform float uImageOpacity;
uniform bool uHasImage;
uniform float uVignetteCenterSize;
uniform float uVignetteFadeEnd;
uniform float uVignetteDarkness;

in vec2 vUv;

out vec4 fragColor;


vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float cnoise(vec3 P) {
  vec3 Pi0 = floor(P);
  vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = Pf0 * Pf0 * Pf0 * (Pf0 * (Pf0 * 6.0 - 15.0) + 10.0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
  return 2.2 * n_xyz;
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {

  float baseNoise = abs(cnoise(vec3(vUv * uFrequency, uTime * uSpeed)));
  
  vec3 baseNoiseColor;
  if (baseNoise < 0.33) {
    float t = baseNoise / 0.33;
    baseNoiseColor = mix(uColorStart, uColorMid, t);
  } else if (baseNoise < 0.66) {
    float t = (baseNoise - 0.33) / 0.33;
    baseNoiseColor = mix(uColorMid, uColorEnd, t);
  } else {
    float t = (baseNoise - 0.66) / 0.34;
    baseNoiseColor = mix(uColorEnd, uColorStart, t);
  }
  
  vec3 finalColor = baseNoiseColor;
  
  if (uHasImage && uImageOpacity > 0.0) {
    

    float noise = cnoise(vec3(vUv * uFrequency, uTime * uSpeed));
    float distortionNoise = cnoise(vec3(vUv * uFrequency * 2.0, uTime * uSpeed * 0.5));
    

    vec2 distortedUv = vUv + vec2(
      sin(noise * 6.28318) * 0.02,
      cos(distortionNoise * 6.28318) * 0.02
    );
    

    distortedUv = clamp(distortedUv, 0.0, 1.0);
    

    vec2 vignetteUv = vUv - 0.5;
    float vignetteDistance = length(vignetteUv);
    

    float vignette;
    if (vignetteDistance < uVignetteCenterSize) {
      vignette = 1.0;
    } else {
      vignette = 1.0 - (smoothstep(uVignetteCenterSize, uVignetteFadeEnd, vignetteDistance) * uVignetteDarkness);
    }
    

    vec3 currentImage = texture(uCurrentTexture, distortedUv).rgb;
    vec3 prevImage = uHasPrevTexture ? texture(uPrevTexture, distortedUv).rgb : currentImage;
    

    vec3 imageColor = mix(prevImage, currentImage, uCrossfade);
    

    imageColor *= vignette;
    

    float overlayNoise = abs(noise);
    

    vec3 noiseColor;
    if (overlayNoise < 0.33) {
      float t = overlayNoise / 0.33;
      noiseColor = mix(uColorStart, uColorMid, t);
    } else if (overlayNoise < 0.66) {
      float t = (overlayNoise - 0.33) / 0.33;
      noiseColor = mix(uColorMid, uColorEnd, t);
    } else {
      float t = (overlayNoise - 0.66) / 0.34;
      noiseColor = mix(uColorEnd, uColorStart, t);
    }
    

    vec3 softLight;
    for(int i = 0; i < 3; i++) {
      if(noiseColor[i] < 0.5) {
        softLight[i] = 2.0 * imageColor[i] * noiseColor[i] + imageColor[i] * imageColor[i] * (1.0 - 2.0 * noiseColor[i]);
      } else {
        softLight[i] = 2.0 * imageColor[i] * (1.0 - noiseColor[i]) + sqrt(imageColor[i]) * (2.0 * noiseColor[i] - 1.0);
      }
    }
    
    vec3 blendedColor = softLight * 1.4;
    

    finalColor = mix(baseNoiseColor, blendedColor, 0.6 * uImageOpacity);
  }
  

  finalColor = finalColor * uValue;

  fragColor = vec4(finalColor, 1.0);
}
`

const asciiVertexShaderSource = `#version 300 es

in vec2 uv;
in vec2 position;

out vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const asciiFragmentShaderSource = `#version 300 es

precision highp float;

uniform vec2 uResolution;
uniform sampler2D uTexture;

in vec2 vUv;

out vec4 fragColor;

float character(int n, vec2 p) {
  p = floor(p * vec2(-4.0, 4.0) + 2.5);
  if(clamp(p.x, 0.0, 4.0) == p.x) {
    if(clamp(p.y, 0.0, 4.0) == p.y) {
      int a = int(round(p.x) + 5.0 * round(p.y));
      if(((n >> a) & 1) == 1)
        return 1.0;
    }
  }
  return 0.0;
}

void main() {
  vec2 pix = gl_FragCoord.xy;
  vec3 col = texture(uTexture, floor(pix / 16.0) * 16.0 / uResolution.xy).rgb;

  float gray = 0.3 * col.r + 0.59 * col.g + 0.11 * col.b;

  int n = 4096;

  if(gray > 0.2)
    n = 65600;
  if(gray > 0.3)
    n = 163153;
  if(gray > 0.4)
    n = 15255086;
  if(gray > 0.5)
    n = 13121101;
  if(gray > 0.6)
    n = 15252014;
  if(gray > 0.7)
    n = 13195790;
  if(gray > 0.8)
    n = 11512810;

  vec2 p = mod(pix / 8.0, 2.0) - vec2(1.0);
  col = col * character(n, p);
  fragColor = vec4(col, 1.0);
}
`


const hexToRgb = (hex: string): [number, number, number] => {
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255
  return [r, g, b]
}


const loadTexture = async (renderer: any, url: string, getCachedTexture: (url: string) => any | null, cacheTexture: (url: string, texture: any) => void): Promise<Texture | null> => {
  const gl = renderer.gl;
  
  const cachedImg = getCachedTexture(url);
  if (cachedImg) {
    try {
      const texture = new Texture(gl, {
        image: cachedImg,
        generateMipmaps: true,
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
        minFilter: gl.LINEAR_MIPMAP_LINEAR,
        magFilter: gl.LINEAR
      })
      return texture
    } catch (error) {
      console.warn('[ASCII RENDERER] Failed to create texture from cache:', error)
      
    }
  }

  return new Promise((resolve) => {
    const img = new Image()
    
    
    
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}&width=512&height=512`
    
    img.crossOrigin = 'anonymous' 
    
    img.onload = () => {
      try {
        
        cacheTexture(url, img);
        
        const texture = new Texture(gl, {
          image: img,
          generateMipmaps: true,
          wrapS: gl.CLAMP_TO_EDGE,
          wrapT: gl.CLAMP_TO_EDGE,
          minFilter: gl.LINEAR_MIPMAP_LINEAR,
          magFilter: gl.LINEAR
        })
        resolve(texture)
      } catch (error) {
        console.warn('[ASCII RENDERER] Failed to create texture:', error)
        resolve(null)
      }
    }
    
    img.onerror = () => {
      console.warn('[ASCII RENDERER] Failed to load image:', url)
      resolve(null)
    }
    
    img.src = proxyUrl
  })
}

interface AsciiRendererProps {
  controls: {
    frequency: number
    speed: number
    value: number
    colorStart: string
    colorMid: string
    colorEnd: string
  }
  
  noiseBlend?: number
  width?: number
  height?: number
  className?: string
  style?: React.CSSProperties
  
  kenBurnsSpeed?: number
  kenBurnsIntensity?: number
}

export default function AsciiRenderer({ 
  controls, 
  noiseBlend,
  width,
  height,
  className,
  style,
}: AsciiRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const currentTextureRef = useRef<Texture | null>(null)
  const prevTextureRef = useRef<Texture | null>(null)
  const noiseProgramRef = useRef<Program | null>(null)
  const textureMapRef = useRef<Map<string, Texture>>(new Map())
  const imageOpacityRef = useRef<number>(0)
  const rendererRef = useRef<any>(null) 
  
  
  const crossfadeProgress = useRef<number>(1.0)  
  const crossfadeStartTime = useRef<number>(0)
  const CROSSFADE_DURATION = 300 
  
  
  const opacityAnimationProgress = useRef<number>(1.0)
  const opacityAnimationStartTime = useRef<number>(0)
  const targetOpacity = useRef<number>(0.0)
  const currentOpacity = useRef<number>(0.0)
  const startOpacity = useRef<number>(0.0)
  
  
  
  
  const ui = useStore.use.ui() || {}
  const imageUrl = ui?.hoveredCardImageUrl || null
  
  const getCachedTextureSelector = useStore.use.getCachedTexture()
  const cacheTextureSelector = useStore.use.cacheTexture()
  
  const getCachedTexture = useCallback((url: string) => {
    return getCachedTextureSelector ? getCachedTextureSelector(url) : null
  }, [getCachedTextureSelector])
  
  const cacheTexture = useCallback((url: string, texture: any) => {
    if (cacheTextureSelector) cacheTextureSelector(url, texture)
  }, [cacheTextureSelector])
  
  
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    const currentTextureMap = textureMapRef.current

    
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas")
      container.appendChild(canvasRef.current)
    }

    const canvas = canvasRef.current

    
    const canvasWidth = width || window.innerWidth
    const canvasHeight = height || window.innerHeight
    
    const renderer = new Renderer({
      canvas,
      width: canvasWidth,
      height: canvasHeight,
      dpr: Math.min(window.devicePixelRatio, 2),
    })

    const gl = renderer.gl
    gl.clearColor(0.05, 0.05, 0.05, 1)

    
    const camera = new Camera(gl, {
      fov: 45,
    })
    camera.position.z = 5

    
    const scene = new Transform()

    
    const geometry = new Plane(gl, {
      width: 2,
      height: 2,
    })

    
    const renderTarget = new RenderTarget(gl, {
      width: canvasWidth,
      height: canvasHeight
    })

    
    const colorStart = hexToRgb(controls.colorStart)
    const colorMid = hexToRgb(controls.colorMid)
    const colorEnd = hexToRgb(controls.colorEnd)

    
    const dummyTexture = new Texture(gl, {
      width: 1,
      height: 1
    })

    
    const noiseProgram = new Program(gl, {
      vertex: vertexShaderSource,
      fragment: fragmentShaderSource,
      uniforms: {
        uTime: { value: 0 },
        uFrequency: { value: controls.frequency },
        uSpeed: { value: controls.speed },
        uValue: { value: controls.value },
        uColorStart: { value: colorStart },
        uColorMid: { value: colorMid },
        uColorEnd: { value: colorEnd },
        uCurrentTexture: { value: dummyTexture },
        uPrevTexture: { value: dummyTexture },
        uCrossfade: { value: 1.0 },
        uHasPrevTexture: { value: false },
        uImageOpacity: { value: 0.0 },
        uHasImage: { value: false },
        uVignetteCenterSize: { value: VIGNETTE_CENTER_SIZE },
        uVignetteFadeEnd: { value: VIGNETTE_FADE_END },
        uVignetteDarkness: { value: VIGNETTE_DARKNESS },
      },
    })

    
    noiseProgramRef.current = noiseProgram
    
    
    rendererRef.current = renderer

    
    currentOpacity.current = 0.0
    targetOpacity.current = 0.0
    startOpacity.current = 0.0
    opacityAnimationProgress.current = 1.0
    opacityAnimationStartTime.current = 0

    
    const asciiProgram = new Program(gl, {
      vertex: asciiVertexShaderSource,
      fragment: asciiFragmentShaderSource,
      uniforms: {
        uResolution: { value: [canvasWidth, canvasHeight] },
        uTexture: { value: renderTarget.texture },
      },
    })

    
    const noiseMesh = new Mesh(gl, { geometry, program: noiseProgram })
    noiseMesh.setParent(scene)

    const asciiMesh = new Mesh(gl, { geometry, program: asciiProgram })
    asciiMesh.setParent(scene)

    
    let lastAnimationTime = 0
    const targetFPS = 30
    const frameTime = 1000 / targetFPS
    
    const animate = (t: number) => {
      animationFrameRef.current = requestAnimationFrame(animate)
      
      
      if (t - lastAnimationTime < frameTime) {
        return
      }
      lastAnimationTime = t
      
      const elapsedTime = t * 0.001

      
      noiseProgram.uniforms.uTime.value = elapsedTime

      
      noiseProgram.uniforms.uFrequency.value = controls.frequency
      noiseProgram.uniforms.uSpeed.value = controls.speed
      noiseProgram.uniforms.uValue.value = controls.value
      noiseProgram.uniforms.uColorStart.value = hexToRgb(controls.colorStart)
      noiseProgram.uniforms.uColorMid.value = hexToRgb(controls.colorMid)
      noiseProgram.uniforms.uColorEnd.value = hexToRgb(controls.colorEnd)

      
      const currentTime = elapsedTime * 1000 
      if (crossfadeStartTime.current > 0) {
        const elapsed = currentTime - crossfadeStartTime.current
        crossfadeProgress.current = Math.min(elapsed / CROSSFADE_DURATION, 1.0)
        
        
        if (crossfadeProgress.current >= 1.0) {
          crossfadeStartTime.current = 0
          prevTextureRef.current = null
        }
      }
      
      
      if (opacityAnimationStartTime.current > 0) {
        const elapsed = currentTime - opacityAnimationStartTime.current
        opacityAnimationProgress.current = Math.min(elapsed / CROSSFADE_DURATION, 1.0)
        
        
        currentOpacity.current = startOpacity.current + (targetOpacity.current - startOpacity.current) * opacityAnimationProgress.current
        
        
        if (opacityAnimationProgress.current >= 1.0) {
          opacityAnimationStartTime.current = 0
          currentOpacity.current = targetOpacity.current
        }
      } else {
        
        currentOpacity.current = targetOpacity.current
      }
      
      
      const currentTexture = currentTextureRef.current
      const prevTexture = prevTextureRef.current
      
      if (currentTexture) {
        noiseProgram.uniforms.uCurrentTexture.value = currentTexture
        noiseProgram.uniforms.uHasImage.value = true
      } else {
        noiseProgram.uniforms.uHasImage.value = false
      }
      
      if (prevTexture) {
        noiseProgram.uniforms.uPrevTexture.value = prevTexture
        noiseProgram.uniforms.uHasPrevTexture.value = true
      } else {
        noiseProgram.uniforms.uHasPrevTexture.value = false
      }
      
      noiseProgram.uniforms.uCrossfade.value = crossfadeProgress.current
      noiseProgram.uniforms.uImageOpacity.value = currentOpacity.current

      
      renderer.render({ scene: noiseMesh, camera, target: renderTarget })

      
      const width = gl.canvas.width
      const height = gl.canvas.height
      asciiProgram.uniforms.uResolution.value = [width, height]
      renderer.render({ scene: asciiMesh, camera })
    }

    
    const resize = () => {
      const newWidth = width || window.innerWidth
      const newHeight = height || window.innerHeight
      
      renderer.setSize(newWidth, newHeight)
      camera.perspective({
        aspect: newWidth / newHeight,
      })
      asciiProgram.uniforms.uResolution.value = [newWidth, newHeight]
    }

    window.addEventListener("resize", resize)
    resize()

    
    animationFrameRef.current = requestAnimationFrame(animate)

    
    return () => {
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      
      window.removeEventListener("resize", resize)

      
      currentTextureMap.forEach(() => {
        try {
          
          
        } catch (error) {
          console.warn('[ASCII RENDERER] Failed to dispose texture on cleanup:', error)
        }
      })
      currentTextureMap.clear()

      
      if (currentTextureRef.current) {
        currentTextureRef.current = null
      }
      if (prevTextureRef.current) {
        prevTextureRef.current = null
      }

      
      opacityAnimationStartTime.current = 0
      opacityAnimationProgress.current = 1.0
      currentOpacity.current = 0.0
      targetOpacity.current = 0.0
      startOpacity.current = 0.0

      
      if (canvas && container) {
        container.removeChild(canvas)
        canvasRef.current = null
      }
    }
  }, [controls, width, height]) 

  
  useEffect(() => {
    if (!noiseProgramRef.current) return
    
    const switchTexture = async () => {
      if (!imageUrl) {
        
        if (currentTextureRef.current && currentOpacity.current > 0.0) {
          startOpacity.current = currentOpacity.current
          targetOpacity.current = 0.0
          opacityAnimationProgress.current = 0.0
          opacityAnimationStartTime.current = performance.now()
          
          
          prevTextureRef.current = currentTextureRef.current
          currentTextureRef.current = null
          crossfadeProgress.current = 0.0
          crossfadeStartTime.current = performance.now()
        }
        return
      }

      
      const existingTexture = textureMapRef.current.get(imageUrl)
      if (existingTexture) {
        
        if (currentTextureRef.current !== existingTexture) {
          prevTextureRef.current = currentTextureRef.current
          currentTextureRef.current = existingTexture
          crossfadeProgress.current = 0.0
          crossfadeStartTime.current = performance.now()
          
          
          if (currentOpacity.current < 1.0) {
            startOpacity.current = currentOpacity.current
            targetOpacity.current = 1.0
            opacityAnimationProgress.current = 0.0
            opacityAnimationStartTime.current = performance.now()
          }
        }
        return
      }
      
      

      
      const MAX_TEXTURES = 5
      if (textureMapRef.current.size >= MAX_TEXTURES) {
        
        const entries = Array.from(textureMapRef.current.entries())
        const texturesToRemove = entries.slice(0, entries.length - MAX_TEXTURES + 1)
        
        texturesToRemove.forEach(([url]) => {
          try {
            
            
          } catch (error) {
            console.warn('[ASCII RENDERER] Failed to dispose texture:', error)
          }
          textureMapRef.current.delete(url)
        })
      }

      
      try {
        
        const renderer = rendererRef.current
        if (!renderer) {
          console.warn('[ASCII RENDERER] No renderer available for texture loading')
          return
        }
        
        const texture = await loadTexture(renderer, imageUrl, getCachedTexture, cacheTexture)
        if (texture && imageUrl) { 
          textureMapRef.current.set(imageUrl, texture)
          
          
          prevTextureRef.current = currentTextureRef.current
          currentTextureRef.current = texture
          crossfadeProgress.current = 0.0
          crossfadeStartTime.current = performance.now()
          
          
          if (currentOpacity.current < 1.0) {
            startOpacity.current = currentOpacity.current
            targetOpacity.current = 1.0
            opacityAnimationProgress.current = 0.0
            opacityAnimationStartTime.current = performance.now()
          }
          
          
        }
      } catch (error) {
        console.warn('[ASCII RENDERER] Failed to load texture:', error)
      }
    }

    switchTexture()
  }, [imageUrl, getCachedTexture, cacheTexture]) 

  return (
    <div
      ref={containerRef}
      className={className || "fixed inset-0 z-0 pointer-events-none"}
      style={{ 
        opacity: style?.opacity !== undefined ? style.opacity : (imageUrl ? 0.8 : 0.6),
        width: width ? `${width}px` : undefined,
        height: height ? `${height}px` : undefined,
        ...style
      }}
    />
  )
}
