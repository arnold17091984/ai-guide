"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProgressLine } from "@/hooks/useProgressLine";

interface MenuItem {
  key: string;
  href: string;
}

interface MenuGroup {
  labelKey: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    labelKey: "categoryGettingStarted",
    items: [
      { key: "vscode", href: "/setup/vscode" },
      { key: "claudeWeb", href: "/setup/claude-web" },
      { key: "claudeCode", href: "/setup/claude-code" },
    ],
  },
  {
    labelKey: "categoryCoreSkills",
    items: [
      { key: "workflow", href: "/setup/workflow" },
      { key: "bestPractices", href: "/setup/best-practices" },
      { key: "commonWorkflows", href: "/setup/common-workflows" },
    ],
  },
  {
    labelKey: "categoryAdvanced",
    items: [
      { key: "memory", href: "/setup/memory" },
      { key: "costs", href: "/setup/costs" },
      { key: "security", href: "/setup/security" },
      { key: "agentTeams", href: "/setup/agent-teams" },
      { key: "pixelAgents", href: "/setup/pixel-agents" },
    ],
  },
];

export default function Sidebar() {
  const t = useTranslations("home.guides");
  const tc = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const { isVisited, progress } = useProgressLine();

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <nav className="sticky top-20 space-y-1">
        {/* Progress bar */}
        <div className="mb-4 px-3">
          <div className="flex items-center justify-between text-xs text-(--text-2)">
            <span>{tc("progress")}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-(--border)">
            <div
              className="h-full rounded-full bg-linear-to-r from-blue-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {menuGroups.map((group, groupIndex) => (
          <div key={group.labelKey} className={groupIndex > 0 ? "pt-4" : ""}>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-(--text-2)">
              {tc(group.labelKey)}
            </p>
            <div className="relative ml-4 border-l border-(--border)">
              {group.items.map((item) => {
                const fullHref = `/${locale}${item.href}`;
                const isActive = pathname === fullHref;
                const visited = isVisited(item.href);

                return (
                  <Link
                    key={item.key}
                    href={fullHref}
                    className={`relative -ml-px flex items-center gap-3 border-l-2 py-2.5 pl-4 pr-3 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                        : visited
                          ? "border-transparent text-(--text-1) hover:border-(--border) hover:bg-(--surface-hover)"
                          : "border-transparent text-(--text-2) hover:border-(--border) hover:bg-(--surface-hover)"
                    }`}
                  >
                    {/* Progress dot */}
                    <span
                      className={`absolute -left-1.25 h-2 w-2 rounded-full transition-all duration-200 ${
                        isActive
                          ? "bg-blue-500 shadow-[0_0_6px_rgba(0,113,227,0.5)]"
                          : visited
                            ? "bg-(--accent)"
                            : "bg-(--border)"
                      }`}
                    />
                    {t(`${item.key}.title`)}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
