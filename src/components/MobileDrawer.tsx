"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_APPLE, DURATION } from "@/lib/motion";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.normal }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
          <motion.nav
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: DURATION.normal, ease: EASE_APPLE }}
            className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-(--surface) p-6 shadow-2xl lg:hidden"
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="text-lg font-bold text-(--text-1)">
                {tc("title")}
              </span>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-(--text-2) hover:bg-(--surface-hover)"
                aria-label="Close menu"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {menuGroups.map((group, groupIndex) => (
              <div key={group.labelKey} className={groupIndex > 0 ? "pt-6" : ""}>
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-(--text-2)">
                  {tc(group.labelKey)}
                </p>
                {group.items.map((item) => {
                  const fullHref = `/${locale}${item.href}`;
                  const isActive = pathname === fullHref;
                  return (
                    <Link
                      key={item.key}
                      href={fullHref}
                      onClick={onClose}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "text-(--text-2) hover:bg-(--surface-hover) hover:text-(--text-1)"
                      }`}
                    >
                      {item.commonKey ? tc(item.commonKey) : t(`${item.key}.title`)}
                    </Link>
                  );
                })}
              </div>
            ))}
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
