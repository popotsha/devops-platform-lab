# Admin Console (`angular-app`)

Angular 19 + keycloak-angular admin console for the Microservice Starter Kit.

## Features

Left sidebar (after SSO):

| Page | Managers | Customers |
|------|----------|-----------|
| Dashboard | Statistics only | Restricted summary |
| Products | CRUD + JSON export | Read-only |
| Orders | All orders | Own orders |
| Notifications | Email delivery log | Hidden |
| Profile | Account & permissions | Account & permissions |

## Local setup

From the repo root (recommended):

```bash
cp .env.example .env
docker compose up -d --build angular-app
```

Standalone (Keycloak + API gateway must be running):

```bash
npm install
npm start
```

Open http://localhost:4200. Runtime config is injected via `env.js` (`docker-entrypoint.sh` / nginx).

Full walkthrough: [user-guide/Microservice-Starter-Kit-Guide.md](../user-guide/Microservice-Starter-Kit-Guide.md).
