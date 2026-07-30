import Link from "next/link";
import { redirect } from "next/navigation";
import DashboardHeader from "@/app/components/DashboardHeader";
import ProductCatalog from "@/app/components/ProductCatalog";
import RoleAccessBanner from "@/app/components/RoleAccessBanner";
import ShoppingCart from "@/app/components/ShoppingCart";
import { CartProvider } from "@/app/context/cart-context";
import { CatalogProvider } from "@/app/context/catalog-context";
import { decodeJwtPayload, extractRoles, fetchProducts } from "@/lib/api";
import { isStripeEnabled } from "@/lib/payment-config";
import { logger } from "@/lib/logger";
import { auth } from "@/auth";

export default async function ProductsPage() {
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

  logger.info("Loading storefront ...", {
    event: "storefront.load",
    authenticated: true,
    role: roles[0] ?? "guest",
    username: user?.email ?? "anonymous",
  });

  let products: Awaited<ReturnType<typeof fetchProducts>> = [];
  let productsError: string | null = null;

  try {
    logger.info("Fetching products ...", { event: "products.fetch" });
    products = await fetchProducts(accessToken);
    logger.info("Products fetched.", { event: "products.fetch.ok", count: products.length });
  } catch {
    logger.warn("Failed to fetch products.", { event: "products.fetch.error" });
    productsError = "We could not load products from the API gateway.";
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
        <RoleAccessBanner roles={roles} />

        <CatalogProvider initialProducts={products}>
          <CartProvider>
            <div className="shop-layout">
              <div className="shop-column">
                <section className="section-header">
                  <div>
                    <p className="section-eyebrow">Catalog</p>
                    <h2>Add products to cart</h2>
                  </div>
                  <Link href="/" className="btn btn-ghost">
                    Home
                  </Link>
                </section>

                <p className="helper-text customer-note">
                  Add items to your cart, then checkout securely. View past purchases under{" "}
                  <strong>My Orders</strong> in the account menu. Catalog management lives in the{" "}
                  <strong>Admin Console</strong> (Angular).
                </p>

                {productsError ? <p className="form-error">{productsError}</p> : null}
                <ProductCatalog />
              </div>
              <ShoppingCart stripeEnabled={stripeEnabled} />
            </div>
          </CartProvider>
        </CatalogProvider>
      </main>
    </div>
  );
}
