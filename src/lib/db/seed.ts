/**
 * Seed script for the AI-Guide platform database.
 *
 * Inserts representative sample data for local development
 * and staging environments. Safe to run on an empty database.
 *
 * Usage:
 *   npx tsx src/lib/db/seed.ts
 *
 * Or add to package.json:
 *   "db:seed": "tsx src/lib/db/seed.ts"
 */

import { db } from "./client";
import {
  users,
  categories,
  tags,
  knowledgeEntries,
  knowledgeEntryTags,
  skills,
  skillVersions,
  caseStudies,
  achievements,
  userAchievements,
} from "./schema";
import type {
  NewUser,
  NewCategory,
  NewKnowledgeEntry,
  NewSkill,
  NewAchievement,
} from "./schema";

// ============================================================
// Helpers
// ============================================================

// ============================================================
// seed()
// ============================================================

export async function seed() {
  console.log("Seeding database...");

  // ----------------------------------------------------------
  // 1. Taxonomy — Categories (5 knowledge + 4 skills)
  // ----------------------------------------------------------

  console.log("  Inserting categories...");

  const categoryData: NewCategory[] = [
    {
      slug: "workflows",
      labelKo: "워크플로우",
      labelEn: "Workflows",
      labelJa: "ワークフロー",
      icon: "git-branch",
      sortOrder: 1,
    },
    {
      slug: "prompt-engineering",
      labelKo: "프롬프트 엔지니어링",
      labelEn: "Prompt Engineering",
      labelJa: "プロンプトエンジニアリング",
      icon: "zap",
      sortOrder: 2,
    },
    {
      slug: "architecture",
      labelKo: "아키텍처",
      labelEn: "Architecture",
      labelJa: "アーキテクチャ",
      icon: "layers",
      sortOrder: 3,
    },
    {
      slug: "testing",
      labelKo: "테스팅",
      labelEn: "Testing",
      labelJa: "テスト",
      icon: "check-circle",
      sortOrder: 4,
    },
    {
      slug: "security",
      labelKo: "보안",
      labelEn: "Security",
      labelJa: "セキュリティ",
      icon: "shield",
      sortOrder: 5,
    },
    {
      slug: "devops",
      labelKo: "데브옵스",
      labelEn: "DevOps",
      labelJa: "デブオプス",
      icon: "server",
      sortOrder: 6,
    },
    {
      slug: "frontend",
      labelKo: "프론트엔드",
      labelEn: "Frontend",
      labelJa: "フロントエンド",
      icon: "monitor",
      sortOrder: 7,
    },
    {
      slug: "data",
      labelKo: "데이터",
      labelEn: "Data",
      labelJa: "データ",
      icon: "database",
      sortOrder: 8,
    },
    {
      slug: "mobile",
      labelKo: "모바일",
      labelEn: "Mobile",
      labelJa: "モバイル",
      icon: "smartphone",
      sortOrder: 9,
    },
  ];

  const insertedCategories = await db
    .insert(categories)
    .values(categoryData)
    .onConflictDoNothing()
    .returning({ id: categories.id, slug: categories.slug });

  const catMap = Object.fromEntries(
    insertedCategories.map((c) => [c.slug, c.id]),
  );
  console.log(`    Inserted ${insertedCategories.length} categories`);

  // ----------------------------------------------------------
  // 2. Tags
  // ----------------------------------------------------------

  console.log("  Inserting tags...");

  const tagData = [
    { slug: "typescript", labelKo: "타입스크립트", labelEn: "TypeScript", labelJa: "TypeScript", color: "blue", category: "language" },
    { slug: "python",     labelKo: "파이썬",       labelEn: "Python",     labelJa: "Python",     color: "yellow", category: "language" },
    { slug: "react",      labelKo: "리액트",       labelEn: "React",      labelJa: "React",      color: "cyan",  category: "framework" },
    { slug: "nextjs",     labelKo: "넥스트JS",     labelEn: "Next.js",    labelJa: "Next.js",    color: "slate", category: "framework" },
    { slug: "beginners",  labelKo: "초급",         labelEn: "Beginners",  labelJa: "初級",       color: "green", category: "level" },
    { slug: "advanced",   labelKo: "고급",         labelEn: "Advanced",   labelJa: "上級",       color: "red",   category: "level" },
    { slug: "claude-code",labelKo: "클로드 코드",  labelEn: "Claude Code",labelJa: "Claude Code",color: "purple", category: "tool" },
    { slug: "testing",    labelKo: "테스팅",       labelEn: "Testing",    labelJa: "テスト",     color: "orange", category: "concept" },
  ];

  const insertedTags = await db
    .insert(tags)
    .values(tagData)
    .onConflictDoNothing()
    .returning({ id: tags.id, slug: tags.slug });

  const tagMap = Object.fromEntries(
    insertedTags.map((t) => [t.slug, t.id]),
  );
  console.log(`    Inserted ${insertedTags.length} tags`);

  // ----------------------------------------------------------
  // 3. Users (3 sample users with different roles)
  // ----------------------------------------------------------

  console.log("  Inserting users...");

  const userData: NewUser[] = [
    {
      username: "admin_kim",
      email: "admin@ai-guide.dev",
      displayName: "김관리자",
      bio: "AI-Guide platform administrator and Claude Code enthusiast.",
      role: "admin",
      locale: "ko",
      githubHandle: "admin-kim",
      reputation: 5000,
      isVerified: true,
    },
    {
      username: "contributor_park",
      email: "park@ai-guide.dev",
      displayName: "박기여자",
      bio: "Senior engineer focused on AI-assisted workflows and developer tooling.",
      role: "contributor",
      locale: "ko",
      githubHandle: "contributor-park",
      websiteUrl: "https://parkdev.io",
      reputation: 1240,
      isVerified: true,
    },
    {
      username: "viewer_lee",
      email: "lee@ai-guide.dev",
      displayName: "이뷰어",
      bio: "Learning how to integrate Claude Code into my daily workflow.",
      role: "viewer",
      locale: "en",
      reputation: 50,
      isVerified: false,
    },
  ];

  const insertedUsers = await db
    .insert(users)
    .values(userData)
    .onConflictDoNothing()
    .returning({ id: users.id, username: users.username });

  const userMap = Object.fromEntries(
    insertedUsers.map((u) => [u.username, u.id]),
  );

  // Fallback: if already seeded, fetch existing users
  let adminId   = userMap["admin_kim"];
  let contribId = userMap["contributor_park"];

  if (!adminId || !contribId) {
    const existing = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .limit(3);
    const existingMap = Object.fromEntries(existing.map((u) => [u.username, u.id]));
    adminId   = existingMap["admin_kim"]       ?? existing[0]?.id ?? "";
    contribId = existingMap["contributor_park"] ?? existing[1]?.id ?? adminId;
  }

  console.log(`    Inserted ${insertedUsers.length} users`);

  // ----------------------------------------------------------
  // 4. Knowledge Entries (5 entries, mix of published/draft)
  // ----------------------------------------------------------

  console.log("  Inserting knowledge entries...");

  const knowledgeData: NewKnowledgeEntry[] = [
    {
      slug: "claude-code-getting-started",
      contentType: "tutorial",
      status: "published",
      difficultyLevel: "beginner",
      authorId: adminId,
      categoryId: catMap["workflows"],
      titleKo: "Claude Code 시작하기: 완벽 가이드",
      titleEn: "Getting Started with Claude Code: Complete Guide",
      titleJa: "Claude Codeを始めよう：完全ガイド",
      summaryKo: "Claude Code를 처음 사용하는 개발자를 위한 단계별 설정 가이드입니다.",
      summaryEn: "A step-by-step setup guide for developers new to Claude Code.",
      summaryJa: "Claude Codeを初めて使う開発者向けのステップバイステップのセットアップガイドです。",
      bodyKo: "# Claude Code 시작하기\n\nClaude Code는 Anthropic이 만든 AI 코딩 어시스턴트입니다.\n\n## 설치\n\n```bash\nnpm install -g @anthropic-ai/claude-code\n```\n\n## CLAUDE.md 설정\n\nCLAUDE.md 파일을 프로젝트 루트에 생성하여 Claude에게 프로젝트 컨텍스트를 제공하세요.",
      bodyEn: "# Getting Started with Claude Code\n\nClaude Code is an AI coding assistant built by Anthropic.\n\n## Installation\n\n```bash\nnpm install -g @anthropic-ai/claude-code\n```\n\n## Configure CLAUDE.md\n\nCreate a CLAUDE.md file at your project root to give Claude context about your project.",
      readTimeMins: 8,
      isFeatured: true,
      publishedAt: new Date("2025-12-01T09:00:00Z"),
    },
    {
      slug: "claude-md-best-practices",
      contentType: "article",
      status: "published",
      difficultyLevel: "intermediate",
      authorId: contribId,
      categoryId: catMap["prompt-engineering"],
      titleKo: "CLAUDE.md 모범 사례: 팀 생산성 극대화",
      titleEn: "CLAUDE.md Best Practices: Maximizing Team Productivity",
      titleJa: "CLAUDE.mdのベストプラクティス：チーム生産性の最大化",
      summaryKo: "효과적인 CLAUDE.md 파일 작성법과 팀 워크플로우 개선 전략을 알아봅니다.",
      summaryEn: "Learn how to write effective CLAUDE.md files and strategies to improve team workflows.",
      readTimeMins: 12,
      isFeatured: true,
      publishedAt: new Date("2025-12-15T09:00:00Z"),
    },
    {
      slug: "testing-with-claude-code",
      contentType: "workflow",
      status: "published",
      difficultyLevel: "intermediate",
      authorId: contribId,
      categoryId: catMap["testing"],
      titleKo: "Claude Code로 테스트 작성 자동화",
      titleEn: "Automating Test Writing with Claude Code",
      summaryKo: "Claude Code를 활용하여 단위 테스트, 통합 테스트를 자동으로 생성하는 방법",
      summaryEn: "Use Claude Code to automatically generate unit and integration tests for your codebase.",
      readTimeMins: 15,
      publishedAt: new Date("2026-01-10T09:00:00Z"),
    },
    {
      slug: "advanced-prompt-patterns",
      contentType: "article",
      status: "published",
      difficultyLevel: "advanced",
      authorId: adminId,
      categoryId: catMap["prompt-engineering"],
      titleKo: "고급 프롬프트 패턴: Claude Code 마스터하기",
      titleEn: "Advanced Prompt Patterns: Mastering Claude Code",
      summaryKo: "체인 오브 스로트, 역할 기반 프롬프팅 등 고급 기법을 다룹니다.",
      summaryEn: "Covers advanced techniques including chain-of-thought, role-based prompting, and structured output patterns.",
      readTimeMins: 20,
      isFeatured: false,
      publishedAt: new Date("2026-01-20T09:00:00Z"),
    },
    {
      slug: "security-scanning-draft",
      contentType: "tip",
      status: "draft",
      difficultyLevel: "advanced",
      authorId: contribId,
      categoryId: catMap["security"],
      titleKo: "Claude Code 보안 스캔 설정 [초안]",
      titleEn: "Setting Up Security Scanning with Claude Code [Draft]",
      summaryKo: "보안 취약점 스캔을 CI/CD 파이프라인에 통합하는 방법",
      summaryEn: "Integrating security vulnerability scanning into your CI/CD pipeline with Claude Code.",
      readTimeMins: 10,
    },
  ];

  const insertedEntries = await db
    .insert(knowledgeEntries)
    .values(knowledgeData)
    .onConflictDoNothing()
    .returning({ id: knowledgeEntries.id, slug: knowledgeEntries.slug });

  const entryMap = Object.fromEntries(
    insertedEntries.map((e) => [e.slug, e.id]),
  );
  console.log(`    Inserted ${insertedEntries.length} knowledge entries`);

  // Attach tags to entries
  const entryTagLinks = [];
  if (entryMap["claude-code-getting-started"] && tagMap["claude-code"] && tagMap["beginners"]) {
    entryTagLinks.push(
      { entryId: entryMap["claude-code-getting-started"], tagId: tagMap["claude-code"] },
      { entryId: entryMap["claude-code-getting-started"], tagId: tagMap["beginners"] },
    );
  }
  if (entryMap["claude-md-best-practices"] && tagMap["claude-code"] && tagMap["typescript"]) {
    entryTagLinks.push(
      { entryId: entryMap["claude-md-best-practices"], tagId: tagMap["claude-code"] },
      { entryId: entryMap["claude-md-best-practices"], tagId: tagMap["typescript"] },
    );
  }
  if (entryMap["testing-with-claude-code"] && tagMap["testing"]) {
    entryTagLinks.push(
      { entryId: entryMap["testing-with-claude-code"], tagId: tagMap["testing"] },
    );
  }
  if (entryTagLinks.length > 0) {
    await db
      .insert(knowledgeEntryTags)
      .values(entryTagLinks)
      .onConflictDoNothing();
  }

  // ----------------------------------------------------------
  // 5. Skills (5 sample skills)
  // ----------------------------------------------------------

  console.log("  Inserting skills...");

  const now = new Date();

  const skillData: NewSkill[] = [
    {
      slug: "deer-deep-research",
      authorId: adminId,
      categoryId: catMap["workflows"],
      name: "deer-deep-research",
      description: "Automated deep research skill — searches the web, summarizes findings, and structures a research report.",
      currentVersion: "1.2.0",
      license: "MIT",
      status: "published",
      triggers: ["research", "조사해", "研究して", "deep research", "web search"],
      tags: ["research", "web", "automation"],
      downloads: 4820,
      stars: 312,
      forks: 45,
      weeklyDownloads: [120, 145, 130, 160, 190, 210, 180, 220, 200, 240, 260, 230],
      body: "---\nname: deer-deep-research\nversion: 1.2.0\ntriggers:\n  - research\n  - 조사해\n---\n\n# Deep Research Skill\n\nThis skill performs automated deep research using web search and summarization.\n\n## Usage\n\nTrigger with: `research [topic]`",
      contentHash: "sha256-abc123",
      securityPassed: true,
      securityRiskScore: 0,
      securityScannedAt: now,
      publishedAt: new Date("2025-11-01"),
    },
    {
      slug: "deer-github-research",
      authorId: adminId,
      categoryId: catMap["workflows"],
      name: "deer-github-research",
      description: "Analyze GitHub repositories — read code structure, issues, PRs, and generate a comprehensive summary.",
      currentVersion: "1.0.3",
      license: "MIT",
      status: "published",
      triggers: ["github research", "analyze repo", "리포지토리 분석"],
      tags: ["github", "research", "code-analysis"],
      downloads: 2100,
      stars: 178,
      forks: 22,
      weeklyDownloads: [60, 75, 80, 90, 85, 100, 95, 110, 105, 120, 115, 130],
      body: "---\nname: deer-github-research\nversion: 1.0.3\n---\n\n# GitHub Research Skill\n\nAnalyzes any GitHub repository given its URL.",
      contentHash: "sha256-def456",
      securityPassed: true,
      securityRiskScore: 0,
      securityScannedAt: now,
      publishedAt: new Date("2025-11-15"),
    },
    {
      slug: "frontend-design",
      authorId: contribId,
      categoryId: catMap["frontend"],
      name: "frontend-design",
      description: "UI component generation skill — builds React/Next.js components from design descriptions or Figma references.",
      currentVersion: "2.1.0",
      license: "MIT",
      status: "published",
      triggers: ["design component", "build ui", "컴포넌트 만들어", "UIを作って"],
      tags: ["react", "nextjs", "ui", "design"],
      downloads: 3450,
      stars: 256,
      forks: 38,
      weeklyDownloads: [90, 100, 110, 105, 115, 120, 130, 125, 140, 135, 150, 145],
      body: "---\nname: frontend-design\nversion: 2.1.0\n---\n\n# Frontend Design Skill\n\nGenerates React components from natural language or Figma descriptions.",
      contentHash: "sha256-ghi789",
      securityPassed: true,
      securityRiskScore: 2,
      securityScannedAt: now,
      publishedAt: new Date("2025-10-20"),
    },
    {
      slug: "vibe-coding",
      authorId: adminId,
      categoryId: catMap["workflows"],
      name: "vibe-coding",
      description: "AI-driven development skill — builds full features from high-level descriptions with minimal back-and-forth.",
      currentVersion: "1.5.1",
      license: "MIT",
      status: "published",
      triggers: ["vibe code", "build feature", "기능 만들어", "featureを作って"],
      tags: ["full-stack", "ai-driven", "rapid-dev"],
      downloads: 5900,
      stars: 440,
      forks: 67,
      weeklyDownloads: [150, 170, 185, 200, 195, 210, 225, 240, 230, 250, 260, 280],
      body: "---\nname: vibe-coding\nversion: 1.5.1\n---\n\n# Vibe Coding Skill\n\nBuilds full features from high-level natural language descriptions.",
      contentHash: "sha256-jkl012",
      securityPassed: true,
      securityRiskScore: 1,
      securityScannedAt: now,
      publishedAt: new Date("2025-10-01"),
    },
    {
      slug: "auto-mode",
      authorId: adminId,
      categoryId: catMap["workflows"],
      name: "auto-mode",
      description: "Permission management skill — configures Claude Code permissions and auto-approval settings for your project.",
      currentVersion: "1.0.0",
      license: "MIT",
      status: "draft",
      triggers: ["auto mode", "권한 설정", "自動モード"],
      tags: ["permissions", "configuration", "security"],
      downloads: 0,
      stars: 0,
      forks: 0,
      weeklyDownloads: [],
      body: "---\nname: auto-mode\nversion: 1.0.0\n---\n\n# Auto Mode Skill\n\nConfigures Claude Code permissions and auto-approval settings.",
      contentHash: "sha256-mno345",
    },
  ];

  const insertedSkills = await db
    .insert(skills)
    .values(skillData)
    .onConflictDoNothing()
    .returning({ id: skills.id, slug: skills.slug });

  const skillMap = Object.fromEntries(
    insertedSkills.map((s) => [s.slug, s.id]),
  );

  // Insert initial skill versions for published skills
  const skillVersionData = insertedSkills
    .filter((s) => ["deer-deep-research", "deer-github-research", "frontend-design", "vibe-coding"].includes(s.slug))
    .map((s) => ({
      skillId: s.id,
      version: skillData.find((d) => d.slug === s.slug)?.currentVersion ?? "1.0.0",
      body: skillData.find((d) => d.slug === s.slug)?.body ?? "",
      contentHash: skillData.find((d) => d.slug === s.slug)?.contentHash ?? "",
      changelog: "Initial release",
    }));

  if (skillVersionData.length > 0) {
    await db.insert(skillVersions).values(skillVersionData).onConflictDoNothing();
  }

  console.log(`    Inserted ${insertedSkills.length} skills`);

  // ----------------------------------------------------------
  // 6. Case Studies (3 sample entries)
  // ----------------------------------------------------------

  console.log("  Inserting case studies...");

  const caseStudyData = [
    {
      slug: "saas-startup-2x-velocity",
      authorId: contribId,
      categoryId: catMap["workflows"],
      status: "published" as const,
      titleKo: "스타트업 개발 속도 2배 향상: Claude Code 도입 사례",
      titleEn: "2x Velocity at a SaaS Startup: Claude Code Adoption Case Study",
      summaryKo: "8명 팀이 Claude Code를 도입하여 4개월 만에 스프린트 속도를 2배로 향상시킨 사례",
      summaryEn: "How an 8-person team doubled sprint velocity in 4 months by adopting Claude Code company-wide.",
      bodyKo: "## 배경\n\n저희 팀은 B2B SaaS 제품을 개발하는 8명 규모의 스타트업입니다.\n\n## 도입 과정\n\n1. 파일럿 프로그램 진행 (2명 개발자, 4주)\n2. 팀 전체 교육 및 CLAUDE.md 표준화\n3. CI/CD 파이프라인 통합\n\n## 결과\n\n- 스프린트 속도 87% 향상\n- 버그 수 43% 감소\n- 코드 리뷰 시간 60% 단축",
      teamSize: 8,
      projectDurationWeeks: 16,
      industry: "SaaS",
      techStack: ["Next.js", "TypeScript", "PostgreSQL", "Claude Code"],
      metrics: {
        velocityIncreasePct: 87,
        bugsReducedPct: 43,
        codeReviewTimeReductionPct: 60,
        developerSatisfactionScore: 9,
      },
      isFeatured: true,
      publishedAt: new Date("2026-01-05T09:00:00Z"),
    },
    {
      slug: "enterprise-migration-success",
      authorId: adminId,
      categoryId: catMap["architecture"],
      status: "published" as const,
      titleKo: "레거시 마이그레이션: Claude Code와 함께한 6개월",
      titleEn: "Legacy Migration: 6 Months with Claude Code",
      summaryKo: "레거시 PHP 모놀리스를 마이크로서비스로 마이그레이션하는 과정에서 Claude Code가 미친 영향",
      summaryEn: "How Claude Code accelerated a legacy PHP monolith to microservices migration.",
      teamSize: 15,
      projectDurationWeeks: 24,
      industry: "FinTech",
      techStack: ["PHP", "Go", "Kubernetes", "Claude Code"],
      metrics: {
        velocityIncreasePct: 55,
        timeSavedHrsWeek: 40,
        testCoverageIncreasePct: 35,
      },
      publishedAt: new Date("2025-12-20T09:00:00Z"),
    },
    {
      slug: "solo-developer-toolkit",
      authorId: contribId,
      categoryId: catMap["workflows"],
      status: "draft" as const,
      titleKo: "솔로 개발자의 Claude Code 활용 전략 [초안]",
      titleEn: "Claude Code Strategy for Solo Developers [Draft]",
      summaryKo: "1인 개발자가 Claude Code로 팀 수준의 생산성을 달성하는 방법",
      summaryEn: "How a solo developer achieved team-level productivity using Claude Code.",
      teamSize: 1,
      projectDurationWeeks: 52,
      industry: "Indie Dev",
      techStack: ["React", "Python", "Claude Code"],
      metrics: {
        velocityIncreasePct: 200,
        timeSavedHrsWeek: 20,
      },
    },
  ];

  const insertedCaseStudies = await db
    .insert(caseStudies)
    .values(caseStudyData)
    .onConflictDoNothing()
    .returning({ id: caseStudies.id, slug: caseStudies.slug });

  console.log(`    Inserted ${insertedCaseStudies.length} case studies`);

  // ----------------------------------------------------------
  // 7. Achievements (8 from the reputation engine)
  // ----------------------------------------------------------

  console.log("  Inserting achievements...");

  const achievementData: NewAchievement[] = [
    {
      slug: "first-contribution",
      nameKey: "achievements.firstContribution.name",
      descriptionKey: "achievements.firstContribution.description",
      iconName: "star",
      category: "contribution",
      tier: "bronze",
      requiredValue: 1,
      isSecret: false,
    },
    {
      slug: "knowledge-author",
      nameKey: "achievements.knowledgeAuthor.name",
      descriptionKey: "achievements.knowledgeAuthor.description",
      iconName: "book-open",
      category: "contribution",
      tier: "silver",
      requiredValue: 10,
      isSecret: false,
    },
    {
      slug: "skill-publisher",
      nameKey: "achievements.skillPublisher.name",
      descriptionKey: "achievements.skillPublisher.description",
      iconName: "package",
      category: "contribution",
      tier: "silver",
      requiredValue: 3,
      isSecret: false,
    },
    {
      slug: "quality-writer",
      nameKey: "achievements.qualityWriter.name",
      descriptionKey: "achievements.qualityWriter.description",
      iconName: "award",
      category: "quality",
      tier: "gold",
      requiredValue: 100,
      isSecret: false,
    },
    {
      slug: "community-helper",
      nameKey: "achievements.communityHelper.name",
      descriptionKey: "achievements.communityHelper.description",
      iconName: "users",
      category: "social",
      tier: "bronze",
      requiredValue: 50,
      isSecret: false,
    },
    {
      slug: "trending-author",
      nameKey: "achievements.trendingAuthor.name",
      descriptionKey: "achievements.trendingAuthor.description",
      iconName: "trending-up",
      category: "milestone",
      tier: "gold",
      requiredValue: 1,
      isSecret: false,
    },
    {
      slug: "skill-maestro",
      nameKey: "achievements.skillMaestro.name",
      descriptionKey: "achievements.skillMaestro.description",
      iconName: "zap",
      category: "contribution",
      tier: "platinum",
      requiredValue: 10000,
      isSecret: false,
    },
    {
      slug: "early-adopter",
      nameKey: "achievements.earlyAdopter.name",
      descriptionKey: "achievements.earlyAdopter.description",
      iconName: "rocket",
      category: "milestone",
      tier: "gold",
      requiredValue: 1,
      isSecret: true,
    },
  ];

  const insertedAchievements = await db
    .insert(achievements)
    .values(achievementData)
    .onConflictDoNothing()
    .returning({ id: achievements.id, slug: achievements.slug });

  const achievementMap = Object.fromEntries(
    insertedAchievements.map((a) => [a.slug, a.id]),
  );
  console.log(`    Inserted ${insertedAchievements.length} achievements`);

  // Award the admin user some achievements
  const adminAchievements = ["first-contribution", "knowledge-author", "early-adopter"];
  const userAchievementData = adminAchievements
    .filter((slug) => achievementMap[slug])
    .map((slug) => ({
      userId: adminId,
      achievementId: achievementMap[slug],
      progress: achievementData.find((a) => a.slug === slug)?.requiredValue ?? 1,
      unlockedAt: new Date(),
    }));

  if (userAchievementData.length > 0) {
    await db
      .insert(userAchievements)
      .values(userAchievementData)
      .onConflictDoNothing();
  }

  // ----------------------------------------------------------
  // Summary
  // ----------------------------------------------------------

  console.log("\nSeed complete.");
  console.log("  Categories:       ", insertedCategories.length);
  console.log("  Tags:             ", insertedTags.length);
  console.log("  Users:            ", insertedUsers.length);
  console.log("  Knowledge entries:", insertedEntries.length);
  console.log("  Skills:           ", insertedSkills.length);
  console.log("  Case studies:     ", insertedCaseStudies.length);
  console.log("  Achievements:     ", insertedAchievements.length);

  // Return summary for programmatic use (e.g. test fixtures)
  return {
    categories: catMap,
    tags: tagMap,
    users: userMap,
    entries: entryMap,
    skills: skillMap,
    achievements: achievementMap,
  };
}

// ============================================================
// main() — CLI entrypoint
// ============================================================

export async function main() {
  try {
    await seed();
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

// Run if invoked directly via tsx / ts-node
if (require.main === module) {
  void main();
}
