"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_APPLE, DURATION } from "@/lib/motion";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProgressLine } from "@/hooks/useProgressLine";
import LanguageSwitcher from "./LanguageSwitcher";

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

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const t = useTranslations("home.guides");
  const tc = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const { isVisited, progress } = useProgressLine();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.normal }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.nav
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: DURATION.normal, ease: EASE_APPLE }}
            role="dialog"
            aria-modal="true"
            className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-(--bg-base) border-r border-(--border) py-4 px-3 lg:hidden"
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between px-2">
              <span className="font-mono text-sm text-(--text-1)">
                {tc("title")}
              </span>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-(--text-2) hover:bg-(--bg-elevated) hover:text-(--text-1) transition-colors"
                aria-label="Close menu"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Language switcher (mobile only) */}
            <div className="mb-4 px-2 sm:hidden">
              <LanguageSwitcher />
            </div>

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

            {/* Nav groups */}
            <div className="space-y-1">
              {menuGroups.map((group) => (
                <div key={group.labelKey} className="pt-3 first:pt-0">
                  {/* Section header */}
                  <p className="px-2 py-1.5 text-xs font-mono uppercase tracking-wider text-(--text-3)">
                    {tc(group.labelKey)}
                  </p>

                  {/* Items */}
                  <div className="mt-0.5 space-y-0.5">
                    {group.items.map((item) => {
                      const fullHref = `/${locale}${item.href}`;
                      const isActive = pathname === fullHref;
                      const visited = isVisited(item.href);

                      return (
                        <Link
                          key={item.key}
                          href={fullHref}
                          onClick={onClose}
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
                </div>
              ))}
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
