import type { NextAuthConfig } from "next-auth";

function useSecureCookies(): boolean {
  const url = (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "").trim();
  return url.startsWith("https://");
}

/**
 * Per-app Auth.js cookie names (same pattern as microservice-kit-v2/v3).
 * Prefixed names prevent session collision on the shared `localhost` host
 * (storefront :3000 + Keycloak :8080 + Angular admin :4200).
 */
export function authCookieOptions(prefix: string): NonNullable<NextAuthConfig["cookies"]> {
  const secure = useSecureCookies();
  const base = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure,
  };

  return {
    sessionToken: {
      name: `authjs.${prefix}.session-token`,
      options: { ...base },
    },
    callbackUrl: {
      name: `authjs.${prefix}.callback-url`,
      options: { httpOnly: false, sameSite: "lax", path: "/", secure },
    },
    csrfToken: {
      name: `authjs.${prefix}.csrf-token`,
      options: { ...base },
    },
    pkceCodeVerifier: {
      name: `authjs.${prefix}.pkce.code_verifier`,
      options: { ...base, maxAge: 900 },
    },
    state: {
      name: `authjs.${prefix}.state`,
      options: { ...base, maxAge: 900 },
    },
    nonce: {
      name: `authjs.${prefix}.nonce`,
      options: { ...base },
    },
  };
}

/**
 * Expire Auth.js session cookie chunks on logout (v1 enhancement over v2/v3).
 * Clears prefixed storefront cookies and any legacy unprefixed leftovers.
 */
export function clearAuthSessionCookies(
  response: {
    cookies: { set: (name: string, value: string, options: Record<string, unknown>) => void };
  },
  prefix = "storefront",
) {
  const secure = useSecureCookies();
  const base = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure,
    maxAge: 0,
  };
  const names = [
    `authjs.${prefix}.session-token`,
    `authjs.session-token`,
    `authjs.lattice.session-token`,
    `__Secure-authjs.${prefix}.session-token`,
    `__Secure-authjs.session-token`,
    `__Secure-authjs.lattice.session-token`,
    `__Host-authjs.${prefix}.session-token`,
    `__Host-authjs.session-token`,
  ];

  for (const name of names) {
    response.cookies.set(name, "", base);
    for (let i = 0; i < 10; i += 1) {
      response.cookies.set(`${name}.${i}`, "", base);
    }
  }
}
