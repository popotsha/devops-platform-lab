"use client";

import { useShoppingCart } from "@/app/context/cart-context";
import type { Order } from "@/lib/api";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function CheckoutSuccessClient() {
  const searchParams = useSearchParams();
  const paymentIntentId =
    searchParams.get("payment_intent") ?? searchParams.get("payment_intent_id");
  const redirectStatus = searchParams.get("redirect_status");
  const { clearCart } = useShoppingCart();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string | null>(null);
  const finalizedRef = useRef(false);

  useEffect(() => {
    if (!paymentIntentId) {
      setStatus("error");
      setMessage("Missing payment reference.");
      return;
    }

    if (redirectStatus && redirectStatus !== "succeeded") {
      setStatus("error");
      setMessage("Payment was not completed successfully.");
      return;
    }

    if (finalizedRef.current) {
      return;
    }
    finalizedRef.current = true;

    let cancelled = false;

    async function finalizeOrder() {
      try {
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId }),
        });

        const payload = (await response.json()) as Order[] | { message?: string };

        if (!response.ok) {
          const errorMessage =
            !Array.isArray(payload) && payload.message
              ? payload.message
              : "Unable to finalize order after payment";

          if (errorMessage.toLowerCase().includes("already placed")) {
            if (!cancelled) {
              clearCart();
              setStatus("success");
            }
            return;
          }

          throw new Error(errorMessage);
        }

        if (!cancelled) {
          clearCart();
          setStatus("success");
        }
      } catch (error) {
        if (!cancelled) {
          finalizedRef.current = false;
          setStatus("error");
          setMessage(error instanceof Error ? error.message : "Unable to finalize order");
        }
      }
    }

    void finalizeOrder();

    return () => {
      cancelled = true;
    };
  }, [paymentIntentId, redirectStatus, clearCart]);

  if (status === "loading") {
    return (
      <section className="payment-result-panel loading">
        <p className="section-eyebrow">Please wait</p>
        <h2>Confirming your order...</h2>
        <p className="helper-text">
          Payment succeeded. We are placing your order and sending a confirmation email.
        </p>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="payment-result-panel failed">
        <div className="payment-result-icon failed">!</div>
        <p className="section-eyebrow">Payment received</p>
        <h2>Order could not be finalized</h2>
        <p className="helper-text">
          {message ?? "Something went wrong while placing your order."}
        </p>
        <div className="payment-result-actions">
          <Link href="/checkout" className="btn btn-primary">
            Return to checkout
          </Link>
          <Link href="/orders" className="btn btn-secondary">
            View my orders
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="payment-result-panel success">
      <div className="payment-result-icon success">✓</div>
      <p className="section-eyebrow">Payment successful</p>
      <h2>Thank you — your order is confirmed</h2>
      <p className="helper-text">
        Payment completed successfully. Your order has been placed and a confirmation email is on
        its way via the notification service.
      </p>
      <ul className="payment-result-checklist">
        <li>Payment received via Stripe</li>
        <li>Order recorded in order service</li>
        <li>Confirmation email queued</li>
      </ul>
      <div className="payment-result-actions">
        <Link href="/products" className="btn btn-primary">
          Back to storefront
        </Link>
        <Link href="/orders" className="btn btn-secondary">
          View my orders
        </Link>
      </div>
    </section>
  );
}
