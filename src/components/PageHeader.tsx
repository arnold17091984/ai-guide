"use client";

import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/motion";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  gradient?: string;
  icon?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  icon,
}: PageHeaderProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="mb-12 border-b border-(--border) pb-8"
    >
      {icon && (
        <motion.div
          variants={fadeUp}
          className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg border border-(--border) bg-(--bg-surface) text-(--text-2)"
        >
          {icon}
        </motion.div>
      )}
      <motion.h1
        variants={fadeUp}
        className="text-3xl font-bold tracking-tight text-(--text-1) sm:text-4xl"
      >
        {title}
      </motion.h1>
      <motion.p
        variants={fadeUp}
        className="mt-3 max-w-2xl text-lg text-(--text-2)"
      >
        {subtitle}
      </motion.p>
    </motion.div>
  );
}
