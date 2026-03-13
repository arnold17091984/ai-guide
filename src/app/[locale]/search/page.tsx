import { getTranslations } from "next-intl/server";
import PageHeader from "@/components/PageHeader";
import SearchResultsClient from "./SearchResultsClient";

interface SearchPageProps {
  searchParams: Promise<{ q?: string; type?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const t = await getTranslations("search");

  const query = params.q ?? "";
  const type = params.type ?? "all";

  return (
    <div>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        
        icon={
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        }
      />
      <SearchResultsClient initialQuery={query} initialType={type} />
    </div>
  );
}
