export const MEMEDECK_PHRASES = {
  trading: {
    title: "📈 Trading Actions",
    phrases: {
      buying: [
        "Nice pick! Time to see if this one moons!",
        "Another card for the collection! Let's gooo!",
        "Feeling lucky? This one's got potential!",
        "Added to the deck! May the charts be ever in your favor!",
        "Fresh card acquired! Now we wait for the magic..."
      ],
      selling: [
        "Time to cash out? Smart move... maybe?",
        "Profit taking activated! This is the way!",
        "Card played! Hope you timed that right!",
        "Another one bites the dust! On to the next!",
        "Closing position! May your profits be ever green!"
      ],
      watching: [
        "Just vibing and watching those candles dance!",
        "Market watching mode activated! This is fine... everything is fine.",
        "Charts looking spicy today! Hold onto your butts!",
        "Number watching intensifies... this is totally normal behavior."
      ]
    }
  },
  
  market: {
    title: "📊 Market Commentary", 
    phrases: {
      pumping: [
        "This one's mooning! 🚀 All aboard the rocket ship!",
        "Green candles everywhere! Nature is healing!",
        "Number go up! Brain make happy chemicals!",
        "Pump it up! This is what we live for!",
        "To the moon and beyond! Mars is the next stop!"
      ],
      dumping: [
        "Bit of a rough patch here... it's just a dip, right? RIGHT?",
        "Red candles build character. Lots and lots of character.",
        "This is fine. Everything is fine. *eye twitching*",
        "Just a little correction! Totally normal market behavior!",
        "Discount prices! Time to buy the dip... again..."
      ],
      sideways: [
        "Crab market activated! Going sideways like a boss!",
        "Patience, young trader. The best moves come to those who wait.",
        "Consolidation mode! This is where legends are made!",
        "Boring is good! Boring means we can actually think clearly!"
      ]
    }
  },
  
  achievements: {
    title: "🏆 Achievement Celebrations",
    phrases: {
      firstTrade: [
        "Welcome to the club, anon! Your journey into madness begins...",
        "First trade unlocked! Baby steps into the trading thunderdome!",
        "Look at you go! From zero to trader in record time!",
        "WAGMI! We're all gonna make it... eventually!"
      ],
      profitMilestone: [
        "Now THAT'S what I call diamond hands! 💎🙌",
        "You magnificent trader, you actually did it!",
        "Profit milestone achieved! You're basically Warren Buffett now!",
        "From zero to hero! Well, from zero to slightly above zero!"
      ],
      lossRecovery: [
        "Phoenix rising from the ashes! This is your comeback story!",
        "Bounced back like a champion! That's the spirit!",
        "Recovery mode activated! Never count out a true degen!",
        "Plot twist! The comeback is always stronger than the setback!"
      ]
    }
  },
  
  educational: {
    title: "🎓 Educational & Explanations",
    phrases: {
      memedeck: [
        "See that green line? That's good news! Green means number go up!",
        "Volume means how many people are trading. More volume, more excitement!",
        "The Money Pool shows liquidity - like how deep the swimming pool is!",
        "Heart & Sol is volatility - how jumpy this token gets. Racing pulse energy!",
        "The Pooligarchy shows distribution - who's holding the bag!",
        "Hot or Bot measures community realness - are these real people or robots?"
      ],
      general: [
        "Charts are like mood rings for tokens - they show the vibe!",
        "Support levels are like trampolines - they bounce you back up!",
        "Resistance is like a ceiling - hard to break through!",
        "Candlesticks tell stories - red ones are sad, green ones are happy!"
      ]
    }
  },
  
  risk: {
    title: "⚠️ Risk Management",
    phrases: {
      warnings: [
        "Remember, only trade with what you can afford to lose!",
        "Diversify those memes! Don't put all eggs in one basket!",
        "This is still gambling, just with better graphics!",
        "Past performance doesn't guarantee future results, but YOLO!",
        "Sir, this is a casino. Would you like some complimentary hopium?"
      ],
      wisdom: [
        "Scared money don't make money... but smart money doesn't lose it all!",
        "Bulls make money, bears make money, but pigs get slaughtered!",
        "The market can stay irrational longer than you can stay solvent!",
        "When in doubt, zoom out! Unless it makes you feel worse..."
      ]
    }
  },
  
  motivation: {
    title: "🎯 Motivation & Encouragement",
    phrases: {
      daily: [
        "Another day, another chance to make it big! Let's gooo!",
        "Markets open, hopium activated! Today's the day!",
        "Time to check those charts for the 47th time today!",
        "Good vibes only! May your candles be green and your bags full!"
      ],
      perseverance: [
        "Every expert was once a beginner! Keep learning!",
        "Rome wasn't built in a day, and neither are portfolios!",
        "Mistakes are just expensive education! Tuition paid!",
        "The best traders are made in bear markets!"
      ]
    }
  },
  
  random: {
    title: "🧠 Random Pepe Wisdom",
    phrases: {
      general: [
        "Have you tried turning your portfolio off and on again?",
        "Instructions unclear, bought more memecoins",
        "This app is so good, it makes TikTok look productive!",
        "Error 404: Profits not found. Please try again later.",
        "Achievement unlocked: Probably should have been working instead",
        "Loading... Just kidding, I don't actually do anything useful",
        "Why do we do this to ourselves? Oh right, the memes.",
        "I'm not a financial advisor, I'm just a frog on the internet."
      ]
    }
  }
};


function getAllPhrases(): string[] {
  const allPhrases: string[] = [];
  
  Object.values(MEMEDECK_PHRASES).forEach(category => {
    Object.values(category.phrases).forEach(phraseGroup => {
      allPhrases.push(...phraseGroup);
    });
  });
  
  return allPhrases;
}


export function getRandomPhrase(categoryKey?: keyof typeof MEMEDECK_PHRASES, subcategoryKey?: string): string {
  const phrases = getAllPhrases();
  
  if (categoryKey && MEMEDECK_PHRASES[categoryKey]) {
    const category = MEMEDECK_PHRASES[categoryKey];
    if (subcategoryKey) {
      const phrasesRecord = category.phrases as Record<string, string[]>; 
      const maybeSub = phrasesRecord[subcategoryKey];
      if (maybeSub) {
        return maybeSub[Math.floor(Math.random() * maybeSub.length)];
      }
    }
    
    const categoryPhrases: string[] = [];
    Object.values(category.phrases).forEach(phraseGroup => {
      categoryPhrases.push(...phraseGroup);
    });
    return categoryPhrases[Math.floor(Math.random() * categoryPhrases.length)];
  }
  
  return phrases[Math.floor(Math.random() * phrases.length)];
}


export const getPhraseForContext = {
  onBuy: () => getRandomPhrase('trading', 'buying'),
  onSell: () => getRandomPhrase('trading', 'selling'),
  onPump: () => getRandomPhrase('market', 'pumping'),
  onDump: () => getRandomPhrase('market', 'dumping'),
  onAchievement: () => getRandomPhrase('achievements', 'profitMilestone'),
  onFirstTrade: () => getRandomPhrase('achievements', 'firstTrade'),
  onEducation: () => getRandomPhrase('educational', 'memedeck'),
  onRisk: () => getRandomPhrase('risk', 'warnings'),
  random: () => getRandomPhrase('random', 'general')
};