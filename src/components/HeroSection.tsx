"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { heroBlurIn, staggerContainer } from "@/lib/motion";

interface HeroSectionProps {
  title: string;
  description: string;
  ctaText: string;
  ctaHref: string;
}

export default function HeroSection({
  title,
  description,
  ctaText,
  ctaHref,
}: HeroSectionProps) {
  return (
    <section className="relative -mx-4 -mt-8 mb-16 overflow-hidden px-4 py-24 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      {/* Mesh gradient background — 3 layered radial-gradients */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-br from-blue-600/20 via-cyan-500/15 to-emerald-400/10 dark:from-blue-600/30 dark:via-cyan-500/20 dark:to-emerald-400/10" />
        <motion.div
          className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-500/20"
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-500/20"
          animate={{
            x: [0, -20, 0],
            y: [0, 30, 0],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/2 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl dark:bg-emerald-500/15"
          animate={{
            x: [0, 15, 0],
            y: [0, 15, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Content */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-3xl text-center"
      >
        <motion.h1
          variants={heroBlurIn}
          className="text-5xl font-bold tracking-tight text-(--text-1) sm:text-6xl"
        >
          {title}
        </motion.h1>
        <motion.p
          variants={heroBlurIn}
          className="mt-6 text-lg leading-relaxed text-(--text-2)"
        >
          {description}
        </motion.p>
        <motion.div variants={heroBlurIn}>
          <Link
            href={ctaHref}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-(--primary) px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/30"
          >
            {ctaText}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
