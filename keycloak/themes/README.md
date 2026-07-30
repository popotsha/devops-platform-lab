# Keycloak themes

Custom login UI for the `ms-realm` SSO screens (Lattice visual language).

| Theme | Path | Used for |
|-------|------|----------|
| `lattice` | `themes/lattice/login` | Sign-in, register, forgot password |

## How it is applied

| Runtime | Theme files | `loginTheme=lattice` |
|---------|-------------|----------------------|
| **Docker Compose** | Volume mount `./keycloak/themes/lattice` (also baked into `keycloak/Dockerfile`) | Realm import + `docker-entrypoint.sh` (`kcadm` on every boot) |

Edit `themes/lattice/login/resources/css/lattice.css` and `messages/messages_en.properties` to rebrand, then rebuild:

```bash
docker compose up -d --build keycloak
```
