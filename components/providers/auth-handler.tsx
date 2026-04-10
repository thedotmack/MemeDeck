"use client";

import { useStore } from "@/lib/store";
import { createInitialUserObject } from "@/lib/utils/auth-helpers";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";


export function AuthHandler() {
  const { ready, authenticated, user, getAccessToken } = usePrivy();
  const { ready: walletsReady, wallets } = useWallets();
  const router = useRouter();

  
  const setAuth = useStore.use.setAuth();
  const switchToUser = useStore.use.switchToUser();
  const setUserTier = useStore.use.setUserTier();
  const userId = useStore.use.userId();
  const isDemoMode = useStore.use.isDemoMode();
  const initializeDemoMode = useStore.use.initializeDemoMode();

  

  
  const embeddedWallet = wallets.find(
    (wallet) => wallet.standardWallet.name === "Privy"
  );
  const embeddedWalletAddress = embeddedWallet?.address;

  

  
  const setDefaultUserTier = useCallback(() => {
    setUserTier('standard');
  }, [setUserTier]);

  
  const handleUserLogin = useCallback(async () => {
    if (!user || !embeddedWalletAddress) return;

    
    const isNewUserSession = !userId || userId === "demo" || userId !== user.id;

    
    try {
      const accessToken = await getAccessToken();

      
      setAuth({
        user: createInitialUserObject(user.id, embeddedWalletAddress, {
          username: user.email?.address || user.id,
          isLiveMode: true, 
        }),
        isAuthenticated: true,
        isLoading: false,
        accessToken: accessToken,
        tradingMode: "live",
        canTradeLive: true,
        embeddedWallet: embeddedWallet,
      });

      await switchToUser(
        user.id,
        accessToken || undefined,
        embeddedWalletAddress
      );

      
      setDefaultUserTier();


    } catch (error) {
      console.error("🔄 [PRIVY] Failed to load authenticated user:", error);
    }
  }, [user, embeddedWalletAddress, embeddedWallet, userId, getAccessToken, setAuth, setDefaultUserTier, switchToUser]); 

  
  const handleUserLogout = useCallback(async () => {
    setAuth({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      accessToken: null,
      tradingMode: "demo",
      canTradeLive: false,
      embeddedWallet: null,
    });
  }, [setAuth]); 

  
  useEffect(() => {
    if (!ready || !walletsReady) return;

    if (authenticated && user && embeddedWalletAddress) {
      
      if (!userId || userId === "demo" || userId !== user.id) {
        handleUserLogin();
      }
    } else if (!authenticated) {
      handleUserLogout();

      
      if (!isDemoMode) {
        initializeDemoMode();
      }
    }
  }, [ready, walletsReady, authenticated, user, isDemoMode, embeddedWalletAddress, userId, handleUserLogin, handleUserLogout, initializeDemoMode]); 

  return null;
}