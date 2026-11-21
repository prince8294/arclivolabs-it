"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  BriefcaseBusiness,
  FolderKanban,
  ReceiptText,
  WalletCards,
  Globe2,
  Settings,
} from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

const navigation = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Website enquiries", href: "/admin/leads", icon: FileText },
  { label: "Deals", href: "/admin/deals", icon: BriefcaseBusiness },
  { label: "Projects", href: "/admin/projects", icon: FolderKanban },
  { label: "Invoices", href: "/admin/invoices", icon: ReceiptText },
  { label: "Finance", href: "/admin/finance", icon: WalletCards },
  { label: "Website content", href: "/admin/website-content", icon: Globe2 },
];

interface AdminShellProps {
  children: ReactNode;
  email: string;
}

function NavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation" className="admin-nav">
      {navigation.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`admin-nav__link${active ? " is-active" : ""}`}
            href={item.href}
            key={item.href}
            onClick={onNavigate}
          >
            <Icon aria-hidden="true" size={17} strokeWidth={1.8} />
            <span>{item.label}</span>
            {active && <span aria-hidden="true" className="admin-nav__indicator" />}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children, email }: AdminShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const reduceMotion = useReducedMotion();
  const menuButton = useRef<HTMLButtonElement>(null);
  const mobileDrawer = useRef<HTMLElement>(null);
  const currentPage =
    pathname === "/admin/leads"
      ? "Website enquiries"
      : pathname === "/admin/deals"
        ? "Deals"
        : pathname === "/admin/projects"
          ? "Projects"
          : pathname === "/admin/invoices"
            ? "Invoices"
            : pathname === "/admin/finance"
              ? "Finance"
              : pathname.startsWith("/admin/website-content")
                ? "Website content"
                : "Dashboard";

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab" || !mobileDrawer.current) return;
      const focusable = mobileDrawer.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    const focusTimer = window.setTimeout(
      () => mobileDrawer.current?.querySelector<HTMLElement>("a[href]")?.focus(),
      0,
    );
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      menuButton.current?.focus();
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    setLoggingOut(true);
    setLogoutError("");
    try {
      await signOut({ redirectTo: "/admin/login" });
    } catch {
      setLogoutError("Sign out could not be completed. Please try again.");
      setLoggingOut(false);
    }
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link aria-label="ArclivoLabs Tech admin home" className="admin-brand" href="/admin">
          <span className="admin-brand__mark">A<span>.</span></span>
          <span className="admin-brand__name">
            ARCLIVOLABS
            <small>TECH / ADMIN</small>
          </span>
        </Link>
        <span className="admin-sidebar__label">WORKSPACE</span>
        <NavigationLinks />
        <div className="admin-sidebar__bottom">
          <span className="admin-sidebar__secure">
            <i />
            PRIVATE WORKSPACE
          </span>
          <button
            className="admin-logout"
            disabled={loggingOut}
            onClick={handleLogout}
            type="button"
          >
            <LogOut aria-hidden="true" size={16} />
            {loggingOut ? "Signing out…" : "Sign out"}
          </button>
          {logoutError && <span className="admin-logout-error" role="alert">{logoutError}</span>}
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <button
            aria-controls="admin-mobile-navigation"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close admin navigation" : "Open admin navigation"}
            className="admin-header__menu"
            onClick={() => setMenuOpen((open) => !open)}
            ref={menuButton}
            type="button"
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
          <div className="admin-header__title">
            <span>ARCLIVOLABS TECH</span>
            <h1>{currentPage}</h1>
          </div>
          <div className="admin-header__account">
            <span className="admin-header__avatar">A</span>
            <span>
              <strong>Administrator</strong>
              <small title={email}>{email}</small>
            </span>
            <Link aria-label="Business settings" href="/admin/settings" title="Business settings">
              <Settings aria-hidden="true" className="admin-header__external" size={14} />
            </Link>
          </div>
        </header>
        <main className="admin-content">{children}</main>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            animate={{ opacity: 1 }}
            className="admin-mobile-backdrop"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => setMenuOpen(false)}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }}
          >
            <motion.aside
              animate={{ x: 0 }}
              aria-label="Admin navigation"
              aria-modal="true"
              className="admin-mobile-drawer"
              exit={{ x: "-100%" }}
              initial={{ x: "-100%" }}
              id="admin-mobile-navigation"
              onClick={(event) => event.stopPropagation()}
              ref={mobileDrawer}
              role="dialog"
              transition={reduceMotion ? { duration: 0 } : { duration: 0.22 }}
            >
              <Link className="admin-brand" href="/admin" onClick={() => setMenuOpen(false)}>
                <span className="admin-brand__mark">A<span>.</span></span>
                <span className="admin-brand__name">
                  ARCLIVOLABS
                  <small>TECH / ADMIN</small>
                </span>
              </Link>
              <span className="admin-sidebar__label">WORKSPACE</span>
              <NavigationLinks onNavigate={() => setMenuOpen(false)} />
              <button
                className="admin-logout"
                disabled={loggingOut}
                onClick={handleLogout}
                type="button"
              >
                <LogOut aria-hidden="true" size={16} />
                {loggingOut ? "Signing out…" : "Sign out"}
              </button>
              {logoutError && <span className="admin-logout-error" role="alert">{logoutError}</span>}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
