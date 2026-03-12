"use server";

import { analyzeClaudeMd } from "@/lib/skill-registry/claude-md-analyzer";
import type { ClaudeMdAnalysis } from "@/lib/skill-registry/types";

/**
 * Server action: analyze raw CLAUDE.md content.
 * No auth required — this is a public utility.
 */
export async function analyzeClaudeMdFile(content: string): Promise<ClaudeMdAnalysis> {
  return analyzeClaudeMd(content, "CLAUDE.md");
}
