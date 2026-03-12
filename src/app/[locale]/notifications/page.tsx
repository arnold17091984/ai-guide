import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import NotificationsClient from "./NotificationsClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "notifications" });
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}`);
  }

  const t = await getTranslations("notifications");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <NotificationsClient
        userId={user.id}
        translations={{
          title: t("title"),
          subtitle: t("subtitle"),
          markAllRead: t("markAllRead"),
          noNotifications: t("noNotifications"),
          unread: t("unread"),
          deleteConfirm: t("deleteConfirm"),
          all: t("filterAll"),
          unreadFilter: t("filterUnread"),
        }}
      />
    </div>
  );
}
