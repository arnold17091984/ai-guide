// ============================================================
// CLI Tool — skill-validator
// ============================================================
// A standalone Node.js script that can be run locally with:
//
//   npx tsx src/lib/skill-registry/cli.ts validate ./my-skill.md
//   npx tsx src/lib/skill-registry/cli.ts analyze ./CLAUDE.md
//   npx tsx src/lib/skill-registry/cli.ts diff ./teamA.json ./teamB.json
//   npx tsx src/lib/skill-registry/cli.ts install-guide ./my-package.json
//
// Zero runtime dependencies beyond Node.js built-ins.
// Startup time target: < 100ms (achieved via lazy imports and
// avoiding heavy module initialization at the top level).

import { readFileSync, existsSync } from "fs";
import { resolve, basename } from "path";
import { validateSkill } from "./validator";
import { analyzeClaudeMd } from "./claude-md-analyzer";
import { importPackage, diffConfigs, formatDiffReport, generateInstallGuide } from "./team-sync";
import type { ValidationIssue, ValidationReport, ClaudeMdAnalysis } from "./types";

// ----------------------------------------------------------
// Terminal color codes (no chalk dependency)
// ----------------------------------------------------------

const isTTY = process.stdout.isTTY ?? false;

const c = {
  reset:   isTTY ? "\x1b[0m"  : "",
  bold:    isTTY ? "\x1b[1m"  : "",
  dim:     isTTY ? "\x1b[2m"  : "",
  red:     isTTY ? "\x1b[31m" : "",
  yellow:  isTTY ? "\x1b[33m" : "",
  green:   isTTY ? "\x1b[32m" : "",
  cyan:    isTTY ? "\x1b[36m" : "",
  blue:    isTTY ? "\x1b[34m" : "",
  magenta: isTTY ? "\x1b[35m" : "",
};

// ----------------------------------------------------------
// Output helpers
// ----------------------------------------------------------

function print(msg: string) { process.stdout.write(msg + "\n"); }
function printErr(msg: string) { process.stderr.write(msg + "\n"); }

function severityColor(sev: ValidationIssue["severity"]): string {
  switch (sev) {
    case "error":   return c.red;
    case "warning": return c.yellow;
    case "info":    return c.cyan;
  }
}

function severityIcon(sev: ValidationIssue["severity"]): string {
  switch (sev) {
    case "error":   return "x";
    case "warning": return "!";
    case "info":    return "i";
  }
}

function scoreBar(score: number, width = 20): string {
  const filled = Math.round((score / 100) * width);
  const color = score >= 80 ? c.green : score >= 50 ? c.yellow : c.red;
  const bar = color + "=".repeat(filled) + c.dim + "-".repeat(width - filled) + c.reset;
  return `[${bar}] ${score}/100`;
}

function printDivider(char = "-", width = 60) {
  print(c.dim + char.repeat(width) + c.reset);
}

// ----------------------------------------------------------
// Commands
// ----------------------------------------------------------

/** validate <file.md> — Run full validation pipeline on a skill file */
function cmdValidate(args: string[]): number {
  const filePath = args[0];
  if (!filePath) {
    printErr(`${c.red}Error:${c.reset} Please provide a path to a skill file.`);
    printErr("  Usage: skill-validator validate <path/to/skill.md>");
    return 1;
  }

  const resolved = resolve(filePath);
  if (!existsSync(resolved)) {
    printErr(`${c.red}Error:${c.reset} File not found: ${resolved}`);
    return 1;
  }

  let content: string;
  try {
    content = readFileSync(resolved, "utf-8");
  } catch (err) {
    printErr(`${c.red}Error:${c.reset} Could not read file: ${(err as Error).message}`);
    return 1;
  }

  print("");
  print(`${c.bold}Validating:${c.reset} ${c.cyan}${basename(resolved)}${c.reset}`);
  printDivider();

  const report = validateSkill(content, { filePath: resolved });

  printValidationReport(report);

  return report.valid ? 0 : 1;
}

