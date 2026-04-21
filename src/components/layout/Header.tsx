"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  IconSearch, IconCart, IconPhone, IconMail, IconMenu, IconUser, IconHeart,
  IconChevron, IconWood, IconMetal, IconHobby, IconFood, IconMachine, IconRuler, IconClose,
} from "@/components/ui/icons";

const NAV_CATS = [
  {
    name: "Дърво", href: "/category/dyrvo", Icon: IconWood,
    children: [
      { group: "Банцигови ленти", items: ["Хоризонтални банцизи", "Вертикални банцизи", "Ленти по поръчка", "Ленти за трупорезачки"] },
      { group: "Циркулярни", items: ["Циркулярни триони", "Ножове за абрихт", "Фрезови дискове"] },
      { group: "Абразиви", items: ["Диаманти", "CBN дискове", "Заточни камъни"] },
    ],
  },
  {
    name: "Метал", href: "/category/metal", Icon: IconMetal,
    children: [
      { group: "Биметални ленти", items: ["M42 HSS", "M51 Cobalt", "Shark", "По поръчка"] },
      { group: "Въглеродна стомана", items: ["CS Standard", "CS Hardback", "CS Flexback"] },
    ],
  },
  { name: "Хоби банциг", href: "/category/hobi-bantsig", Icon: IconHobby, children: null },
  {
    name: "Храни", href: "/category/hrani", Icon: IconFood,
    children: [
      { group: "За месо и риба", items: ["Ленти за месо", "Ленти за риба", "Резервни части"] },
      { group: "Хлебни изделия", items: ["Ленти за хляб", "Назъбени ножове"] },
      { group: "Слайсъри", items: ["Bizerba", "Berkel", "Ножове за слайсъри"] },
    ],
  },
  {
    name: "Машини", href: "/category/mashini", Icon: IconMachine,
    children: [
      { group: "Оборудване", items: ["Заточни машини", "Лентови триони", "Слайсъри"] },
      { group: "Консумативи", items: ["Резервни части", "Масла и охладители"] },
    ],
  },
];

