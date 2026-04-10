


import { isTTSCacheEntry, type TTSCacheEntry } from '@/lib/types/guards';
import crypto from 'crypto';
import fs from 'fs/promises';
import Redis from 'ioredis';
import path from 'path';



interface TTSResult {
  audioUrl: string;
  duration: number;
  timestamps: {
    characters: string[];
    characterStartTimes: number[];
    characterEndTimes: number[];
  };
  cached: boolean;
  filePath: string;
}

class TTSCacheService {
  private redis: Redis;
  private cachePrefix = 'tts';
  private audioDir = path.join(process.cwd(), 'public', 'cached-audio');

  constructor(redisClient?: Redis) {
    this.redis = redisClient || new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.ensureAudioDirectory();
  }

  private async ensureAudioDirectory() {
    try {
      await fs.mkdir(this.audioDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create audio directory:', error);
    }
  }

  
  private generateTextHash(text: string): string {
    return crypto.createHash('sha256').update(text.trim().toLowerCase()).digest('hex').slice(0, 16);
  }

  
  private getCacheKey(textHash: string, voiceId: string): string {
    return `${this.cachePrefix}:${textHash}:${voiceId}`;
  }

  
  private getFilePath(textHash: string, voiceId: string): string {
    const filename = `${textHash}-${voiceId}.mp3`;
    return path.join(this.audioDir, filename);
  }

  
  private getPublicUrl(textHash: string, voiceId: string): string {
    return `/cached-audio/${textHash}-${voiceId}.mp3`;
  }

  
  async getCachedTTS(text: string, voiceId: string): Promise<TTSResult | null> {
    try {
      const textHash = this.generateTextHash(text);
      const cacheKey = this.getCacheKey(textHash, voiceId);
      
      
      const cached = await this.redis.get(cacheKey);
      if (!cached) {
        return null;
      }

  let parsed: unknown
  try { parsed = JSON.parse(cached) } catch { parsed = null }
  if (!isTTSCacheEntry(parsed)) { await this.redis.del(cacheKey); return null }
  const cacheEntry = parsed
      
      
      const filePath = this.getFilePath(textHash, voiceId);
      try {
        await fs.access(filePath);
      } catch {
        
        await this.redis.del(cacheKey);
        return null;
      }

      
      
      return {
        audioUrl: this.getPublicUrl(textHash, voiceId),
        duration: cacheEntry.duration,
        timestamps: cacheEntry.timestamps,
        cached: true,
        filePath: cacheEntry.filePath
      };

    } catch (error) {
      console.error('Error checking TTS cache:', error);
      return null;
    }
  }

  
  async storeTTS(
    text: string,
    voiceId: string,
    audioBuffer: ArrayBuffer,
    duration: number,
    timestamps: {
      characters: string[];
      characterStartTimes: number[];
      characterEndTimes: number[];
    }
  ): Promise<TTSResult> {
    try {
      const textHash = this.generateTextHash(text);
      const filePath = this.getFilePath(textHash, voiceId);
      const cacheKey = this.getCacheKey(textHash, voiceId);

      
      const buffer = Buffer.from(audioBuffer);
      await fs.writeFile(filePath, buffer);

      
      const cacheEntry: TTSCacheEntry = {
        textHash,
        voiceId,
        filePath,
        duration,
        timestamps,
        fileSize: buffer.length,
        createdAt: Date.now(),
        version: this.generateVersionHash({ text, voiceId, duration })
      };

      
      await this.redis.set(cacheKey, JSON.stringify(cacheEntry));

      

      return {
        audioUrl: this.getPublicUrl(textHash, voiceId),
        duration,
        timestamps,
        cached: false,
        filePath
      };

    } catch (error) {
      console.error('Error storing TTS cache:', error);
      throw error;
    }
  }

  
  private generateVersionHash(content: any): string {
    return Buffer.from(JSON.stringify(content)).toString('base64').slice(0, 8);
  }

  
  async getCacheStats(): Promise<{
    totalEntries: number;
    totalFileSize: number;
    oldestEntry: number | null;
  }> {
    try {
      const pattern = `${this.cachePrefix}:*`;
      const keys = await this.redis.keys(pattern);
      
      let totalFileSize = 0;
      let oldestEntry: number | null = null;

      for (const key of keys) {
          const cached = await this.redis.get(key)
          if (cached) {
            try {
              const entryParsed = JSON.parse(cached)
              if (isTTSCacheEntry(entryParsed)) {
                totalFileSize += entryParsed.fileSize
                if (!oldestEntry || entryParsed.createdAt < oldestEntry) oldestEntry = entryParsed.createdAt
              } else { await this.redis.del(key) }
            } catch { await this.redis.del(key) }
          }
      }

      return {
        totalEntries: keys.length,
        totalFileSize,
        oldestEntry
      };

    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalEntries: 0,
        totalFileSize: 0,
        oldestEntry: null
      };
    }
  }

  
  async clearTTS(text: string, voiceId: string): Promise<boolean> {
    try {
      const textHash = this.generateTextHash(text);
      const cacheKey = this.getCacheKey(textHash, voiceId);
      const filePath = this.getFilePath(textHash, voiceId);

      
      await this.redis.del(cacheKey);

      
      try {
        await fs.unlink(filePath);
      } catch {
        
      }

      
      return true;

    } catch (error) {
      console.error('Error clearing TTS cache:', error);
      return false;
    }
  }

  
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    stats?: any;
    error?: string;
  }> {
    try {
      await this.redis.ping();
      const stats = await this.getCacheStats();
      
      return {
        status: 'healthy',
        stats
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}


let ttsCache: TTSCacheService | null = null;

export function getTTSCacheService(redisClient?: Redis): TTSCacheService {
  if (!ttsCache) {
    ttsCache = new TTSCacheService(redisClient);
  }
  return ttsCache;
}