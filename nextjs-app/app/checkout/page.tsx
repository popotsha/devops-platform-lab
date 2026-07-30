import { auth } from "@/auth";
import DashboardHeader from "@/app/components/DashboardHeader";
import { CartProvider } from "@/app/context/cart-context";
import { CatalogProvider } from "@/app/context/catalog-context";
import CheckoutFlow from "@/app/checkout/CheckoutFlow";
import { decodeJwtPayload, extractRoles, fetchProducts } from "@/lib/api";
import { getStripeDisabledMessage, isStripeEnabled } from "@/lib/payment-config";
import { getStripePublishableKey } from "@/lib/stripe";
import { redirect } from "next/navigation";

export default async function CheckoutPage() {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user && session.accessToken);

  if (!isAuthenticated || !session?.accessToken) {
    redirect("/");
  }

  const accessToken = session.accessToken;
  const decodedToken = decodeJwtPayload(accessToken);
  const roles = session.roles?.length ? session.roles : extractRoles(accessToken);
  const user = session.user;
  const displayName =
    user?.name ??
    (decodedToken?.preferred_username as string | undefined) ??
    (decodedToken?.name as string | undefined) ??
    "User";
  const email = user?.email ?? (decodedToken?.email as string | undefined);

  let products: Awaited<ReturnType<typeof fetchProducts>> = [];
  let catalogError: string | null = null;
  try {
    products = await fetchProducts(accessToken);
  } catch {
    products = [];
    catalogError = "Unable to load catalog for checkout. Please return home and try again.";
  }

  const stripeEnabled = isStripeEnabled();

  return (
    <div className="dashboard-shell">
      <DashboardHeader
        authenticated
        displayName={displayName}
        email={email}
        roles={roles}
      />
      <main className="dashboard-main">
        <CatalogProvider initialProducts={products}>
          <CartProvider>
            <CheckoutFlow
              stripeEnabled={stripeEnabled}
              stripePublishableKey={stripeEnabled ? getStripePublishableKey() : ""}
              stripeDisabledMessage={getStripeDisabledMessage()}
              catalogError={catalogError}
            />
          </CartProvider>
        </CatalogProvider>
      </main>
    </div>
  );
}
