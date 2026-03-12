import { requireAuth } from "@/lib/auth/require-auth";
import { db } from "@/lib/db/client";
import { categories } from "@/lib/db/schema/taxonomy";
import { hasRole } from "@/lib/auth/rbac";
import { notFound } from "next/navigation";
import { asc } from "drizzle-orm";
import PageHeader from "@/components/PageHeader";
import KnowledgeEntryForm from "@/components/KnowledgeEntryForm";

// ============================================================
// New Knowledge Entry Page — Server Component
// ============================================================

export default async function NewKnowledgeEntryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Require at least contributor role
  const user = await requireAuth();
  if (!hasRole(user.role, "contributor")) {
    notFound();
  }

  // Fetch categories for the select field
  const categoryList = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.labelEn));

  return (
    <div>
      <PageHeader
        title="New Knowledge Entry"
        subtitle="Share your knowledge with the community. The Korean title and body are required; other locales are optional."
        gradient="from-blue-500 to-cyan-500"
        icon={
          <svg
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
        }
      />

      <div className="mx-auto max-w-3xl">
        <KnowledgeEntryForm categories={categoryList} locale={locale} />
      </div>
    </div>
  );
}
