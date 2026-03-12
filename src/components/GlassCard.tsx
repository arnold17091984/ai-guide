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
        y: -6,
        transition: { duration: DURATION.normal, ease: EASE_APPLE },
      }}
      whileTap={{ scale: 0.98 }}
      className={`group relative overflow-hidden rounded-2xl border border-(--border) bg-white/70 p-6 shadow-md backdrop-blur-xl transition-all duration-300 hover:border-blue-300/50 hover:shadow-xl hover:shadow-blue-500/15 dark:bg-white/5 dark:hover:border-cyan-500/30 dark:hover:shadow-cyan-500/10 ${className}`}
    >
      <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-linear-to-br from-blue-500/10 via-cyan-500/5 to-teal-500/10" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{cardContent}</Link>;
  }

  return cardContent;
}
