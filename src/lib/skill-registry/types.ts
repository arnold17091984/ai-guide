// ============================================================
// Skill Registry and Validation System - Core Type Definitions
// ============================================================
// Designed for the ai-guide platform (Next.js 16 / TypeScript 5)
// All types are pure data contracts - no runtime dependencies.

// ----------------------------------------------------------
// 1. Primitive Value Objects
// ----------------------------------------------------------

/** Semver string e.g. "1.2.3" */
export type SemVer = string;

/** ISO-8601 datetime string */
export type ISODateTime = string;

/** Slug-safe identifier: lowercase, hyphens only */
export type SkillId = string;

export type SkillCategory =
  | "workflow"
  | "code-generation"
  | "testing"
  | "documentation"
  | "security"
  | "devops"
  | "refactoring"
  | "debugging"
  | "review"
  | "other";

export type ValidationSeverity = "error" | "warning" | "info";

export type ClaudeCodeVersion =
  | "1.0"
  | "1.1"
  | "1.2"
  | "1.3"
  | "1.4"
  | "1.5"
  | "latest";

// ----------------------------------------------------------
// 2. Skill Data Model
// ----------------------------------------------------------

/**
 * Frontmatter block parsed from a .md skill file header.
 * Maps 1-to-1 with the YAML block between --- delimiters.
 */
export interface SkillFrontmatter {
  /** Human-readable name shown in the registry UI */
  name: string;
  /** One-sentence summary shown in cards and search results */
  description: string;
  /** Semantic version of this skill file */
  version: SemVer;
  /** Registry author handle, e.g. "alice" or "org/alice" */
  author: string;
  /** Functional domain for filtering */
  category: SkillCategory;
  /**
   * Phrases or regex patterns that trigger this skill.
   * Each entry can be a plain string (exact/prefix match) or
   * a /regex/ literal (must start and end with /).
   */
  triggers: string[];
  /**
   * Other skill IDs this skill depends on.
   * Registry resolves these during install.
   */
  dependencies?: SkillId[];
  /**
   * Minimum and maximum Claude Code versions this skill targets.
   * Omit max to mean "current latest".
   */
  compatibleWith?: {
    min: ClaudeCodeVersion;
    max?: ClaudeCodeVersion;
  };
  /** Free-form tags for search refinement */
  tags?: string[];
  /** SPDX license identifier, e.g. "MIT" */
  license?: string;
  /** URL to skill homepage or repository */
  homepage?: string;
}

/**
 * Full skill entity as stored in the registry database.
 * Extends frontmatter with server-side metadata.
 */
export interface SkillRecord {
  id: SkillId;
  frontmatter: SkillFrontmatter;
  /** Raw markdown body (everything after the closing ---) */
  body: string;
  /** SHA-256 of the raw file content for integrity checks */
  contentHash: string;
  /** When this version was published */
  publishedAt: ISODateTime;
  /** When the record was last updated */
  updatedAt: ISODateTime;
  /** Author's registry user ID */
  authorId: string;
  metrics: SkillMetrics;
  securityScan: SecurityScanResult;
  /** All published versions of this skill, newest first */
  versions: SkillVersion[];
}

export interface SkillVersion {
  version: SemVer;
  publishedAt: ISODateTime;
  contentHash: string;
  changelog?: string;
  /** Whether this version was yanked (hidden but preserved) */
  yanked: boolean;
}

export interface SkillMetrics {
  downloads: number;
  stars: number;
  forks: number;
  /** Weekly download trend for sparklines */
  weeklyDownloads: number[];
}

// ----------------------------------------------------------
// 3. Security Scan Result
// ----------------------------------------------------------

export type SecurityFindingLevel = "critical" | "high" | "medium" | "low" | "info";

export interface SecurityFinding {
  level: SecurityFindingLevel;
  rule: string;
  /** Human-readable explanation */
  message: string;
  /** Line number(s) in the source file */
  lines?: number[];
  /** Suggested safe alternative */
  suggestion?: string;
}

export interface SecurityScanResult {
  scannedAt: ISODateTime;
  passed: boolean;
  findings: SecurityFinding[];
  /** Overall risk score 0-100, lower is safer */
  riskScore: number;
}

