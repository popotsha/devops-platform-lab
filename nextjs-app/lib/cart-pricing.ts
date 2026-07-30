import { fetchProducts, type Product } from "@/lib/api";

export interface CartItemInput {
  productId: number;
  quantity: number;
}

export interface ValidatedCartItem {
  productId: number;
  quantity: number;
  name: string;
  unitPrice: number;
  lineTotal: number;
}

export interface ValidatedCart {
  items: ValidatedCartItem[];
  totalCents: number;
  currency: "usd";
}

export async function validateCartItems(
  items: CartItemInput[],
  accessToken: string,
): Promise<ValidatedCart> {
  if (!items?.length) {
    throw new Error("Cart is empty");
  }

  const products = await fetchProducts(accessToken);
  const productMap = new Map<number, Product>(products.map((product) => [product.id, product]));

  const validatedItems: ValidatedCartItem[] = [];
  let total = 0;

  for (const item of items) {
    if (!item.productId || item.quantity < 1) {
      throw new Error("Invalid cart item");
    }

    const product = productMap.get(item.productId);
    if (!product) {
      throw new Error(`Product ${item.productId} not found`);
    }

    const unitPrice = Number(product.price);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new Error(`Invalid price for product ${item.productId}`);
    }

    const lineTotal = unitPrice * item.quantity;
    total += lineTotal;
    validatedItems.push({
      productId: item.productId,
      quantity: item.quantity,
      name: product.name,
      unitPrice,
      lineTotal,
    });
  }

  const totalCents = Math.round(total * 100);
  if (totalCents < 50) {
    throw new Error("Order total must be at least $0.50");
  }

  return {
    items: validatedItems,
    totalCents,
    currency: "usd",
  };
}
