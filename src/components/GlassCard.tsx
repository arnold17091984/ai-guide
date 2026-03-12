"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { EASE_APPLE, DURATION } from "@/lib/motion";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
}

export default function GlassCard({
  children,
  className = "",
  href,
}: GlassCardProps) {
  const cardContent = (
    <motion.div
      whileHover={{
        y: -4,
        transition: { duration: DURATION.normal, ease: EASE_APPLE },
      }}
      whileTap={{ scale: 0.98 }}
      className={`group relative overflow-hidden rounded-2xl border border-(--border) bg-(--surface) p-6 shadow-sm transition-shadow duration-300 hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-blue-500/10 ${className}`}
    >
      <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-linear-to-br from-blue-500/5 to-cyan-500/5" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{cardContent}</Link>;
  }

  return cardContent;
}
