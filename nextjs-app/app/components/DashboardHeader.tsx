"use client";

import Link from "next/link";
import { signInWithKeycloak } from "@/lib/auth-client";
import UserMenu from "./UserMenu";

interface DashboardHeaderProps {
  authenticated: boolean;
  displayName: string;
  email?: string | null;
  roles?: string[];
}

export default function DashboardHeader({
  authenticated,
  displayName,
  email,
  roles = [],
}: DashboardHeaderProps) {
  return (
    <header className="dashboard-header">
      <Link href="/" className="header-brand">
        <div className="brand-icon">M</div>
        <div>
          <p className="brand-eyebrow">Microservice Starter Kit</p>
          <h1 className="brand-title">Customer Storefront</h1>
        </div>
      </Link>

      <div className="header-actions">
        <Link href="/" className="btn btn-secondary">
          Home
        </Link>
        {authenticated ? (
          <UserMenu displayName={displayName} email={email} roles={roles} />
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => signInWithKeycloak("/products")}
          >
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}

export function HeroSignIn() {
  return (
    <div className="hero-cta-row">
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => signInWithKeycloak("/products")}
      >
        Sign in to shop
      </button>
      <Link href="/" className="btn btn-secondary">
        Back to home
      </Link>
    </div>
  );
}
