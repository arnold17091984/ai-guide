// ============================================================
// CLAUDE.md Analyzer
// ============================================================
// Parses and scores CLAUDE.md files against known best practices.
// Pure TypeScript, no runtime dependencies.

import type {
  ClaudeMdAnalysis,
  ClaudeMdSection,
  ClaudeMdRule,
  ClaudeMdConflict,
  ClaudeMdImprovement,
  TemplateComparison,
} from "./types";

// ----------------------------------------------------------
// Well-known sections from the ai-guide best-practices content
// and community-observed CLAUDE.md patterns.
// ----------------------------------------------------------

const BEST_PRACTICE_SECTIONS = [
  "workflow orchestration",
  "task management",
  "core principles",
  "code style",
  "testing",
  "git workflow",
  "error handling",
  "security",
  "performance",
  "documentation",
] as const;

type BestPracticeSection = (typeof BEST_PRACTICE_SECTIONS)[number];

// Patterns that signal rule conflicts
// Each entry is [patternA, patternB, explanation, resolution]
const CONFLICT_PATTERNS: Array<[RegExp, RegExp, string, string]> = [
  [
    /never\s+commit\s+directly/i,
    /commit\s+directly\s+to\s+main/i,
    "One rule forbids direct commits while another permits them.",
    "Consolidate to: always use feature branches and PRs for non-trivial changes.",
  ],
  [
    /always\s+use\s+tabs/i,
    /always\s+use\s+spaces/i,
    "Conflicting indentation rules (tabs vs spaces).",
    "Pick one and remove the other. Use an .editorconfig file for enforcement.",
  ],
  [
    /never\s+use\s+async\/await/i,
    /prefer\s+async\/await/i,
    "Conflicting async pattern preferences.",
    "Pick one preferred pattern. Document exceptions explicitly.",
  ],
  [
    /skip\s+tests\s+when/i,
    /never\s+skip\s+tests/i,
    "One rule conditionally permits skipping tests; another forbids it entirely.",
    "Define the exact conditions under which tests may be skipped.",
  ],
  [
    /do\s+not\s+modify\s+existing\s+files/i,
    /update\s+existing\s+files\s+in\s+place/i,
    "Contradictory file modification policies.",
    "Clarify which contexts allow in-place editing vs. creating new files.",
  ],
];

// Community templates for comparison
const COMMUNITY_TEMPLATES: Record<string, { sections: string[]; description: string }> = {
  "minimal": {
    description: "Bare minimum for solo projects",
    sections: ["core principles", "code style"],
  },
  "team-standard": {
    description: "Standard for multi-developer teams",
    sections: ["workflow orchestration", "task management", "core principles", "code style", "git workflow", "testing"],
  },
  "enterprise": {
    description: "Full coverage for enterprise teams",
    sections: [
      "workflow orchestration", "task management", "core principles",
      "code style", "testing", "git workflow", "error handling",
      "security", "performance", "documentation",
    ],
  },
  "ai-guide": {
    description: "The ai-guide project standard",
    sections: ["workflow orchestration", "task management", "core principles"],
  },
};

// ----------------------------------------------------------
// Parsing
// ----------------------------------------------------------

/**
 * Split a CLAUDE.md file into heading-delimited sections.
 * Preserves content between headings for rule extraction.
 */
export function parseClaudeMdSections(content: string): ClaudeMdSection[] {
  const sections: ClaudeMdSection[] = [];
  const lines = content.split("\n");
  let currentHeading = "";
  let currentLevel = 0;
  let currentStart = 0;
  let currentLines: string[] = [];

  const flush = (endLine: number) => {
    if (currentHeading) {
      sections.push({
        heading: currentHeading,
        level: currentLevel,
        content: currentLines.join("\n").trim(),
        lineStart: currentStart,
        lineEnd: endLine,
      });
    }
  };

  for (const [idx, line] of lines.entries()) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      flush(idx);
      currentHeading = headingMatch[2].trim();
      currentLevel = headingMatch[1].length;
      currentStart = idx + 1;
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  flush(lines.length);

  return sections;
}

/**
 * Extract individual rules from section content.
 * Rules are detected as:
 *   - List items (- or * or 1.)
 *   - Lines containing imperative verbs: always, never, must, should, prefer
 */