// ----------------------------------------------------------
// 4. Validation Pipeline
// ----------------------------------------------------------

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  /** Source location for editor integration */
  location?: {
    line?: number;
    column?: number;
    field?: string;
  };
  /** Auto-fixable suggestion shown to the user */
  suggestion?: string;
  /** Doc URL for deeper explanation */
  docsUrl?: string;
}

export interface ValidationReport {
  skillId?: SkillId;
  filePath?: string;
  valid: boolean;
  /** Milliseconds the validation pipeline took */
  durationMs: number;
  issues: ValidationIssue[];
  /** Convenience counts by severity */
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
  /** Pass/fail per named pipeline stage */
  stages: Record<ValidationStageName, ValidationStageResult>;
  /** Compatibility matrix for each Claude Code version */
  compatibility: Record<ClaudeCodeVersion, boolean>;
  /** 0-100 quality score derived from warnings and best practices */
  qualityScore: number;
}

export type ValidationStageName =
  | "parse"
  | "frontmatter"
  | "body"
  | "triggers"
  | "dependencies"
  | "security"
  | "compatibility";

export interface ValidationStageResult {
  passed: boolean;
  issues: ValidationIssue[];
}

// ----------------------------------------------------------
// 5. CLAUDE.md Analyzer
// ----------------------------------------------------------

export interface ClaudeMdSection {
  heading: string;
  level: number;
  content: string;
  lineStart: number;
  lineEnd: number;
}

export interface ClaudeMdRule {
  /** The instruction text extracted from a list item or heading */
  text: string;
  section: string;
  lineNumber: number;
}

export interface ClaudeMdConflict {
  ruleA: ClaudeMdRule;
  ruleB: ClaudeMdRule;
  explanation: string;
  resolution?: string;
}

export interface ClaudeMdAnalysis {
  filePath: string;
  sections: ClaudeMdSection[];
  rules: ClaudeMdRule[];
  conflicts: ClaudeMdConflict[];
  /** 0-100 completeness score */
  completenessScore: number;
  /** 0-100 quality score */
  qualityScore: number;
  improvements: ClaudeMdImprovement[];
  templateComparison?: TemplateComparison;
}

export interface ClaudeMdImprovement {
  priority: "high" | "medium" | "low";
  category: string;
  suggestion: string;
  exampleContent?: string;
}

export interface TemplateComparison {
  templateName: string;
  matchScore: number;
  missingSections: string[];
  extraSections: string[];
}

// ----------------------------------------------------------
// 6. Team Sync / Packages
// ----------------------------------------------------------

/**
 * A portable bundle that captures a team's complete skill configuration.
 * Exported as a single JSON file and checked into source control.
 */
export interface SkillPackage {
  /** Package format version for forward compatibility */
  schemaVersion: "1.0";
  name: string;
  description: string;
  version: SemVer;
  author: string;
  createdAt: ISODateTime;
  /** Target role or project type, e.g. "backend", "frontend", "devops" */
  role?: string;
  skills: SkillPackageEntry[];
  claudeMdTemplate?: string;
  /** Registry of well-known packages maintained by the platform */
  standardKit?: boolean;
}

export interface SkillPackageEntry {
  id: SkillId;
  version: SemVer;
  /** If true, the install should fail when this skill is absent */
  required: boolean;
  /** Local overrides applied on top of the published skill */
  overrides?: Partial<SkillFrontmatter>;
}

export interface TeamConfigDiff {
  memberA: string;
  memberB: string;
  createdAt: ISODateTime;
  onlyInA: SkillPackageEntry[];
  onlyInB: SkillPackageEntry[];
  /** Skills present in both but at different versions */
  versionMismatches: Array<{
    id: SkillId;
    versionA: SemVer;
    versionB: SemVer;
  }>;
  /** Skills present in both at identical versions */
  matching: SkillPackageEntry[];
}

// ----------------------------------------------------------
// 7. API Contracts
// ----------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
    durationMs?: number;
  };
}

export interface SkillSearchParams {
  query?: string;
  category?: SkillCategory;
  tags?: string[];
  author?: string;
  sort?: "downloads" | "stars" | "updated" | "relevance";
  page?: number;
  pageSize?: number;
}
