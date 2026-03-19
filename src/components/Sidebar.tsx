"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProgressLine } from "@/hooks/useProgressLine";

interface MenuItem {
  key: string;
  href: string;
  /** When set, use tc(commonKey) instead of t(`${key}.title`) */
  commonKey?: string;
}

interface MenuGroup {
  labelKey: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    labelKey: "categoryPlatform",
    items: [
      { key: "knowledge", href: "/knowledge", commonKey: "navKnowledge" },
      { key: "debtTracker", href: "/knowledge/debt", commonKey: "navDebtTracker" },
      { key: "skills", href: "/skills", commonKey: "navSkills" },
      { key: "packages", href: "/skills/packages", commonKey: "navPackages" },
      { key: "mySkills", href: "/skills/my", commonKey: "navMySkills" },
      { key: "learningPaths", href: "/learning-paths", commonKey: "navLearningPaths" },
      { key: "claudeMdWorkshop", href: "/claude-md", commonKey: "navClaudeMd" },
      { key: "community", href: "/community", commonKey: "navCommunity" },
      { key: "teams", href: "/teams", commonKey: "navTeams" },
      { key: "caseStudies", href: "/case-studies", commonKey: "navCaseStudies" },
      { key: "trending", href: "/trending", commonKey: "navTrending" },
      { key: "digest", href: "/digest", commonKey: "navDigest" },
    ],
  },
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

  // All sections expanded by default
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggleSection(labelKey: string) {
    setCollapsed((prev) => ({ ...prev, [labelKey]: !prev[labelKey] }));
  }

  return (
    <aside className="hidden w-60 shrink-0 border-r border-(--border) lg:block">
      <nav className="sticky top-20 py-4 px-3">
        {/* Progress bar */}
        <div className="mb-4 px-2">
          <div className="flex items-center justify-between text-xs text-(--text-3) font-mono mb-1.5">
            <span>{tc("progress")}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-(--bg-elevated)">
            <div
              className="h-1 rounded-full bg-(--accent) transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          {menuGroups.map((group) => {
            const isCollapsed = collapsed[group.labelKey] === true;

            return (
              <div key={group.labelKey} className="pt-3 first:pt-0">
                {/* Section header */}
                <button
                  type="button"
                  onClick={() => toggleSection(group.labelKey)}
                  className="flex w-full items-center justify-between px-2 py-1.5 cursor-pointer"
                >
                  <span className="text-xs font-mono uppercase tracking-wider text-(--text-3)">
                    {tc(group.labelKey)}
                  </span>
                  <svg
                    className={`h-3 w-3 text-(--text-3) transition-transform duration-200 ${
                      isCollapsed ? "" : "rotate-90"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Collapsible items */}
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="mt-0.5 space-y-0.5">
                        {group.items.map((item) => {
                          const fullHref = `/${locale}${item.href}`;
                          const isActive = pathname === fullHref;
                          const visited = isVisited(item.href);

                          return (
                            <Link
                              key={item.key}
                              href={fullHref}
                              className={`flex items-center gap-2 h-8 px-2 rounded-md text-sm transition-colors duration-150 ${
                                isActive
                                  ? "bg-(--accent-muted) text-(--accent) font-medium border-l-2 border-(--accent)"
                                  : "text-(--text-2) hover:bg-(--bg-elevated) hover:text-(--text-1)"
                              }`}
                            >
                              <span
                                className={`shrink-0 text-xs font-mono w-3 text-center leading-none ${
                                  visited ? "text-(--accent)" : "text-(--text-3)"
                                }`}
                              >
                                {visited ? "✓" : "○"}
                              </span>
                              <span className="truncate">
                                {item.commonKey ? tc(item.commonKey) : t(`${item.key}.title`)}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
