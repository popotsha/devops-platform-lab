import { signIn } from "@/auth";
import { NextRequest } from "next/server";

/** Server redirect to Keycloak authorize. */
export async function GET(request: NextRequest) {
  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") ?? "/";
  const prompt = request.nextUrl.searchParams.get("prompt");
  const loginHint = request.nextUrl.searchParams.get("login_hint");

  const authorization: Record<string, string> = {};
  if (prompt === "none" || prompt === "login") {
    authorization.prompt = prompt;
  }
  if (loginHint?.trim()) {
    authorization.login_hint = loginHint.trim().toLowerCase();
  }

  if (Object.keys(authorization).length > 0) {
    return signIn("keycloak", { redirectTo: callbackUrl }, authorization);
  }

  return signIn("keycloak", { redirectTo: callbackUrl });
}
