


interface ElevenLabsVoice {
  id: string;
  name: string;
  gender: 'male' | 'female';
  accent: string;
}


const ELEVENLABS_VOICES: ElevenLabsVoice[] = [
  { id: 'Bj9UqZbhQsanLzgalpEG', name: 'southern guy', gender: 'male', accent: 'Custom' },
];


export const DEFAULT_PEPE_VOICE = ELEVENLABS_VOICES[0]; 



export const preprocessSpeechText = (text: string): string => {
  
  return text.trim();
};


export async function speakWithElevenLabs(
  text: string,
  voiceId: string = DEFAULT_PEPE_VOICE.id,
  onAnimationFrame?: (frameType: 'open' | 'closed' | 'mid', intensity: number) => void,
  onComplete?: () => void
): Promise<void> {
  try {
    const processedText = preprocessSpeechText(text);
    
    
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: processedText,
        voiceId
      })
    });

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status}`);
    }

    const ttsResult = await response.json();
    
    if (!ttsResult.success) {
      throw new Error(ttsResult.error || 'TTS generation failed');
    }

    
    if (onAnimationFrame && ttsResult.timestamps) {
      const syllables = groupTimestampsIntoSyllables(ttsResult.timestamps);
      
      syllables.forEach((syllable) => {
        setTimeout(() => {
          
          onAnimationFrame('open', syllable.intensity);
          
          
          setTimeout(() => {
            onAnimationFrame('mid', syllable.intensity);
          }, (syllable.endTime - syllable.startTime) * 0.3);
          
          
          setTimeout(() => {
            onAnimationFrame('closed', 0);
          }, syllable.endTime - syllable.startTime);
          
        }, syllable.startTime);
      });
    }
    
    
    await playAudioFile(ttsResult.audioUrl, onComplete);
    
  } catch (error) {
    console.error('ElevenLabs TTS failed:', error);
    onComplete?.();
  }
}



function groupTimestampsIntoSyllables(timestamps: {
  characters: string[];
  characterStartTimes: number[];
  characterEndTimes: number[];
}): Array<{
  startTime: number;
  endTime: number;
  intensity: number;
}> {
  const syllables: Array<{
    startTime: number;
    endTime: number;
    intensity: number;
  }> = [];

  
  const words: Array<{
    word: string;
    startTime: number;
    endTime: number;
    characters: Array<{ char: string; startTime: number; endTime: number }>;
  }> = [];

  let currentWord = '';
  let currentCharacters: Array<{ char: string; startTime: number; endTime: number }> = [];
  let wordStartTime = 0;

  for (let i = 0; i < timestamps.characters.length; i++) {
    const char = timestamps.characters[i];
    const startTime = timestamps.characterStartTimes[i];
    const endTime = timestamps.characterEndTimes[i];

    if (char === ' ' || char === '\n' || char === '\t') {
      
      if (currentWord.trim() && currentCharacters.length > 0) {
        words.push({
          word: currentWord.trim(),
          startTime: wordStartTime,
          endTime: currentCharacters[currentCharacters.length - 1].endTime,
          characters: [...currentCharacters]
        });
      }

      
      currentWord = '';
      currentCharacters = [];
      wordStartTime = 0;
    } else {

      if (currentWord === '') {
        wordStartTime = startTime;
      }
      currentWord += char;
      currentCharacters.push({ char, startTime, endTime });
    }
  }


  if (currentWord.trim() && currentCharacters.length > 0) {
    words.push({
      word: currentWord.trim(),
      startTime: wordStartTime,
      endTime: currentCharacters[currentCharacters.length - 1].endTime,
      characters: [...currentCharacters]
    });
  }


  words.forEach(word => {

    const vowelGroups = word.word.toLowerCase().match(/[aeiouy]+/g) || [];
    const syllableCount = Math.max(1, vowelGroups.length);
    
    const wordDuration = word.endTime - word.startTime;
    const syllableDuration = wordDuration / syllableCount;

    for (let i = 0; i < syllableCount; i++) {
      const syllableStart = word.startTime + (i * syllableDuration);
      const syllableEnd = syllableStart + syllableDuration;
      

      const intensity = 0.6 + (Math.random() * 0.4);
      
      syllables.push({
        startTime: syllableStart,
        endTime: syllableEnd,
        intensity
      });
    }
  });

  return syllables;
}


async function playAudioFile(audioUrl: string, onComplete?: () => void): Promise<void> {
  if (typeof window === 'undefined') {
    onComplete?.();
    return;
  }

  try {
    const audio = new Audio(audioUrl);
    
    audio.onended = () => {
      onComplete?.();
    };
    
    audio.onerror = () => {
      console.error('Error playing audio file:', audioUrl);
      onComplete?.();
    };
    
    await audio.play();
    
  } catch (error) {
    console.error('Failed to play audio:', error);
    onComplete?.();
  }
}

