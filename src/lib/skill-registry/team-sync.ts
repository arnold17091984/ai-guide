// ============================================================
// Team Sync — Package Export / Import / Diff
// ============================================================
// Handles serializing and deserializing SkillPackages, computing
// diffs between two member configurations, and maintaining the
// "standard kit" catalog. Zero external dependencies.

import type {
  SkillPackage,
  SkillPackageEntry,
  TeamConfigDiff,
  SemVer,
  SkillId,
  ISODateTime,
} from "./types";

// ----------------------------------------------------------
// Serialization
// ----------------------------------------------------------

/**
 * Serialize a SkillPackage to a canonical JSON string.
 * Keys are sorted for deterministic diffs in git history.
 */
export function exportPackage(pkg: SkillPackage): string {
  return JSON.stringify(pkg, sortedReplacer, 2);
}

/**
 * Parse and validate a SkillPackage from JSON.
 * Returns the parsed package or throws a descriptive error.
 */
export function importPackage(raw: string): SkillPackage {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON: could not parse skill package file.");
  }

  return validatePackageShape(parsed);
}

// ----------------------------------------------------------
// Validation
// ----------------------------------------------------------

function validatePackageShape(raw: unknown): SkillPackage {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Skill package must be a JSON object.");
  }

  const pkg = raw as Record<string, unknown>;

  if (pkg.schemaVersion !== "1.0") {
    throw new Error(
      `Unsupported schema version "${pkg.schemaVersion}". Expected "1.0".`
    );
  }

  const required = ["name", "description", "version", "author", "createdAt", "skills"];
  for (const field of required) {
    if (pkg[field] === undefined) {
      throw new Error(`Skill package is missing required field: "${field}".`);
    }
  }

  if (!Array.isArray(pkg.skills)) {
    throw new Error('"skills" must be an array.');
  }

  const skills = (pkg.skills as unknown[]).map((entry, idx) => {
    if (typeof entry !== "object" || entry === null) {
      throw new Error(`skills[${idx}] must be an object.`);
    }
    const e = entry as Record<string, unknown>;
    if (typeof e.id !== "string") throw new Error(`skills[${idx}].id must be a string.`);
    if (typeof e.version !== "string") throw new Error(`skills[${idx}].version must be a string.`);
    if (typeof e.required !== "boolean") throw new Error(`skills[${idx}].required must be a boolean.`);
    return {
      id: e.id as SkillId,
      version: e.version as SemVer,
      required: e.required as boolean,
      overrides: e.overrides as SkillPackageEntry["overrides"],
    };
  });

  return {
    schemaVersion: "1.0",
    name: String(pkg.name),
    description: String(pkg.description),
    version: String(pkg.version) as SemVer,
    author: String(pkg.author),
    createdAt: String(pkg.createdAt) as ISODateTime,
    role: pkg.role !== undefined ? String(pkg.role) : undefined,
    skills,
    claudeMdTemplate: pkg.claudeMdTemplate !== undefined ? String(pkg.claudeMdTemplate) : undefined,
    standardKit: typeof pkg.standardKit === "boolean" ? pkg.standardKit : undefined,
  };
}

// ----------------------------------------------------------
// Diff
// ----------------------------------------------------------

/**
 * Compute the symmetric difference between two member configurations.
 * Useful for onboarding reviews and "why is my setup different?" queries.
 */