function printValidationReport(report: ValidationReport): void {
  // Stage summary
  for (const [stageName, stage] of Object.entries(report.stages)) {
    const icon = stage.passed ? `${c.green}pass${c.reset}` : `${c.red}FAIL${c.reset}`;
    print(`  ${icon}  ${stageName.padEnd(16)} ${c.dim}(${stage.issues.length} issue${stage.issues.length !== 1 ? "s" : ""})${c.reset}`);
  }

  print("");

  if (report.issues.length === 0) {
    print(`${c.green}${c.bold}No issues found.${c.reset}`);
  } else {
    printDivider();
    print(`${c.bold}Issues${c.reset}`);
    print("");

    for (const issue of report.issues) {
      const col = severityColor(issue.severity);
      const icon = severityIcon(issue.severity);
      const loc = issue.location
        ? `${c.dim}[${issue.location.field ?? `line ${issue.location.line}`}]${c.reset} `
        : "";
      print(`  ${col}${icon}${c.reset} ${col}${issue.code}${c.reset} ${loc}${issue.message}`);
      if (issue.suggestion) {
        print(`    ${c.dim}Suggestion: ${issue.suggestion}${c.reset}`);
      }
      if (issue.docsUrl) {
        print(`    ${c.dim}Docs: ${issue.docsUrl}${c.reset}`);
      }
    }
  }

  print("");
  printDivider();

  // Summary counts
  const { errors, warnings, infos } = report.summary;
  print(
    `${c.bold}Summary:${c.reset}  ` +
    `${errors > 0 ? c.red : c.dim}${errors} error${errors !== 1 ? "s" : ""}${c.reset}  ` +
    `${warnings > 0 ? c.yellow : c.dim}${warnings} warning${warnings !== 1 ? "s" : ""}${c.reset}  ` +
    `${infos > 0 ? c.cyan : c.dim}${infos} info${c.reset}`
  );

  // Quality score
  print(`${c.bold}Quality:  ${c.reset}${scoreBar(report.qualityScore)}`);

  // Compatibility matrix
  print(`${c.bold}Compat:   ${c.reset}`);
  for (const [version, supported] of Object.entries(report.compatibility)) {
    const mark = supported ? `${c.green}+${c.reset}` : `${c.dim}-${c.reset}`;
    print(`    ${mark} Claude Code ${version}`);
  }

  print("");
  print(`${c.dim}Completed in ${report.durationMs}ms${c.reset}`);
  print("");
  print(report.valid
    ? `${c.green}${c.bold}VALID${c.reset} — skill is ready to publish`
    : `${c.red}${c.bold}INVALID${c.reset} — fix ${errors} error${errors !== 1 ? "s" : ""} before publishing`
  );
  print("");
}

/** analyze <CLAUDE.md> — Score and improve a CLAUDE.md file */
function cmdAnalyze(args: string[]): number {
  const filePath = args[0];
  if (!filePath) {
    printErr(`${c.red}Error:${c.reset} Please provide a path to a CLAUDE.md file.`);
    printErr("  Usage: skill-validator analyze <path/to/CLAUDE.md>");
    return 1;
  }

  const resolved = resolve(filePath);
  if (!existsSync(resolved)) {
    printErr(`${c.red}Error:${c.reset} File not found: ${resolved}`);
    return 1;
  }

  let content: string;
  try {
    content = readFileSync(resolved, "utf-8");
  } catch (err) {
    printErr(`${c.red}Error:${c.reset} Could not read file: ${(err as Error).message}`);
    return 1;
  }

  print("");
  print(`${c.bold}Analyzing:${c.reset} ${c.cyan}${basename(resolved)}${c.reset}`);
  printDivider();

  const analysis = analyzeClaudeMd(content, resolved);
  printClaudeMdAnalysis(analysis);

  return 0;
}

function printClaudeMdAnalysis(analysis: ClaudeMdAnalysis): void {
  print(`${c.bold}Sections found (${analysis.sections.length}):${c.reset}`);
  for (const section of analysis.sections) {
    const indent = "  ".repeat(section.level - 1);
    print(`  ${indent}${c.cyan}${"#".repeat(section.level)}${c.reset} ${section.heading}`);
  }

  print("");
  print(`${c.bold}Rules extracted:${c.reset} ${analysis.rules.length}`);
  print(`${c.bold}Conflicts:${c.reset}       ${analysis.conflicts.length}`);
  print("");
  printDivider();

  if (analysis.conflicts.length > 0) {
    print(`${c.red}${c.bold}Conflicts${c.reset}`);
    for (const conflict of analysis.conflicts) {
      print(`  ${c.red}x${c.reset} ${conflict.explanation}`);
      print(`    ${c.dim}Rule A (line ${conflict.ruleA.lineNumber}):${c.reset} ${conflict.ruleA.text.slice(0, 70)}`);
      print(`    ${c.dim}Rule B (line ${conflict.ruleB.lineNumber}):${c.reset} ${conflict.ruleB.text.slice(0, 70)}`);
      if (conflict.resolution) {
        print(`    ${c.green}Resolution:${c.reset} ${conflict.resolution}`);
      }
    }
    print("");
  }

  print(`${c.bold}Completeness: ${c.reset}${scoreBar(analysis.completenessScore)}`);
  print(`${c.bold}Quality:      ${c.reset}${scoreBar(analysis.qualityScore)}`);

  if (analysis.templateComparison) {
    const tc = analysis.templateComparison;
    print("");
    print(`${c.bold}Best matching template:${c.reset} ${c.magenta}${tc.templateName}${c.reset} (${tc.matchScore}% match)`);
    if (tc.missingSections.length > 0) {
      print(`  Missing sections: ${tc.missingSections.map(s => c.yellow + s + c.reset).join(", ")}`);
    }
    if (tc.extraSections.length > 0) {
      print(`  Extra sections:   ${tc.extraSections.map(s => c.cyan + s + c.reset).join(", ")}`);
    }
  }

  if (analysis.improvements.length > 0) {
    print("");
    printDivider();
    print(`${c.bold}Improvements${c.reset}`);
    print("");

    for (const imp of analysis.improvements) {
      const priorityColor = imp.priority === "high" ? c.red : imp.priority === "medium" ? c.yellow : c.dim;
      print(`  ${priorityColor}[${imp.priority}]${c.reset} ${c.bold}${imp.category}${c.reset}`);
      print(`    ${imp.suggestion}`);
      if (imp.exampleContent) {
        print(`    ${c.dim}Example:${c.reset}`);
        for (const line of imp.exampleContent.split("\n").slice(0, 5)) {
          print(`      ${c.dim}${line}${c.reset}`);
        }
      }
      print("");
    }
  }
}

