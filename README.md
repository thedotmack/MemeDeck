# MemeDeck

A Next.js 15 reference implementation of a card-game-style trading interface for Solana memecoins, built on top of Jupiter's DEX aggregator. MemeDeck is released as an open-source **educational tool** for developers who want to learn how to build a production-grade Solana trading UI — complete with wallet onboarding, real-time token feeds, transaction orchestration, and DEX integration.

> **⚠️ Educational use only.** This project is not financial advice, not a production trading product, and not audited. Trading memecoins is risky. Use at your own risk and always test against devnet before touching mainnet.

## What's inside

MemeDeck demonstrates a complete end-to-end Solana dApp stack:

- **Next.js 15** (App Router, React 19, TypeScript, Turbopack)
- **Zustand** with `immer` for state management — multi-slice store with adaptive demo vs. authenticated persistence
- **Prisma + PostgreSQL** for user profiles, transaction history, achievements, and partner/referral data
- **Privy** for embedded-wallet authentication with Solana support
- **Jupiter** integration via a local Node.js proxy (`server_v3/jupiter-proxy.mjs`) that handles quoting, swap building, rate-limiting, and caching
- **Solana Kit / @solana/web3.js** for on-chain interactions
- **Tailwind CSS 4** + **shadcn/ui** + **Radix UI** primitives
- **Three.js / React Three Fiber** for 3D card effects, **Motion** for animation
- **Tone.js** for audio feedback
- **Vitest** for unit and integration tests

## Learning goals

Reading through this codebase will show you how to:

1. **Structure a Zustand store** for a complex trading app using multiple slices (auth, trading, portfolio, transactions, pools, activity, UI, tutorial, achievements) with immer and persistence.
2. **Integrate Privy embedded wallets** with Solana — sign-in, session management, and transaction signing.
3. **Route swaps through Jupiter** using a proxy service for caching, rate-limiting, and quote freshness.
4. **Build a trading UI** with optimistic updates, real-time polling, and transaction state machines.
5. **Model a referral/partner system** with Prisma, including fee distribution and earnings claims.
6. **Add achievements and tutorials** driven by a single source of truth in the Zustand store.

## Repository layout

```
app/                 Next.js App Router pages and API routes
components/          React components (shadcn/ui + custom)
hooks/               Reusable React hooks
lib/                 Business logic
  services/          API clients, WebSocket handlers, transaction services
  store/             Zustand store and slices
  jupiter/           Jupiter-specific trading helpers
  pepe/              Token analysis utilities
  utils/             Helpers
prisma/              Prisma schema and migrations
public/              Static assets (images, audio, fonts)
scripts/             Dev utilities (warmup, metrics, test runners)
server_v3/           Local Jupiter proxy service (Docker + Node.js)
src/                 Additional source modules
```

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- **PostgreSQL** 15+ (local or hosted)
- **Redis** 7+ (for the proxy service)
- A **Privy** account ([privy.io](https://www.privy.io/))
- A **Solana RPC** endpoint (public RPC works for learning; use a paid provider for anything real)

## Setup

```bash
# 1. Clone and install
pnpm install

# 2. Copy the env template and fill in your values
cp .env.example .env.local

# 3. Set up the database
pnpm db:push           # or: pnpm db:migrate
pnpm db:generate

# 4. (Optional) seed achievements
pnpm db:seed-achievements

# 5. Start Redis + Jupiter proxy + dev server
pnpm dev:with-proxy
```

The dev server runs on **port 3002** (`http://localhost:3002`). The Jupiter proxy runs on port 3001.

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/memedeck

# Privy (https://dashboard.privy.io/)
NEXT_PUBLIC_PRIVY_APP_ID=
PRIVY_APP_SECRET=

# Solana
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Redis (used by the Jupiter proxy)
REDIS_URL=redis://localhost:6379
```

## Scripts

```bash
pnpm dev               # Dev server only (port 3002)
pnpm dev:with-proxy    # Redis + Jupiter proxy + dev server
pnpm build             # Production build
pnpm start             # Start production server
pnpm typecheck         # TypeScript type check (tsc --noEmit)
pnpm lint              # Next.js lint
pnpm test              # Run Vitest tests
pnpm test:jupiter      # Jupiter integration test suite
pnpm db:generate       # Generate Prisma client
pnpm db:migrate        # Run Prisma migrations
pnpm db:studio         # Open Prisma Studio
```

## Architecture highlights

### Zustand store (`lib/store/`)

A single centralized store composed of many slices, using `immer` for immutable updates and a custom storage adapter that switches between `localStorage` (demo mode) and PostgreSQL (authenticated users).

### Jupiter proxy (`server_v3/jupiter-proxy.mjs`)

A small Express service that sits between the client and Jupiter's public API. It adds an LRU cache, rate-limiting, and a few convenience endpoints. Running it locally avoids hammering Jupiter's public endpoints during development and gives you a place to add custom pre/post-processing.

### Trading flow

```
Client component
  → Zustand store action
  → Next.js API route (app/api/...)
  → Jupiter proxy (server_v3)
  → Jupiter public API
  → Solana RPC for transaction submission
```

See `hooks/use-transaction-coordinator.ts` and `lib/services/` for the full pipeline.

## Contributing

MemeDeck is released as an educational reference. PRs that improve clarity, fix bugs, add tests, or improve docs are welcome. For larger architectural changes, please open an issue first to discuss the direction.

## Disclaimer

This software is provided for **educational purposes only**. It is not investment advice. The authors, contributors, and any associated parties are not responsible for any financial loss, bugs, or issues arising from use of this code. Cryptocurrency trading carries significant risk of loss. Never trade with money you cannot afford to lose.

## License

MIT — see [LICENSE](./LICENSE).
