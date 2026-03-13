import { useTranslations } from "next-intl";
import PageHeader from "@/components/PageHeader";
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


export default function WorkflowPage() {
  const t = useTranslations("setup.workflow");

  const flowSteps = t.raw("flow") as { label: string; color: string }[];

  return (
    <div>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        
      />

      <div className="mb-8 rounded-lg border border-(--border) bg-(--bg-surface) p-6">
        <h2 className="mb-2 text-center text-lg font-semibold text-(--text-1)">
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
