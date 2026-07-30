"use client";

import Link from "next/link";
import { signInWithKeycloak } from "@/lib/auth-client";
import UserMenu from "./UserMenu";

interface SiteHeaderProps {
  brandName?: string;
  brandMark?: string;
  authenticated?: boolean;
  displayName?: string;
  email?: string | null;
  roles?: string[];
}

export default function SiteHeader({
  brandName = "Microservice Starter Kit",
  brandMark = "M",
  authenticated = false,
  displayName = "Guest",
  email,
  roles = [],
}: SiteHeaderProps) {
  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <span className="brand-mark" aria-hidden>
          {brandMark}
        </span>
        <span className="brand-word">{brandName}</span>
      </Link>

      <nav className="header-nav" aria-label="Page">
        <a href="/#platform">Platform</a>
        <a href="/#deploy">Deploy</a>
        <a href="/#modules">Services</a>
        <a href="/#how">How it works</a>
        {authenticated ? <Link href="/products">Storefront</Link> : null}
      </nav>

      <div className="header-actions">
        {authenticated ? (
          <>
            <Link href="/products" className="btn btn-ghost">
              Storefront
            </Link>
            <UserMenu displayName={displayName} email={email} roles={roles} />
          </>
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
