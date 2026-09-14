import type { Metadata } from "next";
import localFont from "next/font/local";
import "../globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/lib/cart";
import { MarketProvider } from "@/lib/market-context";
import { getMarket } from "@/i18n/locale";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

const inter = localFont({
  src: [{ path: "../../fonts/inter-latin-cyrillic.woff2", weight: "300 800" }],
  variable: "--font-inter",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
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

export default async function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Resolved from the request's domain, so a Romanian host serves ro-RO without
  // any change to the URL structure — see src/i18n/locale.ts.
  const locale = await getLocale();
  const messages = await getMessages();
  const market = await getMarket();

  return (
    <html lang={locale.split("-")[0]} className={inter.variable}>
      <body className="tl-grain font-sans antialiased text-ink bg-white">
        <NextIntlClientProvider locale={locale} messages={messages}>
        <MarketProvider code={market.code}>
        <CartProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[10000] focus:bg-blue focus:text-white focus:px-6 focus:py-3"
          >
            Към съдържанието
          </a>
          <Header />
          <main id="main-content">{children}</main>
          <Footer />
        </CartProvider>
        </MarketProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
