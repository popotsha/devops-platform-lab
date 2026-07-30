"use client";

import type { Product } from "@/lib/api";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface CatalogContextValue {
  products: Product[];
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

interface CatalogProviderProps {
  initialProducts: Product[];
  children: ReactNode;
}

export function CatalogProvider({ initialProducts, children }: CatalogProviderProps) {
  const [products, setProducts] = useState(initialProducts);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const value = useMemo(() => ({ products }), [products]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);

  if (!context) {
    throw new Error("useCatalog must be used within CatalogProvider");
  }

  return context;
}
