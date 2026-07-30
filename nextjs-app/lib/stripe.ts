import Stripe from "stripe";
import {
  getStripePublishableKeyFromEnv,
  isStripeEnabled,
} from "@/lib/payment-config";

let stripeClient: Stripe | null = null;

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() || undefined : undefined;
}

export function getStripe(): Stripe {
  if (!isStripeEnabled()) {
    throw new Error("Stripe payments are disabled or not configured");
  }

  const secretKey = readEnv("STRIPE_SECRET_KEY");
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

export function getStripePublishableKey(): string {
  if (!isStripeEnabled()) {
    throw new Error("Stripe payments are disabled or not configured");
  }

  const key = getStripePublishableKeyFromEnv();
  if (!key) {
    throw new Error(
      "STRIPE_PUBLISHABLE_KEY or NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured",
    );
  }
  return key;
}
