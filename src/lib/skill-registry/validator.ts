// ============================================================
// Skill Validator - Full Validation Pipeline
// ============================================================
// Pure TypeScript, zero runtime dependencies beyond the stdlib.
// Each stage is a self-contained function that can be tested
// independently and short-circuits only on fatal parse errors.

import type {
  SkillFrontmatter,
  ValidationReport,
  ValidationIssue,
  ValidationStageName,
  ValidationStageResult,
  ClaudeCodeVersion,
  SecurityFinding,
  SecurityScanResult,
  ISODateTime,
} from "./types";

// ----------------------------------------------------------
// Internal constants
// ----------------------------------------------------------

const REQUIRED_FRONTMATTER_FIELDS: (keyof SkillFrontmatter)[] = [
  "name",
  "description",
  "version",
  "author",
  "category",
  "triggers",
];

const VALID_CATEGORIES = new Set([
  "workflow",
  "code-generation",
  "testing",
  "documentation",
  "security",
  "devops",
  "refactoring",
  "debugging",
  "review",
  "other",
]);

const SEMVER_RE = /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CLAUDE_CODE_VERSIONS: ClaudeCodeVersion[] = [
  "1.0", "1.1", "1.2", "1.3", "1.4", "1.5", "latest",
];

/**
 * Patterns whose presence in the skill body signal potentially
 * harmful intent. Ordered by severity: critical first.
 *
 * Design note: These are DETECTION patterns for the scan report.
 * They do NOT block publishing — the platform surfaces findings
 * to reviewers and consumers so they can make informed decisions.
 */
const SECURITY_RULES: Array<{
  id: string;
  level: SecurityFinding["level"];
  pattern: RegExp;
  message: string;
  suggestion?: string;
}> = [
  {
    id: "SEC-001",
    level: "critical",
    pattern: /\brm\s+-rf\s+[/~]/,
    message: "Destructive shell command targeting root or home directory.",
    suggestion: "Remove or scope the command to a safe project subdirectory.",
  },
  {
    id: "SEC-002",
    level: "critical",
    pattern: /\bcurl\b.*\|\s*(?:bash|sh|zsh)/,
    message: "Piping remote content directly into a shell interpreter.",
    suggestion: "Download the script first, inspect it, then execute explicitly.",
  },
  {
    id: "SEC-003",
    level: "high",
    pattern: /\beval\s*\(/,
    message: "eval() can execute arbitrary code from untrusted input.",
    suggestion: "Replace eval with explicit function calls or safe alternatives.",
  },
  {
    id: "SEC-004",
    level: "high",
    pattern: /process\.env\.\w+\s*=\s*/,
    message: "Skill attempts to mutate environment variables at runtime.",
    suggestion: "Document required env vars in frontmatter tags instead.",
  },
  {
    id: "SEC-005",
    level: "medium",
    pattern: /\bsudo\b/,
    message: "Skill instructs use of sudo (privilege escalation).",
    suggestion: "Document why elevated privileges are needed; prefer scoped solutions.",
  },
  {
    id: "SEC-006",
    level: "medium",
    pattern: /\bchmod\s+[0-7]*7[0-7]{2}\b/,
    message: "Granting world-executable permissions to files.",
    suggestion: "Use least-privilege permissions (e.g. 750 instead of 777).",
  },
  {
    id: "SEC-007",
    level: "low",
    pattern: /\bwget\b|\bcurl\b/,
    message: "Skill downloads remote content — ensure source URL is trusted.",
    suggestion: "Pin to a specific commit hash or verified release tag.",
  },
  {
    id: "SEC-008",
    level: "info",
    pattern: /TODO|FIXME|HACK/i,
    message: "Skill contains unresolved TODO/FIXME comments.",
    suggestion: "Resolve open tasks before publishing to the registry.",
  },
];

// ----------------------------------------------------------
// Stage helpers
// ----------------------------------------------------------

function makeIssue(
  severity: ValidationIssue["severity"],
  code: string,
  message: string,
  opts: Partial<Omit<ValidationIssue, "severity" | "code" | "message">> = {}
): ValidationIssue {
  return { severity, code, message, ...opts };
}

// ----------------------------------------------------------
// Stage 1 — Parse
// Splits raw file content into frontmatter YAML text + body.
// Returns null body on fatal parse failure.
// ----------------------------------------------------------

interface ParseResult {
  frontmatterRaw: string | null;
  body: string;
  frontmatterLineCount: number;
}

export function parseSkillFile(raw: string): ParseResult {
  const normalized = raw.replace(/\r\n/g, "\n");
  const fmMatch = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  if (!fmMatch) {
    return { frontmatterRaw: null, body: normalized, frontmatterLineCount: 0 };
  }

  const frontmatterRaw = fmMatch[1];
  const body = fmMatch[2];
  const frontmatterLineCount = frontmatterRaw.split("\n").length + 2; // +2 for delimiters

  return { frontmatterRaw, body, frontmatterLineCount };
}

// ----------------------------------------------------------
// Minimal YAML parser for frontmatter
// Handles: strings, arrays (- item), booleans, nested objects (1 level).
// Full YAML parsing would require a dependency; this covers 100%
// of the schema fields defined in SkillFrontmatter.
// ----------------------------------------------------------

function parseYamlFrontmatter(raw: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = raw.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const keyMatch = line.match(/^(\w[\w-]*):\s*(.*)/);

    if (!keyMatch) {
      i++;
      continue;
    }

    const key = keyMatch[1];
    const restOfLine = keyMatch[2].trim();

    // Inline value on same line
    if (restOfLine.length > 0) {
      result[key] = parsePrimitiveYaml(restOfLine);
      i++;
      continue;
    }

    // Multi-line: look ahead for array items or nested keys
    const items: unknown[] = [];
    const nested: Record<string, unknown> = {};
    let hasNested = false;

    i++;
    while (i < lines.length && (lines[i].startsWith("  ") || lines[i].startsWith("\t"))) {
      const inner = lines[i].trimStart();

      if (inner.startsWith("- ")) {
        items.push(parsePrimitiveYaml(inner.slice(2).trim()));
      } else {
        const nestedMatch = inner.match(/^(\w[\w-]*):\s*(.*)/);
        if (nestedMatch) {
          nested[nestedMatch[1]] = parsePrimitiveYaml(nestedMatch[2].trim());
          hasNested = true;
        }
      }
      i++;
    }

    if (items.length > 0) {
      result[key] = items;
    } else if (hasNested) {
      result[key] = nested;
    }
    // else: empty block, leave key absent
  }

  return result;
}

