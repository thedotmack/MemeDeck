"use client";

import CTAButton from "@/components/cta-button";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { usePrivy } from "@privy-io/react-auth";
import { useExportWallet } from "@privy-io/react-auth/solana";
import { Check, Copy, Wallet } from "lucide-react";
import { useState } from "react";

export default function WelcomeInstructions() {
  const { user, authenticated, login } = usePrivy();
  const { exportWallet } = useExportWallet();
  const auth = useStore.use.auth();
  const funding = useStore.use.funding();
  const openFundingModal = useStore.use.openFundingModal();
  const closeFundingModal = useStore.use.closeFundingModal();
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateKey, setPrivateKey] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const walletAddress = auth.user?.walletAddress;

  const copyWalletAddress = async () => {
    if (walletAddress) {
      try {
        await navigator.clipboard.writeText(walletAddress);
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
      } catch (error) {
        console.error("Failed to copy wallet address:", error);
      }
    }
  };

  const handleExportPrivateKey = async () => {
    setIsExporting(true);
    try {
      const wallet = await exportWallet() as any;
      const privKey: string | undefined = wallet && typeof wallet === 'object' ? (wallet as any).privateKey : undefined;
      if (privKey) {
        setPrivateKey(privKey);
        setShowPrivateKey(true);
      }
    } catch (error) {
      console.error("Failed to export private key:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const copyPrivateKey = async () => {
    if (privateKey) {
      try {
        await navigator.clipboard.writeText(privateKey);
      } catch (error) {
        console.error("Failed to copy private key:", error);
      }
    }
  };

  const handleFundWallet = () => {
    openFundingModal();
  };

  return (
    <div className="relative z-20 w-full max-w-5xl mx-auto space-y-8 text-center">
      {}
      {authenticated && walletAddress ? (
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white">
            Your Embedded Wallet Address
          </h3>
          <div className="flex items-center justify-center gap-2 p-3 bg-black/20 rounded-lg border border-gray-600">
            <code className="text-sm text-green-400 break-all">
              {walletAddress}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyWalletAddress}
              className="flex-shrink-0"
            >
              {copiedAddress ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center">
          <CTAButton onClick={login} />
        </div>
      )}

      {}
      {authenticated && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {}
          <div className="relative">
            <div className="flex justify-around sm:block p-4 bg-blue-900/20 rounded-lg border border-blue-500/30 h-full">
              <div className="flex gap-2 items-center justify-center mb-3">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full text-sm font-bold mb-2">
                  1
                </div>
                <h4 className="text-lg text-left leading-[1] font-semibold text-blue-300">
                  Fund
                  <br /> Wallet
                </h4>
              </div>

              <div className="w-7/12 sm:w-full space-y-2 text-sm text-gray-300">
                <div>
                  Add at least <strong className="text-blue-200">$20</strong> To
                  Start
                </div>

                <Button
                  onClick={handleFundWallet}
                  size="sm"
                  className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Wallet className="h-3 w-3 mr-1" />
                  Fund Wallet
                </Button>
              </div>
            </div>
            {}
            <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-gray-400 text-xl">
              →
            </div>
          </div>

          {}
          <div className="hidden sm:block p-4 bg-green-900/20 rounded-lg border border-green-500/30 h-full">
            <div className="flex gap-2 items-center justify-center mb-3">
              <div className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full text-sm font-bold mb-2">
                2
              </div>
              <h4 className="text-lg text-left leading-[1] font-semibold text-green-300">
                Start
                <br /> Playing
              </h4>
            </div>

            <div className="space-y-2 text-sm text-gray-300">
              <div>Draw cards to buy tokens</div>
              <div>Wait for value to go up</div>
              <div>Sell for real profits</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
