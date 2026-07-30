"use client";

import { signInWithKeycloak } from "@/lib/auth-client";

type SignInCtaProps = {
  label?: string;
  className?: string;
  callbackUrl?: string;
};

export default function SignInCta({
  label = "Sign in",
  className = "btn btn-secondary btn-lg",
  callbackUrl = "/products",
}: SignInCtaProps) {
  return (
    <button type="button" className={className} onClick={() => signInWithKeycloak(callbackUrl)}>
      {label}
    </button>
  );
}
