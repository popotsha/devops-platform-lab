"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const CART_KEY = "storefront-cart";

function readCart(): number[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

function writeCart(ids: number[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(ids));
}

interface CartContextValue {
  cartIds: number[];
  /** False until localStorage cart has been read on the client. */
  isReady: boolean;
  addToCart: (productId: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  isInCart: (productId: number) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartIds, setCartIds] = useState<number[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setCartIds(readCart());
    setIsReady(true);
  }, []);

  const addToCart = useCallback((productId: number) => {
    setCartIds((current) => {
      if (current.includes(productId)) {
        return current;
      }

      const next = [...current, productId];
      writeCart(next);
      return next;
    });
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCartIds((current) => {
      const next = current.filter((id) => id !== productId);
      writeCart(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCartIds([]);
    writeCart([]);
  }, []);

  const isInCart = useCallback(
    (productId: number) => cartIds.includes(productId),
    [cartIds],
  );

  const value = useMemo(
    () => ({ cartIds, isReady, addToCart, removeFromCart, clearCart, isInCart }),
    [cartIds, isReady, addToCart, removeFromCart, clearCart, isInCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useShoppingCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useShoppingCart must be used within CartProvider");
  }

  return context;
}
