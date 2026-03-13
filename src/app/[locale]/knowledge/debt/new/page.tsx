import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth/require-auth";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import PageHeader from "@/components/PageHeader";
import NewDebtFormClient from "./NewDebtFormClient";

// ============================================================
// Types
// ============================================================

interface PageProps {
  params: Promise<{ locale: string }>;
}

// ============================================================
// Icon
// ============================================================

function ReportIcon() {
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

// ============================================================
// Page
// ============================================================

export default async function NewDebtPage({ params }: PageProps) {
  const { locale } = await params;
  await requireAuth();

  const t = await getTranslations({ locale, namespace: "knowledgeDebt" });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={t("newItem.title")}
        subtitle={t("newItem.subtitle")}
        gradient="from-amber-500 to-orange-500"
        icon={<ReportIcon />}
      />

      <ScrollFadeIn>
        <NewDebtFormClient
          locale={locale}
          translations={{
            titleLabel: t("form.titleLabel"),
            titlePlaceholder: t("form.titlePlaceholder"),
            descriptionLabel: t("form.descriptionLabel"),
            descriptionPlaceholder: t("form.descriptionPlaceholder"),
            categoryLabel: t("form.categoryLabel"),
            priorityLabel: t("form.priorityLabel"),
            tagsLabel: t("form.tagsLabel"),
            tagsPlaceholder: t("form.tagsPlaceholder"),
            relatedEntryLabel: t("form.relatedEntryLabel"),
            relatedEntryPlaceholder: t("form.relatedEntryPlaceholder"),
            submit: t("form.submit"),
            preview: t("form.preview"),
            backToEdit: t("form.backToEdit"),
            categoryMissing: t("categories.missing"),
            categoryOutdated: t("categories.outdated"),
            categoryIncomplete: t("categories.incomplete"),
            categoryInaccurate: t("categories.inaccurate"),
            categoryMissingDesc: t("categories.missingDesc"),
            categoryOutdatedDesc: t("categories.outdatedDesc"),
            categoryIncompleteDesc: t("categories.incompleteDesc"),
            categoryInaccurateDesc: t("categories.inaccurateDesc"),
            priorityCritical: t("priority.critical"),
            priorityHigh: t("priority.high"),
            priorityMedium: t("priority.medium"),
            priorityLow: t("priority.low"),
            previewTitle: t("form.previewTitle"),
            submitting: t("form.submitting"),
            errorTitle: t("form.errorTitle"),
          }}
        />
      </ScrollFadeIn>
    </div>
  );
}
