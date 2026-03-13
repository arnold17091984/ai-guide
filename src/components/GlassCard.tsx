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
        y: -2,
        transition: { duration: DURATION.normal, ease: EASE_APPLE },
      }}
      whileTap={{ scale: 0.98 }}
      className={`group relative overflow-hidden rounded-lg border border-(--border) bg-white/3 p-6 backdrop-blur-xl transition-all duration-300 hover:border-(--border-hover) hover:bg-white/5 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] ${className}`}
    >
      <div className="relative z-10">{children}</div>
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{cardContent}</Link>;
  }

  return cardContent;
}
