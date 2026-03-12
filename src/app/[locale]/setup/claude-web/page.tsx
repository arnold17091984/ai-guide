import { useTranslations } from "next-intl";
import StepCard from "@/components/StepCard";
import ContentRenderer from "@/components/ContentRenderer";

export default function ClaudeWebPage() {
  const t = useTranslations("setup.claudeWeb");

  const steps = ["access", "signup", "chat", "tips"] as const;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t("title")}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">{t("subtitle")}</p>
      </div>

      <div className="space-y-6">
        {steps.map((step, index) => (
          <StepCard
            key={step}
            stepNumber={index + 1}
            title={t(`steps.${step}.title`)}
            description={t(`steps.${step}.description`)}
          >
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <ContentRenderer content={t(`steps.${step}.content`)} />
            </div>
          </StepCard>
        ))}
      </div>
    </div>
  );
}
