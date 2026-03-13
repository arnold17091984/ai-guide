import { useTranslations } from "next-intl";
import PageHeader from "@/components/PageHeader";
import CompareBox from "@/components/CompareBox";

const sectionKeys = [
  "verification",
  "exploreFirst",
  "specificPrompts",
  "sessionManagement",
  "commonMistakes",
] as const;

const sectionIcons: Record<string, React.ReactNode> = {
  verification: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  exploreFirst: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  specificPrompts: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  ),
  sessionManagement: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  commonMistakes: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};


export default function BestPracticesPage() {
  const t = useTranslations("setup.bestPractices");

  return (
    <div>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        
      />

      <div className="mb-8 rounded-lg border border-(--border) bg-(--bg-surface) p-6">
        <h2 className="mb-3 text-lg font-semibold text-(--text-1)">
          {t("compareTitle")}
        </h2>
        <CompareBox
          bad={t("compareBad")}
          good={t("compareGood")}
          badLabel={t("compareBadLabel")}
          goodLabel={t("compareGoodLabel")}
        />
      </div>

      <div className="space-y-6">
        {sectionKeys.map((key) => {
          const items = t.raw(`sections.${key}.items`) as string[];
          return (
            <div
              key={key}
              className="rounded-lg border border-(--border) bg-(--bg-surface) p-6"
            >
              <div className="mb-4 flex items-start gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-(--bg-elevated) text-(--text-2)"
                >
                  {sectionIcons[key]}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-(--text-1)">
                    {t(`sections.${key}.title`)}
                  </h2>
                  <p className="mt-1 text-sm text-(--text-2)">
                    {t(`sections.${key}.description`)}
                  </p>
                </div>
              </div>
              <ul className="ml-16 space-y-3">
                {items.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-sm bg-(--accent)" />
                    <span className="whitespace-pre-line text-sm leading-relaxed text-(--text-2)">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
