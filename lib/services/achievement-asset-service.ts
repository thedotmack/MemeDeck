


const ACHIEVEMENT_IMAGE_MAP: Record<string, string> = {
  
  'first_trade': '/achievements/first_trade.webp',
  'trader_10': '/achievements/trader_10.webp', 
  'trader_100': '/achievements/trader_100.webp',
  'trader_1000': '/achievements/trader_1000.webp',
  
  
  'daily_trader_7': '/achievements/daily_trader_7.webp',
  'daily_trader_30': '/achievements/daily_trader_30.webp',
  'weekly_trader_12': '/achievements/weekly_trader_12.webp',
  'early_bird': '/achievements/early_bird.webp',
  
  
  'portfolio_100': '/achievements/portfolio_100.webp',
  'portfolio_1000': '/achievements/portfolio_1000.webp',
  'portfolio_10000': '/achievements/portfolio_10000.webp',
  
  
  'profit_100': '/achievements/profit_100.webp',
  
  
  'comeback_king': '/achievements/comeback_king.webp',
  
  
  'diamond_hands_24h': '/achievements/diamond_hands_24h.webp',
  
  
  'big_winner': '/achievements/big_winner.webp',
  'moonshot': '/achievements/moonshot.webp',
  'first_green': '/achievements/first_green.webp',
  'decent_achiever': '/achievements/decent_achiever.webp',
  'first_red': '/achievements/first_red.webp',
  'rekt': '/achievements/rekt.webp',
  
  
  'speed_demon': '/achievements/speed_demon.webp',
  
  
  'diverse_5': '/achievements/diverse_5.webp',
};


const DEFAULT_ACHIEVEMENT_IMAGE = '/achievements/default-achievement.png';

export function getAchievementImage(achievementId: string): string {
  return ACHIEVEMENT_IMAGE_MAP[achievementId] || DEFAULT_ACHIEVEMENT_IMAGE;
}

