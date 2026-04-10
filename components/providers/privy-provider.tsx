"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import {
    toSolanaWalletConnectors,
} from "@privy-io/react-auth/solana";
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
import { useMemo } from "react";
import { AudioInitializer } from "../audio/audio-initializer";
import { ModalProvider } from "../ui/modal-provider";
import { ActivityProvider } from "./activity-provider";
import { AuthHandler } from "./auth-handler";
import { AuthLoadingWrapper } from "./auth-loading-wrapper";
import { PartnerOnboardingHandler } from "./partner-onboarding-handler";
import { ToastProvider } from "./toast-provider";


declare global {
  interface Window {
    Privy?: {
      getAccessToken?: () => Promise<string>;
    };
  }
}

export default function Providers({ children }: { children: React.ReactNode }) {
  
  
  const solanaConnectors = useMemo(() => toSolanaWalletConnectors(), []);
  
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {
          theme: "dark",
        },
        loginMethods: [
          "email",
          "google", 
          "twitter",
          "discord",
          "sms",
          "wallet",
        ],
        solana: {
          rpcs: {
            'solana:mainnet': {
              rpc: createSolanaRpc(process.env.NEXT_PUBLIC_RPC_URL!),
              rpcSubscriptions: createSolanaRpcSubscriptions(process.env.NEXT_PUBLIC_RPC_URL!.replace('https://', 'wss://'))
            }
          }
        },
        externalWallets: {
          solana: {
            connectors: solanaConnectors,
          },
        },
        
        embedded: {
          solana: {
            createOnLogin: "all-users",
          },
        },
      } as any}>
      <ToastProvider>
        <ModalProvider>
          <ActivityProvider>
            <AuthHandler />
            <PartnerOnboardingHandler />
            <AudioInitializer />
            <AuthLoadingWrapper>
              {children}
            </AuthLoadingWrapper>
          </ActivityProvider>
        </ModalProvider>
      </ToastProvider>
    </PrivyProvider>
  );
}