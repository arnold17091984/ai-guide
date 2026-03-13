// ============================================================
// API Route Definitions
// ============================================================
// Typed contracts for every REST endpoint in the Skill Registry.
// These map directly to Next.js Route Handlers in app/api/*.
//
// Structure: each exported object describes one endpoint:
//   method, path pattern, request shape, response shape, and
//   a JSDoc block with auth requirements and rate limits.
//
// Next.js implementation files live at:
//   src/app/api/skills/route.ts          → LIST / SEARCH
//   src/app/api/skills/[id]/route.ts     → GET / UPDATE / DELETE
//   src/app/api/skills/[id]/versions/route.ts
//   src/app/api/validate/route.ts
//   src/app/api/claude-md/analyze/route.ts
//   src/app/api/packages/route.ts
//   src/app/api/packages/[name]/diff/route.ts
// ============================================================

import type {
  ApiResponse,
  SkillRecord,
  SkillSearchParams,
  ValidationReport,
  ClaudeMdAnalysis,
  SkillPackage,
  TeamConfigDiff,
} from "./types";

// ----------------------------------------------------------
// Shared request/response shapes
// ----------------------------------------------------------

export interface UploadSkillRequest {
  /** Raw .md file content with frontmatter */
  content: string;
  /** Optional changelog for this version */
  changelog?: string;
}

export interface UploadSkillResponse extends ApiResponse<{
  skill: SkillRecord;
  validation: ValidationReport;
}> {}

export interface ValidateSkillRequest {
  content: string;
  /** Optional: resolve dependencies against the live registry */
  resolveDepencies?: boolean;
}

export interface ValidateSkillResponse extends ApiResponse<ValidationReport> {}

export interface AnalyzeClaudeMdRequest {
  content: string;
  filePath?: string;
}

export interface AnalyzeClaudeMdResponse extends ApiResponse<ClaudeMdAnalysis> {}

export interface PackageDiffRequest {
  packageA: SkillPackage;
  memberA: string;
  packageB: SkillPackage;
  memberB: string;
}

export interface PackageDiffResponse extends ApiResponse<{
  diff: TeamConfigDiff;
  report: string;
}> {}

// ----------------------------------------------------------
// Endpoint catalog
// ----------------------------------------------------------

/**
 * SKILL REGISTRY ENDPOINTS
 *
 * GET  /api/skills
 *   Query: SkillSearchParams (query, category, tags, author, sort, page, pageSize)
 *   Auth: Public (read-only)
 *   Rate limit: 120 req/min
 *   Returns: paginated list of SkillRecord
 *
 * POST /api/skills
 *   Body: UploadSkillRequest
 *   Auth: Bearer token (registered user)
 *   Rate limit: 10 uploads/hour per user
 *   Returns: UploadSkillResponse (includes full validation report)
 *   Notes:
 *     - Skills with security findings at critical/high level are
 *       quarantined for manual review before becoming searchable.
 *     - Version conflict: if same author+name already exists at the
 *       submitted version, returns 409 Conflict.
 *
 * GET  /api/skills/:id
 *   Auth: Public
 *   Rate limit: 300 req/min
 *   Returns: SkillRecord
 *
 * PATCH /api/skills/:id
 *   Body: Partial<UploadSkillRequest> (new version or metadata edit)
 *   Auth: Bearer token (skill owner or platform admin)
 *   Rate limit: 20 req/hour per user
 *   Returns: UploadSkillResponse
 *
 * DELETE /api/skills/:id
 *   Auth: Bearer token (skill owner or platform admin)
 *   Notes: Sets yanked=true on latest version; does not destroy record.
 *
 * GET  /api/skills/:id/versions
 *   Auth: Public
 *   Returns: Array<SkillVersion> sorted newest first
 *
 * POST /api/skills/:id/star
 *   Auth: Bearer token
 *   Returns: { stars: number }
 *
 * POST /api/skills/:id/install
 *   Auth: Bearer token (tracked for download metrics)
 *   Returns: { content: string; installGuide: string }
 *
 * VALIDATION ENDPOINTS
 *
 * POST /api/validate
 *   Body: ValidateSkillRequest
 *   Auth: Public (no auth required for local dev workflow)
 *   Rate limit: 60 req/min per IP
 *   Returns: ValidateSkillResponse
 *   Notes:
 *     - Does NOT persist the skill. Pure validation only.
 *     - With resolveDepencies=true, checks dep IDs against live registry.
 *     - Response is always 200 even for invalid skills; check report.valid.
 *
 * CLAUDE.md ANALYZER ENDPOINTS
 *
 * POST /api/claude-md/analyze
 *   Body: AnalyzeClaudeMdRequest
 *   Auth: Public
 *   Rate limit: 30 req/min per IP
 *   Returns: AnalyzeClaudeMdResponse
 *
 * GET  /api/claude-md/templates
 *   Auth: Public
 *   Returns: Array<{ name: string; description: string; content: string }>
 *
 * TEAM SYNC / PACKAGES ENDPOINTS
 *
 * GET  /api/packages
 *   Auth: Public (returns standardKit=true packages only)
 *   Returns: Array<SkillPackage>
 *
 * POST /api/packages
 *   Body: SkillPackage
 *   Auth: Bearer token
 *   Returns: { id: string; package: SkillPackage; installGuide: string }
 *
 * GET  /api/packages/:name
 *   Auth: Public
 *   Returns: SkillPackage
 *
 * POST /api/packages/:name/diff
 *   Body: PackageDiffRequest
 *   Auth: Bearer token
 *   Returns: PackageDiffResponse
 *
 * GET  /api/packages/standard-kits
 *   Auth: Public
 *   Returns: Array<SkillPackage> (all built-in standard kits)
 */
