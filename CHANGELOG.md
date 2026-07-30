# Changelog

All notable releases of the Microservice Starter Kit are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Kit version is independent of per-service `package.json` versions.

## [1.1.0] — Community Edition packaging — 2026-07-30

### Changed

- Published as **Community Edition** (Docker Compose–first public kit)
- README, user guide, landing page, and `EDITIONS.md` now compare Community vs Premium and promote [cyberinfoware.com](https://www.cyberinfoware.com)

### Removed (Premium-only assets)

- `terraform/` (AWS IaC)
- Root `k8s/` and all per-service `k8s/` manifests
- All `.github/workflows/` deploy pipelines
- `build_all.sh` and K8s Grafana secret sync scripts
- `user-guide/CI-CD-TERRAFORM.md` and buyer PDF distributions
- Kubernetes / Terraform / CI/CD documentation from Community guides

### Notes

- Application architecture is unchanged — NestJS services, gateway, Keycloak, Redis, RabbitMQ, and Compose stack remain fully runnable locally
- For Kubernetes, Terraform, Helm, and production CI/CD, use Premium editions at [cyberinfoware.com/products](https://www.cyberinfoware.com/products)

## [1.1.0] — 2026-07-22

### Added

- Next.js marketing landing at `/` with rebrand via `content/landing.ts` or `LANDING_*` env vars
- Storefront routes: `/products` (catalog + cart), `/orders`, `/profile`, plus **Sign in** CTA
- Angular Admin Console sidebar shell: Dashboard, Products, Orders, Notifications, Profile
- Keycloak Lattice theme image packaging (`keycloak/Dockerfile`, `docker-entrypoint.sh`, `themes/lattice`)
- Redis and RabbitMQ Compose helpers (`redis/`, `rabbitmq/`)
- Ops helper `scripts/enable-keycloak-forgot-password.sh`
- Developer guide under `user-guide/` (Markdown + screenshots)
- `SECURITY.md` and this `CHANGELOG.md`
- Storefront cookie cleanup helper at `/clear-cookies.html` (local HTTP 431 / SSO loops)

### Changed

- Admin Console no longer uses a single-page monolith layout — sidebar routes only
- Stripe / SMTP remain optional; examples and troubleshooting clarified
- Distribution hygiene: hardened `.gitignore`, removed accidental pnpm store artifacts and editor scaffolding (`AGENTS.md` / `CLAUDE.md`)

### Notes

- **Upgrade from 1.0.0:** copy refreshed `*.example` env files if you still use older templates; Admin Console URLs are now path-based (`/dashboard`, `/products`, …); storefront shopping starts at `/products` after Sign in
- Screenshots in `user-guide/screenshots/` may still show older layouts in a few places — follow the written walkthrough if an image differs

## [1.0.0] — 2026-07-07

### Added

- Initial commercial release: Keycloak SSO, Next.js storefront, Angular admin console, NestJS API gateway, catalog / order / notification services, PostgreSQL, Redis, RabbitMQ
- Optional Stripe checkout and SMTP order-confirmation emails
- Docker Compose local stack (Premium historically also shipped Kubernetes, Terraform, and CI/CD)

### Notes

- Tagged as `v1.0.0` — *Initial commercial release*
