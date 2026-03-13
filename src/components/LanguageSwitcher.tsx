"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
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

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  const activeIndex = languages.findIndex((l) => l.code === locale);

  return (
    <div className="relative flex items-center rounded-md bg-(--bg-elevated) p-1 border border-(--border)">
      {/* Sliding indicator */}
      <motion.div
        className="absolute top-1 bottom-1 rounded-md bg-(--accent)"
        animate={{
          left: `calc(${activeIndex} * 33.333% + 4px)`,
          width: "calc(33.333% - 8px)",
        }}
        transition={{ duration: DURATION.fast, ease: EASE_APPLE }}
      />
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => switchLocale(lang.code)}
          className={`relative z-10 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
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
