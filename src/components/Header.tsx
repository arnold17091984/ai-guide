"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import Link from "next/link";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header() {
  const t = useTranslations("common");
  const locale = useLocale();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={`/${locale}`} className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-lg font-bold text-white">
            AI
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {t("title")}
            </h1>
            <p className="hidden text-xs text-gray-500 dark:text-gray-400 sm:block">
              {t("subtitle")}
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href={`/${locale}`}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {t("home")}
            </Link>
            <Link
              href={`/${locale}/setup/vscode`}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              VS Code
            </Link>
            <Link
              href={`/${locale}/setup/claude-web`}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Claude Web
            </Link>
            <Link
              href={`/${locale}/setup/claude-code`}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Claude Code
            </Link>
          </nav>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