function parsePrimitiveYaml(value: string): unknown {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null" || value === "~") return null;
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  if (/^\d+\.\d+$/.test(value)) return parseFloat(value);
  // Strip surrounding quotes
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

// ----------------------------------------------------------
// Stage 2 — Frontmatter field validation
// ----------------------------------------------------------

function validateFrontmatter(
  raw: Record<string, unknown>,
  lineOffset: number
): ValidationStageResult {
  const issues: ValidationIssue[] = [];

  // 2a. Required fields presence
  for (const field of REQUIRED_FRONTMATTER_FIELDS) {
    if (raw[field] === undefined || raw[field] === null || raw[field] === "") {
      issues.push(makeIssue(
        "error",
        "FM-001",
        `Required field "${field}" is missing or empty.`,
        {
          location: { line: lineOffset, field },
          suggestion: `Add "${field}: <value>" to the frontmatter block.`,
          docsUrl: "https://ai-guide.example.com/skills/frontmatter",
        }
      ));
    }
  }

  // 2b. Name: 3–80 chars, no leading/trailing whitespace
  if (typeof raw.name === "string") {
    if (raw.name.length < 3 || raw.name.length > 80) {
      issues.push(makeIssue(
        "error",
        "FM-002",
        `"name" must be between 3 and 80 characters (got ${raw.name.length}).`,
        { location: { line: lineOffset, field: "name" } }
      ));
    }
    if (raw.name !== raw.name.trim()) {
      issues.push(makeIssue(
        "warning",
        "FM-003",
        '"name" has leading or trailing whitespace.',
        {
          location: { line: lineOffset, field: "name" },
          suggestion: `Change to: "${raw.name.trim()}"`,
        }
      ));
    }
  }

  // 2c. Description: 10–300 chars
  if (typeof raw.description === "string") {
    if (raw.description.length < 10) {
      issues.push(makeIssue(
        "warning",
        "FM-004",
        `"description" is too short (${raw.description.length} chars). Aim for at least 10.`,
        { location: { line: lineOffset, field: "description" } }
      ));
    }
    if (raw.description.length > 300) {
      issues.push(makeIssue(
        "warning",
        "FM-005",
        `"description" exceeds 300 characters. Keep it concise for card display.`,
        { location: { line: lineOffset, field: "description" } }
      ));
    }
  }

  // 2d. Version: valid semver
  if (typeof raw.version === "string" && !SEMVER_RE.test(raw.version)) {
    issues.push(makeIssue(
      "error",
      "FM-006",
      `"version" "${raw.version}" is not valid semver (expected MAJOR.MINOR.PATCH).`,
      {
        location: { line: lineOffset, field: "version" },
        suggestion: 'Use format "1.0.0".',
      }
    ));
  }

  // 2e. Author: present and slug-safe
  if (typeof raw.author === "string") {
    if (raw.author.trim().length === 0) {
      issues.push(makeIssue(
        "error",
        "FM-007",
        '"author" cannot be empty.',
        { location: { line: lineOffset, field: "author" } }
      ));
    }
    if (!SLUG_RE.test(raw.author) && !raw.author.includes("/")) {
      issues.push(makeIssue(
        "warning",
        "FM-008",
        `"author" "${raw.author}" contains special characters. Prefer slug format (e.g. "alice" or "org/alice").`,
        { location: { line: lineOffset, field: "author" } }
      ));
    }
  }

  // 2f. Category: must be one of the known values
  if (typeof raw.category === "string" && !VALID_CATEGORIES.has(raw.category)) {
    issues.push(makeIssue(
      "error",
      "FM-009",
      `"category" "${raw.category}" is not a valid category.`,
      {
        location: { line: lineOffset, field: "category" },
        suggestion: `Valid categories: ${[...VALID_CATEGORIES].join(", ")}`,
      }
    ));
  }

  return { passed: issues.every(i => i.severity !== "error"), issues };
}

// ----------------------------------------------------------
// Stage 3 — Body validation
// ----------------------------------------------------------

function validateBody(body: string, frontmatterLineCount: number): ValidationStageResult {
  const issues: ValidationIssue[] = [];
  const lineOffset = frontmatterLineCount;

  if (body.trim().length === 0) {
    issues.push(makeIssue(
      "error",
      "BODY-001",
      "Skill body is empty. Add markdown instructions that Claude will follow.",
      { location: { line: lineOffset + 1 }, suggestion: "Start with an H2 heading." }
    ));
    return { passed: false, issues };
  }

  if (body.trim().length < 50) {
    issues.push(makeIssue(
      "warning",
      "BODY-002",
      `Skill body is very short (${body.trim().length} chars). A more detailed description improves usefulness.`,
      { location: { line: lineOffset + 1 } }
    ));
  }

  // Recommend at least one heading in the body
  if (!/^#{1,6}\s/m.test(body)) {
    issues.push(makeIssue(
      "info",
      "BODY-003",
      "Skill body has no markdown headings. Structure with ## sections for readability.",
      { location: { line: lineOffset + 1 } }
    ));
  }

  // Recommend at least one example
  if (!body.includes("```") && !body.toLowerCase().includes("example")) {
    issues.push(makeIssue(
      "info",
      "BODY-004",
      "Consider adding a code example or sample usage to help users understand the skill.",
      { suggestion: "Add a fenced code block (```) with a usage example." }
    ));
  }

  return { passed: issues.every(i => i.severity !== "error"), issues };
}

// ----------------------------------------------------------
// Stage 4 — Trigger pattern validation
// ----------------------------------------------------------

function validateTriggers(raw: Record<string, unknown>): ValidationStageResult {
  const issues: ValidationIssue[] = [];
  const triggers = raw.triggers;

  if (!Array.isArray(triggers) || triggers.length === 0) {
    issues.push(makeIssue(
      "error",
      "TRIG-001",
      '"triggers" must be a non-empty array of strings.',
      {
        location: { field: "triggers" },
        suggestion: 'Add at least one trigger, e.g. triggers:\n  - "review code"',
      }
    ));
    return { passed: false, issues };
  }

  const seen = new Set<string>();

  for (const [idx, trigger] of triggers.entries()) {
    if (typeof trigger !== "string") {
      issues.push(makeIssue(
        "error",
        "TRIG-002",
        `Trigger at index ${idx} must be a string (got ${typeof trigger}).`,
        { location: { field: "triggers" } }
      ));
      continue;
    }

    if (trigger.trim().length === 0) {
      issues.push(makeIssue(
        "error",
        "TRIG-003",
        `Trigger at index ${idx} is an empty string.`,
        { location: { field: "triggers" } }
      ));
      continue;
    }

    // Duplicate trigger check
    const normalized = trigger.toLowerCase().trim();
    if (seen.has(normalized)) {
      issues.push(makeIssue(
        "warning",
        "TRIG-004",
        `Duplicate trigger "${trigger}" at index ${idx}.`,
        { location: { field: "triggers" }, suggestion: "Remove the duplicate entry." }
      ));
    }
    seen.add(normalized);

    // Regex triggers: must compile without error
    if (trigger.startsWith("/") && trigger.endsWith("/")) {
      const regexBody = trigger.slice(1, -1);
      try {
        new RegExp(regexBody);
      } catch (e) {
        issues.push(makeIssue(
          "error",
          "TRIG-005",
          `Trigger "${trigger}" is an invalid regular expression: ${(e as Error).message}`,
          { location: { field: "triggers" } }
        ));
      }
    }

    // Overly broad trigger warning (single common word)
    const tooGeneric = ["do", "run", "go", "help", "the", "a", "an", "it", "this"];
    if (tooGeneric.includes(trigger.trim().toLowerCase())) {
      issues.push(makeIssue(
        "warning",
        "TRIG-006",
        `Trigger "${trigger}" is too generic and will conflict with many other skills.`,
        {
          location: { field: "triggers" },
          suggestion: "Use a more specific phrase, e.g. 'review my code for security issues'.",
        }
      ));
    }
  }

  return { passed: issues.every(i => i.severity !== "error"), issues };
}

// ----------------------------------------------------------
// Stage 5 — Dependency validation
// ----------------------------------------------------------

function validateDependencies(
  raw: Record<string, unknown>,
  knownSkillIds?: Set<string>
): ValidationStageResult {
  const issues: ValidationIssue[] = [];
  const deps = raw.dependencies;

  if (deps === undefined) {
    return { passed: true, issues };
  }

  if (!Array.isArray(deps)) {
    issues.push(makeIssue(
      "error",
      "DEP-001",
      '"dependencies" must be an array of skill ID strings.',
      { location: { field: "dependencies" } }
    ));
    return { passed: false, issues };
  }

  for (const [idx, dep] of deps.entries()) {
    if (typeof dep !== "string" || dep.trim().length === 0) {
      issues.push(makeIssue(
        "error",
        "DEP-002",
        `Dependency at index ${idx} must be a non-empty string skill ID.`,
        { location: { field: "dependencies" } }
      ));
      continue;
    }

    if (!SLUG_RE.test(dep)) {
      issues.push(makeIssue(
        "warning",
        "DEP-003",
        `Dependency ID "${dep}" is not in slug format. Registry IDs use lowercase-hyphen format.`,
        {
          location: { field: "dependencies" },
          suggestion: `Rename to "${dep.toLowerCase().replace(/[^a-z0-9-]/g, "-")}"`,
        }
      ));
    }

    // Optional: check against known registry IDs
    if (knownSkillIds && !knownSkillIds.has(dep)) {
      issues.push(makeIssue(
        "warning",
        "DEP-004",
        `Dependency "${dep}" was not found in the registry.`,
        {
          location: { field: "dependencies" },
          suggestion: "Verify the skill ID is correct, or publish the dependency first.",
        }
      ));
    }
  }

  return { passed: issues.every(i => i.severity !== "error"), issues };
}

// ----------------------------------------------------------
// Stage 6 — Security scan
// ----------------------------------------------------------

export function runSecurityScan(content: string): SecurityScanResult {
  const lines = content.split("\n");
  const findings: SecurityFinding[] = [];

  for (const rule of SECURITY_RULES) {
    const matchingLines: number[] = [];

    for (const [idx, line] of lines.entries()) {
      if (rule.pattern.test(line)) {
        matchingLines.push(idx + 1); // 1-indexed
      }
    }

    if (matchingLines.length > 0) {
      findings.push({
        level: rule.level,
        rule: rule.id,
        message: rule.message,
        lines: matchingLines,
        suggestion: rule.suggestion,
      });
    }
  }

  // Risk scoring: critical=40, high=20, medium=10, low=5, info=1
  const riskWeights: Record<SecurityFinding["level"], number> = {
    critical: 40,
    high: 20,
    medium: 10,
    low: 5,
    info: 1,
  };
  const rawScore = findings.reduce((acc, f) => acc + riskWeights[f.level], 0);
  const riskScore = Math.min(100, rawScore);

  return {
    scannedAt: new Date().toISOString() as ISODateTime,
    passed: !findings.some(f => f.level === "critical" || f.level === "high"),
    findings,
    riskScore,
  };
}

// ----------------------------------------------------------
// Stage 7 — Compatibility check
// ----------------------------------------------------------

function checkCompatibility(raw: Record<string, unknown>): {
  stage: ValidationStageResult;
  matrix: Record<ClaudeCodeVersion, boolean>;
} {
  const issues: ValidationIssue[] = [];
  const matrix = {} as Record<ClaudeCodeVersion, boolean>;

  const compatibleWith = raw.compatibleWith as
    | { min?: string; max?: string }
    | undefined;

  if (!compatibleWith) {
    // Unspecified: assumed compatible with all versions
    for (const v of CLAUDE_CODE_VERSIONS) matrix[v] = true;
    issues.push(makeIssue(
      "info",
      "COMPAT-001",
      '"compatibleWith" is not specified. Skill will be shown for all Claude Code versions.',
      {
        suggestion: 'Add compatibleWith:\n  min: "1.0"\nto clarify version support.',
      }
    ));
    return { stage: { passed: true, issues }, matrix };
  }

  const minIdx = CLAUDE_CODE_VERSIONS.indexOf(compatibleWith.min as ClaudeCodeVersion);
  const maxIdx = compatibleWith.max
    ? CLAUDE_CODE_VERSIONS.indexOf(compatibleWith.max as ClaudeCodeVersion)
    : CLAUDE_CODE_VERSIONS.length - 1;

  if (minIdx === -1) {
    issues.push(makeIssue(
      "error",
      "COMPAT-002",
      `"compatibleWith.min" value "${compatibleWith.min}" is not a known Claude Code version.`,
      { suggestion: `Valid versions: ${CLAUDE_CODE_VERSIONS.join(", ")}` }
    ));
  }

  if (compatibleWith.max && maxIdx === -1) {
    issues.push(makeIssue(
      "error",
      "COMPAT-003",
      `"compatibleWith.max" value "${compatibleWith.max}" is not a known Claude Code version.`,
      { suggestion: `Valid versions: ${CLAUDE_CODE_VERSIONS.join(", ")}` }
    ));
  }

  if (minIdx !== -1 && maxIdx !== -1 && minIdx > maxIdx) {
    issues.push(makeIssue(
      "error",
      "COMPAT-004",
      `"compatibleWith.min" (${compatibleWith.min}) is newer than "max" (${compatibleWith.max}).`
    ));
  }

  for (const [idx, v] of CLAUDE_CODE_VERSIONS.entries()) {
    matrix[v] = idx >= minIdx && idx <= maxIdx;
  }

  return { stage: { passed: issues.every(i => i.severity !== "error"), issues }, matrix };
}

// ----------------------------------------------------------
// Quality score computation
// ----------------------------------------------------------

function computeQualityScore(stages: Record<ValidationStageName, ValidationStageResult>): number {
  let score = 100;

  for (const stage of Object.values(stages)) {
    for (const issue of stage.issues) {
      if (issue.severity === "error") score -= 25;
      else if (issue.severity === "warning") score -= 8;
      else if (issue.severity === "info") score -= 2;
    }
  }

  return Math.max(0, score);
}

// ----------------------------------------------------------
// Public API — Main entry point
// ----------------------------------------------------------

export interface ValidateSkillOptions {
  /** Absolute path to the file, for reporting only */
  filePath?: string;
  /** Set of known registry skill IDs for dependency resolution */
  knownSkillIds?: Set<string>;
}

/**
 * Run the full validation pipeline on a raw skill file string.
 *
 * Pipeline stages:
 *   1. parse       — Split frontmatter from body
 *   2. frontmatter — Validate all required and optional fields
 *   3. body        — Validate markdown body content
 *   4. triggers    — Validate trigger patterns and regex syntax
 *   5. dependencies — Validate dep IDs and optional registry lookup
 *   6. security    — Scan for harmful patterns
 *   7. compatibility — Validate version range fields
 *
 * Stages 2-7 run independently and accumulate issues even when
 * earlier stages have warnings, enabling a full report in one pass.
 * Only a fatal parse failure (stage 1) short-circuits the pipeline.
 */
export function validateSkill(
  rawContent: string,
  options: ValidateSkillOptions = {}
): ValidationReport {
  const startTime = Date.now();
  const stages = {} as Record<ValidationStageName, ValidationStageResult>;

  // Stage 1: Parse
  const parsed = parseSkillFile(rawContent);

  if (parsed.frontmatterRaw === null) {
    const parseStage: ValidationStageResult = {
      passed: false,
      issues: [
        makeIssue(
          "error",
          "PARSE-001",
          "Could not find a valid frontmatter block. Skill files must begin with --- delimiters.",
          {
            location: { line: 1 },
            suggestion: "Wrap your frontmatter in --- ... --- at the very top of the file.",
            docsUrl: "https://ai-guide.example.com/skills/format",
          }
        ),
      ],
    };
    stages.parse = parseStage;

    // Populate remaining stages as skipped (passed=false, empty issues)
    const skipped: ValidationStageResult = { passed: false, issues: [] };
    for (const name of ["frontmatter", "body", "triggers", "dependencies", "security", "compatibility"] as ValidationStageName[]) {
      stages[name] = skipped;
    }

    return buildReport({ stages, startTime, options, compatibility: {} as Record<ClaudeCodeVersion, boolean> });
  }

  stages.parse = { passed: true, issues: [] };

  // Parse YAML
  const frontmatterData = parseYamlFrontmatter(parsed.frontmatterRaw);

  // Stage 2: Frontmatter
  stages.frontmatter = validateFrontmatter(frontmatterData, 2);

  // Stage 3: Body
  stages.body = validateBody(parsed.body, parsed.frontmatterLineCount);

  // Stage 4: Triggers
  stages.triggers = validateTriggers(frontmatterData);

  // Stage 5: Dependencies
  stages.dependencies = validateDependencies(frontmatterData, options.knownSkillIds);

  // Stage 6: Security
  const securityScan = runSecurityScan(rawContent);
  stages.security = {
    passed: securityScan.passed,
    issues: securityScan.findings.map(f =>
      makeIssue(
        f.level === "critical" || f.level === "high" ? "error" : f.level === "medium" ? "warning" : "info",
        f.rule,
        f.message,
        { location: { line: f.lines?.[0] ?? 1 }, suggestion: f.suggestion }
      )
    ),
  };

  // Stage 7: Compatibility
  const { stage: compatStage, matrix } = checkCompatibility(frontmatterData);
  stages.compatibility = compatStage;

  return buildReport({ stages, startTime, options, compatibility: matrix });
}

interface BuildReportParams {
  stages: Record<ValidationStageName, ValidationStageResult>;
  startTime: number;
  options: ValidateSkillOptions;
  compatibility: Record<ClaudeCodeVersion, boolean>;
}

function buildReport({ stages, startTime, options, compatibility }: BuildReportParams): ValidationReport {
  const allIssues = Object.values(stages).flatMap(s => s.issues);
  const errors = allIssues.filter(i => i.severity === "error").length;
  const warnings = allIssues.filter(i => i.severity === "warning").length;
  const infos = allIssues.filter(i => i.severity === "info").length;

  return {
    filePath: options.filePath,
    valid: errors === 0,
    durationMs: Date.now() - startTime,
    issues: allIssues,
    summary: { errors, warnings, infos },
    stages,
    compatibility,
    qualityScore: computeQualityScore(stages),
  };
}
