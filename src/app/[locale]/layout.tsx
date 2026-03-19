import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import SkipToContent from "@/components/SkipToContent";
import AchievementToast from "@/components/AchievementToast";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Guide - Claude Code Platform",
  description: "Collaborative AI knowledge platform for Claude Code",
  openGraph: {
    title: "AI Guide - Claude Code Platform",
    description: "Collaborative AI knowledge platform for Claude Code",
    type: "website",
    siteName: "AI Guide",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Guide - Claude Code Platform",
    description: "Collaborative AI knowledge platform for Claude Code",
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${geistMono.variable} font-sans antialiased bg-(--bg-base) text-(--text-1)`}
      >
        <SkipToContent />
        <NextIntlClientProvider messages={messages}>
          <div className="flex min-h-screen flex-col overflow-x-hidden">
            <Header />
            <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-8 sm:px-6 lg:px-8">
              <Sidebar />
              <main id="main-content" className="min-w-0 flex-1">
                {children}
              </main>
            </div>
          </div>
          <AchievementToast />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
