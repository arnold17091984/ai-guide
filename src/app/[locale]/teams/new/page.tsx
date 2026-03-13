import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth/require-auth";
import PageHeader from "@/components/PageHeader";
import CreateTeamForm from "./CreateTeamForm";

// ---------------------------------------------------------------------------
// Icon
// ---------------------------------------------------------------------------

function PlusIcon() {
  return (
    <svg
      className="h-7 w-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function CreateTeamPage({ params }: PageProps) {
  const { locale } = await params;

  // Auth guard — redirects to /auth/login if not authenticated
  await requireAuth();

  const t = await getTranslations("teams");

  return (
    <>
      <PageHeader
        title={t("createTeam")}
        subtitle={t("subtitle")}
        gradient="from-cyan-600 via-blue-500 to-indigo-500"
        icon={<PlusIcon />}
      />

      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-(--border) bg-white/70 p-8 shadow-md backdrop-blur-xl dark:bg-white/5">
          <CreateTeamForm
            locale={locale}
            labels={{
              teamName: t("teamName"),
              description: t("description"),
              publicTeam: t("publicTeam"),
              publicTeamHint: t("publicTeamHint"),
              privateTeam: t("privateTeam"),
              privateTeamHint: t("privateTeamHint"),
              creating: t("creating"),
              createTeam: t("createTeam"),
              cancel: t("cancel"),
            }}
          />
        </div>
      </div>
    </>
  );
}
