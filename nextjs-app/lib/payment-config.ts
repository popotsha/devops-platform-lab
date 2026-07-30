function isTruthy(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

/**
 * Read env dynamically so Next.js does not inline NEXT_PUBLIC_* at build time.
 * Docker Compose supplies keys via env_file at container runtime.
 */
function readEnv(name: string): string | undefined {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() || undefined : undefined;
}

export function getStripePublishableKeyFromEnv(): string | undefined {
  return readEnv("STRIPE_PUBLISHABLE_KEY") || readEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
}

/** Stripe checkout is active only when explicitly enabled and both keys are set. */
export function isStripeEnabled(): boolean {
  if (!isTruthy(readEnv("STRIPE_ENABLED"))) {
    return false;
  }

  return Boolean(readEnv("STRIPE_SECRET_KEY") && getStripePublishableKeyFromEnv());
}

export function getStripeDisabledMessage(): string {
  if (!isTruthy(readEnv("STRIPE_ENABLED"))) {
    return "Stripe payments are disabled. Set STRIPE_ENABLED=true in nextjs-app/.env.local and add your API keys.";
  }

  return "Stripe is enabled but API keys are missing. Add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (or STRIPE_PUBLISHABLE_KEY) to nextjs-app/.env.local.";
}
