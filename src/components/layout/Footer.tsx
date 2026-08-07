import Link from "next/link";
import { Btn } from "@/components/ui/primitives";
import { IconArrowRight } from "@/components/ui/icons";
import { COMPANY, COMPANY_LATIN } from "@/lib/company";

const columns = [
  { title: "Продукти", links: [
    { label: "Хоризонтални банцизи", href: "/category/horizontalni-bantsizi" },
    { label: "Вертикални банцизи", href: "/category/vertikalni-bantsizi" },
    { label: "Биметални ленти", href: "/category/bimetalni-lenti" },
    { label: "Циркулярни триони", href: "/category/tsirkulyarni-trioni" },
    { label: "Ножове за абрихт", href: "/category/nozhove-za-abriht" },
    { label: "Машини", href: "/category/mashini" },
  ]},
  { title: "Индустрии", links: [
    { label: "Дървообработка", href: "/category/dyrvo" },
    { label: "Металообработка", href: "/category/metal" },
    { label: "Хранителна индустрия", href: "/category/hrani" },
    { label: "Хоби работилници", href: "/category/hobi-bantsig" },
  ]},
  { title: "Компания", links: [
    { label: "За нас", href: "/about" },
    { label: "Блог", href: "/blog" },
    { label: "Сертификати", href: "/about" },
    { label: "Контакти", href: "/contact" },
  ]},
  { title: "Клиенти", links: [
    { label: "Доставка и плащане", href: "/delivery" },
    { label: "Гаранция", href: "/terms" },
    { label: "Условия", href: "/terms" },
    { label: "Поверителност", href: "/privacy" },
  ]},
];

// Only certifications the company actually holds. ISO 14001, the Sandvik
// distributor claim and the EUWA membership were removed as unsubstantiated —
// the Sandvik one also contradicted the catalogue, which carries no Sandvik
// product at all.
const certs = ["TÜV NORD ISO 9001", "CE"];

export function Footer() {
  return (
    <footer className="bg-blue-deep text-white pt-20">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10">
        {/* Top: wordmark + tagline.
            The tagline was set in orange italic at 88px, the only italic on the
            site — the June pass replaced that treatment with heavy upright
            everywhere else and the footer was missed. Scale comes down so the
            footer reads as a close, not as a second hero, and a measured rail
            of facts carries the credibility instead of a slab of display type. */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-20 pb-14 border-b border-white/10">
          <div>
            <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-orange-light mb-5">
              № 00 — Tehnoles Ltd. · est. 1993
            </div>
            <div className="font-display text-4xl md:text-5xl lg:text-[56px] leading-[1.02] font-extrabold tracking-[-0.035em]">
              Режещи инструменти,<br />
              <span className="text-orange">направени точно.</span>
            </div>

            {/* Verifiable facts, set as data rather than as prose */}
            <dl className="mt-9 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-5 max-w-[520px]">
              {[
                ["1993", "основана"],
                ["Габрово", "цех и склад"],
                ["6-200", "мм широчина"],
                ["БГ + Балкани", "доставка"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="font-display text-lg font-bold tracking-tight tabular-nums">{v}</dt>
                  <dd className="font-mono text-[10px] tracking-[0.12em] uppercase text-white/50 mt-1 m-0">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="self-end">
            <p className="font-sans text-[15px] leading-relaxed text-white/70 max-w-[380px]">
              Над 30 години доставяме банцигови ленти, циркулярни триони и консумативи за дървообработка,
              металообработка и хранителна индустрия в България и Балканите.
            </p>
            <div className="mt-7 flex gap-3 flex-wrap">
              <Link href="/configurator">
                <Btn variant="primary" size="md" iconRight={<IconArrowRight size={14} />}>Заяви по размер</Btn>
              </Link>
              <Link href="/contact">
                <Btn variant="ghostLight" size="md">Технически съвет</Btn>
              </Link>
            </div>
          </div>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-10 py-14">
          {/* Office column */}
          <div className="col-span-2 md:col-span-1 lg:col-span-1">
            <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-white/50 mb-4">Централен офис</div>
            <div className="font-display text-lg font-semibold mb-1">{COMPANY.legalName}</div>
            <div className="font-sans text-sm text-white/70 leading-relaxed">
              гр. {COMPANY.address.city} {COMPANY.address.postalCode}<br />
              {COMPANY.address.street}<br />
              {COMPANY.address.country}
            </div>
            {/* The footer states numbers in full international form: it is the
                formal identity block, and it is read from outside Bulgaria. */}
            <div className="mt-5 flex flex-col gap-1.5 font-mono text-xs">
              <a href={COMPANY.phone.office.href} className="text-white no-underline hover:text-orange-light transition-colors">{COMPANY_LATIN.phone.office.display}</a>
              <a href={COMPANY.phone.mobile.href} className="text-white no-underline hover:text-orange-light transition-colors">{COMPANY_LATIN.phone.mobile.display}</a>
              <a href={`mailto:${COMPANY.email}`} className="text-orange-light no-underline hover:text-white transition-colors">{COMPANY.email}</a>
            </div>
          </div>

          {/* Nav columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-white/50 mb-4">{col.title}</div>
              <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="font-sans text-sm text-white/75 no-underline hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Certifications */}
        <div className="flex flex-wrap items-center gap-6 py-6 border-t border-white/10">
          <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-white/50">Сертификати</div>
          <div className="flex-1 flex gap-7 flex-wrap">
            {certs.map((c) => (
              <span key={c} className="font-mono text-[11px] tracking-[0.05em] text-white/60">{c}</span>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-6 border-t border-white/10 font-mono text-[11px] text-white/50 tracking-[0.04em]">
          <div>© {COMPANY.foundedYear}–{new Date().getFullYear()} {COMPANY.legalName} · www.banciglenti.com · ДДС {COMPANY.vatNumber}</div>
          <div className="flex gap-5">
            <a href="https://www.facebook.com/tehnoles" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white no-underline transition-colors">Facebook</a>
            <a href="https://www.youtube.com/@Tehnolesltd" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white no-underline transition-colors">YouTube</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
