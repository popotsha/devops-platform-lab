import { auth } from "@/auth";
import { decodeJwtPayload } from "@/lib/api";
import { validateCartItems, type CartItemInput } from "@/lib/cart-pricing";
import { isStripeEnabled } from "@/lib/payment-config";
import { logger } from "@/lib/logger";
import { getStripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  const accessToken = session?.accessToken;

  if (!accessToken || !session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!isStripeEnabled()) {
    return NextResponse.json(
      { message: "Stripe payments are disabled or not configured" },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as { items?: CartItemInput[] };
    const cart = await validateCartItems(body.items ?? [], accessToken);
    const stripe = getStripe();

    const userSub = (decodeJwtPayload(accessToken)?.sub as string | undefined) ?? "unknown";

    const paymentIntent = await stripe.paymentIntents.create({
      amount: cart.totalCents,
      currency: cart.currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        userSub,
        itemsJson: JSON.stringify(
          cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        ),
      },
    });

    logger.info("Stripe payment intent created", {
      event: "payment.intent.created",
      amount: cart.totalCents,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: cart.totalCents,
      currency: cart.currency,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start checkout";
    logger.error("Failed to create payment intent", {
      event: "payment.intent.error",
      message,
    });
    return NextResponse.json({ message }, { status: 400 });
  }
}
