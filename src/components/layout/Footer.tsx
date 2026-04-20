import Link from "next/link";
import { Btn } from "@/components/ui/primitives";
import { IconArrowRight } from "@/components/ui/icons";

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

const certs = ["TÜV NORD ISO 9001", "ISO 14001", "CE", "Сертифициран дистрибутор · Sandvik", "Member · EUWA"];

export function Footer() {
  return (
    <footer className="bg-blue-deep text-white pt-20">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10">
        {/* Top: wordmark + tagline */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 lg:gap-20 pb-16 border-b border-white/10">
          <div>
            <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-orange-light mb-6">
              № 00 — Tehnoles Ltd. · est. 1993
            </div>
            <div className="font-display text-5xl md:text-7xl lg:text-[88px] leading-[0.95] font-extrabold tracking-[-0.04em]">
              Режещи<br />инструменти,<br />
              <span className="text-orange italic font-medium">направени точно.</span>
            </div>
          </div>
          <div className="self-end pb-4">
            <p className="font-sans text-[15px] leading-relaxed text-white/70 max-w-[380px]">
              Над 30 години доставяме банцигови ленти, циркулярни триони и консумативи за дървообработка,
              металообработка и хранителна индустрия в България и Балканите.
            </p>
            <div className="mt-7 flex gap-3 flex-wrap">
              <Link href="/contact">
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
            <div className="font-display text-lg font-semibold mb-1">ТЕХНОЛЕС ООД</div>
            <div className="font-sans text-sm text-white/70 leading-relaxed">
              гр. Габрово 5300<br />
              ул. „Негенска" 2<br />
              България
            </div>
            <div className="mt-5 flex flex-col gap-1.5 font-mono text-xs">
              <a href="tel:066800822" className="text-white no-underline hover:text-orange-light transition-colors">+359 66 800 822</a>
              <a href="tel:0878800162" className="text-white no-underline hover:text-orange-light transition-colors">+359 878 800 162</a>
              <a href="mailto:tehnoles@tehnoles.com" className="text-orange-light no-underline hover:text-white transition-colors">tehnoles@tehnoles.com</a>
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
          <div>© 1993–{new Date().getFullYear()} ТЕХНОЛЕС ООД · www.banciglenti.com · ДДС BG817088234</div>
          <div className="flex gap-5">
            <a href="https://www.facebook.com/tehnoles" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white no-underline transition-colors">Facebook</a>
            <a href="https://www.youtube.com/@Tehnolesltd" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white no-underline transition-colors">YouTube</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
