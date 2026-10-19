import type { Metadata } from "next";
import localFont from "next/font/local";
import "../globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/lib/cart";
import { MarketProvider } from "@/lib/market-context";
import { getMarket } from "@/i18n/locale";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { siteOrigin } from "@/lib/site-url";

const inter = localFont({
  src: [{ path: "../../fonts/inter-latin-cyrillic.woff2", weight: "300 800" }],
  variable: "--font-inter",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

/**
 * Site-wide metadata, per market.
 *
 * It was one constant: Bulgarian title, Bulgarian description, `bg_BG`, on
 * every domain — so the Romanian store introduced itself to search engines and
 * link previews in Cyrillic under another brand's name, and the description
 * opened with a superlative nobody can verify. Now the market decides the
 * language, the name (ТЕХНОЛЕС in Bulgaria, Saw-Meister elsewhere, matching the
 * header) and the locale, and `metadataBase` is the domain being visited so
 * every relative URL a page declares resolves on its own host.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [t, locale, origin] = await Promise.all([getTranslations("seo"), getLocale(), siteOrigin()]);
  return {
    metadataBase: new URL(origin),
    title: { default: t("title"), template: `%s | ${t("siteName")}` },
    description: t("description"),
    openGraph: {
      type: "website",
      locale: locale.replace("-", "_"),
      siteName: t("siteName"),
      title: t("title"),
      description: t("description"),
    },
  };
}

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
  const tSeo = await getTranslations("seo");

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
            {tSeo("skipToContent")}
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
