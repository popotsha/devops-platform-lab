# Customer Storefront (`nextjs-app`)

Next.js 16 + Auth.js (NextAuth v5) storefront for the Microservice Starter Kit.

## Features

- Keycloak SSO (`authjs.storefront.*` cookies)
- Catalog browse, cart, optional Stripe checkout
- **My Orders** at `/orders` (account menu)
- Optional OpenTelemetry

## Local setup

From the repo root (recommended):

```bash
cp .env.example .env
cp nextjs-app/.env.local.example nextjs-app/.env.local
docker compose up -d --build nextjs-app
```

Standalone (infra must already be running):

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Open http://localhost:3000.

## Env

See `.env.local.example`. Stripe is off until `STRIPE_ENABLED=true` and keys are set.
Docker runtime also accepts `STRIPE_PUBLISHABLE_KEY` (aliased from `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `docker-entrypoint.sh`).

## Helpers

- Cookie cleanup (local 431): http://localhost:3000/clear-cookies.html

Full walkthrough: [user-guide/Microservice-Starter-Kit-Guide.md](../user-guide/Microservice-Starter-Kit-Guide.md).
