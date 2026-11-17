import type { Metadata } from "next";
import Link from "next/link";
import { getLocale as getIntlLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/layout/PageHeader";
import { getMarket } from "@/i18n/locale";
import { listArticles, type ArticleCard } from "@/lib/blog";
import { absoluteUrl } from "@/lib/site-url";

/** Read per request: an article published a minute ago has to be there a minute later. */
export const dynamic = "force-dynamic";

const CATEGORIES = ["blog", "technical"] as const;
type Category = (typeof CATEGORIES)[number];
const isCategory = (v: unknown): v is Category => typeof v === "string" && (CATEGORIES as readonly string[]).includes(v);

type Search = { category?: string; page?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<Search> }): Promise<Metadata> {
  const t = await getTranslations("blog");
  const { category, page } = await searchParams;
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    // Filtered and paged views are not separate pages worth indexing.
    alternates: { canonical: await absoluteUrl("/blog") },
    robots: category || (page && page !== "1") ? { index: false, follow: true } : undefined,
  };
}

function Card({ article, locale, label, readMore }: { article: ArticleCard; locale: string; label: string; readMore: string }) {
  const date = article.publishedAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(article.publishedAt))
    : null;
  return (
    <Link href={`/blog/${article.slug}`} className="group flex flex-col bg-white border border-ink-15 no-underline text-inherit hover:border-ink transition-colors">
      <div className="aspect-[16/9] bg-paper overflow-hidden border-b border-ink-15">
        {article.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.image.url} alt={article.image.alt} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div aria-hidden className="w-full h-full" style={{ backgroundImage: "repeating-linear-gradient(135deg, rgba(17,24,39,0.05) 0 1px, transparent 1px 14px)" }} />
        )}
      </div>
      <div className="p-5 flex flex-col gap-2 flex-1">
        <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-ink-50">
          {label}
          {date ? ` · ${date}` : ""}
        </div>
        <h2 className="font-display text-lg font-bold tracking-tight text-ink m-0 leading-snug">{article.title}</h2>
        {article.excerpt && <p className="font-sans text-sm text-ink-70 m-0 line-clamp-3">{article.excerpt}</p>}
        <span className="mt-auto pt-3 font-mono text-[11px] text-orange">{readMore} →</span>
      </div>
    </Link>
  );
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<Search> }) {
  const t = await getTranslations("blog");
  const locale = await getIntlLocale();
  const market = await getMarket();
  const sp = await searchParams;
  const category = isCategory(sp.category) ? sp.category : undefined;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const { articles, pages, total } = await listArticles(market.code, { category, page });

  const href = (c: Category | undefined, p = 1) => {
    const q = new URLSearchParams();
    if (c) q.set("category", c);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `/blog?${s}` : "/blog";
  };
  const chip = (active: boolean) =>
    `inline-flex items-center h-10 px-4 border font-mono text-[11px] tracking-[0.08em] uppercase no-underline transition-colors ${
      active ? "bg-ink text-white border-ink" : "bg-white text-ink-70 border-ink-15 hover:border-ink"
    }`;

  return (
    <div className="bg-paper">
      <PageHeader
        compact
        eyebrowNumber={t("eyebrowNumber")}
        eyebrowLabel={t("eyebrow")}
        crumbs={[{ label: (await getTranslations("common"))("home"), href: "/" }, { label: t("navLabel") }]}
        title={t("title")}
        description={t("description")}
      />

      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-10 pb-20">
        <nav aria-label={t("eyebrow")} className="flex gap-2 flex-wrap mb-8">
          <Link href="/blog" className={chip(!category)}>{t("filterAll")}</Link>
          {CATEGORIES.map((c) => (
            <Link key={c} href={href(c)} className={chip(category === c)}>{t(`categories.${c}`)}</Link>
          ))}
        </nav>

        {total === 0 ? (
          <p className="font-sans text-ink-70 py-10">{category ? t("emptyCategory") : t("empty")}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {articles.map((a) => (
                <Card
                  key={a.id}
                  article={a}
                  locale={locale}
                  label={a.category ? t(`categories.${a.category}`) : t("eyebrow")}
                  readMore={t("readMore")}
                />
              ))}
            </div>
            {pages > 1 && (
              <div className="mt-10 flex items-center justify-between font-mono text-[11px] tracking-[0.08em] uppercase text-ink-70">
                {page > 1 ? <Link href={href(category, page - 1)} className="text-ink no-underline">{t("previous")}</Link> : <span />}
                <span>{t("page", { page, pages })}</span>
                {page < pages ? <Link href={href(category, page + 1)} className="text-ink no-underline">{t("next")}</Link> : <span />}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
