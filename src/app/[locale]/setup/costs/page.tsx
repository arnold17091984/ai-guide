import { useTranslations } from "next-intl";
import TipBox from "@/components/TipBox";

const sectionKeys = [
  "contextWindow",
  "reduceTokens",
  "teamCosts",
  "costTips",
] as const;

const sectionIcons: Record<string, React.ReactNode> = {
  contextWindow: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
    </svg>
  ),
  reduceTokens: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
  ),
  teamCosts: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  costTips: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
};

const sectionColors: Record<string, string> = {
  contextWindow: "from-blue-500 to-cyan-400",
  reduceTokens: "from-green-500 to-emerald-400",
  teamCosts: "from-purple-500 to-indigo-500",
  costTips: "from-amber-500 to-yellow-400",
};

interface ModelInfo {
  name: string;
  speed: string;
  cost: string;
  best: string;
  color: string;
}

export default function CostsPage() {
  const t = useTranslations("setup.costs");
  const models = t.raw("models") as ModelInfo[];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t("title")}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">{t("subtitle")}</p>
      </div>

      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          {t("modelsTitle")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {models.map((model, i) => (
            <div
              key={i}
              className={`rounded-lg border p-4 ${model.color}`}
            >
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {model.name}
              </h3>
              <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p>{model.speed}</p>
                <p>{model.cost}</p>
              </div>
              <p className="mt-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                {model.best}
              </p>
            </div>
          ))}
        </div>
        <TipBox variant="info">{t("modelsTip")}</TipBox>
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
