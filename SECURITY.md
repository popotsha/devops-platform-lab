# Security

## Reporting a vulnerability

If you find a security issue in this starter kit, email **[cyberInfoware@gmail.com](mailto:cyberInfoware@gmail.com)** with steps to reproduce. Please do not open a public issue for undisclosed vulnerabilities.

## Secrets hygiene

- Never commit `.env`, `.env.local`, or any file with real SMTP, Stripe, Grafana, database, or Keycloak admin passwords
- Copy from the tracked `*.example` files and fill in your own values
- Before production or sharing a private clone, rotate every demo secret (Keycloak clients, `AUTH_SECRET` / `NEXTAUTH_SECRET`, DB passwords)

## Demo credentials

The kit ships with intentional demo users and weak local defaults so `docker compose up` works out of the box. Treat them as **lab-only**. See README § Security notes for production before deploying beyond your machine.

## Repository visibility

This product is sold under a **commercial license** ([`LICENSE.md`](LICENSE.md)). Do not publish the full source as a public repository.
