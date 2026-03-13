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
        
      />

      <div className="space-y-6">
        {steps.map((step, index) => (
          <StepCard
            key={step}
            stepNumber={index + 1}
            title={t(`steps.${step}.title`)}
            description={t(`steps.${step}.description`)}
          >
            <div className="rounded-lg border border-(--border) bg-(--bg-surface) p-4">
              <ContentRenderer content={t(`steps.${step}.content`)} />
            </div>
          </StepCard>
        ))}
      </div>
    </div>
  );
}
