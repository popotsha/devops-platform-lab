"use client";

import { useCatalog } from "@/app/context/catalog-context";
import { useShoppingCart } from "@/app/context/cart-context";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type CheckoutFlowProps = {
  stripeEnabled: boolean;
  stripePublishableKey: string;
  stripeDisabledMessage: string;
  catalogError?: string | null;
};

type CheckoutFormProps = {
  clientSecret: string;
  paymentIntentId: string;
  totalLabel: string;
};

function CheckoutForm({
  clientSecret,
  paymentIntentId,
  totalLabel,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setErrorMessage(submitError.message ?? "Please check your payment details.");
      setIsSubmitting(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
      redirect: "if_required",
    });

    if (confirmError) {
      setIsSubmitting(false);
      router.push(
        `/checkout/failed?reason=${encodeURIComponent(confirmError.message ?? "payment_failed")}`,
      );
      return;
    }

    router.push(`/checkout/success?payment_intent=${encodeURIComponent(paymentIntentId)}`);
  }

  return (
    <form className="checkout-payment-form" onSubmit={handleSubmit}>
      <PaymentElement options={{ layout: "tabs" }} />
      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
      <button
        type="submit"
        className="btn btn-primary checkout-pay-btn"
        disabled={!stripe || isSubmitting}
      >
        {isSubmitting ? "Processing payment..." : `Pay ${totalLabel}`}
      </button>
      <p className="checkout-test-hint">
        Stripe test card: <code>4242 4242 4242 4242</code> · any future expiry · any CVC
      </p>
    </form>
  );
}

export default function CheckoutFlow({
  stripeEnabled,
  stripePublishableKey,
  stripeDisabledMessage,
  catalogError = null,
}: CheckoutFlowProps) {
  const { products } = useCatalog();
  const { cartIds, isReady } = useShoppingCart();
  const stripePromise = useMemo(
    () => (stripeEnabled && stripePublishableKey ? loadStripe(stripePublishableKey) : null),
    [stripeEnabled, stripePublishableKey],
  );
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingIntent, setIsLoadingIntent] = useState(true);
  const intentRequestRef = useRef(0);

  const cartItems = useMemo(
    () => products.filter((product) => cartIds.includes(product.id)),
    [products, cartIds],
  );

  const total = cartItems.reduce((sum, item) => sum + Number(item.price), 0);
  const cartSignature = cartIds.join(",");

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!stripeEnabled || cartIds.length === 0) {
      setIsLoadingIntent(false);
      setClientSecret(null);
      setPaymentIntentId(null);
      setLoadError(null);
      return;
    }

    if (catalogError) {
      setIsLoadingIntent(false);
      setLoadError(catalogError);
      return;
    }

    if (cartItems.length === 0) {
      setIsLoadingIntent(false);
      setLoadError("Cart items could not be matched to the catalog. Return home and try again.");
      return;
    }

    if (!stripePublishableKey) {
      setIsLoadingIntent(false);
      setLoadError("Stripe publishable key is missing. Check nextjs-app/.env.local and restart.");
      return;
    }

    const requestId = ++intentRequestRef.current;
    let cancelled = false;

    async function createIntent() {
      setIsLoadingIntent(true);
      setLoadError(null);
      setClientSecret(null);
      setPaymentIntentId(null);

      try {
        const response = await fetch("/api/payments/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cartIds.map((productId) => ({ productId, quantity: 1 })),
          }),
        });

        const payload = (await response.json()) as {
          clientSecret?: string;
          paymentIntentId?: string;
          message?: string;
        };

        if (!response.ok || !payload.clientSecret || !payload.paymentIntentId) {
          throw new Error(payload.message ?? "Unable to start checkout");
        }

        if (!cancelled && requestId === intentRequestRef.current) {
          setClientSecret(payload.clientSecret);
          setPaymentIntentId(payload.paymentIntentId);
        }
      } catch (error) {
        if (!cancelled && requestId === intentRequestRef.current) {
          setLoadError(error instanceof Error ? error.message : "Unable to start checkout");
        }
      } finally {
        if (!cancelled && requestId === intentRequestRef.current) {
          setIsLoadingIntent(false);
        }
      }
    }

    void createIntent();

    return () => {
      cancelled = true;
    };
  }, [
    isReady,
    stripeEnabled,
    stripePublishableKey,
    cartSignature,
    cartItems.length,
    catalogError,
    cartIds,
  ]);

  if (!isReady) {
    return (
      <section className="checkout-panel">
        <p className="helper-text">Loading checkout...</p>
      </section>
    );
  }

  if (cartIds.length === 0) {
    return (
      <section className="checkout-panel empty-checkout">
        <h2>Your cart is empty</h2>
        <p>Add products from the catalog before checking out.</p>
        <Link href="/products" className="btn btn-primary">
          Back to catalog
        </Link>
      </section>
    );
  }

  return (
    <section className="checkout-layout">
      <div className="checkout-grid">
        <article className="checkout-panel">
          <p className="section-eyebrow">Checkout</p>
          <h2>Payment</h2>
          <p className="helper-text">
            Enter your payment details below. Your order is placed when payment succeeds.
          </p>

          {!stripeEnabled ? (
            <div className="payment-result-panel failed checkout-disabled-panel">
              <p className="form-error">{stripeDisabledMessage}</p>
              <p className="helper-text">
                Enable Stripe in <code>nextjs-app/.env.local</code> and restart the storefront
                container.
              </p>
            </div>
          ) : null}

          {stripeEnabled && isLoadingIntent ? (
            <p className="helper-text">Preparing secure checkout...</p>
          ) : null}
          {stripeEnabled && loadError ? <p className="form-error">{loadError}</p> : null}
          {stripeEnabled && !isLoadingIntent && !loadError && !clientSecret ? (
            <p className="helper-text">Preparing secure checkout...</p>
          ) : null}

          {stripeEnabled && clientSecret && paymentIntentId && stripePromise ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm
                clientSecret={clientSecret}
                paymentIntentId={paymentIntentId}
                totalLabel={`$${total.toFixed(2)}`}
              />
            </Elements>
          ) : null}
        </article>

        <aside className="checkout-summary cart-panel">
          <h3>Order summary</h3>
          <ul className="cart-list">
            {cartItems.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <span>${Number(item.price).toFixed(2)}</span>
                </div>
              </li>
            ))}
          </ul>
          <p className="cart-total">
            Total due: <strong>${total.toFixed(2)}</strong>
          </p>
          <Link href="/products" className="btn btn-secondary">
            ← Continue shopping
          </Link>
        </aside>
      </div>
    </section>
  );
}
