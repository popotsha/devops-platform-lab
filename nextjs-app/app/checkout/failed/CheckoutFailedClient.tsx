"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function CheckoutFailedClient() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  return (
    <section className="payment-result-panel failed">
      <div className="payment-result-icon failed">×</div>
      <p className="section-eyebrow">Payment failed</p>
      <h2>We could not complete your payment</h2>
      <p className="helper-text">
        {reason
          ? decodeURIComponent(reason)
          : "Your card was declined or the payment was cancelled. No order was placed and you were not charged."}
      </p>
      <ul className="payment-result-checklist failed-list">
        <li>No order was created</li>
        <li>Your cart items are still saved</li>
        <li>You can try again with a different payment method</li>
      </ul>
      <div className="payment-result-actions">
        <Link href="/checkout" className="btn btn-primary">
          Try payment again
        </Link>
        <Link href="/products" className="btn btn-secondary">
          Back to cart
        </Link>
      </div>
    </section>
  );
}
