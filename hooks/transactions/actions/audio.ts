import { audioSystem, ensureAudioInitialized } from "@/lib/audio";

export const playSound = async (name: "card_draw" | "trade_sent" | "trade_confirmed") => {
  await ensureAudioInitialized();
  audioSystem.playTradingSound(name);
};