export function extractRules(sections: ClaudeMdSection[]): ClaudeMdRule[] {
  const rules: ClaudeMdRule[] = [];
  const imperativeRe = /\b(always|never|must|should|prefer|avoid|do not|don't|ensure|require)\b/i;

  for (const section of sections) {
    const lines = section.content.split("\n");

    for (const [lineOffset, line] of lines.entries()) {
      const listMatch = line.match(/^[\s]*[-*]\s+(.+)/) ?? line.match(/^[\s]*\d+\.\s+(.+)/);
      const text = listMatch ? listMatch[1].trim() : line.trim();

      if (!text) continue;

      const isListItem = !!listMatch;
      const hasImperative = imperativeRe.test(text);

      if (isListItem || hasImperative) {
        rules.push({
          text,
          section: section.heading,
          lineNumber: section.lineStart + lineOffset,
        });
      }
    }
  }

  return rules;
}

/**
 * Detect conflicting rules by running the conflict pattern matrix
 * across all rule pairs.
 */
export function detectConflicts(rules: ClaudeMdRule[]): ClaudeMdConflict[] {
  const conflicts: ClaudeMdConflict[] = [];

  for (const [patternA, patternB, explanation, resolution] of CONFLICT_PATTERNS) {
    const matchA = rules.filter(r => patternA.test(r.text));
    const matchB = rules.filter(r => patternB.test(r.text));

    for (const ruleA of matchA) {
      for (const ruleB of matchB) {
        if (ruleA.lineNumber !== ruleB.lineNumber) {
          conflicts.push({ ruleA, ruleB, explanation, resolution });
        }
      }
    }
  }

  return conflicts;
}

// ----------------------------------------------------------
// Scoring
// ----------------------------------------------------------

/**
 * Score completeness: fraction of best-practice sections present.
 * Weight by how critical each section is (workflow + principles = high).
 */
function scoreCompleteness(sections: ClaudeMdSection[]): number {
  const sectionHeadings = new Set(sections.map(s => s.heading.toLowerCase()));

  const weights: Partial<Record<BestPracticeSection, number>> = {
    "workflow orchestration": 15,
    "core principles": 15,
    "task management": 12,
    "code style": 12,
    "testing": 10,
    "git workflow": 10,
    "error handling": 8,
    "security": 8,
    "performance": 5,
    "documentation": 5,
  };

  let earned = 0;
  let total = 0;

  for (const [section, weight] of Object.entries(weights) as [BestPracticeSection, number][]) {
    total += weight;
    if (sectionHeadings.has(section)) {
      earned += weight;
    } else {
      // Partial credit for partial heading matches (e.g. "## Workflow" matches "workflow orchestration")
      const partialMatch = [...sectionHeadings].some(h => section.startsWith(h) || h.includes(section.split(" ")[0]));
      if (partialMatch) earned += weight * 0.5;
    }
  }

  return Math.round((earned / total) * 100);
}

/**
 * Score quality based on:
 *   - Rule specificity (imperative language with clear scope)
 *   - Section depth (headings have content, not just sub-headings)
 *   - Absence of conflicts
 *   - Examples present
 */
function scoreQuality(
  sections: ClaudeMdSection[],
  rules: ClaudeMdRule[],
  conflicts: ClaudeMdConflict[]
): number {
  let score = 100;

  // Penalize empty sections
  const emptySections = sections.filter(s => s.content.trim().length < 20);
  score -= emptySections.length * 8;

  // Penalize conflicts
  score -= conflicts.length * 15;

  // Reward specificity: rules with examples or constraints
  const vagueRules = rules.filter(r => r.text.split(" ").length < 5);
  score -= Math.min(20, vagueRules.length * 3);

  // Reward presence of code examples
  const hasExamples = sections.some(s => s.content.includes("```"));
  if (!hasExamples) score -= 5;

  // Reward having a substantial file overall
  const totalChars = sections.reduce((acc, s) => acc + s.content.length, 0);
  if (totalChars < 200) score -= 15;
  else if (totalChars < 500) score -= 5;

  return Math.max(0, Math.min(100, score));
}

// ----------------------------------------------------------
// Improvement suggestions
// ----------------------------------------------------------

function generateImprovements(
  sections: ClaudeMdSection[],
  rules: ClaudeMdRule[],
  conflicts: ClaudeMdConflict[]
): ClaudeMdImprovement[] {
  const improvements: ClaudeMdImprovement[] = [];
  const sectionHeadings = new Set(sections.map(s => s.heading.toLowerCase()));

  // Missing high-priority sections
  if (!sectionHeadings.has("workflow orchestration") && !sectionHeadings.has("workflow")) {
    improvements.push({
      priority: "high",
      category: "Structure",
      suggestion: "Add a ## Workflow Orchestration section to define how Claude should approach multi-step tasks.",
      exampleContent: [
        "## Workflow Orchestration",
        "",
        "- Enter plan mode for ANY non-trivial task (3+ steps)",
        "- If something goes wrong, STOP and re-plan immediately",
        "- Use subagents for parallel research tasks",
        "- Verify all changes before marking complete",
      ].join("\n"),
    });
  }

  if (!sectionHeadings.has("core principles") && !sectionHeadings.has("principles")) {
    improvements.push({
      priority: "high",
      category: "Structure",
      suggestion: "Add a ## Core Principles section to establish non-negotiable constraints.",
      exampleContent: [
        "## Core Principles",
        "",
        "- Simplicity First: Make every change as simple as possible",
        "- No Laziness: Find root causes, avoid temporary fixes",
        "- Minimal Impact: Touch only what is necessary",
      ].join("\n"),
    });
  }

  if (!sectionHeadings.has("testing") && !sectionHeadings.has("test")) {
    improvements.push({
      priority: "medium",
      category: "Quality Gates",
      suggestion: "Add a ## Testing section to define when and how tests must be run.",
      exampleContent: [
        "## Testing",
        "",
        "- Run the full test suite before committing",
        "- Never mark a task complete without proving it works",
        "- Add regression tests for every bug fix",
      ].join("\n"),
    });
  }

  if (!sectionHeadings.has("git workflow") && !sectionHeadings.has("git")) {
    improvements.push({
      priority: "medium",
      category: "Version Control",
      suggestion: "Add a ## Git Workflow section to standardize commit and branching practices.",
    });
  }

  // Vague rules
  const vagueRules = rules.filter(r => r.text.split(" ").length < 5);
  if (vagueRules.length > 0) {
    improvements.push({
      priority: "low",
      category: "Rule Specificity",
      suggestion: `${vagueRules.length} rule(s) are too vague (under 5 words). Expand them with concrete constraints or examples.`,
    });
  }

  // Conflicts
  for (const conflict of conflicts) {
    improvements.push({
      priority: "high",
      category: "Conflict Resolution",
      suggestion: `Resolve conflict between "${conflict.ruleA.text.slice(0, 50)}" (line ${conflict.ruleA.lineNumber}) and "${conflict.ruleB.text.slice(0, 50)}" (line ${conflict.ruleB.lineNumber}). ${conflict.explanation}`,
      exampleContent: conflict.resolution,
    });
  }

  return improvements;
}

// ----------------------------------------------------------
// Template comparison
// ----------------------------------------------------------

function compareWithTemplates(sections: ClaudeMdSection[]): TemplateComparison {
  const sectionHeadings = new Set(sections.map(s => s.heading.toLowerCase()));

  // Find best matching template
  let bestTemplateName = "minimal";
  let bestMatchScore = 0;

  for (const [name, template] of Object.entries(COMMUNITY_TEMPLATES)) {
    const matched = template.sections.filter(s =>
      sectionHeadings.has(s) ||
      [...sectionHeadings].some(h => h.includes(s.split(" ")[0]))
    ).length;
    const score = matched / template.sections.length;
    if (score > bestMatchScore) {
      bestMatchScore = score;
      bestTemplateName = name;
    }
  }

  const template = COMMUNITY_TEMPLATES[bestTemplateName];
  const missingSections = template.sections.filter(s =>
    !sectionHeadings.has(s) &&
    ![...sectionHeadings].some(h => h.includes(s.split(" ")[0]))
  );
  const extraSections = [...sectionHeadings].filter(h =>
    !template.sections.some(s => s.includes(h.split(" ")[0]) || h.includes(s.split(" ")[0]))
  );

  return {
    templateName: bestTemplateName,
    matchScore: Math.round(bestMatchScore * 100),
    missingSections,
    extraSections,
  };
}

// ----------------------------------------------------------
// Public API
// ----------------------------------------------------------

/**
 * Analyze a CLAUDE.md file and return a structured report
 * with completeness/quality scores and actionable improvements.
 */
export function analyzeClaudeMd(
  content: string,
  filePath = "CLAUDE.md"
): ClaudeMdAnalysis {
  const sections = parseClaudeMdSections(content);
  const rules = extractRules(sections);
  const conflicts = detectConflicts(rules);
  const completenessScore = scoreCompleteness(sections);
  const qualityScore = scoreQuality(sections, rules, conflicts);
  const improvements = generateImprovements(sections, rules, conflicts);
  const templateComparison = compareWithTemplates(sections);

  return {
    filePath,
    sections,
    rules,
    conflicts,
    completenessScore,
    qualityScore,
    improvements,
    templateComparison,
  };
}
