import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    idToken?: string;
    expiresAt?: number;
    roles?: string[];
    user?: {
      name?: string | null;
      email?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    idToken?: string;
    expiresAt?: number;
    roles?: string[];
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
  }
}