export const API_CATALOG = {
  skills: {
    list:    { method: "GET",    path: "/api/skills" },
    create:  { method: "POST",   path: "/api/skills" },
    get:     { method: "GET",    path: "/api/skills/:id" },
    update:  { method: "PATCH",  path: "/api/skills/:id" },
    delete:  { method: "DELETE", path: "/api/skills/:id" },
    versions:{ method: "GET",    path: "/api/skills/:id/versions" },
    star:    { method: "POST",   path: "/api/skills/:id/star" },
    install: { method: "POST",   path: "/api/skills/:id/install" },
  },
  validate: {
    skill:   { method: "POST",   path: "/api/validate" },
  },
  claudeMd: {
    analyze:   { method: "POST",   path: "/api/claude-md/analyze" },
    templates: { method: "GET",    path: "/api/claude-md/templates" },
  },
  packages: {
    list:         { method: "GET",  path: "/api/packages" },
    create:       { method: "POST", path: "/api/packages" },
    get:          { method: "GET",  path: "/api/packages/:name" },
    diff:         { method: "POST", path: "/api/packages/:name/diff" },
    standardKits: { method: "GET",  path: "/api/packages/standard-kits" },
  },
} as const;

// ----------------------------------------------------------
// Next.js Route Handler factory helpers
// ----------------------------------------------------------

/**
 * Wrap a handler with standardized error handling and JSON response.
 * Usage in route.ts:
 *
 *   export const POST = apiHandler(async (req) => {
 *     const body = await req.json() as ValidateSkillRequest;
 *     const report = validateSkill(body.content);
 *     return { data: report };
 *   });
 */
export function apiHandler<T>(
  handler: (req: Request) => Promise<{ data: T; status?: number; meta?: ApiResponse<T>["meta"] }>
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const startTime = Date.now();

    try {
      const { data, status = 200, meta } = await handler(req);
      const body: ApiResponse<T> = {
        success: true,
        data,
        meta: { ...meta, durationMs: Date.now() - startTime },
      };
      return Response.json(body, { status });
    } catch (err) {
      const isExpected = err instanceof ApiError;
      const status = isExpected ? (err as ApiError).status : 500;
      const body: ApiResponse<never> = {
        success: false,
        error: {
          code: isExpected ? (err as ApiError).code : "INTERNAL_ERROR",
          message: isExpected ? (err as ApiError).message : "An unexpected error occurred.",
        },
        meta: { durationMs: Date.now() - startTime },
      };

      // Log unexpected errors server-side
      if (!isExpected) {
        console.error("[API Error]", err);
      }

      return Response.json(body, { status });
    }
  };
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number = 400
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Common API errors used across routes
export const ApiErrors = {
  notFound: (resource: string) =>
    new ApiError("NOT_FOUND", `${resource} not found.`, 404),
  unauthorized: () =>
    new ApiError("UNAUTHORIZED", "Authentication required.", 401),
  forbidden: () =>
    new ApiError("FORBIDDEN", "You do not have permission to perform this action.", 403),
  conflict: (message: string) =>
    new ApiError("CONFLICT", message, 409),
  rateLimited: () =>
    new ApiError("RATE_LIMITED", "Too many requests. Please try again later.", 429),
  invalidPayload: (message: string) =>
    new ApiError("INVALID_PAYLOAD", message, 422),
} as const;

// ----------------------------------------------------------
// Rate limiting helper (in-memory for dev, use Redis in prod)
// ----------------------------------------------------------

interface RateWindow {
  count: number;
  resetAt: number;
}

const rateLimitWindows = new Map<string, RateWindow>();

/**
 * Check if a key (e.g. IP address) has exceeded maxRequests
 * within windowMs milliseconds. Returns true if the request
 * should be allowed, false if it should be rate limited.
 */
export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const existing = rateLimitWindows.get(key);

  if (!existing || existing.resetAt < now) {
    rateLimitWindows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (existing.count >= maxRequests) return false;

  existing.count++;
  return true;
}
