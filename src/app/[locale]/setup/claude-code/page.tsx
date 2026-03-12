import { useTranslations } from "next-intl";
import PageHeader from "@/components/PageHeader";
import StepCard from "@/components/StepCard";
import OsSelector from "@/components/OsSelector";
import ContentRenderer from "@/components/ContentRenderer";
import GuideImage from "@/components/GuideImage";

export default function ClaudeCodePage() {
  const t = useTranslations("setup.claudeCode");

  return (
    <div>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        gradient="from-blue-500 to-cyan-600"
      />

      <div className="space-y-6">
        {/* Step 1: VS Code Extension */}
        <StepCard
          stepNumber={1}
          title={t("steps.install.title")}
          description={t("steps.install.description")}
        >
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <ContentRenderer content={t("steps.install.content")} />
          </div>
          <GuideImage
            src="/images/setup/claude-code-extension.jpeg"
            alt="Claude Code extension in VS Code"
            caption={t("steps.install.imageCaption")}
          />
        </StepCard>

        {/* Step 2: CLI Prerequisites (OS-specific) */}
        <StepCard
          stepNumber={2}
          title={t("steps.cliPrereq.title")}
          description={t("steps.cliPrereq.description")}
        >
          <OsSelector
            windowsContent={t("steps.cliPrereq.windows")}
            macosContent={t("steps.cliPrereq.macos")}
          />
        </StepCard>

        {/* Step 3: CLI Install */}
        <StepCard
          stepNumber={3}
          title={t("steps.cliInstall.title")}
          description={t("steps.cliInstall.description")}
        >
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <ContentRenderer content={t("steps.cliInstall.content")} />
          </div>
          <GuideImage
            src="/images/setup/claude-code-welcome.jpeg"
            alt="Claude Code welcome screen in terminal"
            caption={t("steps.cliInstall.imageCaption")}
          />
        </StepCard>

        {/* Step 4: CLI Usage */}
        <StepCard
          stepNumber={4}
          title={t("steps.cliUsage.title")}
          description={t("steps.cliUsage.description")}
        >
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <ContentRenderer content={t("steps.cliUsage.content")} />
          </div>
          <GuideImage
            src="/images/setup/claude-code-dashboard.jpeg"
            alt="Claude Code dashboard after login"
            caption={t("steps.cliUsage.imageCaption")}
          />
        </StepCard>

        {/* Step 5: VS Code Login */}
        <StepCard
          stepNumber={5}
          title={t("steps.login.title")}
          description={t("steps.login.description")}
        >
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <ContentRenderer content={t("steps.login.content")} />
          </div>
        </StepCard>

        {/* Step 6: Agent Installer (Optional) */}
        <StepCard
          stepNumber={6}
          title={t("steps.agentInstaller.title")}
          description={t("steps.agentInstaller.description")}
        >
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <ContentRenderer content={t("steps.agentInstaller.content")} />
          </div>
          <GuideImage
            src="/images/setup/claude-code-agent-installer.jpeg"
            alt="Agent Installer running in Claude Code"
            caption={t("steps.agentInstaller.imageCaption")}
          />
        </StepCard>
      </div>
    </div>
  );
}
