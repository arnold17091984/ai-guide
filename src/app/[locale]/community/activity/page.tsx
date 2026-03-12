import { getTranslations } from "next-intl/server";
import ActivityFeedClient from "./ActivityFeedClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "activity" });
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function ActivityFeedPage() {
  const t = await getTranslations("activity");
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <ActivityFeedClient
        translations={{
          title: t("title"),
          subtitle: t("subtitle"),
          all: t("filters.all"),
          entries: t("filters.entries"),
          skills: t("filters.skills"),
          social: t("filters.social"),
          loadMore: t("loadMore"),
          noActivity: t("noActivity"),
        }}
      />
    </div>
  );
}
