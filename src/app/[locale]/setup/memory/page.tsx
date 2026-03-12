import { useTranslations } from "next-intl";
import PageHeader from "@/components/PageHeader";
import TipBox from "@/components/TipBox";

const sectionKeys = [
  "overview",
  "claudeMd",
  "claudeMdContent",
  "autoMemory",
  "rules",
] as const;

const sectionIcons: Record<string, React.ReactNode> = {
  overview: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  claudeMd: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  claudeMdContent: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  autoMemory: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  rules: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  ),
};

const sectionColors: Record<string, string> = {
  overview: "from-teal-500 to-cyan-400",
  claudeMd: "from-blue-500 to-indigo-500",
  claudeMdContent: "from-blue-500 to-cyan-400",
  autoMemory: "from-green-500 to-emerald-400",
  rules: "from-orange-500 to-amber-400",
};

export default function MemoryPage() {
  const t = useTranslations("setup.memory");

  return (
    <div>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        gradient="from-teal-500 to-cyan-400"
      />

      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          {t("fileStructureTitle")}
        </h2>
        <div className="rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-100 dark:bg-gray-800">
          <pre className="whitespace-pre">{t("fileStructure")}</pre>
        </div>
        <TipBox variant="tip">{t("fileStructureTip")}</TipBox>
      </div>

      <div className="space-y-6">
        {sectionKeys.map((key) => {
          const items = t.raw(`sections.${key}.items`) as string[];
          return (
            <div
              key={key}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="mb-4 flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${sectionColors[key]} text-white`}
                >
                  {sectionIcons[key]}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t(`sections.${key}.title`)}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {t(`sections.${key}.description`)}
                  </p>
                </div>
              </div>
              <ul className="ml-16 space-y-3">
                {items.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    <span className="whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-gray-300">
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
