import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";

interface GuideCard {
  key: string;
  href: string;
  gradient: string;
  badge?: "beginner" | "intermediate" | "advanced" | "experimental";
  icon: React.ReactNode;
}

interface CardGroup {
  labelKey: string;
  cards: GuideCard[];
}

const cardGroups: CardGroup[] = [
  {
    labelKey: "categoryGettingStarted",
    cards: [
      {
        key: "vscode",
        href: "/setup/vscode",
        gradient: "from-blue-500 to-cyan-400",
        badge: "beginner",
        icon: (
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.583 2.603l-5.404 4.93L7.29 3.99 3.6 5.5v13l3.69 1.51 4.89-3.54 5.404 4.927L24 19.6V4.4l-6.417-1.797zM7.29 15.41L3.6 12l3.69-3.41v6.82zM17.583 17.6l-5.404-4.93v-1.34l5.404-4.93v11.2z" />
          </svg>
        ),
      },
      {
        key: "claudeWeb",
        href: "/setup/claude-web",
        gradient: "from-orange-400 to-rose-500",
        badge: "beginner",
        icon: (
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        ),
      },
      {
        key: "claudeCode",
        href: "/setup/claude-code",
        gradient: "from-blue-500 to-cyan-600",
        badge: "beginner",
        icon: (
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
          </svg>
        ),
      },
    ],
  },
  {
    labelKey: "categoryCoreSkills",
    cards: [
      {
        key: "workflow",
        href: "/setup/workflow",
        gradient: "from-emerald-500 to-teal-400",
        badge: "intermediate",
        icon: (
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ),
      },
      {
        key: "bestPractices",
        href: "/setup/best-practices",
        gradient: "from-green-500 to-emerald-400",
        badge: "intermediate",
        icon: (
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        key: "commonWorkflows",
        href: "/setup/common-workflows",
        gradient: "from-indigo-500 to-blue-500",
        badge: "intermediate",
        icon: (
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ),
      },
    ],
  },
  {
    labelKey: "categoryAdvanced",
    cards: [
      {
        key: "memory",
        href: "/setup/memory",
        gradient: "from-teal-500 to-cyan-400",
        badge: "advanced",
        icon: (
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
      {
        key: "costs",
        href: "/setup/costs",
        gradient: "from-amber-500 to-yellow-400",
        badge: "advanced",
        icon: (
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
      },
      {
        key: "security",
        href: "/setup/security",
        gradient: "from-red-500 to-rose-400",
        badge: "advanced",
        icon: (
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        ),
      },
      {
        key: "agentTeams",
        href: "/setup/agent-teams",
        gradient: "from-cyan-500 to-blue-500",
        badge: "experimental",
        icon: (
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
      },
      {
        key: "pixelAgents",
        href: "/setup/pixel-agents",
        gradient: "from-pink-500 to-rose-400",
        badge: "experimental",
        icon: (
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        ),
      },
    ],
  },
];

const badgeStyles: Record<string, { bg: string; text: string; label: string }> = {
  beginner: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    label: "Beginner",
  },
  intermediate: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    label: "Intermediate",
  },
  advanced: {
    bg: "bg-teal-100 dark:bg-teal-900/30",
    text: "text-teal-700 dark:text-teal-400",
    label: "Advanced",
  },
  experimental: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    label: "Experimental",
  },
};

export default function HomePage() {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const locale = useLocale();

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          {t("welcome")}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
          {t("description")}
        </p>
      </div>

      {cardGroups.map((group, groupIndex) => (
        <div key={group.labelKey} className={groupIndex > 0 ? "mt-10" : ""}>
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
            {tc(group.labelKey)}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {group.cards.map((card) => (
              <Link
                key={card.key}
                href={`/${locale}${card.href}`}
                className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} text-white`}
                  >
                    {card.icon}
                  </div>
                  {card.badge && (
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeStyles[card.badge].bg} ${badgeStyles[card.badge].text}`}
                    >
                      {badgeStyles[card.badge].label}
                    </span>
                  )}
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                  {t(`guides.${card.key}.title`)}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t(`guides.${card.key}.description`)}
                </p>
                <div className="mt-4 flex items-center text-sm font-medium text-blue-600 dark:text-blue-400">
                  {t("getStarted")}
                  <svg
                    className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
