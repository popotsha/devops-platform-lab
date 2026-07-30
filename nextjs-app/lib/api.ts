export interface Product {
  id: number;
  name: string;
  description?: string;
  price: string | number;
}

export interface Order {
  id: number;
  userSub: string;
  userEmail?: string;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: string | number;
  status: string;
  createdAt: string;
}

function getApiGatewayUrl() {
  return process.env.API_GATEWAY_URL ?? "http://localhost:3001";
}

export async function fetchProducts(accessToken: string): Promise<Product[]> {
  const response = await fetch(`${getApiGatewayUrl()}/products`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load products: ${response.status}`);
  }

  return response.json() as Promise<Product[]>;
}

export async function fetchMyOrders(accessToken: string): Promise<Order[]> {
  const response = await fetch(`${getApiGatewayUrl()}/orders/mine`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load orders: ${response.status}`);
  }

  return response.json() as Promise<Order[]>;
}

export function decodeJwtPayload(token?: string | null) {
  if (!token) {
    return null;
  }

  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const base64 = Buffer.from(normalized, "base64").toString("utf8");
    return JSON.parse(base64) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function extractRoles(token?: string | null): string[] {
  const payload = decodeJwtPayload(token);
  const realmAccess = payload?.realm_access as { roles?: string[] } | undefined;
  return realmAccess?.roles ?? [];
}
