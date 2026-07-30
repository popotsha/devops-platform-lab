import { auth } from "@/auth";
import { decodeJwtPayload } from "@/lib/api";
import type { CartItemInput } from "@/lib/cart-pricing";
import { logger } from "@/lib/logger";
import {
  markPaymentIntentFulfilled,
  verifyPaymentForOrder,
} from "@/lib/payment-verification";
import { isStripeEnabled } from "@/lib/payment-config";
import { NextResponse } from "next/server";

function getApiGatewayUrl() {
  return process.env.API_GATEWAY_URL ?? "http://localhost:3001";
}

export async function POST(request: Request) {
  logger.info("Placing order ...", { event: "order.create" });
  const session = await auth();
  const accessToken = session?.accessToken;

  if (!accessToken || !session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      items?: CartItemInput[];
      paymentIntentId?: string;
    };

    if (!isStripeEnabled()) {
      return NextResponse.json(
        { message: "Stripe payments are disabled or not configured" },
        { status: 503 },
      );
    }

    if (!body.paymentIntentId) {
      return NextResponse.json(
        { message: "Payment is required before placing an order" },
        { status: 402 },
      );
    }

    const userSub = (decodeJwtPayload(accessToken)?.sub as string | undefined) ?? "unknown";

    const { cart } = await verifyPaymentForOrder({
      paymentIntentId: body.paymentIntentId,
      items: body.items,
      userSub,
      accessToken,
    });

    const response = await fetch(`${getApiGatewayUrl()}/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    await markPaymentIntentFulfilled(body.paymentIntentId);

    logger.info("Order placed after successful payment", {
      event: "order.create.ok",
      paymentIntentId: body.paymentIntentId,
    });

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to place order";
    logger.error("Failed to place order.", {
      event: "order.create.error",
      message,
    });
    return NextResponse.json({ message }, { status: 400 });
  }
}
