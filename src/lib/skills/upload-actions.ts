"use server";

// ============================================================
// Skill Upload — Server Actions
// ============================================================
// validateSkillFile: public, no auth required
// publishSkill:      requires contributor+ role

import { validateSkill } from "@/lib/skill-registry/validator";
import { parseSkillFile } from "@/lib/skill-registry/validator";
import { runSecurityScan } from "@/lib/skill-registry/validator";
import type { ValidationReport } from "@/lib/skill-registry/types";
import { db } from "@/lib/db/client";
import { skills, skillVersions, skillSecurityFindings } from "@/lib/db/schema/skills";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { hasRole } from "@/lib/auth/rbac";

// ----------------------------------------------------------
// Helpers
// ----------------------------------------------------------

async function sha256Hex(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Minimal YAML frontmatter extractor — mirrors the validator's internal parser
// but returns just the key we need (the fields already validated).
function parseFrontmatterFields(raw: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = raw.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const keyMatch = line.match(/^(\w[\w-]*):\s*(.*)/);
    if (!keyMatch) { i++; continue; }

    const key = keyMatch[1];
    const restOfLine = keyMatch[2].trim();

    if (restOfLine.length > 0) {
      result[key] = restOfLine;
      i++;
      continue;
    }

    // Multi-line array
    const items: string[] = [];
    i++;
    while (i < lines.length && (lines[i].startsWith("  ") || lines[i].startsWith("\t"))) {
      const inner = lines[i].trimStart();
      if (inner.startsWith("- ")) items.push(inner.slice(2).trim());
      i++;
    }
    if (items.length > 0) result[key] = items;
  }

  return result;
}

// ----------------------------------------------------------
// Public action — Validate only, no auth required
// ----------------------------------------------------------

export async function validateSkillFile(
  content: string
): Promise<{ success: true; report: ValidationReport } | { success: false; error: string }> {
  try {
    if (!content || content.trim().length === 0) {
      return { success: false, error: "Content cannot be empty." };
    }

    if (content.length > 500_000) {
      return { success: false, error: "File is too large. Maximum size is 500 KB." };
    }

    const report = validateSkill(content);
    return { success: true, report };
  } catch (err) {
    console.error("[validateSkillFile]", err);
    return { success: false, error: "An unexpected error occurred during validation." };
  }
}

// ----------------------------------------------------------
// Authenticated action — Validate then publish
// ----------------------------------------------------------

export async function publishSkill(content: string): Promise<
  | { success: true; skillId: string; slug: string; status: string }
  | { success: false; error: string; report?: ValidationReport }
> {
  // Auth gate
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in to publish a skill." };
  }
  if (!hasRole(user.role, "contributor")) {
    return { success: false, error: "You need at least Contributor role to publish skills." };
  }

  try {
    if (!content || content.trim().length === 0) {
      return { success: false, error: "Content cannot be empty." };
    }

    if (content.length > 500_000) {
      return { success: false, error: "File is too large. Maximum size is 500 KB." };
    }

    // Run full validation pipeline
    const report = validateSkill(content);

    // Block on hard errors
    if (!report.valid) {
      return {
        success: false,
        error: `Validation failed with ${report.summary.errors} error(s). Fix them before publishing.`,
        report,
      };
    }

    // Parse file sections
    const { frontmatterRaw, body } = parseSkillFile(content);
    if (!frontmatterRaw) {
      return { success: false, error: "Could not parse skill frontmatter." };
    }

    const fm = parseFrontmatterFields(frontmatterRaw);

    // Determine publish status based on security findings
    const secScan = runSecurityScan(content);
    const hasCriticalOrHigh = secScan.findings.some(
      (f) => f.level === "critical" || f.level === "high"
    );
    const publishStatus = hasCriticalOrHigh ? "quarantined" : "published";

    const contentHash = await sha256Hex(content);
    const rawName = String(fm.name ?? "untitled");
    const slug = slugify(rawName);
    const version = String(fm.version ?? "1.0.0");
    const triggers = Array.isArray(fm.triggers)
      ? (fm.triggers as string[])
      : typeof fm.triggers === "string"
      ? [fm.triggers]
      : [];
    const tags = Array.isArray(fm.tags)
      ? (fm.tags as string[])
      : [];

    // Upsert-style: insert skill, insert version, insert findings
    const [insertedSkill] = await db
      .insert(skills)
      .values({
        slug,
        authorId: user.id,
        name: rawName,
        description: String(fm.description ?? ""),
        currentVersion: version,
        license: fm.license ? String(fm.license) : null,
        homepageUrl: fm.homepage ? String(fm.homepage) : null,
        status: publishStatus,
        compatibleMin: fm.compatibleWith && typeof fm.compatibleWith === "object"
          ? String((fm.compatibleWith as Record<string, unknown>).min ?? "")
          : null,
        compatibleMax: fm.compatibleWith && typeof fm.compatibleWith === "object"
          ? String((fm.compatibleWith as Record<string, unknown>).max ?? "") || null
          : null,
        triggers,
        tags,
        body,
        contentHash,
        securityScannedAt: new Date(secScan.scannedAt),
        securityPassed: secScan.passed,
        securityRiskScore: secScan.riskScore,
        publishedAt: publishStatus === "published" ? new Date() : null,
      })
      .returning({ id: skills.id });

    const skillId = insertedSkill.id;

    // Insert version record
    await db.insert(skillVersions).values({
      skillId,
      version,
      body,
      contentHash,
      publishedBy: user.id,
    });

    // Insert security findings
    if (secScan.findings.length > 0) {
      await db.insert(skillSecurityFindings).values(
        secScan.findings.map((f) => ({
          skillId,
          level: f.level,
          rule: f.rule,
          message: f.message,
          lines: f.lines ?? null,
          suggestion: f.suggestion ?? null,
          scannedAt: new Date(secScan.scannedAt),
        }))
      );
    }

    return { success: true, skillId, slug, status: publishStatus };
  } catch (err) {
    console.error("[publishSkill]", err);
    return { success: false, error: "An unexpected error occurred while publishing the skill." };
  }
}
