#!/bin/sh
set -eu

# Next.js inlines NEXT_PUBLIC_* at build time (often empty in Docker).
# Prefer a runtime publishable key; fall back to NEXT_PUBLIC from env_file.
if [ -z "${STRIPE_PUBLISHABLE_KEY:-}" ] && [ -n "${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:-}" ]; then
  export STRIPE_PUBLISHABLE_KEY="$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
fi

# Cookie isolation (authjs.storefront.*) matches v2/v3 and is the real anti-431 fix.
# A modest header-size raise remains as a localhost safety net because v1 also runs
# Angular keycloak-js on :4200, so Keycloak host cookies still accumulate on localhost.
# Production (separate domains) does not need a large value; override via env if desired.
MAX_HEADER_SIZE="${NODE_MAX_HTTP_HEADER_SIZE:-262144}"
export NODE_OPTIONS="--max-http-header-size=${MAX_HEADER_SIZE}${NODE_OPTIONS:+ ${NODE_OPTIONS}}"

exec node --max-http-header-size="${MAX_HEADER_SIZE}" server.js
