"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useId } from "react";
import {
  IconSearch, IconCart, IconPhone, IconMail, IconMenu,
  IconChevron, IconWood, IconMetal, IconHobby, IconFood, IconMachine, IconRuler, IconClose,
} from "@/components/ui/icons";
import { useCart } from "@/lib/cart";
import { companyFor } from "@/lib/company";
import { SawMeisterLogo } from "@/components/layout/SawMeisterLogo";
import { SAW_MEISTER } from "@/lib/series";
import { useLocale, useTranslations } from "next-intl";

type NavItem = { label: string; href: string };
type NavGroup = { group: string; items: NavItem[] };
type NavCat = { name: string; href: string; Icon: typeof IconWood; children: NavGroup[] | null };

/**
 * Navigation carries translation keys, not words. Steel grades (M42 HSS,
 * CS Flexback) are deliberately literal — they are the same in every market
 * and translating them would be wrong.
 */
const NAV_CATS: NavCat[] = [
  {
    name: "wood", href: "/category/dyrvo", Icon: IconWood,
    children: [
      { group: "bandsawBlades", items: [
        { label: "horizontal", href: "/category/horizontalni-bantsizi" },
        { label: "vertical", href: "/category/vertikalni-bantsizi" },
        { label: "custom", href: "/configurator" },
      ]},
      { group: "circular", items: [
        { label: "circularSaws", href: "/category/tsirkulyarni-trioni" },
        { label: "planerKnives", href: "/category/nozhove-za-abriht" },
      ]},
      { group: "abrasives", items: [
        { label: "diamondCbn", href: "/category/abrazivi" },
        { label: "sharpeningStones", href: "/category/abrazivi" },
      ]},
    ],
  },
  {
    name: "metal", href: "/category/metal", Icon: IconMetal,
    children: [
      { group: "bimetal", items: [
        { label: "!M42 HSS", href: "/category/bimetalni-lenti" },
        { label: "!M51 / M90", href: "/category/bimetalni-lenti" },
        { label: "custom", href: "/configurator" },
      ]},
      { group: "carbonSteel", items: [
        { label: "!CS Flexback", href: "/category/vyglerodna-lenti-cs" },
        { label: "!CS Hardback", href: "/category/vyglerodna-lenti-cs" },
      ]},
    ],
  },
  { name: "hobby", href: "/category/hobi-bantsig", Icon: IconHobby, children: null },
  {
    name: "food", href: "/category/hrani", Icon: IconFood,
    children: [
      { group: "meatFish", items: [
        { label: "meatBlades", href: "/category/meso-i-riba" },
        { label: "fishBlades", href: "/category/meso-i-riba" },
      ]},
      { group: "bakery", items: [
        { label: "breadBlades", href: "/category/hlebni-izdeliya" },
      ]},
    ],
  },
  {
    name: "machines", href: "/category/mashini", Icon: IconMachine,
    children: [
      { group: "equipment", items: [
        { label: "sharpeningMachines", href: "/category/mashini" },
      ]},
      { group: "consumables", items: [
        { label: "spareParts", href: "/category/konsumativi" },
        { label: "camsGauges", href: "/category/konsumativi" },
      ]},
    ],
  },
];

