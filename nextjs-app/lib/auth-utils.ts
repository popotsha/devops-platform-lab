/** Decode `azp` (authorized party / OAuth client id) from a JWT without verification. */
export function decodeJwtAzp(token: string): string | undefined {
  try {
    const [, payload] = token.split(".");
    if (!payload) return undefined;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(Buffer.from(normalized, "base64").toString("utf8")) as {
      azp?: string;
      aud?: string | string[];
    };
    if (typeof decoded.azp === "string") return decoded.azp;
    if (typeof decoded.aud === "string") return decoded.aud;
    if (Array.isArray(decoded.aud) && typeof decoded.aud[0] === "string") return decoded.aud[0];
    return undefined;
  } catch {
    return undefined;
  }
}

/** Same idea as v2 `lattice-logged-out` / v3 admin `admin-logged-out` — app-specific marker. */
export const LOGGED_OUT_COOKIE = "storefront-logged-out";

/** Legacy name from an earlier port; still cleared so old browsers recover cleanly. */
const LEGACY_LOGGED_OUT_COOKIES = ["lattice-logged-out"];

export function readLoggedOutCookie(): boolean {
  if (typeof document === "undefined") return false;
  const cookies = document.cookie.split(";");
  const names = [LOGGED_OUT_COOKIE, ...LEGACY_LOGGED_OUT_COOKIES];
  return cookies.some((c) => {
    const trimmed = c.trim();
    return names.some((name) => trimmed.startsWith(`${name}=`));
  });
}

export function clearLoggedOutCookie() {
  if (typeof document === "undefined") return;
  for (const name of [LOGGED_OUT_COOKIE, ...LEGACY_LOGGED_OUT_COOKIES]) {
    document.cookie = `${name}=; Max-Age=0; path=/`;
  }
}
