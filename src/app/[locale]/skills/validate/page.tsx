// ============================================================
// Skill Validate Page — Server Component (public, no auth)
// "Instant value" page for first-time visitors
// ============================================================

import { getTranslations } from "next-intl/server";
import PageHeader from "@/components/PageHeader";
import ValidateOnlyForm from "@/components/ValidateOnlyForm";

interface PageProps {
  params: Promise<{ locale: string }>;
}

function ShieldCheckIcon() {
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
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

export default async function ValidateSkillPage({ params }: PageProps) {
  await params;

  const t = await getTranslations("skills");

  return (
    <div>
      <PageHeader
        title={t("validate.title")}
        subtitle={t("validate.subtitle")}
        gradient="from-teal-600 via-cyan-600 to-blue-600"
        icon={<ShieldCheckIcon />}
      />

      <div className="mx-auto max-w-3xl space-y-8">
        {/* Explainer card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <p className="text-sm text-(--text-2)">{t("validate.explainer")}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-(--text-2)">
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              {t("validate.features.noAuth")}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              {t("validate.features.noSave")}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              {t("validate.features.instant")}
            </span>
          </div>
        </div>

        {/* Validate-only form (no publish button) */}
        <ValidateOnlyForm />
      </div>
    </div>
  );
}
