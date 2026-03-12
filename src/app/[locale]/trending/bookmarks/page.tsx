import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import PageHeader from "@/components/PageHeader";
import { getUserBookmarks } from "@/lib/trending/actions";
import BookmarksClient from "./BookmarksClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "trending" });
  return {
    title: t("bookmarks.title"),
    description: t("bookmarks.subtitle"),
  };
}

export default async function BookmarksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}`);
  }

  const t = await getTranslations({ locale, namespace: "trending" });
  const bookmarksData = await getUserBookmarks(user.id, { limit: 20 });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={t("bookmarks.title")}
        subtitle={t("bookmarks.subtitle")}
        gradient="from-pink-500 to-purple-500"
        icon={
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-7 w-7"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        }
      />

      <BookmarksClient
        initialBookmarks={bookmarksData}
        translations={{
          empty: t("bookmarks.empty"),
          remove: t("bookmarks.remove"),
          comments: t("card.comments"),
          points: t("card.points"),
          bookmark: t("card.bookmark"),
          bookmarked: t("card.bookmarked"),
        }}
      />
    </div>
  );
}
