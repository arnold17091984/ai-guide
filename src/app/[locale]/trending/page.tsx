import { getTranslations } from "next-intl/server";
import PageHeader from "@/components/PageHeader";
import { getTrendingFeed, getTrendingStats } from "@/lib/trending/actions";
import TrendingFeedClient from "./TrendingFeedClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "trending" });
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function TrendingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "trending" });

  let initialItems: Awaited<ReturnType<typeof getTrendingFeed>> = [];
  let stats: Awaited<ReturnType<typeof getTrendingStats>> = { itemCounts: {}, sources: [], totalItems: 0 };
  try {
    [initialItems, stats] = await Promise.all([
      getTrendingFeed({ limit: 12, sortBy: "score" }),
      getTrendingStats(),
    ]);
  } catch {
    // DB not available — render empty state
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        gradient="from-rose-500 to-orange-500"
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
              d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18a3.75 3.75 0 00.495-7.468 5.99 5.99 0 00-1.925 3.547 5.975 5.975 0 01-2.133-1.001A3.75 3.75 0 0012 18z"
            />
          </svg>
        }
      />

      <TrendingFeedClient
        initialItems={initialItems}
        itemCounts={stats.itemCounts}
        translations={{
          sourcesAll: t("sources.all"),
          sourcesGithub: t("sources.github"),
          sourcesHackernews: t("sources.hackernews"),
          sourcesReddit: t("sources.reddit"),
          sourcesTwitter: t("sources.twitter"),
          sourcesProducthunt: t("sources.producthunt"),
          sortHot: t("sort.hot"),
          sortNew: t("sort.new"),
          loadMore: t("loadMore"),
          noResults: t("noResults"),
          cardComments: t("card.comments"),
          cardPoints: t("card.points"),
          cardBookmark: t("card.bookmark"),
          cardBookmarked: t("card.bookmarked"),
        }}
      />
    </div>
  );
}
