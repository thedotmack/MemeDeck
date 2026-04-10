import Providers from "@/components/providers/privy-provider";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata, Viewport } from "next";
import type React from "react";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "MemeDeck - Real Money Crypto Trading Card Game",
  description:
    "Trade meme coins with real money through an innovative card game interface. Draw cards to buy trending tokens, manage your deck, and race to profit before the dump.",
  keywords:
    "meme coin trading, crypto trading game, solana memes, pump and dump, real money trading, jupiter dex, meme tokens, crypto gambling",
  authors: [{ name: "MemeDeck Team" }],
  applicationName: "MemeDeck",
  appleWebApp: {
    capable: true,
    title: "MemeDeck",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/apple-icon.png",
    shortcut: "/apple-icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://memedeck.win",
    title: "MemeDeck - Real Money Meme Coin Trading Game",
    description:
      "Trade meme coins with real money through an innovative card game interface. Draw cards to buy trending tokens, manage your deck, and race to profit before the dump.",
    siteName: "MemeDeck",
    images: [
      {
        url: "https://memedeck.win/pepe-dealer.webp",
        width: 1200,
        height: 630,
        alt: "MemeDeck - Pepe the Dealer helps you trade meme coins",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MemeDeck - Real Money Meme Trading Game",
    description:
      "Draw cards to instantly buy trending meme coins. It's us vs the insiders - time your sells perfectly with Pepe's coaching.",
    images: ["https://memedeck.win/pepe-dealer.webp"],
    creator: "@_SurfSolana",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          href="/fonts/Nasa.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/blauer-nue/BlauerNue-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/blauer-nue/BlauerNue-Bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
        <GoogleAnalytics gaId="G-1Z79VMKQT4" />
        <Analytics />
      </body>
    </html>
  );
}
