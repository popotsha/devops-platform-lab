#!/usr/bin/env bash
# Enable Forgot password + SMTP + Lattice theme on the live ms-realm
# (realm file import only applies on first Keycloak volume boot).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "FAIL: missing .env — copy from .env.example first"
  exit 1
fi

eval "$(grep -E '^(KEYCLOAK_ADMIN|KEYCLOAK_ADMIN_PASSWORD|SMTP_HOST|SMTP_PORT|SMTP_USER|SMTP_PASS|SMTP_SECURE|SMTP_STARTTLS|KEYCLOAK_SMTP_FROM|KEYCLOAK_SMTP_FROM_DISPLAY)=' .env | sed 's/\r$//' || true)"

KEYCLOAK_ADMIN="${KEYCLOAK_ADMIN:-admin}"
KEYCLOAK_ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:-}"
SMTP_HOST="${SMTP_HOST:-smtp.resend.com}"
SMTP_PORT="${SMTP_PORT:-465}"
SMTP_USER="${SMTP_USER:-resend}"
SMTP_PASS="${SMTP_PASS:-}"
SMTP_SECURE="${SMTP_SECURE:-true}"
SMTP_STARTTLS="${SMTP_STARTTLS:-false}"
KEYCLOAK_SMTP_FROM="${KEYCLOAK_SMTP_FROM:-noreply@localhost}"
KEYCLOAK_SMTP_FROM_DISPLAY="${KEYCLOAK_SMTP_FROM_DISPLAY:-Storefront}"

for i in $(seq 1 20); do
  code=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/health/ready || echo 000)
  [[ "$code" == "200" ]] && break
  sleep 2
done

TOKEN=$(curl -s -X POST "http://localhost:8080/realms/master/protocol/openid-connect/token" \
  -d "grant_type=password&client_id=admin-cli&username=${KEYCLOAK_ADMIN}&password=${KEYCLOAK_ADMIN_PASSWORD}" \
  | python3 -c 'import json,sys; print(json.load(sys.stdin).get("access_token",""))')
if [[ -z "$TOKEN" ]]; then
  echo "FAIL: could not obtain Keycloak admin token"
  exit 1
fi

export TOKEN SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASS SMTP_SECURE SMTP_STARTTLS KEYCLOAK_SMTP_FROM KEYCLOAK_SMTP_FROM_DISPLAY
python3 <<'PY'
import json, os, urllib.request

token = os.environ["TOKEN"]
req = urllib.request.Request(
    "http://localhost:8080/admin/realms/ms-realm",
    headers={"Authorization": f"Bearer {token}"},
)
with urllib.request.urlopen(req) as resp:
    realm = json.load(resp)

realm["resetPasswordAllowed"] = True
realm["loginWithEmailAllowed"] = True
realm["rememberMe"] = True
realm["loginTheme"] = "lattice"
realm["displayName"] = "Storefront"
realm["displayNameHtml"] = "Storefront"
ssl = "true" if os.environ.get("SMTP_SECURE", "true").lower() == "true" else "false"
starttls = "true" if os.environ.get("SMTP_STARTTLS", "false").lower() == "true" else "false"
realm["smtpServer"] = {
    "host": os.environ["SMTP_HOST"],
    "port": os.environ["SMTP_PORT"],
    "from": os.environ["KEYCLOAK_SMTP_FROM"],
    "fromDisplayName": os.environ.get("KEYCLOAK_SMTP_FROM_DISPLAY", "Storefront"),
    "ssl": ssl,
    "starttls": starttls,
    "auth": "true",
    "user": os.environ["SMTP_USER"],
    "password": os.environ.get("SMTP_PASS", ""),
}

put = urllib.request.Request(
    "http://localhost:8080/admin/realms/ms-realm",
    data=json.dumps(realm).encode(),
    method="PUT",
    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
)
with urllib.request.urlopen(put) as resp:
    print(f"OK realm updated ({resp.status})")

req2 = urllib.request.Request(
    "http://localhost:8080/admin/realms/ms-realm",
    headers={"Authorization": f"Bearer {token}"},
)
with urllib.request.urlopen(req2) as resp:
    r = json.load(resp)
print("loginTheme =", r.get("loginTheme"))
print("resetPasswordAllowed =", r.get("resetPasswordAllowed"))
print("smtpHost =", (r.get("smtpServer") or {}).get("host"))
PY
