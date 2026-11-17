import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale as getIntlLocale, getTranslations } from "next-intl/server";
import { RichText } from "@payloadcms/richtext-lexical/react";

import { Btn } from "@/components/ui/primitives";
import { getMarket } from "@/i18n/locale";
import { getArticle } from "@/lib/blog";
import { absoluteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const market = await getMarket();
  const article = await getArticle(market.code, slug);
  if (!article) return {};
  const url = await absoluteUrl(`/blog/${article.slug}`);
  return {
    title: article.title,
    description: article.excerpt ?? undefined,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: article.title,
      description: article.excerpt ?? undefined,
      publishedTime: article.publishedAt ?? undefined,
      ...(article.image ? { images: [{ url: article.image.url }] } : {}),
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const market = await getMarket();
  const article = await getArticle(market.code, slug);
  if (!article) notFound();

  const t = await getTranslations("blog");
  const tc = await getTranslations("common");
  const locale = await getIntlLocale();
  const date = article.publishedAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(article.publishedAt))
    : null;
  const url = await absoluteUrl(`/blog/${article.slug}`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    ...(article.excerpt ? { description: article.excerpt } : {}),
    ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
    dateModified: article.updatedAt,
    mainEntityOfPage: url,
    ...(article.image ? { image: article.image.url } : {}),
  };

  return (
    <article className="bg-white">
      <div className="max-w-[820px] mx-auto px-4 md:px-10 pt-8 pb-20">
        <nav aria-label="breadcrumb" className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 flex gap-2 mb-6 flex-wrap">
          <Link href="/" className="text-ink-50 no-underline hover:text-ink py-2 -my-2">{tc("home")}</Link>
          <span aria-hidden>/</span>
          <Link href="/blog" className="text-ink-50 no-underline hover:text-ink py-2 -my-2">{t("navLabel")}</Link>
        </nav>

        <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-ink-50">
          {article.category ? t(`categories.${article.category}`) : t("eyebrow")}
          {date ? ` · ${date}` : ""}
        </div>
        <h1 className="font-display text-[30px] md:text-[44px] leading-[1.08] tracking-[-0.03em] font-extrabold text-ink mt-3 mb-0">
          {article.title}
        </h1>
        {article.excerpt && <p className="font-sans text-[18px] leading-relaxed text-ink-70 mt-5 mb-0">{article.excerpt}</p>}

        {article.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.image.url} alt={article.image.alt} className="w-full mt-8 border border-ink-15" />
        )}

        <div className="tl-prose tl-article mt-8">
          {article.body ? <RichText data={article.body as never} /> : null}
        </div>

        <aside className="mt-12 border border-ink-15 bg-paper p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          <div className="flex-1">
            <h2 className="font-display text-[20px] font-bold text-ink m-0">{t("ctaTitle")}</h2>
            <p className="font-sans text-sm text-ink-70 mt-2 mb-0">{t("ctaText")}</p>
          </div>
          <Link href="/configurator" className="no-underline shrink-0">
            <Btn variant="primary" size="lg">{t("ctaButton")}</Btn>
          </Link>
        </aside>

        <p className="mt-8 mb-0">
          <Link href="/blog" className="font-mono text-[12px] text-ink-70 no-underline hover:text-ink">{t("back")}</Link>
        </p>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </article>
  );
}
