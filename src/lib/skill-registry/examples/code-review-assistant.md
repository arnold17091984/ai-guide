---
name: Code Review Assistant
description: Performs thorough code reviews covering security, performance, and style
version: 1.2.0
author: alice
category: review
triggers:
  - "review my code"
  - "review this file"
  - "check this implementation"
  - "/code\s+review/i"
compatibleWith:
  min: "1.0"
dependencies:
  - security-scanner
tags:
  - code-review
  - security
  - quality
  - best-practices
license: MIT
homepage: https://github.com/alice/claude-skills
---

## Code Review Assistant

Instructs Claude to perform a structured, multi-dimensional code review. Modeled after
the review practices described in the ai-guide best-practices guide.

### Review Dimensions

When activated, Claude will evaluate the code across these axes:

1. **Security** — Look for injection vulnerabilities, auth bypasses, exposed secrets,
   insecure dependencies, and improper error handling that leaks information.

2. **Performance** — Identify N+1 queries, unnecessary re-renders, missing memoization,
   blocking I/O, and inefficient data structures.

3. **Correctness** — Check edge cases, null/undefined handling, type safety, and
   off-by-one errors.

4. **Maintainability** — Flag overly complex functions (cyclomatic complexity > 10),
   missing comments on non-obvious logic, and violation of the single responsibility
   principle.

5. **Test Coverage** — Verify that new code paths have corresponding tests and that
   test assertions are meaningful (not just coverage theater).

### Output Format

The review should be structured as:

```markdown
## Summary
One paragraph overall assessment.

## Issues Found
| Severity | Line | Issue | Suggestion |
|----------|------|-------|------------|
| Critical | 42   | SQL injection via f-string | Use parameterized queries |

## Positive Observations
What was done well.

## Recommended Next Steps
Ordered action items.
```

### Behavior Guidelines

- Always cite specific line numbers when pointing out issues
- Suggest concrete fixes, not vague "consider improving X"
- Distinguish between must-fix issues and stylistic preferences
- Note when a pattern matches a known anti-pattern by name
- If the code appears to be a prototype/experiment, adjust
  expectations accordingly and say so

### Example Invocations

```
review my code in src/auth/login.ts
```

```
check this implementation — focus on security and error handling
```

```
code review for the PR diff pasted below
```
