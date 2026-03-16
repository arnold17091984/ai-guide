"use client";

// ============================================================
// ValidationResults — Animated skill validation report
// ============================================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_APPLE, DURATION } from "@/lib/motion";
import type {
  ValidationReport,
  ValidationStageName,
  ValidationIssue,
  ClaudeCodeVersion,
} from "@/lib/skill-registry/types";

// ----------------------------------------------------------
// Motion variants
// ----------------------------------------------------------

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.medium, ease: EASE_APPLE },
  },
};

// ----------------------------------------------------------
// Severity helpers
// ----------------------------------------------------------

type SeverityLevel = "error" | "warning" | "info";
type SecurityLevel = "critical" | "high" | "medium" | "low" | "info";

function SeverityIcon({ severity }: { severity: SeverityLevel }) {
  if (severity === "error") {
    return (
      <svg className="h-4 w-4 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
      </svg>
    );
  }
  if (severity === "warning") {
    return (
      <svg className="h-4 w-4 shrink-0 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4 shrink-0 text-zinc-400" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
    </svg>
  );
}

function SecurityBadge({ level }: { level: SecurityLevel }) {
  const styles: Record<SecurityLevel, string> = {
    critical: "bg-red-500/10 text-red-400",
    high:     "bg-orange-500/10 text-orange-400",
    medium:   "bg-amber-500/10 text-amber-400",
    low:      "bg-zinc-500/10 text-zinc-400",
    info:     "bg-zinc-500/10 text-zinc-400",
  };
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-mono uppercase ${styles[level]}`}>
      {level}
    </span>
  );
}

// ----------------------------------------------------------
// Stage name display
// ----------------------------------------------------------

const STAGE_LABELS: Record<ValidationStageName, string> = {
  parse: "Parse",
  frontmatter: "Frontmatter",
  body: "Body",
  triggers: "Triggers",
  dependencies: "Dependencies",
  security: "Security",
  compatibility: "Compatibility",
};

// ----------------------------------------------------------
// Quality score bar
// ----------------------------------------------------------

function QualityBar({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));

  // Color gradient: 0-39 red, 40-69 yellow, 70-100 green
  let barColor = "bg-green-500";
  if (clamped < 40) barColor = "bg-red-500";
  else if (clamped < 70) barColor = "bg-amber-400";

  let textColor = "text-green-400";
  if (clamped < 40) textColor = "text-red-400";
  else if (clamped < 70) textColor = "text-amber-400";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-(--text-2)">Quality Score</span>
        <span className={`text-2xl font-bold tabular-nums ${textColor}`}>{clamped}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-(--bg-elevated)">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.8, ease: EASE_APPLE, delay: 0.3 }}
          className={`h-full rounded-full ${barColor} shadow-sm`}
        />
      </div>
      <div className="flex justify-between text-xs text-(--text-2)">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Issue row (expandable suggestion)
// ----------------------------------------------------------

function IssueRow({ issue }: { issue: ValidationIssue }) {
  const [open, setOpen] = useState(false);
  const hasSuggestion = Boolean(issue.suggestion || issue.docsUrl);

  return (
    <div className="rounded-lg border border-(--border) bg-(--bg-elevated) p-3">
      <button
        type="button"
        onClick={() => hasSuggestion && setOpen((o) => !o)}
        className={`flex w-full items-start gap-2 text-left ${hasSuggestion ? "cursor-pointer" : "cursor-default"}`}
      >
        <span className="mt-0.5">
          <SeverityIcon severity={issue.severity} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-(--bg-base) px-1.5 py-0.5 font-mono text-xs text-(--text-2)">
              {issue.code}
            </span>
            {issue.location?.field && (
              <span className="text-xs text-(--text-2)">field: {issue.location.field}</span>
            )}
            {issue.location?.line && (
              <span className="text-xs text-(--text-2)">line {issue.location.line}</span>
            )}
          </div>
          <p className="mt-1 text-sm text-(--text-1)">{issue.message}</p>
        </div>
        {hasSuggestion && (
          <svg
            className={`h-4 w-4 shrink-0 text-(--text-2) transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      <AnimatePresence>
        {open && hasSuggestion && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: DURATION.fast, ease: EASE_APPLE }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2 border-t border-(--border) pt-3 pl-6">
              {issue.suggestion && (
                <p className="text-xs text-(--text-2)">
                  <span className="font-semibold text-(--accent)">Suggestion:</span>{" "}
                  {issue.suggestion}
                </p>
              )}
              {issue.docsUrl && (
                <a
                  href={issue.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-(--accent) hover:underline"
                >
                  Documentation
                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
                  </svg>
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ----------------------------------------------------------
// Stage row
// ----------------------------------------------------------

function StageRow({
  name,
  result,
}: {
  name: ValidationStageName;
  result: { passed: boolean; issues: ValidationIssue[] };
  delay?: number;
}) {
  const [open, setOpen] = useState(false);
  const hasIssues = result.issues.length > 0;
  const errorCount = result.issues.filter((i) => i.severity === "error").length;
  const warnCount = result.issues.filter((i) => i.severity === "warning").length;
  const infoCount = result.issues.filter((i) => i.severity === "info").length;

  return (
    <motion.div
      variants={itemVariants}
      className="rounded-lg border border-(--border) bg-(--bg-surface)"
    >
      <button
        type="button"
        onClick={() => hasIssues && setOpen((o) => !o)}
        className={`flex w-full items-center gap-3 p-4 text-left ${hasIssues ? "cursor-pointer" : "cursor-default"}`}
      >
        {/* Pass/fail indicator */}
        <span className="shrink-0">
          {result.passed ? (
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
          )}
        </span>

        {/* Label */}
        <span className="flex-1 text-sm font-semibold text-(--text-1)">
          {STAGE_LABELS[name]}
        </span>

        {/* Issue pill counts */}
        <span className="flex items-center gap-1.5">
          {errorCount > 0 && (
            <span className="rounded bg-red-500/10 px-2 py-0.5 text-xs font-mono text-red-400">
              {errorCount} err
            </span>
          )}
          {warnCount > 0 && (
            <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-mono text-amber-400">
              {warnCount} warn
            </span>
          )}
          {infoCount > 0 && (
            <span className="rounded bg-zinc-500/10 px-2 py-0.5 text-xs font-mono text-zinc-400">
              {infoCount} info
            </span>
          )}
          {!hasIssues && (
            <span className="text-xs text-(--text-2)">No issues</span>
          )}
        </span>

        {/* Expand chevron */}
        {hasIssues && (
          <svg
            className={`h-4 w-4 shrink-0 text-(--text-2) transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      <AnimatePresence>
        {open && hasIssues && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: DURATION.normal, ease: EASE_APPLE }}
            className="overflow-hidden"
          >
            <div className="space-y-2 border-t border-(--border) p-4">
              {result.issues.map((issue, idx) => (
                <IssueRow key={`${issue.code}-${idx}`} issue={issue} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ----------------------------------------------------------
// Compatibility matrix
// ----------------------------------------------------------

function CompatibilityMatrix({
  matrix,
}: {
  matrix: Record<ClaudeCodeVersion, boolean>;
}) {
  const entries = Object.entries(matrix) as [ClaudeCodeVersion, boolean][];
  if (entries.length === 0) return null;

  return (
    <motion.div variants={itemVariants} className="rounded-lg border border-(--border) bg-(--bg-surface) p-4">
      <h3 className="mb-3 text-sm font-semibold text-(--text-1)">Claude Code Compatibility</h3>
      <div className="flex flex-wrap gap-2">
        {entries.map(([version, compatible]) => (
          <div
            key={version}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
              compatible
                ? "bg-(--accent-muted) text-(--accent)"
                : "bg-(--bg-elevated) text-(--text-2) line-through"
            }`}
          >
            {compatible ? (
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            )}
            v{version}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ----------------------------------------------------------
// Security findings section
// ----------------------------------------------------------

function SecurityFindings({
  findings,
}: {
  findings: import("@/lib/skill-registry/types").SecurityFinding[];
}) {
  if (findings.length === 0) return null;

  return (
    <motion.div variants={itemVariants} className="rounded-lg border border-(--border) bg-(--bg-surface) p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-(--text-1)">
        <svg className="h-4 w-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
        </svg>
        Security Findings
      </h3>
      <div className="space-y-3">
        {findings.map((finding, idx) => (
          <div key={`${finding.rule}-${idx}`} className="rounded-lg border border-(--border) bg-(--bg-elevated) p-3">
            <div className="flex flex-wrap items-start gap-2">
              <SecurityBadge level={finding.level} />
              <span className="rounded bg-(--bg-base) px-1.5 py-0.5 font-mono text-xs text-(--text-2)">
                {finding.rule}
              </span>
              {finding.lines && finding.lines.length > 0 && (
                <span className="text-xs text-(--text-2)">
                  line{finding.lines.length > 1 ? "s" : ""}{" "}
                  {finding.lines.slice(0, 3).join(", ")}
                  {finding.lines.length > 3 ? " ..." : ""}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-(--text-1)">{finding.message}</p>
            {finding.suggestion && (
              <p className="mt-1.5 text-xs text-(--text-2)">
                <span className="font-semibold text-(--accent)">Fix:</span>{" "}
                {finding.suggestion}
              </p>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ----------------------------------------------------------
// Main export
// ----------------------------------------------------------

export interface ValidationResultsProps {
  report: ValidationReport;
}

const STAGE_ORDER: ValidationStageName[] = [
  "parse",
  "frontmatter",
  "body",
  "triggers",
  "dependencies",
  "security",
  "compatibility",
];

export default function ValidationResults({ report }: ValidationResultsProps) {
  const overallPassed = report.valid;

  // Collect security findings from the security stage mapped back from issues
  // The validator puts security issues into stages.security, but we want the
  // original SecurityFinding shape. We'll derive from report.stages.security.issues
  // and re-expose the severity-mapped data.
  const securityFindings = report.stages.security.issues.map(
    (issue): import("@/lib/skill-registry/types").SecurityFinding => ({
      level: issue.severity === "error"
        ? "high"
        : issue.severity === "warning"
        ? "medium"
        : "info",
      rule: issue.code,
      message: issue.message,
      lines: issue.location?.line ? [issue.location.line] : undefined,
      suggestion: issue.suggestion,
    })
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* Overall pass/fail hero */}
      <motion.div
        variants={itemVariants}
        className={`flex items-center gap-4 rounded-lg border p-6 ${
          overallPassed
            ? "border-green-500/30 bg-green-500/10"
            : "border-red-500/30 bg-red-500/10"
        }`}
      >
        {overallPassed ? (
          <svg className="h-12 w-12 shrink-0 text-green-400" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="24" cy="24" r="20" />
            <polyline points="16,24 21,29 32,18" />
          </svg>
        ) : (
          <svg className="h-12 w-12 shrink-0 text-red-400" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="24" cy="24" r="20" />
            <line x1="16" y1="16" x2="32" y2="32" />
            <line x1="32" y1="16" x2="16" y2="32" />
          </svg>
        )}
        <div className="min-w-0 flex-1">
          <p className={`text-xl font-bold ${overallPassed ? "text-green-400" : "text-red-400"}`}>
            {overallPassed ? "Validation Passed" : "Validation Failed"}
          </p>
          <p className="mt-0.5 text-sm text-(--text-2)">
            {report.summary.errors > 0 && (
              <span className="text-red-400">{report.summary.errors} error{report.summary.errors !== 1 ? "s" : ""} </span>
            )}
            {report.summary.warnings > 0 && (
              <span className="text-amber-400">{report.summary.warnings} warning{report.summary.warnings !== 1 ? "s" : ""} </span>
            )}
            {report.summary.infos > 0 && (
              <span className="text-zinc-400">{report.summary.infos} suggestion{report.summary.infos !== 1 ? "s" : ""} </span>
            )}
            {report.summary.errors === 0 && report.summary.warnings === 0 && report.summary.infos === 0 && (
              <span>No issues found</span>
            )}
            &nbsp;&middot;&nbsp;
            <span>{report.durationMs}ms</span>
          </p>
        </div>
      </motion.div>

      {/* Quality score bar */}
      <motion.div
        variants={itemVariants}
        className="rounded-lg border border-(--border) bg-(--bg-surface) p-4"
      >
        <QualityBar score={report.qualityScore} />
      </motion.div>

      {/* Stage-by-stage results */}
      <motion.div variants={itemVariants} className="space-y-2">
        <h3 className="text-sm font-semibold text-(--text-1)">Pipeline Stages</h3>
        <div className="space-y-2">
          {STAGE_ORDER.map((stageName, idx) => {
            const stageResult = report.stages[stageName];
            if (!stageResult) return null;
            return (
              <StageRow
                key={stageName}
                name={stageName}
                result={stageResult}
                delay={idx * 0.05}
              />
            );
          })}
        </div>
      </motion.div>

      {/* Security findings */}
      {securityFindings.length > 0 && (
        <SecurityFindings findings={securityFindings} />
      )}

      {/* Compatibility matrix */}
      {Object.keys(report.compatibility).length > 0 && (
        <CompatibilityMatrix matrix={report.compatibility} />
      )}
    </motion.div>
  );
}
