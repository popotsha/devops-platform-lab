import { auth, signOut } from "@/auth";
import { decodeJwtAzp } from "@/lib/auth-utils";
import { keycloakEndpoint } from "@/lib/keycloak-urls";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  // Same guard as microservice-kit-v2/v3: drop sessions minted for a different OAuth client.
  const expectedClient = process.env.AUTH_KEYCLOAK_ID ?? "nextjs-app";
  if (session.idToken && decodeJwtAzp(session.idToken) !== expectedClient) {
    await signOut({ redirect: false });
    return NextResponse.json({ valid: false, reason: "wrong_client" }, { status: 401 });
  }

  const issuer = process.env.AUTH_KEYCLOAK_ISSUER;
  if (!issuer) {
    return NextResponse.json({ valid: true });
  }

  try {
    const response = await fetch(keycloakEndpoint("userinfo", true), {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
    });

    if (!response.ok) {
      await signOut({ redirect: false });
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json({ valid: false }, { status: 401 });
  }
}
