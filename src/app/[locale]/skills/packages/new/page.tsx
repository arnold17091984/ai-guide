import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { listSkills } from "@/lib/db/queries/skills";
import PageHeader from "@/components/PageHeader";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import PackageForm from "./PackageForm";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ edit?: string }>;
}

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function PackageIconLg() {
  return (
    <svg
      className="h-7 w-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16.5 9.4l-9-5.19" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CreatePackagePage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const _sp = await searchParams;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/skills/packages`);
  }

  const t = await getTranslations("skillPackages");

  // Load available skills for the selector (graceful fallback when DB is unavailable)
  let availableSkills: Awaited<ReturnType<typeof listSkills>>["items"] = [];
  try {
    ({ items: availableSkills } = await listSkills({ pageSize: 100 }));
  } catch {
    // DB not available — empty skill list
  }

  const skillOptions = availableSkills.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    description: s.description,
    currentVersion: s.currentVersion,
    stars: s.stars,
    downloads: s.downloads,
  }));

  return (
    <>
      <PageHeader
        title={t("create.title")}
        subtitle={t("create.subtitle")}
        gradient="from-emerald-600 via-teal-600 to-cyan-600"
        icon={<PackageIconLg />}
      />

      <ScrollFadeIn>
        <PackageForm
          locale={locale}
          availableSkills={skillOptions}
          labels={{
            name: t("form.name"),
            namePlaceholder: t("form.namePlaceholder"),
            description: t("form.description"),
            descriptionPlaceholder: t("form.descriptionPlaceholder"),
            tags: t("form.tags"),
            tagsPlaceholder: t("form.tagsPlaceholder"),
            addSkills: t("form.addSkills"),
            searchSkills: t("form.searchSkills"),
            selectedSkills: t("form.selectedSkills"),
            noSkillsSelected: t("form.noSkillsSelected"),
            submit: t("form.submit"),
            creating: t("form.creating"),
          }}
        />
      </ScrollFadeIn>
    </>
  );
}
