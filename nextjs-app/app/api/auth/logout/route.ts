import { auth, signOut } from "@/auth";
import { clearAuthSessionCookies } from "@/lib/auth-cookies";
import { decodeJwtAzp, LOGGED_OUT_COOKIE } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  logger.info("User logout requested ...", { event: "auth.logout" });
  const session = await auth();
  const idToken = session?.idToken;
  const issuer = process.env.AUTH_KEYCLOAK_ISSUER;
  const expectedClient = process.env.AUTH_KEYCLOAK_ID ?? "nextjs-app";
  const baseUrl = (process.env.NEXTAUTH_URL ?? new URL(request.url).origin).replace(/\/$/, "");
  const postLogout = `${baseUrl}/`;

  await signOut({ redirect: false });

  const response =
    idToken && issuer && decodeJwtAzp(idToken) === expectedClient
      ? NextResponse.redirect(
          `${issuer}/protocol/openid-connect/logout?id_token_hint=${encodeURIComponent(idToken)}&post_logout_redirect_uri=${encodeURIComponent(postLogout)}`,
        )
      : NextResponse.redirect(`${postLogout}?loggedOut=1`);

  clearAuthSessionCookies(response);

  response.cookies.set(LOGGED_OUT_COOKIE, "1", {
    maxAge: 120,
    path: "/",
    sameSite: "lax",
  });

  return response;
}
