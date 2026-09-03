# Flipduel (`$FLIP`)

1v1 Pump.fun PvL duel on Solana. Portfolio PnL% wins the bank. Manual Phantom deposits, no Connect Wallet.

## Monorepo

- `apps/web` — Vite React SPA (Cloudflare Pages)
- `apps/api` — Hono API + PnL judge + escrow
- `packages/shared` — types, PnL calculator
- `programs/flipduel-escrow` — Anchor escrow (optional deploy)

## Quick start

```bash
npm install
npm run build -w @flipduel/shared
npm run db:migrate
npm run dev:api
npm run dev:web
```

- Web: http://localhost:5173
- API: http://localhost:3001

Copy `.env.example` to `.env` and set `AUTHORITY_PRIVATE_KEY` for settlement payouts on devnet.

## Product rules

See [docs/PRODUCT.md](docs/PRODUCT.md) and conversation PLAN v1.0.

## Deploy

### Web (Cloudflare Pages)

- Build command: `npm run build -w @flipduel/web`
- Output: `apps/web/dist`
- SPA redirect: `apps/web/public/_redirects`

### API (Render)

- Build: `npm install && npm run build -w @flipduel/shared && npm run build -w @flipduel/api`
- Start: `npm run start -w @flipduel/api`
- Env: `PORT`, `SOLANA_RPC_URL`, `HELIUS_API_KEY`, `AUTHORITY_PRIVATE_KEY`

## Escrow model (v1)

Per-room vault keypair (stored server-side for payout). Deposits detected via RPC balance polling. Anchor program in `programs/` for future on-chain settlement.
