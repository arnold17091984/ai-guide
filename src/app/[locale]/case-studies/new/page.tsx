import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { getCaseStudyCategories } from "@/lib/db/queries/case-studies";
import PageHeader from "@/components/PageHeader";
import CaseStudyForm from "./CaseStudyForm";

export const metadata: Metadata = {
  title: "New Case Study",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function NewCaseStudyPage({ params }: PageProps) {
  // Auth guard — redirects to login if not authenticated
  await requireAuth();

  const { locale } = await params;
  const localeKey = (locale as "ko" | "en" | "ja") ?? "ko";

  const [t, categories] = await Promise.all([
    getTranslations("caseStudies"),
    getCaseStudyCategories(localeKey),
  ]);

  const categoryOptions = categories.map((cat) => ({
    id: cat.id,
    slug: cat.slug,
    label: cat.label,
  }));

  return (
    <div className="min-h-screen">
      <PageHeader
        title={t("newCaseStudy")}
        subtitle={t("subtitle")}
        gradient="from-violet-600 via-purple-600 to-fuchsia-600"
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-7 w-7"
            aria-hidden="true"
          >
            <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
          </svg>
        }
      />

      <div className="mx-auto max-w-3xl">
        <CaseStudyForm categories={categoryOptions} />
      </div>
    </div>
  );
}