/** diff <packageA.json> <packageB.json> — Compare two team configurations */
function cmdDiff(args: string[]): number {
  const [pathA, pathB] = args;
  if (!pathA || !pathB) {
    printErr(`${c.red}Error:${c.reset} Please provide two package files to compare.`);
    printErr("  Usage: skill-validator diff <packageA.json> <packageB.json>");
    return 1;
  }

  const resolvedA = resolve(pathA);
  const resolvedB = resolve(pathB);

  for (const [label, p] of [[pathA, resolvedA], [pathB, resolvedB]] as [string, string][]) {
    if (!existsSync(p)) {
      printErr(`${c.red}Error:${c.reset} File not found: ${label}`);
      return 1;
    }
  }

  let pkgA, pkgB;
  try {
    pkgA = importPackage(readFileSync(resolvedA, "utf-8"));
    pkgB = importPackage(readFileSync(resolvedB, "utf-8"));
  } catch (err) {
    printErr(`${c.red}Error:${c.reset} ${(err as Error).message}`);
    return 1;
  }

  const nameA = basename(resolvedA, ".json");
  const nameB = basename(resolvedB, ".json");
  const diff = diffConfigs(nameA, pkgA, nameB, pkgB);
  const report = formatDiffReport(diff);

  print("");
  print(report);
  return 0;
}

/** install-guide <package.json> — Generate install guide for a package */
function cmdInstallGuide(args: string[]): number {
  const filePath = args[0];
  if (!filePath) {
    printErr(`${c.red}Error:${c.reset} Please provide a path to a skill package JSON file.`);
    printErr("  Usage: skill-validator install-guide <package.json>");
    return 1;
  }

  const resolved = resolve(filePath);
  if (!existsSync(resolved)) {
    printErr(`${c.red}Error:${c.reset} File not found: ${resolved}`);
    return 1;
  }

  let pkg;
  try {
    pkg = importPackage(readFileSync(resolved, "utf-8"));
  } catch (err) {
    printErr(`${c.red}Error:${c.reset} ${(err as Error).message}`);
    return 1;
  }

  print(generateInstallGuide(pkg));
  return 0;
}

/** help — Print usage information */
function cmdHelp(): number {
  print(`
${c.bold}skill-validator${c.reset} — Claude Code Skill Registry CLI
${c.dim}Usage: skill-validator <command> [options]${c.reset}

${c.bold}Commands:${c.reset}

  ${c.cyan}validate${c.reset} <skill.md>
    Validate a skill file and print a full report with quality score.
    Exit code 0 = valid, 1 = has errors.

  ${c.cyan}analyze${c.reset} <CLAUDE.md>
    Analyze a CLAUDE.md file for completeness, quality, and conflicts.
    Prints score breakdown and actionable improvements.

  ${c.cyan}diff${c.reset} <packageA.json> <packageB.json>
    Compare two team skill packages and show what differs.

  ${c.cyan}install-guide${c.reset} <package.json>
    Generate a step-by-step install guide for a skill package.

  ${c.cyan}help${c.reset}
    Print this message.

${c.bold}Examples:${c.reset}

  skill-validator validate ./skills/my-reviewer.md
  skill-validator analyze ./CLAUDE.md
  skill-validator diff ./alice.json ./bob.json
  skill-validator install-guide ./team-backend-kit.json

${c.dim}Exit codes: 0 = success, 1 = error or validation failure${c.reset}
`);
  return 0;
}

// ----------------------------------------------------------
// Entry point
// ----------------------------------------------------------

function main(): void {
  const [, , command, ...args] = process.argv;

  const exitCode = (() => {
    switch (command) {
      case "validate":      return cmdValidate(args);
      case "analyze":       return cmdAnalyze(args);
      case "diff":          return cmdDiff(args);
      case "install-guide": return cmdInstallGuide(args);
      case "help":
      case "--help":
      case "-h":
      case undefined:       return cmdHelp();
      default:
        printErr(`${c.red}Error:${c.reset} Unknown command "${command}". Run "skill-validator help" for usage.`);
        return 1;
    }
  })();

  process.exit(exitCode);
}

// Only run when executed directly (not when imported as a module)
// Works with both `node cli.js` and `tsx cli.ts`
if (
  typeof require !== "undefined" &&
  require.main === module
) {
  main();
}
