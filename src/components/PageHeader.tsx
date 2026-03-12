"use client";

import { motion } from "framer-motion";
import { heroBlurIn, staggerContainer } from "@/lib/motion";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  gradient: string;
  icon?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  gradient,
  icon,
}: PageHeaderProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={`relative -mx-4 -mt-8 mb-12 overflow-hidden rounded-b-3xl bg-linear-to-br ${gradient} px-8 py-16 sm:-mx-6 lg:-mx-8`}
    >
      <div className="absolute inset-0 bg-black/5 dark:bg-black/20" />
      <div className="relative">
        {icon && (
          <motion.div
            variants={heroBlurIn}
            className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-sm"
          >
            {icon}
          </motion.div>
        )}
        <motion.h1
          variants={heroBlurIn}
          className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
        >
          {title}
        </motion.h1>
        <motion.p
          variants={heroBlurIn}
          className="mt-3 max-w-2xl text-lg text-white/80"
        >
          {subtitle}
        </motion.p>
      </div>
    </motion.div>
  );
}
