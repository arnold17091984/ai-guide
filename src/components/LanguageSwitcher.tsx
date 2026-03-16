"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { EASE_APPLE, DURATION } from "@/lib/motion";

const languages = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "EN" },
  { code: "ja", label: "日本語" },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const updateIndicator = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const activeBtn = container.querySelector<HTMLButtonElement>(
      `[data-locale="${locale}"]`
    );
    if (!activeBtn) return;
    setIndicator({
      left: activeBtn.offsetLeft,
      width: activeBtn.offsetWidth,
    });
  }, [locale]);

  useEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label="Language"
      className="relative flex items-center rounded-md bg-(--bg-elevated) p-1 border border-(--border)"
    >
      {/* Sliding indicator — measured from actual button positions */}
      <motion.div
        className="absolute top-1 bottom-1 rounded-md bg-(--accent)"
        animate={{ left: indicator.left, width: indicator.width }}
        transition={{ duration: DURATION.fast, ease: EASE_APPLE }}
      />
      {languages.map((lang) => (
        <button
          key={lang.code}
          role="radio"
          aria-checked={locale === lang.code}
          data-locale={lang.code}
          onClick={() => switchLocale(lang.code)}
          className={`relative z-10 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
            locale === lang.code
              ? "text-black"
              : "text-(--text-2) hover:text-(--text-1)"
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
