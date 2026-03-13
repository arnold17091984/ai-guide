"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import HeroSection from "./HeroSection";
import { fadeUp, staggerContainer } from "@/lib/motion";

const STAT_CARDS = [
  {
    key: "knowledge",
    href: "/knowledge",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    key: "skills",
    href: "/skills",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    key: "teams",
    href: "/teams",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
] as const;

export default function AuthenticatedHero() {
  const { user, loading } = useAuth();
  const t = useTranslations("home");
  const th = useTranslations("hero");
  const locale = useLocale();

  // While loading auth state, show a minimal skeleton to avoid layout shift
  if (loading) {
    return (
      <section className="relative -mx-4 -mt-8 mb-8 px-4 py-20 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="h-12 w-3/4 mx-auto animate-pulse rounded bg-(--bg-elevated)" />
          <div className="mt-4 h-6 w-1/2 mx-auto animate-pulse rounded bg-(--bg-elevated)" />
          <div className="mt-10 h-48 animate-pulse rounded-lg bg-(--bg-elevated)" />
        </div>
      </section>
    );
  }

  // Anonymous visitors see the terminal animation hero
  if (!user) {
    return (
      <HeroSection
        title={th("title")}
        subtitle={th("subtitle")}
        ctaText={th("cta")}
        ctaHref={`/${locale}/setup/vscode`}
        exploreCta={th("exploreCta")}
        exploreHref={`/${locale}/skills`}
      />
    );
  }

  // Authenticated users see a personalized welcome
  const displayName = user.user_metadata?.full_name
    || user.user_metadata?.preferred_username
    || user.email?.split("@")[0]
    || "User";

  return (
    <section className="relative -mx-4 -mt-8 mb-8 px-4 py-16 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-3xl"
      >
        {/* Welcome message */}
        <motion.h1
          variants={fadeUp}
          className="text-3xl font-bold tracking-tight text-(--text-1) sm:text-4xl text-center"
        >
          {th("welcomeBack", { name: displayName })}
        </motion.h1>

        {/* Quick access stat cards */}
        <motion.div
          variants={fadeUp}
          className="mt-8 grid grid-cols-3 gap-3"
        >
          {STAT_CARDS.map((card) => (
            <Link
              key={card.key}
              href={`/${locale}${card.href}`}
              className="group flex flex-col items-center gap-2 rounded-lg border border-(--border) bg-(--bg-surface) p-4 transition-colors hover:border-(--border-hover) hover:bg-(--bg-elevated)"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-(--accent-muted) text-(--accent) transition-colors group-hover:bg-(--accent) group-hover:text-black">
                {card.icon}
              </div>
              <span className="text-sm font-medium text-(--text-2) group-hover:text-(--text-1)">
                {t(`quickAccess.${card.key}`)}
              </span>
            </Link>
          ))}
        </motion.div>

        {/* Continue learning CTA */}
        <motion.div
          variants={fadeUp}
          className="mt-6 flex justify-center"
        >
          <Link
            href={`/${locale}/setup/vscode`}
            className="inline-flex items-center gap-2 text-sm font-medium text-(--accent) hover:text-(--accent-hover) transition-colors"
          >
            {t("getStarted")}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
