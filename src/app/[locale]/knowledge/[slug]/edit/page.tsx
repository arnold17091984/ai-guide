import { notFound } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/require-auth";
import { hasRole } from "@/lib/auth/rbac";
import { db } from "@/lib/db/client";
import { knowledgeEntries, knowledgeEntryTags } from "@/lib/db/schema/knowledge";
import { categories, tags } from "@/lib/db/schema/taxonomy";
import PageHeader from "@/components/PageHeader";
import KnowledgeEntryForm from "@/components/KnowledgeEntryForm";

// ============================================================
// Edit Knowledge Entry Page — Server Component
// ============================================================

export default async function EditKnowledgeEntryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  const user = await requireAuth();

  // Fetch the entry
  const entry = await db
    .select()
    .from(knowledgeEntries)
    .where(eq(knowledgeEntries.slug, slug))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!entry || entry.status === "archived") {
    notFound();
  }

  // Authorization: must be the author or a moderator+
  const isAuthor = entry.authorId === user.id;
  const isModerator = hasRole(user.role, "moderator");

  if (!isAuthor && !isModerator) {
    notFound();
  }

  // Fetch categories
  const categoryList = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.labelEn));

  // Fetch associated tag slugs for the entry
  const entryTagRows = await db
    .select({ slug: tags.slug })
    .from(knowledgeEntryTags)
    .innerJoin(tags, eq(knowledgeEntryTags.tagId, tags.id))
    .where(eq(knowledgeEntryTags.entryId, entry.id));

  const initialTagSlugs = entryTagRows.map((r) => r.slug).join(", ");

  return (
    <div>
      <PageHeader
        title="Edit Entry"
        subtitle={`Editing: ${entry.titleKo}`}
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
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        }
      />

      <div className="mx-auto max-w-3xl">
        <KnowledgeEntryForm
          categories={categoryList}
          locale={locale}
          entry={entry}
          initialTagSlugs={initialTagSlugs}
        />
      </div>
    </div>
  );
}