/** A leading "!" marks a literal that must not be translated. */
const navText = (t: (k: string) => string, key: string) =>
  key.startsWith("!") ? key.slice(1) : t(key);

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
  const locale = useLocale();
  const isBulgaria = locale.startsWith("bg");
  const company = companyFor(locale);
  const menuId = useId();
  const tSite = useTranslations("siteHeader");
  const tCommon = useTranslations("common");
  const tHeader = useTranslations("header");
  const tNav = useTranslations("nav");

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
            <span className="text-white">● {tHeader("workshop")}</span>
            <span className="opacity-60">{tHeader("customWelding")}</span>
          </div>
          <div className="flex gap-5 items-center ml-auto">
            {/* Below 640px only the icon shows, so the link carries its own name
                and a 40px tap target. */}
            <a
              href={company.phone.office.href}
              aria-label={tSite("phoneCall", { number: company.phone.office.display })}
              className="flex items-center justify-center gap-1.5 min-w-10 h-10 text-inherit no-underline hover:text-white transition-colors"
            >
              <IconPhone size={12} /> <span className="hidden sm:inline tabular-nums">{company.phone.office.display}</span>
            </a>
            <a href={`mailto:${company.email}`} className="hidden md:flex items-center gap-1.5 text-inherit no-underline hover:text-white transition-colors">
              <IconMail size={12} /> {company.email}
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
        {/* Bulgaria keeps the ТЕХНОЛЕС mark it has carried since 1993 — the name
            is worth something there. Outside Bulgaria it is unreadable Cyrillic
            for an unknown company, so those markets lead with Saw-Meister. */}
        <Link
          href="/"
          className="flex flex-col items-start justify-center no-underline text-ink shrink-0"
          aria-label={`${isBulgaria ? tCommon("brand") : SAW_MEISTER} — ${tCommon("home")}`}
        >
          {isBulgaria ? (
            <Image
              src="/images/hero/tehnoles-logo.png"
              alt={tCommon("brand")}
              width={1177}
              height={210}
              preload
              className="h-8 w-auto md:h-9"
            />
          ) : (
            <SawMeisterLogo preload />
          )}
          <div className="font-mono text-[9px] md:text-[10px] tracking-[0.14em] text-ink-50 mt-1.5 uppercase whitespace-nowrap">
            {tCommon("tagline")}
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
              aria-label={tCommon("searchPlaceholder")}
              placeholder="2360 · Kodiak · Holzmann BS128"
              className="w-full h-12 pl-10 pr-3 bg-transparent font-mono text-[13px] text-ink outline-none placeholder:text-ink-30"
            />
          </div>
          <button
            type="submit"
            className="px-5 bg-ink text-white font-mono text-[10px] tracking-[0.12em] uppercase cursor-pointer border-none hover:bg-orange transition-colors"
          >
            {tSite("search")}
          </button>
        </form>

        {/* Actions. The wishlist carried a hardcoded badge of 3 and the profile
            linked to /account, which does not exist — both removed. */}
        <div className="flex items-center gap-1 ml-auto">
          <HeaderIconBtn icon={<IconCart size={18} />} label={tCommon("cart")} badge={itemCount || undefined} href="/cart" />
          <button
            className="md:hidden p-2 ml-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? tCommon("closeMenu") : tCommon("openMenu")}
            aria-expanded={mobileOpen}
            aria-controls={menuId}
          >
            {mobileOpen ? <IconClose size={24} /> : <IconMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Category nav — desktop */}
      <nav className="hidden md:block border-t border-b border-ink-05" aria-label={tCommon("mainNav")} onMouseLeave={() => setOpen(null)} onKeyDown={(e) => { if (e.key === "Escape") setOpen(null); }}>
        <div className="max-w-[1440px] mx-auto px-10 flex items-stretch gap-0">
          <Link
            href="/shop"
            className="flex items-center gap-2.5 px-5 cursor-pointer font-sans text-[13px] font-semibold text-white bg-navy tracking-tight no-underline hover:brightness-110 transition-all"
          >
            <IconMenu size={16} /> {tSite("allProducts")}
          </Link>

          {NAV_CATS.map((cat) => {
            const CatIcon = cat.Icon;
            const isOpen = open === cat.name;
            return (
              <div
                key={cat.name}
                className="relative"
                onMouseEnter={() => setOpen(cat.name)}
                onFocus={() => setOpen(cat.name)}
                onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(null); }}
              >
                <Link
                  href={cat.href}
                  aria-haspopup={cat.children ? "true" : undefined}
                  aria-expanded={cat.children ? isOpen : undefined}
                  className={`flex items-center gap-2 px-[18px] h-12 font-sans text-[13px] font-medium text-ink no-underline transition-colors hover:text-blue ${isOpen ? "border-b-2 border-orange" : "border-b-2 border-transparent"}`}
                >
                  <CatIcon size={16} /> {tNav(cat.name)}
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
                          {tNav(grp.group)}
                        </div>
                        <ul className="list-none p-0 m-0 flex flex-col gap-2">
                          {grp.items.map((it) => (
                            <li key={it.label}>
                              <Link href={it.href} className="font-sans text-[13px] text-ink-70 no-underline hover:text-ink transition-colors">
                                {navText(tNav, it.label)}
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
            <IconRuler size={16} /> {tCommon("configurator")}
          </Link>

          <div className="flex-1" />

          <Link href="/contact" className="flex items-center px-4 h-12 font-sans text-[13px] text-ink-70 no-underline hover:text-ink transition-colors">
            {tCommon("contact")}
          </Link>
        </div>
      </nav>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav id={menuId} className="md:hidden bg-white border-t border-ink-05 shadow-lg max-h-[80vh] overflow-y-auto" aria-label={tCommon("mobileNav")}>
          {/* Same handler as the desktop field — this used to be an inert box. */}
          <form onSubmit={handleSearch} role="search" className="p-4 border-b border-ink-05 flex items-stretch gap-2">
            <div className="relative flex-1">
              <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-50 pointer-events-none" />
              <input
                name="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label={tCommon("searchPlaceholder")}
                placeholder="2360 · Kodiak · Holzmann"
                className="w-full h-11 pl-10 pr-4 bg-ink-05 border border-ink-05 font-mono text-[13px] outline-none focus:bg-white focus:border-ink-15 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-4 bg-ink text-white font-mono text-[10px] tracking-[0.1em] uppercase cursor-pointer border-none"
            >
              {tSite("search")}
            </button>
          </form>
          <Link href="/shop" className="flex items-center gap-3 px-4 py-3 font-semibold text-white bg-navy no-underline" onClick={() => setMobileOpen(false)}>
            <IconMenu size={16} /> {tSite("allProducts")}
          </Link>
          {NAV_CATS.map((cat) => {
            const CatIcon = cat.Icon;
            return (
              <div key={cat.name}>
                <Link href={cat.href} className="flex items-center gap-3 px-4 py-3 text-ink font-medium no-underline border-b border-ink-05" onClick={() => setMobileOpen(false)}>
                  <CatIcon size={16} /> {tNav(cat.name)}
                </Link>
                {cat.children && (
                  <div className="bg-ink-05 px-4 py-2">
                    {cat.children.map((grp) => (
                      <div key={grp.group} className="mb-2">
                        <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-ink-50 mb-1">{tNav(grp.group)}</div>
                        {grp.items.map((it) => (
                          <Link key={it.label} href={it.href} className="block py-1 pl-4 text-[13px] text-ink-70 no-underline" onClick={() => setMobileOpen(false)}>
                            {navText(tNav, it.label)}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <Link href="/contact" className="block px-4 py-3 text-ink-70 no-underline border-t border-b border-ink-05" onClick={() => setMobileOpen(false)}>{tCommon("contact")}</Link>
        </nav>
      )}
    </header>
  );
}
