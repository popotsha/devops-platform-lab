"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

const LOGOUT_SIGNAL = "ms-kit-sso-logout";

function redirectLoggedOut() {
  sessionStorage.setItem("sso-logout-pending", "1");
  window.location.href = "/?loggedOut=1";
}

export default function SessionSync() {
  const { status } = useSession();
  const validated = useRef(false);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== LOGOUT_SIGNAL) {
        return;
      }

      void signOut({ redirect: false }).then(redirectLoggedOut);
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || validated.current) {
      return;
    }

    validated.current = true;

    void fetch("/api/auth/validate-session", { cache: "no-store" }).then((response) => {
      if (!response.ok) {
        void signOut({ redirect: false }).then(redirectLoggedOut);
      }
    });
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") {
      validated.current = false;
      return;
    }

    const onVisible = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      void fetch("/api/auth/validate-session", { cache: "no-store" }).then((response) => {
        if (!response.ok) {
          void signOut({ redirect: false }).then(redirectLoggedOut);
        }
      });
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [status]);

  return null;
}
