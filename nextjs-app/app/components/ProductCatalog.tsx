"use client";

import { useCatalog } from "@/app/context/catalog-context";
import { useShoppingCart } from "@/app/context/cart-context";
import type { Product } from "@/lib/api";
import { useState } from "react";

export default function ProductCatalog() {
  const { products } = useCatalog();
  const { addToCart, isInCart } = useShoppingCart();
  const [cartMessage, setCartMessage] = useState<string | null>(null);

  function handleBuy(product: Product) {
    addToCart(product.id);
    setCartMessage(`“${product.name}” added to cart — checkout from the cart panel.`);
    window.setTimeout(() => setCartMessage(null), 2800);
  }

  if (products.length === 0) {
    return (
      <div className="empty-state">
        <h3>No products yet</h3>
        <p>Your catalog is empty. Managers can add products from the Admin Console (Angular app).</p>
      </div>
    );
  }

  return (
    <div className="catalog-wrapper">
      {cartMessage ? <p className="cart-message">{cartMessage}</p> : null}

      <div className="product-grid">
        {products.map((product) => {
          const inCart = isInCart(product.id);
          return (
            <article key={product.id} className="product-card">
              <div className="product-card-top">
                <span className="product-id">#{product.id}</span>
                <span className="product-price">${Number(product.price).toFixed(2)}</span>
              </div>
              <h3>{product.name}</h3>
              <p>{product.description ?? "No description provided."}</p>
              <div className="product-actions">
                <button
                  type="button"
                  className="btn btn-buy"
                  disabled={inCart}
                  onClick={() => handleBuy(product)}
                >
                  {inCart ? "In cart" : "Add to cart"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
