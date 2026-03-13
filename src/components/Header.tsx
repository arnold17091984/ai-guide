"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import AuthButton from "./AuthButton";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileDrawer from "./MobileDrawer";
import NotificationBell from "./NotificationBell";
import SearchBar from "./SearchBar";
import { useAuth } from "@/hooks/useAuth";

function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light") {
      setTheme("light");
      document.documentElement.classList.replace("dark", "light");
    }
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.replace(theme, next);
    localStorage.setItem("theme", next);
  };

  return (
    <button
      onClick={toggle}
      className="rounded-md p-2 text-(--text-2) hover:bg-(--bg-elevated) hover:text-(--text-1) transition-colors"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

export default function Header() {
  const locale = useLocale();
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-(--border) bg-(--bg-base)/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Mobile hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-md p-2 text-(--text-2) hover:bg-(--bg-elevated) lg:hidden"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2 font-mono text-lg">
            <span className="text-(--text-3)">ai</span>
            <span className="text-(--accent)">-guide</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <SearchBar />
            <ThemeToggle />
            <LanguageSwitcher />
            {user && <NotificationBell userId={user.id} />}
            <AuthButton />
          </div>
        </div>
      </header>

      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
