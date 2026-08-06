import Link from "next/link";

import { PageHeader } from "@/components/layout/PageHeader";
import { Btn } from "@/components/ui/primitives";
import { IconArrowRight, IconRuler, IconPhone } from "@/components/ui/icons";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "Страницата не е намерена" };

/**
 * Reachable in normal use: /product/[slug] calls notFound() for any unknown
 * slug, and next.config.ts redirects sixteen legacy banciglenti.com URLs into
 * this app. Someone arriving from an old link or a stale search result lands
 * here, so it offers the three ways out rather than apologising.
 */
export default function NotFound() {
  return (
    <div className="bg-paper">
      <PageHeader
        eyebrowNumber="404"
        eyebrowLabel="Страницата не съществува"
        crumbs={[{ label: "Начало", href: "/" }]}
        title="Тази страница я няма."
        description="Може да е преместена или адресът да е сгрешен. Ето откъде да продължите."
      />

      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-14 pb-[120px]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-ink-15 border border-ink-15">
          <Link href="/shop" className="group bg-white p-7 no-underline text-ink hover:bg-paper transition-colors">
            <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">01</div>
            <div className="font-display text-xl font-bold tracking-tight mt-3">Каталогът</div>
            <p className="font-sans text-sm text-ink-70 mt-2 mb-4">
              Филтрирайте по машина, дължина, широчина или марка.
            </p>
            <span className="font-mono text-[11px] text-orange flex items-center gap-1.5">
              Разгледай <IconArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
            </span>
          </Link>

          <Link href="/shop?mode=custom" className="group bg-white p-7 no-underline text-ink hover:bg-paper transition-colors">
            <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">02</div>
            <div className="font-display text-xl font-bold tracking-tight mt-3 flex items-center gap-2">
              <IconRuler size={20} className="text-blue" /> По размер
            </div>
            <p className="font-sans text-sm text-ink-70 mt-2 mb-4">
              Задайте размерите и вижте цена веднага по актуалния ценоразпис.
            </p>
            <span className="font-mono text-[11px] text-orange flex items-center gap-1.5">
              Конфигуратор <IconArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
            </span>
          </Link>

          <div className="bg-white p-7">
            <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">03</div>
            <div className="font-display text-xl font-bold tracking-tight mt-3">Питайте инженер</div>
            <p className="font-sans text-sm text-ink-70 mt-2 mb-4">
              Ако не знаете какъв размер ви трябва — обадете се. Консултацията е безплатна.
            </p>
            <a
              href={COMPANY.phone.office.href}
              className="font-display text-lg font-bold text-ink no-underline flex items-center gap-2 tabular-nums hover:text-orange transition-colors"
            >
              <IconPhone size={16} className="text-orange" /> {COMPANY.phone.office.display}
            </a>
          </div>
        </div>

        <div className="mt-10">
          <Link href="/"><Btn variant="ghost" size="lg">← Към началната страница</Btn></Link>
        </div>
      </div>
    </div>
  );
}
