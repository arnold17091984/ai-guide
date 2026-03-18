"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { fadeUp, staggerContainer } from "@/lib/motion";

// ============================================================
// Terminal commands cycling data
// ============================================================

const COMMANDS = [
  {
    input: 'claude "プロジェクトのREADMEを書いて"',
    output: ["README.md を生成しました", "プロジェクト構造を分析", "3つのセクションを作成"],
  },
  {
    input: 'claude "このバグを修正して"',
    output: ["エラーログを分析", "根本原因を特定", "パッチを適用"],
  },
  {
    input: 'claude "/review-pr 42"',
    output: ["PR #42 を取得", "変更差分を分析", "レビューコメントを作成"],
  },
];

const CHAR_DELAY_MS = 40;
const CYCLE_INTERVAL_MS = 8000;

// ============================================================
// TerminalWindow
// ============================================================

function TerminalWindow() {
  const [commandIndex, setCommandIndex] = useState(0);
  const [typedInput, setTypedInput] = useState("");
  const [visibleOutputLines, setVisibleOutputLines] = useState<number>(0);
  const [phase, setPhase] = useState<"typing" | "results" | "pause">("typing");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (resetTimerRef.current !== null) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  };

  useEffect(() => {
    const command = COMMANDS[commandIndex];

    if (phase === "typing") {
      let charIndex = 0;

      // Reset state asynchronously to avoid synchronous setState in effect
      resetTimerRef.current = setTimeout(() => {
        setTypedInput("");
        setVisibleOutputLines(0);
      }, 0);
      const typeNext = () => {
        charIndex += 1;
        setTypedInput(command.input.slice(0, charIndex));
        if (charIndex < command.input.length) {
          timeoutRef.current = setTimeout(typeNext, CHAR_DELAY_MS);
        } else {
          // Typing done — show results after a short pause
          timeoutRef.current = setTimeout(() => setPhase("results"), 300);
        }
      };
      timeoutRef.current = setTimeout(typeNext, CHAR_DELAY_MS);
    }

    if (phase === "results") {
      let lineIndex = 0;
      const showNext = () => {
        lineIndex += 1;
        setVisibleOutputLines(lineIndex);
        if (lineIndex < command.output.length) {
          timeoutRef.current = setTimeout(showNext, 250);
        } else {
          // All results shown — pause before cycling
          timeoutRef.current = setTimeout(() => setPhase("pause"), 2000);
        }
      };
      timeoutRef.current = setTimeout(showNext, 150);
    }

    if (phase === "pause") {
      timeoutRef.current = setTimeout(() => {
        setCommandIndex((prev) => (prev + 1) % COMMANDS.length);
        setPhase("typing");
      }, CYCLE_INTERVAL_MS - command.input.length * CHAR_DELAY_MS - 2500);
    }

    return clearTimer;
  }, [phase, commandIndex]);

  const command = COMMANDS[commandIndex];

  return (
    <div aria-hidden="true" className="w-full max-w-xl mx-auto">
      {/* Title bar */}
      <div className="bg-(--bg-elevated) rounded-t-lg border border-(--border) px-4 py-2 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-red-500" />
        <span className="h-3 w-3 rounded-full bg-yellow-500" />
        <span className="h-3 w-3 rounded-full bg-green-500" />
        <span className="ml-2 text-xs font-mono text-(--text-3)">claude</span>
      </div>

      {/* Terminal body */}
      <div className="bg-(--bg-surface) rounded-b-lg border-x border-b border-(--border) p-3 sm:p-4 font-mono text-xs sm:text-sm min-h-36 sm:min-h-50">
        {/* Prompt + typed input */}
        <div className="flex items-start gap-2">
          <span className="text-(--accent) select-none shrink-0">&#x27E9;</span>
          <span className="text-(--text-1) break-all">
            {typedInput}
            {(phase === "typing") && (
              <span className="inline-block animate-terminal-blink text-(--accent)">&#x2588;</span>
            )}
          </span>
        </div>

        {/* Output lines */}
        <div className="mt-2 space-y-1">
          {command.output.slice(0, visibleOutputLines).map((line, i) => (
            <div key={i} className="flex items-start gap-2 text-(--text-2)">
              <span className="text-(--accent) select-none shrink-0">&#x2713;</span>
              <span>{line}</span>
            </div>
          ))}
          {/* Blinking cursor after results */}
          {phase !== "typing" && visibleOutputLines === command.output.length && (
            <div className="flex items-start gap-2 mt-2">
              <span className="text-(--accent) select-none shrink-0">&#x27E9;</span>
              <span className="inline-block animate-terminal-blink text-(--accent)">&#x2588;</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HeroSection
// ============================================================

export interface HeroSectionProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
  exploreCta?: string;
  exploreHref?: string;
}

export default function HeroSection({
  title,
  subtitle,
  ctaText,
  ctaHref,
  exploreCta,
  exploreHref,
}: HeroSectionProps) {
  return (
    <section className="relative -mx-4 -mt-8 mb-8 px-4 py-12 sm:py-20 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-3xl"
      >
        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          className="text-2xl font-bold tracking-tight text-(--text-1) sm:text-4xl lg:text-5xl text-center"
        >
          {title}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fadeUp}
          className="mt-3 text-sm leading-relaxed text-(--text-2) text-center sm:mt-4 sm:text-lg"
        >
          {subtitle}
        </motion.p>

        {/* Terminal window */}
        <motion.div variants={fadeUp} className="mt-6 sm:mt-10">
          <TerminalWindow />
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          variants={fadeUp}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 rounded-md bg-(--accent) text-black font-medium h-9 px-4 text-sm transition-colors hover:bg-(--accent-hover)"
          >
            {ctaText}
          </Link>
          {exploreCta && exploreHref && (
            <Link
              href={exploreHref}
              className="inline-flex items-center gap-2 rounded-md border border-(--border) text-(--text-1) h-9 px-4 text-sm transition-colors hover:bg-(--bg-elevated)"
            >
              {exploreCta}
            </Link>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}
