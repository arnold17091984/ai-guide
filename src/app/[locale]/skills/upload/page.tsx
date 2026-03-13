// ============================================================
// Skill Upload Page — Server Component
// Requires contributor+ role
// ============================================================

import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { hasRole } from "@/lib/auth/rbac";
import PageHeader from "@/components/PageHeader";
import SkillUploadForm from "@/components/SkillUploadForm";

interface PageProps {
  params: Promise<{ locale: string }>;
}

function UploadIcon() {
  return (
    <svg
      className="h-7 w-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

export default async function SkillUploadPage({ params }: PageProps) {
  await params; // resolve to trigger locale context

  // Auth gate: contributor+
  const user = await requireAuth();
  if (!hasRole(user.role, "contributor")) {
    notFound();
  }

  const t = await getTranslations("skills");

  return (
    <div>
      <PageHeader
        title={t("upload.title")}
        subtitle={t("upload.subtitle")}
        icon={<UploadIcon />}
      />

      <div className="mx-auto max-w-3xl space-y-8">
        {/* Instructions card */}
        <div className="rounded-lg border border-(--border) bg-(--bg-surface) p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-(--text-1)">
            <svg className="h-5 w-5 text-(--accent)" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
            {t("upload.formatGuide.heading")}
          </h2>
          <div className="space-y-3 text-sm text-(--text-2)">
            <p>{t("upload.formatGuide.intro")}</p>
            <pre className="overflow-x-auto rounded-lg border border-(--border) bg-(--bg-elevated) p-4 font-mono text-xs text-(--text-1) leading-relaxed">{`---
name: My Skill Name
description: A concise description of what this skill does.
version: 1.0.0
author: your-handle
category: workflow
triggers:
  - "trigger phrase"
  - "another trigger"
tags:
  - tag1
license: MIT
---

## What This Skill Does

Write your markdown instructions here. Claude will follow
these instructions when triggered.

\`\`\`bash
# Include examples to help users understand usage
echo "Hello from my skill!"
\`\`\``}</pre>
            <ul className="list-inside list-disc space-y-1">
              <li>{t("upload.formatGuide.rule1")}</li>
              <li>{t("upload.formatGuide.rule2")}</li>
              <li>{t("upload.formatGuide.rule3")}</li>
              <li>{t("upload.formatGuide.rule4")}</li>
            </ul>
          </div>
        </div>

        {/* Upload form */}
        <SkillUploadForm showPublish={true} />
      </div>
    </div>
  );
}
