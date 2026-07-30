"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

type UserMenuProps = {
  displayName: string;
  email?: string | null;
  roles?: string[];
};

const ADMIN_CONSOLE_URL =
  process.env.NEXT_PUBLIC_ADMIN_CONSOLE_URL?.trim() || "http://localhost:4200";

export default function UserMenu({ displayName, email, roles = [] }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const initial = displayName.charAt(0).toUpperCase() || "S";
  const isManager = roles.includes("manager");

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    sessionStorage.setItem("sso-logout-pending", "1");
    window.location.href = "/api/auth/logout";
  };

  return (
    <div className="user-menu" ref={rootRef}>
      <button
        type="button"
        className="user-menu-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label="Open account menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="user-avatar" aria-hidden>
          {initial}
        </span>
        <span className="user-menu-trigger-copy">
          <span className="user-name">{displayName}</span>
          <span className="user-meta">{email ?? "Account & profile"}</span>
        </span>
        <span className="user-menu-caret" aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <div className="user-menu-panel" id={menuId} role="menu">
          <div className="user-menu-header">
            <span className="user-avatar user-avatar-lg" aria-hidden>
              {initial}
            </span>
            <div>
              <p className="user-name">{displayName}</p>
              {email ? <p className="user-meta">{email}</p> : null}
            </div>
          </div>

          {roles.length > 0 ? (
            <div className="user-menu-section">
              <p className="user-menu-label">Roles</p>
              <div className="role-badges user-menu-roles">
                {roles.map((role) => (
                  <span key={role} className="role-badge">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="user-menu-section">
            <p className="user-menu-label">Account</p>
            <nav className="user-menu-links" aria-label="Account">
              <Link
                href="/profile"
                className="user-menu-link user-menu-link-primary"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <span>My Profile</span>
                <span className="user-menu-link-hint">Account details & permissions</span>
              </Link>
              <Link
                href="/orders"
                className="user-menu-link"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <span>My Orders</span>
                <span className="user-menu-link-hint">Order history & status</span>
              </Link>
              {isManager ? (
                <a
                  href={ADMIN_CONSOLE_URL}
                  className="user-menu-link"
                  role="menuitem"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                >
                  <span>Admin Console</span>
                  <span className="user-menu-link-hint">Catalog management (Angular)</span>
                </a>
              ) : null}
            </nav>
          </div>

          <div className="user-menu-actions">
            <button type="button" className="btn btn-danger user-menu-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
