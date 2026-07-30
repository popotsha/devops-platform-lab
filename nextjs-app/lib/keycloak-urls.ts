/** Browser-visible issuer (JWT iss claim + login redirect). */
export function keycloakIssuerPublic(): string {
  return (process.env.AUTH_KEYCLOAK_ISSUER ?? "").replace(/\/$/, "");
}

/** In-cluster issuer for server-side OIDC calls (K8s: http://keycloak:8080/...). */
export function keycloakIssuerInternal(): string {
  const internal = process.env.AUTH_KEYCLOAK_ISSUER_INTERNAL?.replace(/\/$/, "");
  return internal || keycloakIssuerPublic();
}

type KeycloakEndpoint = "auth" | "token" | "userinfo";

const ENDPOINT_PATHS: Record<KeycloakEndpoint, string> = {
  auth: "/protocol/openid-connect/auth",
  token: "/protocol/openid-connect/token",
  userinfo: "/protocol/openid-connect/userinfo",
};

export function keycloakEndpoint(endpoint: KeycloakEndpoint, internal = false): string {
  const base = internal ? keycloakIssuerInternal() : keycloakIssuerPublic();
  return `${base}${ENDPOINT_PATHS[endpoint]}`;
}
