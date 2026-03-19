"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { EASE_APPLE, DURATION } from "@/lib/motion";

// ── Types ────────────────────────────────────────────────────────────────────

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
  userName: string;
  avatarUrl?: string;
}

type RoleKey = "backend" | "frontend" | "devops" | "fullstack" | "data" | "mobile";

// ── Role data ────────────────────────────────────────────────────────────────

const ROLES: { key: RoleKey; icon: React.ReactNode }[] = [
  {
    key: "backend",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    ),
  },
  {
    key: "frontend",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: "devops",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: "fullstack",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    key: "data",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    key: "mobile",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
];

// ── Animation variants ────────────────────────────────────────────────────────

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.normal, ease: EASE_APPLE } },
  exit: { opacity: 0, transition: { duration: DURATION.fast, ease: EASE_APPLE } },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: EASE_APPLE },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 12,
    transition: { duration: DURATION.fast, ease: EASE_APPLE },
  },
};

const stepVariants = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? 32 : -32,
  }),
  center: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.normal, ease: EASE_APPLE },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? -32 : 32,
    transition: { duration: DURATION.fast, ease: EASE_APPLE },
  }),
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-2" role="tablist" aria-label="Onboarding steps">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          role="tab"
          aria-selected={i === current}
          aria-label={`Step ${i + 1}`}
          className="h-1.5 rounded-full transition-all duration-300"
          style={{
            width: i === current ? 24 : 6,
            background: i === current ? "var(--accent)" : "var(--border-hover)",
          }}
        />
      ))}
    </div>
  );
}

// ── Step 1: Welcome ───────────────────────────────────────────────────────────

function StepWelcome({
  t,
  userName,
  avatarUrl,
  onNext,
}: {
  t: ReturnType<typeof useTranslations>;
  userName: string;
  avatarUrl?: string;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-6">
      {/* Avatar */}
      <div className="relative">
        <div
          className="h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden"
          style={{ background: "var(--accent-muted)", border: "2px solid var(--accent)" }}
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={userName}
              width={64}
              height={64}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <span style={{ color: "var(--accent)" }}>
              {userName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        {/* Pulse ring */}
        <span
          className="absolute -inset-1 rounded-full animate-ping opacity-20"
          style={{ background: "var(--accent)" }}
          aria-hidden="true"
        />
      </div>

      {/* Text */}
      <div className="space-y-2">
        <h2
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--text-1)", fontFamily: "ui-monospace, monospace" }}
        >
          {t("welcome")}
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
          {t("welcomeDesc")}
        </p>
        <p className="text-xs font-medium" style={{ color: "var(--text-3)" }}>
          @{userName}
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={onNext}
        className="mt-2 w-full rounded-md px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2"
        style={{
          background: "var(--accent)",
          color: "#000",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent)")}
      >
        {t("letsStart")}
      </button>
    </div>
  );
}

// ── Step 2: Role selection ────────────────────────────────────────────────────

function StepRole({
  t,
  onNext,
}: {
  t: ReturnType<typeof useTranslations>;
  onNext: () => void;
}) {
  const [selected, setSelected] = useState<RoleKey | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center space-y-1">
        <h2
          className="text-xl font-bold tracking-tight"
          style={{ color: "var(--text-1)", fontFamily: "ui-monospace, monospace" }}
        >
          {t("roleQuestion")}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label={t("roleQuestion")}>
        {ROLES.map(({ key, icon }) => {
          const isSelected = selected === key;
          return (
            <button
              key={key}
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelected(key)}
              className="flex flex-col items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2"
              style={{
                background: isSelected ? "var(--accent-muted)" : "var(--bg-elevated)",
                borderColor: isSelected ? "var(--accent)" : "var(--border)",
                color: isSelected ? "var(--accent)" : "var(--text-2)",
              }}
            >
              <span style={{ color: isSelected ? "var(--accent)" : "var(--text-3)" }}>
                {icon}
              </span>
              {t(`roles.${key}`)}
            </button>
          );
        })}
      </div>

      <button
        onClick={onNext}
        disabled={!selected}
        className="w-full rounded-md px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: selected ? "var(--accent)" : "var(--bg-elevated)",
          color: selected ? "#000" : "var(--text-3)",
          borderWidth: selected ? 0 : 1,
          borderStyle: "solid",
          borderColor: "var(--border)",
        }}
      >
        {t("next")}
      </button>
    </div>
  );
}

// ── Step 3: Ready ─────────────────────────────────────────────────────────────

function StepReady({
  t,
  locale,
  onComplete,
}: {
  t: ReturnType<typeof useTranslations>;
  locale: string;
  onComplete: () => void;
}) {
  const LINKS = [
    {
      key: "browseSkills" as const,
      href: `/${locale}/skills`,
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      key: "startPath" as const,
      href: `/${locale}/learning-paths`,
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      key: "exploreKnowledge" as const,
      href: `/${locale}/knowledge`,
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
  ] as const;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Check mark */}
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: "var(--accent-muted)", border: "2px solid var(--accent)" }}
      >
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: "var(--accent)" }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Text */}
      <div className="text-center space-y-1">
        <h2
          className="text-xl font-bold tracking-tight"
          style={{ color: "var(--text-1)", fontFamily: "ui-monospace, monospace" }}
        >
          {t("allSet")}
        </h2>
        <p className="text-sm" style={{ color: "var(--text-2)" }}>
          {t("allSetDesc")}
        </p>
      </div>

      {/* Quick links */}
      <div className="w-full space-y-2">
        {LINKS.map(({ key, href, icon }) => (
          <Link
            key={key}
            href={href}
            onClick={onComplete}
            className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-colors"
            style={{ borderColor: "var(--border)", background: "var(--bg-elevated)", color: "var(--text-2)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--border-hover)";
              e.currentTarget.style.color = "var(--text-1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--text-2)";
            }}
          >
            <span style={{ color: "var(--accent)" }}>{icon}</span>
            {t(key)}
          </Link>
        ))}
      </div>

      {/* Finish button */}
      <button
        onClick={onComplete}
        className="w-full rounded-md px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2"
        style={{ background: "var(--accent)", color: "#000" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent)")}
      >
        {t("startExploring")}
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const TOTAL_STEPS = 3;

export default function OnboardingModal({
  isOpen,
  onComplete,
  userName,
  avatarUrl,
}: OnboardingModalProps) {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onComplete();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="onboarding-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "var(--bg-overlay)", backdropFilter: "blur(4px)" }}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-label="Onboarding wizard"
        >
          <motion.div
            key="onboarding-card"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-lg rounded-xl border p-6 sm:p-8 shadow-2xl"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
            }}
          >
            {/* Step content with slide animation */}
            <div className="overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                {step === 0 && (
                  <motion.div
                    key="step-0"
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                  >
                    <StepWelcome
                      t={t}
                      userName={userName}
                      avatarUrl={avatarUrl}
                      onNext={goNext}
                    />
                  </motion.div>
                )}
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                  >
                    <StepRole t={t} onNext={goNext} />
                  </motion.div>
                )}
                {step === 2 && (
                  <motion.div
                    key="step-2"
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                  >
                    <StepReady t={t} locale={locale} onComplete={onComplete} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Step indicator dots */}
            <div className="mt-6">
              <StepDots total={TOTAL_STEPS} current={step} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
