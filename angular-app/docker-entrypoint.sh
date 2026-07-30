#!/bin/sh
set -eu

KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8080}"
KEYCLOAK_REALM="${KEYCLOAK_REALM:-ms-realm}"
KEYCLOAK_CLIENT_ID="${KEYCLOAK_CLIENT_ID:-angular-app}"
API_GATEWAY_URL="${API_GATEWAY_URL:-http://localhost:3001}"
STOREFRONT_URL="${STOREFRONT_URL:-http://localhost:3000}"
OTEL_ENABLED="${OTEL_ENABLED:-false}"
OTEL_SERVICE_NAME="${OTEL_SERVICE_NAME:-angular-app}"
OTEL_DEPLOYMENT_ENVIRONMENT="${OTEL_DEPLOYMENT_ENVIRONMENT:-local}"

cat > /usr/share/nginx/html/browser/env.js <<EOF
window.__ENV = {
  keycloakUrl: "${KEYCLOAK_URL}",
  keycloakRealm: "${KEYCLOAK_REALM}",
  keycloakClientId: "${KEYCLOAK_CLIENT_ID}",
  apiGatewayUrl: "${API_GATEWAY_URL}",
  storefrontUrl: "${STOREFRONT_URL}",
  otelEnabled: ${OTEL_ENABLED},
  otelServiceName: "${OTEL_SERVICE_NAME}",
  otelDeploymentEnvironment: "${OTEL_DEPLOYMENT_ENVIRONMENT}"
};
EOF

exec nginx -g 'daemon off;'
