


import { NextRequest, NextResponse } from 'next/server';
import { getTTSCacheService } from '@/lib/services/tts-cache-service';

interface ElevenLabsResponse {
  audio_base64: string;
  alignment: {
    characters: string[];
    character_start_times_seconds: number[];
    character_end_times_seconds: number[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId = '21m00Tcm4TlvDq8ikWAM' } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text parameter is required and must be a string' },
        { status: 400 }
      );
    }

    const ttsCache = getTTSCacheService();

    
    const cached = await ttsCache.getCachedTTS(text, voiceId);
    if (cached) {
      return NextResponse.json({
        success: true,
        audioUrl: cached.audioUrl,
        duration: cached.duration,
        timestamps: cached.timestamps,
        cached: true
      });
    }

    
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.3, 
            similarity_boost: 0.75, 
            speed: 0.8, 
            style: 1.0, 
            use_speaker_boost: true 
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }

    const data: ElevenLabsResponse = await response.json();

    
    const audioData = atob(data.audio_base64);
    const audioBuffer = new ArrayBuffer(audioData.length);
    const audioView = new Uint8Array(audioBuffer);
    for (let i = 0; i < audioData.length; i++) {
      audioView[i] = audioData.charCodeAt(i);
    }

    
    const duration = data.alignment.character_end_times_seconds.length > 0 
      ? data.alignment.character_end_times_seconds[data.alignment.character_end_times_seconds.length - 1] * 1000
      : 0;

    
    const timestamps = {
      characters: data.alignment.characters,
      characterStartTimes: data.alignment.character_start_times_seconds.map(t => t * 1000),
      characterEndTimes: data.alignment.character_end_times_seconds.map(t => t * 1000)
    };

    
    const result = await ttsCache.storeTTS(text, voiceId, audioBuffer, duration, timestamps);

    return NextResponse.json({
      success: true,
      audioUrl: result.audioUrl,
      duration: result.duration,
      timestamps: result.timestamps,
      cached: false
    });

  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate speech',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const ttsCache = getTTSCacheService();
    const health = await ttsCache.healthCheck();
    
    return NextResponse.json({
      service: 'TTS Cache',
      ...health
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    );
  }
}