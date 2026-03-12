import { useTranslations } from "next-intl";
import StepCard from "@/components/StepCard";
import OsSelector from "@/components/OsSelector";
import ContentRenderer from "@/components/ContentRenderer";
import GuideImage from "@/components/GuideImage";

export default function VscodePage() {
  const t = useTranslations("setup.vscode");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t("title")}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">{t("subtitle")}</p>
      </div>

      <div className="space-y-6">
        <StepCard
          stepNumber={1}
          title={t("steps.download.title")}
          description={t("steps.download.description")}
        >
          <OsSelector
            windowsContent={t("steps.download.windows")}
            macosContent={t("steps.download.macos")}
          />
          <GuideImage
            src="/images/setup/vscode-download.png"
            alt="VS Code download page"
            caption={t("steps.download.imageCaption")}
          />
        </StepCard>

        <StepCard
          stepNumber={2}
          title={t("steps.install.title")}
          description={t("steps.install.description")}
        >
          <OsSelector
            windowsContent={t("steps.install.windows")}
            macosContent={t("steps.install.macos")}
          />
        </StepCard>

        <StepCard
          stepNumber={3}
          title={t("steps.setup.title")}
          description={t("steps.setup.description")}
        >
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <ContentRenderer content={t("steps.setup.content")} />
          </div>
          <GuideImage
            src="/images/setup/vscode-langpack.jpeg"
            alt="VS Code Language Pack installation"
            caption={t("steps.setup.imageCaption")}
          />
        </StepCard>
      </div>
    </div>
  );
}
