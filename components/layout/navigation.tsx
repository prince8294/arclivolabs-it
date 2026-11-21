"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
  { label: "Home", href: "#home" },
  { label: "Services", href: "#services" },
  { label: "Solutions", href: "#solutions" },
  { label: "Process", href: "#process" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

function BrandMark() {
  return (
    <span aria-hidden="true" className="brand-mark">
      <svg fill="none" viewBox="0 0 24 24">
        <path
          d="M5 17.5 12 5l7 12.5M8.2 12h7.6M9.1 16.4h5.8"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.6"
        />
        <circle cx="12" cy="5" r="1.15" fill="#365BFF" />
      </svg>
    </span>
  );
}

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const updateScroll = () => setScrolled(window.scrollY > 24);
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });

    const sections = links
      .map(({ href }) => document.querySelector<HTMLElement>(href))
      .filter((section): section is HTMLElement => section !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: [0, 0.15, 0.4] },
    );
    sections.forEach((section) => observer.observe(section));

    return () => {
      window.removeEventListener("scroll", updateScroll);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.body.classList.add("menu-open");
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("menu-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
        <div className="site-header__bar">
          <Link
            aria-label="ArclivoLabs Tech home"
            className="brand-lockup"
            href="#home"
            onClick={closeMenu}
          >
            <BrandMark />
            <span className="brand-text">
              ARCLIVOLABS
              <small>TECHNOLOGY &amp; DIGITAL</small>
            </span>
          </Link>

          <nav aria-label="Main navigation" className="desktop-nav">
            {links.map((link) => {
              const section = link.href.slice(1);
              return (
                <Link
                  aria-current={activeSection === section ? "location" : undefined}
                  className={`nav-link${activeSection === section ? " is-active" : ""}`}
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                  {activeSection === section && (
                    <motion.span
                      className="nav-link__indicator"
                      layoutId="active-nav-indicator"
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 420, damping: 34 }
                      }
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="nav-cta-wrap">
            <Link className="button button--primary nav-cta" href="#contact">
              Start a Project
              <ArrowUpRight aria-hidden="true" size={14} />
            </Link>
          </div>

          <button
            aria-controls="mobile-navigation"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            className={`menu-toggle${menuOpen ? " is-open" : ""}`}
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            animate={{ opacity: 1, y: 0 }}
            aria-label="Mobile navigation"
            className="mobile-overlay"
            id="mobile-navigation"
            initial={{ opacity: 0, y: 12 }}
            exit={{ opacity: 0, y: 12 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.24 }}
          >
            <div className="mobile-overlay__links">
              {links.map((link, index) => (
                <Link
                  className="mobile-overlay__link"
                  href={link.href}
                  key={link.href}
                  onClick={closeMenu}
                >
                  {link.label}
                  <span>0{index + 1}</span>
                </Link>
              ))}
            </div>
            <div className="mobile-overlay__bottom">
              <span>INDEPENDENT DIGITAL ENGINEERING STUDIO</span>
              <span>© {new Date().getFullYear()}</span>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
