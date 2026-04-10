export const SPRITE_CONFIG = {
  basePath: '/frames/',
  
  
  sequence: ['1-1.webp', '1-2.webp', '1-3.webp', '1-4.webp', '1-5.webp'],
  
  
  blinkOverlays: {
    '1-1.webp': '1-1-blink.webp',
    '1-2.webp': '1-2-blink.webp',
    '1-3.webp': '1-3-blink.webp',
    '1-4.webp': '1-4-blink.webp',
    '1-5.webp': '1-5-blink.webp'
  }
} as const;

export const ANIMATION_CONFIG = {
  blinkInterval: { min: 2000, max: 5000 },
  blinkDuration: 150,
  floatAmplitude: 5,
  floatDuration: 2000,
  frameDuration: 60 
} as const;