"use client";

import { useCatalog } from "@/app/context/catalog-context";
import { useShoppingCart } from "@/app/context/cart-context";
import Link from "next/link";
import { useMemo } from "react";

type ShoppingCartProps = {
  stripeEnabled: boolean;
};

export default function ShoppingCart({ stripeEnabled }: ShoppingCartProps) {
  const { products } = useCatalog();
  const { cartIds, removeFromCart, clearCart } = useShoppingCart();

  const cartItems = useMemo(
    () => products.filter((product) => cartIds.includes(product.id)),
    [products, cartIds],
  );

  const total = cartItems.reduce((sum, item) => sum + Number(item.price), 0);

  if (cartIds.length === 0) {
    return (
      <section className="cart-panel empty-cart">
        <h3>My Cart</h3>
        <p>Your cart is empty. Add products from the catalog below.</p>
      </section>
    );
  }

  return (
    <section className="cart-panel">
      <div className="cart-panel-header">
        <h3>My Cart ({cartItems.length})</h3>
        <button type="button" className="btn btn-secondary btn-sm" onClick={clearCart}>
          Clear cart
        </button>
      </div>
      <ul className="cart-list">
        {cartItems.map((item) => (
          <li key={item.id}>
            <div>
              <strong>{item.name}</strong>
              <span>${Number(item.price).toFixed(2)}</span>
            </div>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => removeFromCart(item.id)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <p className="cart-total">
        Estimated total: <strong>${total.toFixed(2)}</strong>
      </p>
      {!stripeEnabled ? (
        <p className="helper-text">
          Checkout is disabled. Configure Stripe in <code>nextjs-app/.env.local</code>.
        </p>
      ) : null}
      {stripeEnabled ? (
        <Link href="/checkout" className="btn btn-buy">
          Proceed to checkout
        </Link>
      ) : (
        <button type="button" className="btn btn-buy" disabled>
          Checkout unavailable
        </button>
      )}
    </section>
  );
}
