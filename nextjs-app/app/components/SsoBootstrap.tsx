"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { signInWithKeycloak } from "@/lib/auth-client";
import { clearLoggedOutCookie, readLoggedOutCookie } from "@/lib/auth-utils";

function clearClientStorage() {
  sessionStorage.clear();
  localStorage.clear();
}

function cleanQueryParams(keys: string[]) {
  const params = new URLSearchParams(window.location.search);
  let changed = false;

  for (const key of keys) {
    if (params.has(key)) {
      params.delete(key);
      changed = true;
    }
  }

  if (!changed) {
    return;
  }

  const nextQuery = params.toString();
  const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`;
  window.history.replaceState({}, "", nextUrl);
}

/**
 * Runs a silent Keycloak SSO check once per browser page load (including manual refresh).
 * Does not re-run on tab focus or any automatic interval.
 */
export default function SsoBootstrap() {
  const { status } = useSession();
  const silentCheckDone = useRef(false);

  useEffect(() => {
    if (status === "authenticated") {
      clearLoggedOutCookie();
    }
  }, [status]);

  useEffect(() => {
    if (status === "loading" || status === "authenticated" || silentCheckDone.current) {
      return;
    }

    silentCheckDone.current = true;

    const params = new URLSearchParams(window.location.search);

    if (params.get("loggedOut") === "1" || readLoggedOutCookie()) {
      clearLoggedOutCookie();
      clearClientStorage();
      sessionStorage.setItem("sso-logout-pending", "1");
      cleanQueryParams(["loggedOut"]);
      return;
    }

    // Keep pending until explicit Sign in (prompt !== "none") clears it in auth-client.
    if (sessionStorage.getItem("sso-logout-pending") === "1") {
      return;
    }

    if (params.get("error")) {
      cleanQueryParams(["error", "error_description"]);
      return;
    }

    signInWithKeycloak(window.location.pathname || "/", { prompt: "none" });
  }, [status]);

  return null;
}
