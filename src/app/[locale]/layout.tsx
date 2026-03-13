import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Geist } from "next/font/google";
import "../globals.css";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import SkipToContent from "@/components/SkipToContent";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Guide - Claude & VS Code",
  description: "AI beginner guide for Claude and VS Code setup",
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
    <html lang={locale}>
      <body className={`${geist.variable} font-sans antialiased bg-(--bg) text-(--text-1)`}>
        <SkipToContent />
        <NextIntlClientProvider messages={messages}>
          <div className="flex min-h-screen flex-col overflow-x-hidden">
            <Header />
            <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-8 sm:px-6 lg:px-8">
              <Sidebar />
              <main id="main-content" className="min-w-0 flex-1">{children}</main>
            </div>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
