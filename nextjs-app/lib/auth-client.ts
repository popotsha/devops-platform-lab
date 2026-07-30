/** Redirect to server login route → Keycloak authorize page. */
export function signInWithKeycloak(
  callbackUrl: string,
  authorization?: {
    prompt?: "none" | "login";
    loginHint?: string;
  },
) {
  if (authorization?.prompt !== "none") {
    sessionStorage.removeItem("sso-logout-pending");
  }
  const params = new URLSearchParams({ callbackUrl });
  if (authorization?.prompt) {
    params.set("prompt", authorization.prompt);
  }
  if (authorization?.loginHint?.trim()) {
    params.set("login_hint", authorization.loginHint.trim().toLowerCase());
  }
  window.location.assign(`/api/auth/login?${params}`);
}
