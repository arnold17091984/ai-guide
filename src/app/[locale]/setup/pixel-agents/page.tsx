import { useTranslations } from "next-intl";
import PageHeader from "@/components/PageHeader";
import StepCard from "@/components/StepCard";
import TipBox from "@/components/TipBox";
import CodeBlock from "@/components/CodeBlock";
import GuideImage from "@/components/GuideImage";

const featureKeys = [
  "visualMonitoring",
  "customization",
  "subAgents",
  "security",
] as const;

const featureIcons: Record<string, React.ReactNode> = {
  visualMonitoring: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  customization: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  subAgents: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  security: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
};


export default function PixelAgentsPage() {
  const t = useTranslations("setup.pixelAgents");
  const shortcuts = t.raw("shortcuts") as { action: string; key: string }[];

  return (
    <div>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        
      />

      <div className="mb-8 rounded-lg border border-(--border) bg-(--bg-surface) p-6">
        <h2 className="mb-3 text-lg font-semibold text-(--text-1)">
          {t("overviewTitle")}
        </h2>
        <GuideImage
          src="/images/setup/pixel-agents-banner.png"
          alt="Pixel Agents banner"
          caption={t("bannerCaption")}
        />
        <p className="text-sm leading-relaxed text-(--text-2)">
          {t("overviewDescription")}
        </p>
        <TipBox variant="info">{t("overviewTip")}</TipBox>
      </div>

      <div className="mb-8 rounded-lg border border-(--border) bg-(--bg-surface) p-6">
        <h2 className="mb-3 text-lg font-semibold text-(--text-1)">
          {t("previewTitle")}
        </h2>
        <GuideImage
          src="/images/setup/pixel-agents-screenshot.jpg"
          alt="Pixel Agents virtual office"
          caption={t("previewCaption")}
        />
        <div className="mt-4 flex justify-center">
          <GuideImage
            src="/images/setup/pixel-agents-characters.png"
            alt="Pixel Agents characters"
            caption={t("charactersCaption")}
          />
        </div>
      </div>

      <div className="mb-8 space-y-4">
        <h2 className="text-xl font-semibold text-(--text-1)">
          {t("stepsTitle")}
        </h2>

        <StepCard
          stepNumber={1}
          title={t("steps.install.title")}
          description={t("steps.install.description")}
        >
          <p className="text-sm text-(--text-2)">
            {t("steps.install.detail")}
          </p>
          <CodeBlock code={t("steps.install.command")} />
        </StepCard>

        <StepCard
          stepNumber={2}
          title={t("steps.claudeInstall.title")}
          description={t("steps.claudeInstall.description")}
        >
          <CodeBlock code="npm install -g @anthropic-ai/claude-code" />
        </StepCard>

        <StepCard
          stepNumber={3}
          title={t("steps.claudeRun.title")}
          description={t("steps.claudeRun.description")}
        >
          <CodeBlock code="claude" />
        </StepCard>

        <StepCard
          stepNumber={4}
          title={t("steps.openTerminal.title")}
          description={t("steps.openTerminal.description")}
        >
          <CodeBlock code="claude" />
          <TipBox variant="tip">{t("steps.openTerminal.tip")}</TipBox>
        </StepCard>

        <StepCard
          stepNumber={5}
          title={t("steps.showPanel.title")}
          description={t("steps.showPanel.description")}
        >
          <div className="rounded-lg bg-(--bg-base) p-3 font-mono text-sm text-(--text-1)">
            <p>{t("steps.showPanel.command")}</p>
          </div>
          <TipBox variant="info">{t("steps.showPanel.detail")}</TipBox>
        </StepCard>
      </div>

      <div className="mb-8 rounded-lg border border-(--border) bg-(--bg-surface) p-6">
        <h2 className="mb-4 text-lg font-semibold text-(--text-1)">
          {t("shortcutsTitle")}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--border)">
                <th className="pb-3 pr-4 text-left font-semibold text-(--text-1)">
                  {t("shortcutsAction")}
                </th>
                <th className="pb-3 text-left font-semibold text-(--text-1)">
                  {t("shortcutsKey")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border)">
              {shortcuts.map((item, i) => (
                <tr key={i}>
                  <td className="py-2.5 pr-4 text-(--text-2)">
                    {item.action}
                  </td>
                  <td className="py-2.5">
                    <kbd className="rounded-md border border-(--border) bg-(--bg-elevated) px-2 py-0.5 font-mono text-xs text-(--text-1)">
                      {item.key}
                    </kbd>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-8 space-y-6">
        <h2 className="text-xl font-semibold text-(--text-1)">
          {t("featuresTitle")}
        </h2>
        {featureKeys.map((key) => {
          const items = t.raw(`features.${key}.items`) as string[];
          return (
            <div
              key={key}
              className="rounded-lg border border-(--border) bg-(--bg-surface) p-6"
            >
              <div className="mb-4 flex items-start gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-(--bg-elevated) text-(--text-2)"
                >
                  {featureIcons[key]}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-(--text-1)">
                    {t(`features.${key}.title`)}
                  </h3>
                  <p className="mt-1 text-sm text-(--text-2)">
                    {t(`features.${key}.description`)}
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

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-6">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-amber-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {t("limitationsTitle")}
        </h2>
        <ul className="space-y-2">
          {(t.raw("limitations") as string[]).map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-amber-400">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
