import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AppHeader } from "@/components/app-header";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const jakarta = localFont({
  src: "./fonts/PlusJakartaSans-latin.woff2",
  weight: "400 600",
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Credit Scoring Assistant",
  description:
    "Alat review kredit BNPL untuk credit analyst: skor, faktor risiko, guardrail, dan keputusan.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full`}>
      <body className="flex min-h-full flex-col text-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-accent"
        >
          Langsung ke konten
        </a>
        <AppHeader />
        <main id="main" className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 lg:px-8">
          {children}
        </main>
        <footer className="mx-auto w-full max-w-[1200px] px-4 pb-8 pt-2 text-xs text-muted lg:px-8">
          Demo internal. Data sintetis, tanpa PII nyata.
        </footer>
        <PwaRegister />
      </body>
    </html>
  );
}
