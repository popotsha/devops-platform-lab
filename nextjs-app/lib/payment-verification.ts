import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import {
  validateCartItems,
  type CartItemInput,
  type ValidatedCart,
} from "@/lib/cart-pricing";

function parseItemsFromMetadata(paymentIntent: Stripe.PaymentIntent): CartItemInput[] {
  const raw = paymentIntent.metadata.itemsJson;
  if (!raw) {
    throw new Error("Payment is missing order items");
  }

  try {
    const parsed = JSON.parse(raw) as CartItemInput[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("Payment order items are invalid");
    }
    return parsed;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Payment")) {
      throw error;
    }
    throw new Error("Payment order items are invalid");
  }
}

export async function verifyPaymentForOrder(params: {
  paymentIntentId: string;
  items?: CartItemInput[];
  userSub: string;
  accessToken: string;
}): Promise<{ paymentIntent: Stripe.PaymentIntent; cart: ValidatedCart }> {
  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.retrieve(params.paymentIntentId);

  if (paymentIntent.metadata.userSub !== params.userSub) {
    throw new Error("Payment does not belong to this user");
  }

  if (paymentIntent.status !== "succeeded") {
    throw new Error("Payment has not succeeded");
  }

  if (paymentIntent.metadata.orderPlaced === "true") {
    throw new Error("Order already placed for this payment");
  }

  const items =
    params.items && params.items.length > 0
      ? params.items
      : parseItemsFromMetadata(paymentIntent);

  const cart = await validateCartItems(items, params.accessToken);
  if (paymentIntent.amount !== cart.totalCents) {
    throw new Error("Payment amount does not match cart total");
  }

  return { paymentIntent, cart };
}

export async function markPaymentIntentFulfilled(paymentIntentId: string): Promise<void> {
  const stripe = getStripe();
  await stripe.paymentIntents.update(paymentIntentId, {
    metadata: { orderPlaced: "true" },
  });
}
