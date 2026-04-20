import type { Metadata } from "next";
import localFont from "next/font/local";
import "../globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const inter = localFont({
  src: [{ path: "../../fonts/inter-latin-cyrillic.woff2", weight: "300 800" }],
  variable: "--font-inter",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

const jetbrains = localFont({
  src: [{ path: "../../fonts/inter-latin-cyrillic.woff2", weight: "400 600" }],
  variable: "--font-jetbrains",
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
});

export const metadata: Metadata = {
  title: {
    default: "ТЕХНОЛЕС — Банцигови ленти и режещи инструменти",
    template: "%s | ТЕХНОЛЕС",
  },
  description:
    "Най-голямото разнообразие от банцигови ленти, циркулярни триони, ножове за абрихт и абразиви в България. Индивидуални решения за дърво, метал и хранителна промишленост.",
  openGraph: {
    type: "website",
    locale: "bg_BG",
    siteName: "ТЕХНОЛЕС",
  },
};

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bg" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="font-sans antialiased text-ink bg-white">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[10000] focus:bg-blue focus:text-white focus:px-6 focus:py-3"
        >
          Към съдържанието
        </a>
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
