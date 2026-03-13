import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://ai-guide.vercel.app";
const SITE_NAME = "AI Guide";
const DEFAULT_DESCRIPTION =
  "The collaborative knowledge platform for Claude AI and VS Code — guides, skills, case studies, and community insights.";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

interface MetadataOptions {
  title: string;
  description?: string;
  /** Absolute path or full URL for og:image */
  image?: string;
  /** BCP-47 locale string, e.g. "en", "ko", "ja" */
  locale?: string;
  /** Canonical path (without base URL), e.g. "/knowledge/my-article" */
  canonicalPath?: string;
  /** Prevent indexing (draft pages, auth pages, etc.) */
  noIndex?: boolean;
}

/**
 * createMetadata — generate consistent Next.js Metadata for any page.
 *
 * Usage (Server Component):
 *   export const metadata = createMetadata({ title: "Knowledge Base", locale: "en" });
 *
 * Usage (dynamic page):
 *   export async function generateMetadata(): Promise<Metadata> {
 *     return createMetadata({ title: entry.title, description: entry.summary });
 *   }
 */
export function createMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_OG_IMAGE,
  locale = "en",
  canonicalPath,
  noIndex = false,
}: MetadataOptions): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const canonical = canonicalPath
    ? `${SITE_URL}/${locale}${canonicalPath}`
    : undefined;

  // Resolve image to absolute URL
  const ogImage = image.startsWith("http") ? image : `${SITE_URL}${image}`;

  return {
    title: fullTitle,
    description,
    ...(noIndex && { robots: { index: false, follow: false } }),
    ...(canonical && { alternates: { canonical } }),
    openGraph: {
      title: fullTitle,
      description,
      url: canonical ?? SITE_URL,
      siteName: SITE_NAME,
      locale,
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
  };
}
