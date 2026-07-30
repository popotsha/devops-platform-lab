import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import { authCookieOptions } from "@/lib/auth-cookies";
import {
  keycloakEndpoint,
  keycloakIssuerInternal,
  keycloakIssuerPublic,
} from "@/lib/keycloak-urls";

interface KeycloakProfileLike {
  given_name?: string;
  family_name?: string;
  name?: string;
  email?: string;
  preferred_username?: string;
}

function decodeAccessTokenRoles(accessToken?: string): string[] {
  if (!accessToken) {
    return [];
  }

  try {
    const [, payload] = accessToken.split(".");
    if (!payload) {
      return [];
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(Buffer.from(normalized, "base64").toString("utf8")) as {
      realm_access?: { roles?: string[] };
    };

    return decoded.realm_access?.roles ?? [];
  } catch {
    return [];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  cookies: authCookieOptions("storefront"),
  pages: {
    signIn: "/",
  },
  providers: [
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET,
      issuer: keycloakIssuerPublic(),
      wellKnown: `${keycloakIssuerInternal()}/.well-known/openid-configuration`,
      authorization: { url: keycloakEndpoint("auth") },
      token: { url: keycloakEndpoint("token", true) },
      userinfo: { url: keycloakEndpoint("userinfo", true) },
    }),
  ],

  callbacks: {
    async jwt({ token, account, profile }) {
      const profileData = profile as KeycloakProfileLike | undefined;

      if (account) {
        // Keep access + id tokens only. Refresh tokens are large and unused here;
        // storing them bloats the Auth.js session cookie and triggers HTTP 431 on localhost.
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.roles = decodeAccessTokenRoles(account.access_token);
      }

      if (profileData) {
        token.firstName = profileData.given_name;
        token.lastName = profileData.family_name;
        token.name = profileData.name ?? profileData.preferred_username;
        token.email = profileData.email;
      }

      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.idToken = token.idToken;
      session.roles = token.roles ?? [];
      session.user = {
        ...session.user,
        name: token.name ?? session.user?.name,
        email: token.email ?? session.user?.email,
        firstName: (token.firstName ?? token.givenName) as string | undefined,
        lastName: (token.lastName ?? token.familyName) as string | undefined,
      };

      return session;
    },
  },
});
