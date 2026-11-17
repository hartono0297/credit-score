import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Credit Scoring Assistant",
  description:
    "Alat review kredit BNPL untuk credit analyst: skor, faktor risiko, guardrail, dan keputusan.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full">
      <body className="min-h-full bg-bg text-ink">{children}</body>
    </html>
  );
}
