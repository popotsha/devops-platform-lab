"use client";

import { SessionProvider } from "next-auth/react";
import SessionSync from "./components/SessionSync";
import SsoBootstrap from "./components/SsoBootstrap";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus>
      <SessionSync />
      <SsoBootstrap />
      {children}
    </SessionProvider>
  );
}
