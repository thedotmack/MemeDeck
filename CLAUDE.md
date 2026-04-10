# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MemeDeck is a Next.js 15 application for Solana memecoin trading with an integrated Jupiter DEX interface. The application uses TypeScript, React 19, Zustand for state management, Prisma with PostgreSQL, and Tailwind CSS for styling.

## Essential Commands

### Development
```bash
pm2 start memedeck-ui             # dev server is running on port 3002
pm2 log memedeck-ui --nostream    # print logs

# freshen logs to debug errors
pm2 flush memedeck-ui && pm2 log memedeck-ui --nostream 
```

### Type Checking & Linting
```bash
pnpm typecheck     # Run TypeScript type checking (tsc --noEmit)
pnpm lint          # Run Next.js linting
```

### Database Management
```bash
pnpm db:generate   # Generate Prisma client
pnpm db:migrate    # Run Prisma migrations
pnpm db:push       # Push schema changes without migration
pnpm db:studio     # Open Prisma Studio
pnpm db:seed       # Seed database
```

## Architecture

### Core State Management (Zustand)

The application uses a centralized Zustand store with multiple slices:

- **Store Structure** (`lib/store/index.ts`):
  - Uses immer for immutable updates
  - Implements adaptive storage that switches between demo and authenticated modes
  - Persists to PostgreSQL for authenticated users via custom storage adapter
  - Key slices: auth, trading, portfolio, transaction, pool, activity, UI, animation, demo, tutorial, achievements

### API Architecture

- **API Routes** (`app/api/`):
  - Authentication endpoints using Privy
  - Jupiter proxy endpoints for DEX operations
  - Transaction management endpoints
  - Partner/referral system endpoints
  - Achievement system endpoints

### Database Schema (PostgreSQL + Prisma)

Key models:
- `Users`: Core user data with Privy integration, Hydra wallet support
- `Transaction`: Trade records with Jupiter integration
- `Partner`: Referral partner system with earnings tracking
- `FeeTransaction`: Fee distribution and referral rewards
- `EarningsClaim`: Partner earning claims

### Jupiter Integration

- **Proxy Service** (`server_v3/jupiter-proxy.mjs`): Handles Jupiter API communication
- **Trading Flow**: Client → API route → Proxy service → Jupiter API
- Supports swap operations, quote fetching, and transaction building

### Component Structure

- **Components** (`components/`): Reusable UI components using shadcn/ui
- **Hooks** (`hooks/`): Custom React hooks for common functionality
- **Lib** (`lib/`): Business logic, utilities, and services
  - `services/`: API clients, WebSocket handlers, transaction services
  - `utils/`: Helper functions and utilities
  - `jupiter/`: Jupiter-specific trading logic
  - `pepe/`: Custom token analysis and metrics

## Key Technical Details

### Environment Configuration
- Requires PostgreSQL database (DATABASE_URL)
- Uses Privy for authentication (multiple PRIVY_* vars required)
- Solana RPC configuration for blockchain interactions
- Redis for caching and session management

### Build Configuration
- Next.js 15 with Turbopack for development
- TypeScript with strict mode disabled
- ESLint and build errors ignored in production builds
- WebGL shader support via webpack configuration

### Testing
- Vitest for unit tests
- Jupiter integration test suite (`test:jupiter:*` commands)
- Type metrics tracking (`pnpm type:metrics`)

### Performance Optimizations
- React Strict Mode disabled to prevent duplicate API calls
- Image optimization disabled for flexibility
- Custom LRU caching for API responses
- WebSocket connections for real-time token data

## Development Workflow

1. Always run `pnpm typecheck` before committing to catch type errors
2. Database changes require running `pnpm db:migrate` followed by `pnpm db:generate`
3. For full local development: `pnpm dev:with-proxy` (starts Redis, proxy, and dev server)
4. Authentication flow uses Privy embedded wallets with Solana support
5. Trading operations go through Jupiter proxy for rate limiting and caching