"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { EASE_APPLE, DURATION } from "@/lib/motion";
import ContentRenderer from "./ContentRenderer";

interface OsSelectorProps {
  windowsContent: string;
  macosContent: string;
}

export default function OsSelector({
  windowsContent,
  macosContent,
}: OsSelectorProps) {
  const t = useTranslations("common");
  const [os, setOs] = useState<"windows" | "macos">("windows");

  return (
    <div>
      <div className="relative mb-4 inline-flex rounded-xl bg-(--surface) p-1 border border-(--border)">
        {/* Sliding pill background */}
        <motion.div
          className="absolute top-1 bottom-1 rounded-lg bg-linear-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20"
          animate={{
            left: os === "windows" ? "4px" : "50%",
            right: os === "windows" ? "50%" : "4px",
          }}
          transition={{ duration: DURATION.normal, ease: EASE_APPLE }}
        />
        <button
          onClick={() => setOs("windows")}
          className={`relative z-10 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            os === "windows" ? "text-white" : "text-(--text-2) hover:text-(--text-1)"
          }`}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
          </svg>
          {t("windows")}
        </button>
        <button
          onClick={() => setOs("macos")}
          className={`relative z-10 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            os === "macos" ? "text-white" : "text-(--text-2) hover:text-(--text-1)"
          }`}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          {t("macos")}
        </button>
      </div>
      <div className="rounded-xl border border-(--border) bg-(--surface) p-4">
        <ContentRenderer content={os === "windows" ? windowsContent : macosContent} />
      </div>
    </div>
  );
}
