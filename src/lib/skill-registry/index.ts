// ============================================================
// Skill Registry — Public API Surface
// ============================================================
// Import from "@/lib/skill-registry" in Next.js route handlers,
// React Server Components, and other lib files.

export type {
  // Core value objects
  SkillId,
  SemVer,
  ISODateTime,
  SkillCategory,
  ClaudeCodeVersion,
  ValidationSeverity,
  // Skill data model
  SkillFrontmatter,
  SkillRecord,
  SkillVersion,
  SkillMetrics,
  // Security
  SecurityFinding,
  SecurityFindingLevel,
  SecurityScanResult,
  // Validation
  ValidationIssue,
  ValidationReport,
  ValidationStageName,
  ValidationStageResult,
  // CLAUDE.md analyzer
  ClaudeMdSection,
  ClaudeMdRule,
  ClaudeMdConflict,
  ClaudeMdAnalysis,
  ClaudeMdImprovement,
  TemplateComparison,
  // Team sync
  SkillPackage,
  SkillPackageEntry,
  TeamConfigDiff,
  // API
  ApiResponse,
  SkillSearchParams,
} from "./types";

// Validator pipeline
export {
  validateSkill,
  parseSkillFile,
  runSecurityScan,
} from "./validator";
export type { ValidateSkillOptions } from "./validator";

// CLAUDE.md analyzer
export {
  analyzeClaudeMd,
  parseClaudeMdSections,
  extractRules,
  detectConflicts,
} from "./claude-md-analyzer";

// Team sync
export {
  exportPackage,
  importPackage,
  diffConfigs,
  formatDiffReport,
  generateInstallGuide,
  STANDARD_KITS,
} from "./team-sync";

// API helpers
export {
  apiHandler,
  ApiError,
  ApiErrors,
  checkRateLimit,
  API_CATALOG,
} from "./api-routes";
export type {
  UploadSkillRequest,
  UploadSkillResponse,
  ValidateSkillRequest,
  ValidateSkillResponse,
  AnalyzeClaudeMdRequest,
  AnalyzeClaudeMdResponse,
  PackageDiffRequest,
  PackageDiffResponse,
} from "./api-routes";