function HeaderIconBtn({ icon, label, badge, href }: { icon: React.ReactNode; label: string; badge?: number; href?: string }) {
  const inner = (
    <div className="flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer px-3 py-1.5 text-ink-70 hover:text-ink font-mono text-[9px] tracking-[0.08em] uppercase relative transition-colors">
      {icon}
      <span>{label}</span>
      {badge ? (
        <span className="absolute top-0.5 right-1 min-w-4 h-4 px-1 bg-orange text-white font-mono text-[9px] font-bold flex items-center justify-center rounded-full">
          {badge}
        </span>
      ) : null}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export function Header() {
  const [open, setOpen] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 bg-white transition-[border-color] duration-200"
      style={{ borderBottom: `1px solid ${scrolled ? "#D9D9D9" : "transparent"}` }}
    >
      {/* Top utility bar */}
      <div className="bg-ink text-white/80">
        <div className="max-w-[1440px] mx-auto px-10 h-9 flex items-center justify-between font-mono text-[11px] tracking-[0.08em] uppercase">
          <div className="hidden md:flex gap-6">
            <span className="text-white">● На склад / България</span>
            <span className="opacity-60">Доставка до 24–72ч</span>
            <span className="opacity-60">TÜV NORD сертифициран</span>
          </div>
          <div className="flex gap-5 items-center ml-auto">
            <a href="tel:066800822" className="flex items-center gap-1.5 text-inherit no-underline hover:text-white transition-colors">
              <IconPhone size={12} /> <span className="hidden sm:inline">066 800 822</span>
            </a>
            <a href="mailto:tehnoles@tehnoles.com" className="hidden md:flex items-center gap-1.5 text-inherit no-underline hover:text-white transition-colors">
              <IconMail size={12} /> tehnoles@tehnoles.com
            </a>
            <span className="opacity-60">BG / EN</span>
          </div>
        </div>
      </div>

      {/* Main brand row */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 h-[84px] flex items-center gap-4 md:gap-10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 no-underline text-ink shrink-0">
          <svg width="36" height="36" viewBox="0 0 36 36" aria-label="Tehnoles">
            <ellipse cx="18" cy="18" rx="15" ry="10" fill="none" stroke="#004FC6" strokeWidth="2" />
            <path d="M3 18h30" stroke="#004FC6" strokeWidth="2" />
            <path d="M12 11h12M18 11v14" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <div className="leading-none">
            <div className="font-display font-extrabold text-xl tracking-tight">ТЕХНОЛЕС</div>
            <div className="font-mono text-[10px] tracking-[0.12em] text-ink-50 mt-1 uppercase">Band saw blade expert · est. 1993</div>
          </div>
        </Link>

        {/* Search */}
        <div className="hidden md:block flex-1 max-w-[520px] ml-6 relative">
          <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-50" />
          <input
            placeholder="Търси по размер, марка или машина — напр. 3810×27×0.9 M42"
            className="w-full h-11 pl-10 pr-24 bg-ink-05 border border-ink-05 text-[13px] font-sans outline-none focus:bg-white focus:border-ink-15 transition-colors"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-ink-50 border border-ink-15 px-1.5 py-0.5">⌘ K</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-auto">
          <div className="hidden md:flex items-center gap-1">
            <HeaderIconBtn icon={<IconUser size={18} />} label="Профил" href="/account" />
            <HeaderIconBtn icon={<IconHeart size={18} />} label="Списък" badge={3} />
          </div>
          <HeaderIconBtn icon={<IconCart size={18} />} label="Количка" badge={2} href="/cart" />
          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 ml-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Затвори менюто" : "Отвори менюто"}
          >
            {mobileOpen ? <IconClose size={24} /> : <IconMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Category nav — desktop */}
      <nav className="hidden md:block border-t border-b border-ink-05" aria-label="Основна навигация" onMouseLeave={() => setOpen(null)}>
        <div className="max-w-[1440px] mx-auto px-10 flex items-stretch gap-0">
          <Link
            href="/shop"
            className="flex items-center gap-2.5 px-5 cursor-pointer font-sans text-[13px] font-semibold text-white bg-navy tracking-tight no-underline hover:brightness-110 transition-all"
          >
            <IconMenu size={16} /> Всички продукти
          </Link>

          {NAV_CATS.map((cat) => {
            const CatIcon = cat.Icon;
            const isOpen = open === cat.name;
            return (
              <div key={cat.name} className="relative" onMouseEnter={() => setOpen(cat.name)}>
                <Link
                  href={cat.href}
                  className={`flex items-center gap-2 px-[18px] h-12 font-sans text-[13px] font-medium text-ink no-underline transition-colors hover:text-blue ${isOpen ? "border-b-2 border-orange" : "border-b-2 border-transparent"}`}
                >
                  <CatIcon size={16} /> {cat.name}
                  {cat.children && <IconChevron size={12} className="opacity-50" />}
                </Link>
                {isOpen && cat.children && (
                  <div
                    className="absolute top-full left-0 min-w-[640px] bg-white border border-ink-15 shadow-[0_20px_48px_rgba(11,30,51,0.12)] p-6 z-60"
                    style={{ display: "grid", gridTemplateColumns: `repeat(${cat.children.length}, 1fr)`, gap: 24 }}
                  >
                    {cat.children.map((grp) => (
                      <div key={grp.group}>
                        <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 mb-3 pb-2 border-b border-ink-05">
                          {grp.group}
                        </div>
                        <ul className="list-none p-0 m-0 flex flex-col gap-2">
                          {grp.items.map((it) => (
                            <li key={it}>
                              <Link href="/shop" className="font-sans text-[13px] text-ink-70 no-underline hover:text-ink transition-colors">
                                {it}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <Link href="/configurator" className="flex items-center gap-2 px-[18px] h-12 font-sans text-[13px] font-medium text-orange no-underline hover:brightness-110 transition-all">
            <IconRuler size={16} /> Конфигуратор
          </Link>

          <div className="flex-1" />

          <Link href="/blog" className="flex items-center px-4 h-12 font-sans text-[13px] text-ink-70 no-underline hover:text-ink transition-colors">
            Блог
          </Link>
          <Link href="/contact" className="flex items-center px-4 h-12 font-sans text-[13px] text-ink-70 no-underline hover:text-ink transition-colors">
            Контакти
          </Link>
        </div>
      </nav>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="md:hidden bg-white border-t border-ink-05 shadow-lg max-h-[80vh] overflow-y-auto" aria-label="Мобилна навигация">
          <div className="p-4 border-b border-ink-05">
            <div className="relative">
              <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-50" />
              <input placeholder="Търси..." className="w-full h-10 pl-10 pr-4 bg-ink-05 border border-ink-05 text-sm font-sans" />
            </div>
          </div>
          <Link href="/shop" className="flex items-center gap-3 px-4 py-3 font-semibold text-white bg-navy no-underline" onClick={() => setMobileOpen(false)}>
            <IconMenu size={16} /> Всички продукти
          </Link>
          {NAV_CATS.map((cat) => {
            const CatIcon = cat.Icon;
            return (
              <div key={cat.name}>
                <Link href={cat.href} className="flex items-center gap-3 px-4 py-3 text-ink font-medium no-underline border-b border-ink-05" onClick={() => setMobileOpen(false)}>
                  <CatIcon size={16} /> {cat.name}
                </Link>
                {cat.children && (
                  <div className="bg-ink-05 px-4 py-2">
                    {cat.children.map((grp) => (
                      <div key={grp.group} className="mb-2">
                        <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-ink-50 mb-1">{grp.group}</div>
                        {grp.items.map((it) => (
                          <Link key={it} href="/shop" className="block py-1 pl-4 text-[13px] text-ink-70 no-underline" onClick={() => setMobileOpen(false)}>
                            {it}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <Link href="/blog" className="block px-4 py-3 text-ink-70 no-underline border-t border-ink-05" onClick={() => setMobileOpen(false)}>Блог</Link>
          <Link href="/contact" className="block px-4 py-3 text-ink-70 no-underline border-b border-ink-05" onClick={() => setMobileOpen(false)}>Контакти</Link>
        </nav>
      )}
    </header>
  );
}
