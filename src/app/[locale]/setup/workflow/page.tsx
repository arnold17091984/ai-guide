import { useTranslations } from "next-intl";
import FlowChart from "@/components/FlowChart";
import TipBox from "@/components/TipBox";

const sectionKeys = [
  "planMode",
  "subagent",
  "verification",
  "taskManagement",
  "corePrinciples",
] as const;

const sectionIcons: Record<string, React.ReactNode> = {
  planMode: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  subagent: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  verification: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  taskManagement: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  ),
  corePrinciples: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
};

const sectionColors: Record<string, string> = {
  planMode: "from-blue-500 to-cyan-400",
  subagent: "from-purple-500 to-indigo-500",
  verification: "from-green-500 to-emerald-400",
  taskManagement: "from-orange-500 to-amber-400",
  corePrinciples: "from-rose-500 to-pink-400",
};

export default function WorkflowPage() {
  const t = useTranslations("setup.workflow");

  const flowSteps = t.raw("flow") as { label: string; color: string }[];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t("title")}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">{t("subtitle")}</p>
      </div>

      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-2 text-center text-lg font-semibold text-gray-900 dark:text-white">
          {t("flowTitle")}
        </h2>
        <FlowChart steps={flowSteps} />
        <TipBox variant="info">{t("flowTip")}</TipBox>
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
