import { auth } from "@/auth";
import type { Order } from "@/lib/api";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

function getApiGatewayUrl() {
  return process.env.API_GATEWAY_URL ?? "http://localhost:3001";
}

export async function GET() {
  logger.info('Listing my orders ...', { event: 'orders.list.mine' });
  const session = await auth();
  const accessToken = session?.accessToken;

  if (!accessToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const response = await fetch(`${getApiGatewayUrl()}/orders/mine`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  const data = (await response.json()) as Order[];
  return NextResponse.json(data, { status: response.status });
}
