"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  IconSearch, IconCart, IconPhone, IconMail, IconMenu,
  IconChevron, IconWood, IconMetal, IconHobby, IconFood, IconMachine, IconRuler, IconClose,
} from "@/components/ui/icons";
import { useCart } from "@/lib/cart";
import { COMPANY } from "@/lib/company";

type NavItem = { label: string; href: string };
type NavGroup = { group: string; items: NavItem[] };
type NavCat = { name: string; href: string; Icon: typeof IconWood; children: NavGroup[] | null };

const NAV_CATS: NavCat[] = [
  {
    name: "Дърво", href: "/category/dyrvo", Icon: IconWood,
    children: [
      { group: "Банцигови ленти", items: [
        { label: "Хоризонтални банцизи", href: "/category/horizontalni-bantsizi" },
        { label: "Вертикални банцизи", href: "/category/vertikalni-bantsizi" },
        { label: "Ленти по поръчка", href: "/configurator" },
      ]},
      { group: "Циркулярни", items: [
        { label: "Циркулярни триони", href: "/category/tsirkulyarni-trioni" },
        { label: "Ножове за абрихт", href: "/category/nozhove-za-abriht" },
      ]},
      { group: "Абразиви", items: [
        { label: "Диаманти и CBN", href: "/category/abrazivi" },
        { label: "Заточни камъни", href: "/category/abrazivi" },
      ]},
    ],
  },
  {
    name: "Метал", href: "/category/metal", Icon: IconMetal,
    children: [
      { group: "Биметални ленти", items: [
        { label: "M42 HSS", href: "/category/bimetalni-lenti" },
        { label: "M51 / M90", href: "/category/bimetalni-lenti" },
        { label: "По поръчка", href: "/configurator" },
      ]},
      { group: "Въглеродна стомана", items: [
        { label: "CS Flexback", href: "/category/vyglerodna-lenti-cs" },
        { label: "CS Hardback", href: "/category/vyglerodna-lenti-cs" },
      ]},
    ],
  },
  { name: "Хоби банциг", href: "/category/hobi-bantsig", Icon: IconHobby, children: null },
  {
    name: "Храни", href: "/category/hrani", Icon: IconFood,
    children: [
      { group: "Месо и риба", items: [
        { label: "Ленти за месо", href: "/category/meso-i-riba" },
        { label: "Ленти за риба", href: "/category/meso-i-riba" },
      ]},
      { group: "Хлебни изделия", items: [
        { label: "Ленти за хляб", href: "/category/hlebni-izdeliya" },
      ]},
      { group: "Слайсъри", items: [
        { label: "Bizerba", href: "/category/slicers" },
        { label: "Berkel", href: "/category/slicers" },
      ]},
    ],
  },
  {
    name: "Машини", href: "/category/mashini", Icon: IconMachine,
    children: [
      { group: "Оборудване", items: [
        { label: "Заточни машини", href: "/category/mashini" },
      ]},
      { group: "Консумативи", items: [
        { label: "Резервни части", href: "/category/konsumativi" },
        { label: "Гърбици и измервателни уреди", href: "/category/konsumativi" },
      ]},
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
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
    setMobileOpen(false);
  };
  const { itemCount } = useCart();

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
      {/* Top utility bar — only claims that hold up. It previously advertised
          "Доставка до 24–72ч", contradicting the 24–48ч stated everywhere else. */}
      <div className="bg-ink text-white/80">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 h-9 flex items-center justify-between font-mono text-[11px] tracking-[0.08em] uppercase">
          <div className="hidden md:flex gap-6">
            <span className="text-white">● Габрово · собствен цех</span>
            <span className="opacity-60">Заваряване по размер</span>
          </div>
          <div className="flex gap-5 items-center ml-auto">
            <a href={COMPANY.phone.office.href} className="flex items-center gap-1.5 text-inherit no-underline hover:text-white transition-colors">
              <IconPhone size={12} /> <span className="hidden sm:inline tabular-nums">{COMPANY.phone.office.display}</span>
            </a>
            <a href={`mailto:${COMPANY.email}`} className="hidden md:flex items-center gap-1.5 text-inherit no-underline hover:text-white transition-colors">
              <IconMail size={12} /> {COMPANY.email}
            </a>
          </div>
        </div>
      </div>

      {/* Main brand row.
          The search is the centre of gravity rather than a slot beside the
          logo: this is a catalogue people arrive at knowing a dimension, so
          finding by size is the primary act, not a secondary convenience. */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-4 flex items-center gap-4 md:gap-10">
        {/* Logo. items-start matters — in a column flex box the image would
            otherwise stretch to the width of the strapline beneath it, which is
            what was squashing the mark. */}
        <Link
          href="/"
          className="flex flex-col items-start justify-center no-underline text-ink shrink-0"
          aria-label="ТЕХНОЛЕС — начало"
        >
          <Image
            src="/images/hero/tehnoles-logo.png"
            alt="ТЕХНОЛЕС"
            width={1177}
            height={210}
            preload
            className="h-8 w-auto md:h-9"
          />
          <div className="font-mono text-[9px] md:text-[10px] tracking-[0.14em] text-ink-50 mt-1.5 uppercase whitespace-nowrap">
            Innovation sharpened to perfection.
          </div>
        </Link>

        {/* Search — a real one. Submitting goes to the catalogue filtered by
            the query; it used to be an inert box wearing a ⌘K badge. */}
        <form
          onSubmit={handleSearch}
          role="search"
          className="hidden md:flex flex-1 max-w-[560px] ml-4 items-stretch border border-ink-15 focus-within:border-blue transition-colors bg-white"
        >
          <div className="relative flex-1">
            <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-50 pointer-events-none" />
            <input
              name="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Търси в каталога"
              placeholder="2360 · Kodiak · Holzmann BS128"
              className="w-full h-12 pl-10 pr-3 bg-transparent font-mono text-[13px] text-ink outline-none placeholder:text-ink-30"
            />
          </div>
          <button
            type="submit"
            className="px-5 bg-ink text-white font-mono text-[10px] tracking-[0.12em] uppercase cursor-pointer border-none hover:bg-orange transition-colors"
          >
            Търси
          </button>
        </form>

        {/* Actions. The wishlist carried a hardcoded badge of 3 and the profile
            linked to /account, which does not exist — both removed. */}
        <div className="flex items-center gap-1 ml-auto">
          <HeaderIconBtn icon={<IconCart size={18} />} label="Количка" badge={itemCount || undefined} href="/cart" />
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
                            <li key={it.label}>
                              <Link href={it.href} className="font-sans text-[13px] text-ink-70 no-underline hover:text-ink transition-colors">
                                {it.label}
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
          {/* Same handler as the desktop field — this used to be an inert box. */}
          <form onSubmit={handleSearch} role="search" className="p-4 border-b border-ink-05 flex items-stretch gap-2">
            <div className="relative flex-1">
              <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-50 pointer-events-none" />
              <input
                name="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Търси в каталога"
                placeholder="2360 · Kodiak · Holzmann"
                className="w-full h-11 pl-10 pr-4 bg-ink-05 border border-ink-05 font-mono text-[13px] outline-none focus:bg-white focus:border-ink-15 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-4 bg-ink text-white font-mono text-[10px] tracking-[0.1em] uppercase cursor-pointer border-none"
            >
              Търси
            </button>
          </form>
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
                          <Link key={it.label} href={it.href} className="block py-1 pl-4 text-[13px] text-ink-70 no-underline" onClick={() => setMobileOpen(false)}>
                            {it.label}
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
