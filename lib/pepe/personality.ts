import { getRandomPhrase, getPhraseForContext } from './phrases';

class PepePersonality {
  
  getContextualResponse(context: string): string {
    switch (context) {
      case 'achievement_unlocked':
        return getPhraseForContext.onAchievement();
      default:
        return getPhraseForContext.random();
    }
  }

}


export const defaultPepePersonality = new PepePersonality();