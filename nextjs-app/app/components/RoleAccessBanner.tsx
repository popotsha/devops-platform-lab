"use client";

interface RoleAccessBannerProps {
  roles: string[];
}

const PERMISSIONS = {
  manager: [
    "Browse product catalog",
    "Add items to shopping cart & place orders",
    "Manage catalog in Admin Console",
  ],
  customer: [
    "Browse product catalog",
    "Add items to shopping cart & place orders",
    "View your orders",
  ],
};

export default function RoleAccessBanner({ roles }: RoleAccessBannerProps) {
  const isManager = roles.includes("manager");
  const isCustomer = roles.includes("customer");
  const primaryRole = isManager ? "manager" : isCustomer ? "customer" : "guest";
  const permissions = PERMISSIONS[primaryRole as keyof typeof PERMISSIONS];

  if (!permissions) {
    return null;
  }

  return (
    <section className={`role-banner role-banner-${primaryRole}`}>
      <div>
        <p className="role-banner-eyebrow">Storefront access</p>
        <h3>
          Signed in as <strong>{primaryRole}</strong>
          {isManager && isCustomer ? " (manager role active)" : ""}
        </h3>
        <p className="role-banner-copy">
          {isManager
            ? "Managers use this storefront to shop and place orders. Add, edit, and delete products in the Admin Console."
            : "Customers can browse, cart, and place orders. Catalog changes happen in the Admin Console."}
        </p>
      </div>
      <ul className="role-permissions">
        {permissions.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
