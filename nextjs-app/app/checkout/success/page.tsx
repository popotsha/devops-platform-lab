import { auth } from "@/auth";
import DashboardHeader from "@/app/components/DashboardHeader";
import { CartProvider } from "@/app/context/cart-context";
import CheckoutSuccessClient from "@/app/checkout/success/CheckoutSuccessClient";
import { decodeJwtPayload, extractRoles } from "@/lib/api";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function CheckoutSuccessPage() {
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

  return (
    <div className="dashboard-shell">
      <DashboardHeader
        authenticated
        displayName={displayName}
        email={email}
        roles={roles}
      />
      <main className="dashboard-main">
        <CartProvider>
          <Suspense fallback={<p className="helper-text">Loading confirmation...</p>}>
            <CheckoutSuccessClient />
          </Suspense>
        </CartProvider>
      </main>
    </div>
  );
}