export function diffConfigs(
  memberA: string,
  pkgA: SkillPackage,
  memberB: string,
  pkgB: SkillPackage
): TeamConfigDiff {
  const mapA = new Map(pkgA.skills.map(s => [s.id, s]));
  const mapB = new Map(pkgB.skills.map(s => [s.id, s]));

  const onlyInA: SkillPackageEntry[] = [];
  const onlyInB: SkillPackageEntry[] = [];
  const versionMismatches: TeamConfigDiff["versionMismatches"] = [];
  const matching: SkillPackageEntry[] = [];

  for (const [id, entryA] of mapA) {
    if (!mapB.has(id)) {
      onlyInA.push(entryA);
    } else {
      const entryB = mapB.get(id)!;
      if (entryA.version !== entryB.version) {
        versionMismatches.push({ id, versionA: entryA.version, versionB: entryB.version });
      } else {
        matching.push(entryA);
      }
    }
  }

  for (const [id, entryB] of mapB) {
    if (!mapA.has(id)) {
      onlyInB.push(entryB);
    }
  }

  return {
    memberA,
    memberB,
    createdAt: new Date().toISOString() as ISODateTime,
    onlyInA,
    onlyInB,
    versionMismatches,
    matching,
  };
}

/**
 * Format a TeamConfigDiff as a human-readable text report.
 * Suitable for CLI output or PR comments.
 */
export function formatDiffReport(diff: TeamConfigDiff): string {
  const lines: string[] = [
    `Config diff: ${diff.memberA} vs ${diff.memberB}`,
    `Generated: ${diff.createdAt}`,
    "",
  ];

  if (diff.matching.length > 0) {
    lines.push(`  Matching skills (${diff.matching.length})`);
    for (const s of diff.matching) {
      lines.push(`    + ${s.id}@${s.version}`);
    }
    lines.push("");
  }

  if (diff.onlyInA.length > 0) {
    lines.push(`  Only in ${diff.memberA} (${diff.onlyInA.length})`);
    for (const s of diff.onlyInA) {
      lines.push(`    - ${s.id}@${s.version}${s.required ? " (required)" : ""}`);
    }
    lines.push("");
  }

  if (diff.onlyInB.length > 0) {
    lines.push(`  Only in ${diff.memberB} (${diff.onlyInB.length})`);
    for (const s of diff.onlyInB) {
      lines.push(`    - ${s.id}@${s.version}${s.required ? " (required)" : ""}`);
    }
    lines.push("");
  }

  if (diff.versionMismatches.length > 0) {
    lines.push(`  Version mismatches (${diff.versionMismatches.length})`);
    for (const m of diff.versionMismatches) {
      lines.push(`    ~ ${m.id}: ${diff.memberA}@${m.versionA} vs ${diff.memberB}@${m.versionB}`);
    }
    lines.push("");
  }

  const totalDiffs = diff.onlyInA.length + diff.onlyInB.length + diff.versionMismatches.length;
  lines.push(totalDiffs === 0 ? "  Configurations are identical." : `  Total differences: ${totalDiffs}`);

  return lines.join("\n");
}

// ----------------------------------------------------------
// Standard Kit catalog
// ----------------------------------------------------------

/**
 * Built-in curated packages. In a real deployment, these would
 * be stored in the database and served from the registry API.
 * Kept here as static data so the validator CLI works offline.
 */
export const STANDARD_KITS: Record<string, SkillPackage> = {
  "backend-engineer": {
    schemaVersion: "1.0",
    name: "Backend Engineer Standard Kit",
    description: "Curated skills for backend / API development teams",
    version: "1.0.0",
    author: "ai-guide",
    createdAt: "2025-01-01T00:00:00Z",
    role: "backend",
    standardKit: true,
    skills: [
      { id: "api-design-reviewer", version: "1.2.0", required: true },
      { id: "test-coverage-enforcer", version: "1.0.0", required: true },
      { id: "sql-query-optimizer", version: "2.1.0", required: false },
      { id: "openapi-generator", version: "1.4.0", required: false },
      { id: "docker-compose-helper", version: "1.1.0", required: false },
    ],
  },
  "frontend-engineer": {
    schemaVersion: "1.0",
    name: "Frontend Engineer Standard Kit",
    description: "Curated skills for frontend / UI development teams",
    version: "1.0.0",
    author: "ai-guide",
    createdAt: "2025-01-01T00:00:00Z",
    role: "frontend",
    standardKit: true,
    skills: [
      { id: "component-accessibility-checker", version: "1.0.0", required: true },
      { id: "css-variable-extractor", version: "1.3.0", required: false },
      { id: "storybook-story-generator", version: "2.0.0", required: false },
      { id: "lighthouse-ci-advisor", version: "1.1.0", required: false },
    ],
  },
  "devops-engineer": {
    schemaVersion: "1.0",
    name: "DevOps Engineer Standard Kit",
    description: "Curated skills for infrastructure and CI/CD teams",
    version: "1.0.0",
    author: "ai-guide",
    createdAt: "2025-01-01T00:00:00Z",
    role: "devops",
    standardKit: true,
    skills: [
      { id: "github-actions-linter", version: "1.2.0", required: true },
      { id: "terraform-plan-reviewer", version: "1.0.0", required: false },
      { id: "k8s-manifest-validator", version: "1.5.0", required: false },
      { id: "changelog-generator", version: "2.0.0", required: false },
    ],
  },
};

