import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCaseStudyBySlug, getRelatedCaseStudies } from "@/lib/db/queries/case-studies";
import { renderMarkdown } from "@/lib/markdown";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import VoteButton from "@/components/VoteButton";
import CommentSection from "@/components/CommentSection";
import { db } from "@/lib/db/client";
import { comments, votes } from "@/lib/db/schema/social";
import { eq, and, desc } from "drizzle-orm";
import { users } from "@/lib/db/schema/users";
import type { CommentWithAuthor } from "@/lib/social/comment-actions";
import Link from "next/link";

// ============================================================
// Metadata
// ============================================================

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const study = await getCaseStudyBySlug(slug, locale as "ko" | "en" | "ja");

  if (!study) return {};

  return {
    title: study.title ?? study.slug,
    description: study.summary ?? undefined,
    openGraph: study.featuredImage
      ? { images: [study.featuredImage] }
      : undefined,
  };
}

// ============================================================
// Table of Contents — extracted from h2/h3 headings in body
// ============================================================

interface TocItem {
  level: number;
  text: string;
  id: string;
}

function extractToc(markdown: string): TocItem[] {
  const headingRe = /^(#{2,3})\s+(.+)$/gm;
  const items: TocItem[] = [];
  let match: RegExpExecArray | null;

  while ((match = headingRe.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 60);

    items.push({ level, text, id });
  }

  return items;
}

// ============================================================
// Helper: format date
// ============================================================

function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

// ============================================================
// Fetch votes for a case study
// ============================================================

async function fetchVoteData(caseStudyId: string, userId: string | null) {
  // Score
  const allVotes = await db
    .select({ v: votes.value })
    .from(votes)
    .where(
      and(
        eq(votes.targetType, "case_study"),
        eq(votes.targetId, caseStudyId),
      ),
    );

  const score = allVotes.reduce((acc, r) => acc + (r.v ?? 0), 0);

  let userVote: 1 | -1 | 0 = 0;
  if (userId) {
    const row = await db
      .select({ value: votes.value })
      .from(votes)
      .where(
        and(
          eq(votes.targetType, "case_study"),
          eq(votes.targetId, caseStudyId),
          eq(votes.userId, userId),
        ),
      )
      .limit(1)
      .then((r) => r[0] ?? null);

    if (row?.value === 1 || row?.value === -1) {
      userVote = row.value as 1 | -1;
    }
  }

  return { score, userVote };
}

// ============================================================
// Fetch comments for a case study
// ============================================================

async function fetchComments(caseStudyId: string): Promise<CommentWithAuthor[]> {
  const rows = await db
    .select({
      id: comments.id,
      authorId: comments.authorId,
      parentId: comments.parentId,
      targetType: comments.targetType,
      targetId: comments.targetId,
      body: comments.body,
      isDeleted: comments.isDeleted,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      userId: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(comments)
    .leftJoin(users, eq(comments.authorId, users.id))
    .where(
      and(
        eq(comments.targetType, "case_study"),
        eq(comments.targetId, caseStudyId),
        eq(comments.isDeleted, false),
      ),
    )
    .orderBy(desc(comments.createdAt));

  return rows.map((r) => ({
    id: r.id,
    authorId: r.authorId,
    parentId: r.parentId,
    targetType: r.targetType,
    targetId: r.targetId,
    body: r.body,
    isDeleted: r.isDeleted,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    author: r.userId
      ? {
          id: r.userId,
          username: r.username ?? "",
          displayName: r.displayName,
          avatarUrl: r.avatarUrl,
        }
      : null,
  }));
}

// ============================================================
// Page
// ============================================================

export default async function CaseStudyDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const localeKey = (locale as "ko" | "en" | "ja") ?? "ko";

  const [study, user, t] = await Promise.all([
    getCaseStudyBySlug(slug, localeKey),
    getCurrentUser(),
    getTranslations("caseStudies"),
  ]);

  if (!study) notFound();

  const bodyHtml = renderMarkdown(study.body ?? "");
  const toc = extractToc(study.body ?? "");

  const [{ score, userVote }, initialComments, relatedStudies] =
    await Promise.all([
      fetchVoteData(study.id, user?.id ?? null),
      fetchComments(study.id),
      getRelatedCaseStudies({
        categoryId: study.categorySlug ? study.id : null,
        excludeSlug: slug,
        locale: localeKey,
        limit: 3,
      }),
    ]);

  const canModerate =
    user?.role === "moderator" || user?.role === "admin";

  return (
    <div className="min-h-screen">
      {/* Hero / metadata bar */}
      <div className="relative -mx-4 -mt-8 mb-12 overflow-hidden rounded-b-3xl bg-linear-to-br from-violet-600 via-purple-600 to-fuchsia-600 px-8 py-16 sm:-mx-6 lg:-mx-8">
        <div className="absolute inset-0 bg-black/10 dark:bg-black/25" />
        <div className="relative mx-auto max-w-4xl">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-sm text-white/70">
            <Link
              href={`/${locale}/case-studies`}
              className="hover:text-white transition-colors"
            >
              {t("title")}
            </Link>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-white/90 line-clamp-1">{study.title}</span>
          </nav>

          {/* Category + industry badges */}
          <div className="mb-4 flex flex-wrap gap-2">
            {study.categoryLabel && (
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                {study.categoryLabel}
              </span>
            )}
            {study.industry && (
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
                {study.industry}
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {study.title ?? study.slug}
          </h1>

          {study.summary && (
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/80">
              {study.summary}
            </p>
          )}

          {/* Metadata row */}
          <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-white/70">
            {/* Author */}
            <div className="flex items-center gap-2">
              {study.authorAvatar ? (
                <img
                  src={study.authorAvatar}
                  alt={study.authorName ?? ""}
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-white/30"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/30">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4 text-white"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
              <span className="font-medium text-white/90">
                {study.authorName ?? study.authorUsername ?? "Anonymous"}
              </span>
            </div>

            {/* Date */}
            {study.publishedAt && (
              <time dateTime={new Date(study.publishedAt).toISOString()} className="flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z"
                    clipRule="evenodd"
                  />
                </svg>
                {formatDate(study.publishedAt)}
              </time>
            )}

            {/* Team size */}
            {study.teamSize && (
              <span className="flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                {study.teamSize === 1 ? "Solo" : `${study.teamSize} people`}
              </span>
            )}

            {/* Duration */}
            {study.projectDurationWeeks && (
              <span className="flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                    clipRule="evenodd"
                  />
                </svg>
                {study.projectDurationWeeks} weeks
              </span>
            )}
          </div>

          {/* Tech stack */}
          {study.techStack && study.techStack.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {study.techStack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-md bg-white/15 px-2.5 py-1 text-xs font-mono text-white/90 backdrop-blur-sm"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main content layout */}
      <div className="mx-auto max-w-5xl">
        <div className="flex gap-10 xl:gap-16">
          {/* Article body */}
          <div className="min-w-0 flex-1">
            {/* Vote + content wrapper */}
            <div className="flex gap-6">
              {/* Vote column */}
              <div className="hidden shrink-0 pt-1 sm:block">
                <VoteButton
                  targetType="case_study"
                  targetId={study.id}
                  initialScore={score}
                  initialUserVote={userVote}
                />
              </div>

              {/* Rendered markdown */}
              <article
                className="prose-sm sm:prose max-w-none flex-1"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
            </div>

            {/* Mobile vote */}
            <div className="mt-8 flex justify-center sm:hidden">
              <VoteButton
                targetType="case_study"
                targetId={study.id}
                initialScore={score}
                initialUserVote={userVote}
              />
            </div>

            {/* Tags */}
            {study.tags && study.tags.length > 0 && (
              <div className="mt-10 flex flex-wrap gap-2 border-t border-(--border) pt-8">
                {study.tags.map((tag) => (
                  <span
                    key={tag.slug}
                    className="rounded-full border border-(--border) px-3 py-1 text-xs font-medium text-(--text-2)"
                  >
                    #{tag.label ?? tag.slug}
                  </span>
                ))}
              </div>
            )}

            {/* Comments */}
            <div className="mt-12">
              <CommentSection
                targetType="case_study"
                targetId={study.id}
                initialComments={initialComments}
                currentUserId={user?.id ?? null}
                canModerate={canModerate}
              />
            </div>
          </div>

          {/* Sidebar: ToC */}
          {toc.length > 0 && (
            <aside className="hidden w-56 shrink-0 xl:block">
              <div className="sticky top-24 rounded-2xl border border-(--border) bg-white/70 p-5 backdrop-blur-xl shadow-md dark:bg-white/5">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-(--text-2)">
                  {t("tableOfContents")}
                </p>
                <nav className="space-y-1">
                  {toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block rounded-lg py-1 text-xs leading-snug text-(--text-2) transition-colors hover:text-violet-600 dark:hover:text-violet-400 ${
                        item.level === 3 ? "pl-4" : "pl-0 font-medium"
                      }`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}
        </div>

        {/* Related case studies */}
        {relatedStudies.length > 0 && (
          <section className="mt-16 border-t border-(--border) pt-12">
            <h2 className="mb-6 text-xl font-bold text-(--text-1)">
              {t("relatedStudies")}
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedStudies.map((related) => (
                <Link
                  key={related.id}
                  href={`/${locale}/case-studies/${related.slug}`}
                  className="group flex flex-col rounded-2xl border border-(--border) bg-white/70 p-5 shadow-sm backdrop-blur-xl transition-all duration-200 hover:border-violet-300/50 hover:shadow-md dark:bg-white/5"
                >
                  <span className="mb-2 text-xs font-medium text-(--text-2)">
                    {related.industry}
                  </span>
                  <span className="text-sm font-semibold leading-snug text-(--text-1) line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {related.title ?? related.slug}
                  </span>
                  {related.summary && (
                    <span className="mt-2 text-xs leading-relaxed text-(--text-2) line-clamp-2">
                      {related.summary}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
