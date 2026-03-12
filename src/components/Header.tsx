"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import AuthButton from "./AuthButton";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileDrawer from "./MobileDrawer";
import NotificationBell from "./NotificationBell";
import SearchBar from "./SearchBar";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const t = useTranslations("common");
  const locale = useLocale();
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-30 border-b border-white/20 backdrop-blur-2xl backdrop-saturate-150 transition-all duration-300 dark:border-white/10 ${
          scrolled
            ? "bg-white/70 py-3 shadow-lg shadow-blue-500/5 dark:bg-slate-900/70"
            : "bg-white/50 py-4 dark:bg-slate-900/50"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Mobile hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg p-2 text-(--text-2) hover:bg-(--surface-hover) lg:hidden"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link href={`/${locale}`} className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-cyan-500 text-lg font-bold text-white">
              <span className="relative z-10">AI</span>
              <div className="absolute inset-0 rounded-lg bg-linear-to-br from-blue-500 to-cyan-500 opacity-50 blur-md" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-(--text-1)">
                {t("title")}
              </h1>
              <p className="hidden text-xs text-(--text-2) sm:block">
                {t("subtitle")}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <nav className="hidden items-center gap-1 md:flex">
              {[
                { label: t("home"), href: `/${locale}` },
                { label: t("navKnowledge"), href: `/${locale}/knowledge` },
                { label: t("navSkills"), href: `/${locale}/skills` },
                { label: t("navClaudeMd"), href: `/${locale}/claude-md` },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative rounded-lg px-3 py-2 text-sm font-medium text-(--text-2) transition-colors hover:text-(--text-1) group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-(--primary) transition-all duration-200 group-hover:w-4/5" />
                </Link>
              ))}
            </nav>
            <SearchBar />
            <div className="h-6 w-px bg-(--border)" />
            <LanguageSwitcher />
            <div className="h-6 w-px bg-(--border)" />
            {user && <NotificationBell userId={user.id} />}
            <AuthButton />
          </div>
        </div>
        {/* Gradient bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-500/40 to-transparent" />
      </header>

      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
