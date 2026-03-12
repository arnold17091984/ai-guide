"use client";

import { motion } from "framer-motion";
import { EASE_APPLE, DURATION } from "@/lib/motion";
import type { ClaudeMdAnalysis, ClaudeMdImprovement } from "@/lib/skill-registry/types";
import ScoreGauge from "./ScoreGauge";

// ---------------------------------------------------------------------------
// Animation helpers
// ---------------------------------------------------------------------------

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: DURATION.medium, ease: EASE_APPLE, delay },
});

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      {...fadeUp(delay)}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-(--text-2)">
      {children}
    </h3>
  );
}

function PriorityBadge({ priority }: { priority: ClaudeMdImprovement["priority"] }) {
  const styles = {
    high: "bg-red-500/15 text-red-400 ring-1 ring-red-500/30",
    medium: "bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/30",
    low: "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[priority]}`}>
      {priority}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface ClaudeMdResultsProps {
  analysis: ClaudeMdAnalysis;
  labels: {
    scores: string;
    completeness: string;
    quality: string;
    sections: string;
    missingSections: string;
    noMissingSections: string;
    conflicts: string;
    noConflicts: string;
    rules: string;
    noRules: string;
    template: string;
    templateMatch: string;
    templateMissing: string;
    templateExtra: string;
    improvements: string;
    noImprovements: string;
    line: string;
    conflictExplanation: string;
    conflictResolution: string;
    exampleContent: string;
  };
}

export default function ClaudeMdResults({ analysis, labels }: ClaudeMdResultsProps) {
  const {
    completenessScore,
    qualityScore,
    sections,
    conflicts,
    rules,
    improvements,
    templateComparison,
  } = analysis;

  return (
    <div className="space-y-6">
      {/* Score gauges */}
      <SectionCard delay={0}>
        <SectionHeading>{labels.scores}</SectionHeading>
        <div className="flex flex-wrap justify-center gap-10 py-4">
          <ScoreGauge score={completenessScore} label={labels.completeness} size={130} />
          <ScoreGauge score={qualityScore} label={labels.quality} size={130} />
        </div>
      </SectionCard>

      {/* Sections found */}
      <SectionCard delay={0.08}>
        <SectionHeading>{labels.sections}</SectionHeading>
        {sections.length === 0 ? (
          <p className="text-sm text-(--text-2)">—</p>
        ) : (
          <ul className="space-y-2">
            {sections.map((sec, i) => (
              <motion.li
                key={`${sec.heading}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: DURATION.fast, ease: EASE_APPLE, delay: 0.1 + i * 0.04 }}
                className="flex items-center gap-3 text-sm"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="font-medium text-(--text-1)">
                  {"#".repeat(sec.level)} {sec.heading}
                </span>
                <span className="ml-auto shrink-0 text-xs text-(--text-2)">
                  L{sec.lineStart}–{sec.lineEnd}
                </span>
              </motion.li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* Missing sections / improvements */}
      <SectionCard delay={0.14}>
        <SectionHeading>{labels.improvements}</SectionHeading>
        {improvements.length === 0 ? (
          <p className="text-sm text-green-400">{labels.noImprovements}</p>
        ) : (
          <ul className="space-y-4">
            {improvements.map((imp, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: DURATION.fast, ease: EASE_APPLE, delay: 0.2 + i * 0.05 }}
                className="rounded-xl border border-white/8 bg-white/3 p-4"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <PriorityBadge priority={imp.priority} />
                  <span className="text-xs font-medium text-(--text-2)">{imp.category}</span>
                </div>
                <p className="text-sm text-(--text-1)">{imp.suggestion}</p>
                {imp.exampleContent && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-medium text-blue-400 hover:text-blue-300">
                      {labels.exampleContent}
                    </summary>
                    <pre className="mt-2 overflow-x-auto rounded-lg bg-black/30 p-3 text-xs text-green-300">
                      {imp.exampleContent}
                    </pre>
                  </details>
                )}
              </motion.li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* Conflicts */}
      <SectionCard delay={0.2}>
        <SectionHeading>{labels.conflicts}</SectionHeading>
        {conflicts.length === 0 ? (
          <p className="text-sm text-green-400">{labels.noConflicts}</p>
        ) : (
          <ul className="space-y-4">
            {conflicts.map((conflict, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: DURATION.fast, ease: EASE_APPLE, delay: 0.25 + i * 0.05 }}
                className="rounded-xl border border-red-500/20 bg-red-500/5 p-4"
              >
                <div className="mb-3 flex flex-col gap-2">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 shrink-0 rounded bg-red-500/20 px-1.5 py-0.5 text-xs font-mono text-red-400">
                      L{conflict.ruleA.lineNumber}
                    </span>
                    <span className="text-(--text-1)">{conflict.ruleA.text}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 shrink-0 rounded bg-red-500/20 px-1.5 py-0.5 text-xs font-mono text-red-400">
                      L{conflict.ruleB.lineNumber}
                    </span>
                    <span className="text-(--text-1)">{conflict.ruleB.text}</span>
                  </div>
                </div>
                <p className="text-xs text-red-300/80">
                  <span className="font-semibold">{labels.conflictExplanation}:</span>{" "}
                  {conflict.explanation}
                </p>
                {conflict.resolution && (
                  <p className="mt-1 text-xs text-yellow-300/80">
                    <span className="font-semibold">{labels.conflictResolution}:</span>{" "}
                    {conflict.resolution}
                  </p>
                )}
              </motion.li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* Rules extracted */}
      <SectionCard delay={0.26}>
        <SectionHeading>{labels.rules}</SectionHeading>
        {rules.length === 0 ? (
          <p className="text-sm text-(--text-2)">{labels.noRules}</p>
        ) : (
          <ul className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {rules.map((rule, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: DURATION.fast, delay: 0.3 + Math.min(i * 0.02, 0.5) }}
                className="flex items-start gap-3 text-sm"
              >
                <span className="mt-0.5 shrink-0 rounded bg-white/8 px-1.5 py-0.5 text-xs font-mono text-(--text-2)">
                  {labels.line} {rule.lineNumber}
                </span>
                <span className="text-(--text-1)">{rule.text}</span>
              </motion.li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* Template comparison */}
      {templateComparison && (
        <SectionCard delay={0.32}>
          <SectionHeading>{labels.template}</SectionHeading>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-blue-500/20 px-3 py-1 text-sm font-semibold text-blue-300">
                {templateComparison.templateName}
              </span>
              <span className="text-sm text-(--text-2)">
                {labels.templateMatch}: {templateComparison.matchScore}%
              </span>
            </div>

            {templateComparison.missingSections.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-yellow-400">
                  {labels.templateMissing}
                </p>
                <div className="flex flex-wrap gap-2">
                  {templateComparison.missingSections.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-0.5 text-xs text-yellow-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {templateComparison.extraSections.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-400">
                  {labels.templateExtra}
                </p>
                <div className="flex flex-wrap gap-2">
                  {templateComparison.extraSections.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-0.5 text-xs text-green-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