// ----------------------------------------------------------
// Install guide generation
// ----------------------------------------------------------

/**
 * Generate a step-by-step install guide for a SkillPackage.
 * Returned as markdown for embedding in the UI or printing to CLI.
 */
export function generateInstallGuide(pkg: SkillPackage): string {
  const lines = [
    `# Install Guide: ${pkg.name}`,
    "",
    `> ${pkg.description}`,
    "",
    `**Version:** ${pkg.version}  `,
    `**Author:** ${pkg.author}  `,
    pkg.role ? `**Role:** ${pkg.role}  ` : "",
    "",
    "## Prerequisites",
    "",
    "- Claude Code CLI installed (`npm install -g @anthropic-ai/claude-code`)",
    "- Authenticated with `claude auth login`",
    "",
    "## Installation Steps",
    "",
  ].filter(l => l !== undefined);

  const required = pkg.skills.filter(s => s.required);
  const optional = pkg.skills.filter(s => !s.required);

  let stepNum = 1;

  if (required.length > 0) {
    lines.push(`### Step ${stepNum}: Install Required Skills`);
    lines.push("");
    lines.push("These skills are required for the standard kit to function correctly:");
    lines.push("");
    for (const skill of required) {
      lines.push(`\`\`\`bash`);
      lines.push(`claude skills install ${skill.id}@${skill.version}`);
      lines.push("```");
      lines.push("");
    }
    stepNum++;
  }

  if (optional.length > 0) {
    lines.push(`### Step ${stepNum}: Install Optional Skills`);
    lines.push("");
    lines.push("These skills are recommended but not required:");
    lines.push("");
    for (const skill of optional) {
      lines.push(`\`\`\`bash`);
      lines.push(`claude skills install ${skill.id}@${skill.version}`);
      lines.push("```");
      lines.push("");
    }
    stepNum++;
  }

  if (pkg.claudeMdTemplate) {
    lines.push(`### Step ${stepNum}: Apply CLAUDE.md Template`);
    lines.push("");
    lines.push("Save this to `CLAUDE.md` in your project root:");
    lines.push("");
    lines.push("```markdown");
    lines.push(pkg.claudeMdTemplate);
    lines.push("```");
    lines.push("");
    stepNum++;
  }

  lines.push(`### Step ${stepNum}: Verify Installation`);
  lines.push("");
  lines.push("```bash");
  lines.push("claude skills list");
  lines.push("claude skills validate");
  lines.push("```");
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(`*Generated by ai-guide Skill Registry — schema v${pkg.schemaVersion}*`);

  return lines.join("\n");
}

// ----------------------------------------------------------
// Utilities
// ----------------------------------------------------------

function sortedReplacer(_key: string, value: unknown): unknown {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return Object.keys(value as object)
      .sort()
      .reduce((sorted: Record<string, unknown>, k) => {
        sorted[k] = (value as Record<string, unknown>)[k];
        return sorted;
      }, {});
  }
  return value;
}
