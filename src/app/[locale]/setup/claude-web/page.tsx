import { useTranslations } from "next-intl";
import PageHeader from "@/components/PageHeader";
import StepCard from "@/components/StepCard";
import ContentRenderer from "@/components/ContentRenderer";

export default function ClaudeWebPage() {
  const t = useTranslations("setup.claudeWeb");

  const steps = ["access", "signup", "chat", "tips"] as const;

  return (
    <div>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        gradient="from-rose-400 to-orange-400"
      />

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
