"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { useStore } from "@/lib/store";
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";

export function AuthLoadingWrapper({ children }: { children: React.ReactNode }) {
  const { ready: privyReady } = usePrivy();
  const { ready: walletsReady } = useWallets();
  const [isInitializing, setIsInitializing] = useState(true);
  
  
  useEffect(() => {
    if (privyReady && walletsReady) {
      
      const timer = setTimeout(() => {
        setIsInitializing(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [privyReady, walletsReady]);

  
  if (isInitializing) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/card-face-IfUoFstUaf97oc3Aqyg3c6JmQUSWlA.webp"
            alt="MemeDeck Logo"
            width={120}
            height={120}
            className="animate-pulse"
          />
          <h1 className="text-4xl font-bold text-white tracking-normal text-retro-shadow">
            MEMEDECK
          </h1>
          <div className="flex items-center gap-2">
            <motion.div className="w-2 h-2 bg-green-400 rounded-full" animate={{ y: [0, -10, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
            <motion.div className="w-2 h-2 bg-green-400 rounded-full" animate={{ y: [0, -10, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} />
            <motion.div className="w-2 h-2 bg-green-400 rounded-full" animate={{ y: [0, -10, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}