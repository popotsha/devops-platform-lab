import { auth } from "@/auth";
import DashboardHeader from "@/app/components/DashboardHeader";
import { decodeJwtPayload, extractRoles } from "@/lib/api";
import { logger } from "@/lib/logger";
import Link from "next/link";
import { redirect } from "next/navigation";

const PERMISSION_MATRIX = [
  { feature: "Browse catalog", customer: true, manager: true },
  { feature: "Shopping cart", customer: true, manager: true },
  { feature: "Create products", customer: false, manager: false },
  { feature: "Edit listings", customer: false, manager: false },
  { feature: "Delete products", customer: false, manager: false },
  { feature: "Admin analytics", customer: false, manager: false },
];

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user || !session.accessToken) {
    redirect("/");
  }

  const decodedToken = decodeJwtPayload(session.accessToken);
  const roles = session.roles?.length ? session.roles : extractRoles(session.accessToken);
  const user = session.user;
  const isManager = roles.includes("manager");

  logger.info('Loading profile page ...', {
    event: 'profile.view',
    role: roles[0] ?? 'unknown',
    username: user.email ?? 'unknown',
  });

  const displayName =
    user.name ??
    (decodedToken?.preferred_username as string | undefined) ??
    (decodedToken?.name as string | undefined) ??
    "User";

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

        <section className="profile-card">
          <h2>My Profile</h2>
          <dl className="profile-details">
            <div>
              <dt>Username</dt>
              <dd>{displayName}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email ?? "N/A"}</dd>
            </div>
            <div>
              <dt>Roles</dt>
              <dd>{roles.length ? roles.join(", ") : "No roles assigned"}</dd>
            </div>
            <div>
              <dt>Active app</dt>
              <dd>Customer Storefront (Next.js)</dd>
            </div>
          </dl>

          <h3>Storefront permissions</h3>
          <p className="helper-text">
            Product creation, deletion, and analytics are available in the Admin Console
            (Angular app), not this storefront.
          </p>
          <div className="permissions-matrix">
            {PERMISSION_MATRIX.map((row) => (
              <div key={row.feature}>
                <span>{row.feature}</span>
                <span>{(isManager ? row.manager : row.customer) ? "Allowed" : "Locked"}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
