import { auth } from "@/auth";
import DashboardHeader from "@/app/components/DashboardHeader";
import { decodeJwtPayload, extractRoles, fetchMyOrders, type Order } from "@/lib/api";
import { logger } from "@/lib/logger";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function OrdersPage() {
  const session = await auth();

  if (!session?.user || !session.accessToken) {
    redirect("/");
  }

  const decodedToken = decodeJwtPayload(session.accessToken);
  const roles = session.roles?.length ? session.roles : extractRoles(session.accessToken);
  const user = session.user;

  const displayName =
    user.name ??
    (decodedToken?.preferred_username as string | undefined) ??
    (decodedToken?.name as string | undefined) ??
    "User";

  let orders: Order[] = [];
  let loadError: string | null = null;

  try {
    orders = await fetchMyOrders(session.accessToken);
    logger.info("Loading my orders page ...", {
      event: "orders.page.view",
      count: orders.length,
      username: user.email ?? "unknown",
    });
  } catch {
    loadError = "We could not load your orders. Please try again.";
    logger.warn("Failed to load my orders page", {
      event: "orders.page.error",
      username: user.email ?? "unknown",
    });
  }

  return (
    <div className="dashboard-shell">
      <DashboardHeader
        authenticated
        displayName={displayName}
        email={user.email}
        roles={roles}
      />

      <main className="dashboard-main profile-page">
        <Link href="/products" className="back-link">
          ← Back to storefront
        </Link>

        <section className="profile-card orders-page-card">
          <div className="orders-page-header">
            <div>
              <p className="section-eyebrow">Account</p>
              <h2>My Orders</h2>
              <p className="helper-text">
                Orders you placed from this storefront after successful checkout.
              </p>
            </div>
            {orders.length > 0 ? (
              <span className="orders-page-count">{orders.length} order{orders.length === 1 ? "" : "s"}</span>
            ) : null}
          </div>

          {loadError ? <p className="form-error">{loadError}</p> : null}

          {!loadError && orders.length === 0 ? (
            <div className="empty-state-inline">
              <p>No orders yet.</p>
              <p className="helper-text">Add products to your cart and complete checkout to see them here.</p>
              <Link href="/products" className="btn btn-primary">
                Browse catalog
              </Link>
            </div>
          ) : null}

          {!loadError && orders.length > 0 ? (
            <div className="ops-table-wrap">
              <table className="ops-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Placed</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{order.productName}</td>
                      <td>{order.quantity}</td>
                      <td>${(Number(order.unitPrice) * order.quantity).toFixed(2)}</td>
                      <td>
                        <span className={`status-pill status-${order.status}`}>{order.status}</span>
                      </td>
                      <td>{new Date(order.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
