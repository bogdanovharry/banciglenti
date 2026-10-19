"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef } from "react";
import { SectionNumber, Placeholder, Btn } from "@/components/ui/primitives";
import { ProductCard, type ProductCardData } from "@/components/product/ProductCard";
import { Reveal } from "@/components/ui/Reveal";
import {
  HORIZONTAL_WOOD_BLADES,
  VERTICAL_WOOD_BLADES,
  METAL_BIMETAL_BLADES,
  METAL_CARBON_BLADES,
  MEAT_BLADES,
  BREAD_BLADES,
  TEXTILE_BLADES,
} from "@/lib/pricing";
import {
  IconArrowRight, IconPhone, IconWood, IconMetal, IconFood,
  IconHobby, IconMachine, IconAbrasive,
} from "@/components/ui/icons";
import { usePrices } from "@/lib/market-context";
import { companyFor } from "@/lib/company";
import { CATALOG_FACTS } from "@/lib/catalog-facts";
import { ConfiguratorPanel } from "@/components/configurator/ConfiguratorPanel";
import { useTranslations, useLocale } from "next-intl";

/** 1000 -> "1 000" (non-breaking space). Intl leaves 4-digit numbers ungrouped in bg/ro. */
const spaced = (n: number) => n.toLocaleString("en-US").replace(/,/g, String.fromCharCode(160));

// Industrial accent for highlighted words — heavy upright sans, brand orange
const accent = "font-extrabold";

// ========== HERO ==========
/**
 * Full-bleed over a photograph of a blade actually being welded. That image is
 * the business: cutting stock to length and welding it to fit a customer's
 * machine in 24 hours is the thing competitors do not do.
 *
 * The ground is the brand blue rather than ink, and the scrims are deliberately
 * lighter than a legibility minimum would require — the point is a blue-cast
 * photograph, not a black panel. Orange sparks survive the cast because the
 * tint layer shifts hue without collapsing luminance.
 */
function HeroCustom() {
  const t = useTranslations("home.hero");
  const tf = useTranslations("home.facts");
  // Every figure is derived from the price tables (see catalog-facts.ts). The
  // tile that used to say "12 000 active clients" is gone: the legacy shop's
  // own numbers are 5 766 orders from 1 865 customers, so it was not defensible.
  const facts: [string, string][] = [
    ["30+", tf("years")],
    [String(CATALOG_FACTS.profiles), tf("profiles")],
    [`${CATALOG_FACTS.widthMin}–${CATALOG_FACTS.widthMax}`, tf("width")],
    [String(CATALOG_FACTS.specs), tf("specs")],
  ];
  return (
    <section className="relative isolate bg-blue-deep text-white overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/hero/shutterstock_1753030058.webp"
          alt={t("imageAlt")}
          fill
          preload
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Hue shift toward the brand blue. `color` blending keeps the
            photograph's own light and shadow intact, so this tints rather than
            darkens — a flat blue fill at this strength would kill the sparks. */}
        <div className="absolute inset-0 bg-blue mix-blend-color opacity-70" />
        {/* Directional scrims in blue-deep, so even the darkest corners stay
            blue instead of going neutral black. */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-deep/88 via-blue-ink/50 to-blue/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-deep/65 via-transparent to-blue-deep/20" />
      </div>

      <div className="max-w-[1440px] mx-auto px-4 md:px-10 pt-20 pb-12 md:pt-[124px] md:pb-16">
        <div className="max-w-[860px]">
          <SectionNumber n="№ 01" label={t("eyebrow")} tone="light" />
          <h1 className="font-display text-5xl md:text-7xl lg:text-[92px] font-extrabold leading-[0.94] tracking-[-0.045em] mt-8 mb-7">
            {t("title1")}<br />{t("title2")}<br />
            <span className={`${accent} text-orange-light`}>{t("title3")}</span>
          </h1>
          <p className="font-sans text-lg leading-relaxed text-white/75 max-w-[560px] mb-10">
            {t("lede")}
          </p>
          <div className="flex gap-3 items-center flex-wrap">
            <Link href="/configurator">
              <Btn variant="primary" size="lg" iconRight={<IconArrowRight size={16} />}>{t("ctaConfigure")}</Btn>
            </Link>
            <Link href="/shop"><Btn variant="ghostLight" size="lg">{t("ctaCatalogue")}</Btn></Link>
          </div>
        </div>

        {/* Proof rail */}
        <div className="mt-16 md:mt-24 grid grid-cols-2 md:grid-cols-4 gap-0 border-t border-white/20">
          {facts.map(([v, l], i) => (
            <div key={l} className={`pt-5 pb-1 pr-4 ${i > 0 ? "md:border-l md:border-white/20 md:pl-5" : ""}`}>
              <div className="font-display text-3xl md:text-4xl font-bold tracking-tight tabular-nums">{v}</div>
              <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-white/55 mt-1.5">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ========== TICKER ==========
/**
 * A marquee that can be stopped (WCAG 2.2.2): it pauses while the pointer is
 * over it or keyboard focus is inside it, there is a visible pause/play button,
 * and for visitors who prefer reduced motion the animation is switched off in
 * globals.css (it matches the inline "tl-marquee" animation) and the button is
 * hidden, since there is then nothing to pause.
 */
function TickerStrip() {
  const t = useTranslations("home.ticker");
  const th = useTranslations("homepage");
  const tc = useTranslations("common");
  const { market, price } = usePrices();
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const paused = userPaused || hovered || focused;

  // The threshold is authored in EUR without VAT; formatted here so a Romanian
  // visitor reads it in lei, like every other figure on the page.
  const threshold = `${price(market.freeShippingThreshold)} ${tc("exVat")}`;
  // Every entry has to be defensible. "Над 8 000 размера на склад", "Заваряване
  // за 4 часа" and "Доставка до 48ч" were removed: the first described
  // made-to-order combinations as stock, and the other two promised times the
  // workshop does not commit to. What replaced them is countable — see
  // catalog-facts.ts, derived from the price tables themselves.
  const items = [
    t("specs", { specs: CATALOG_FACTS.specs }),
    t("widths", { widths: CATALOG_FACTS.widths, profiles: CATALOG_FACTS.profiles }),
    // Only where delivery is actually free above something — not in Romania,
    // where the courier charges by weight.
    ...(market.carriage === "flat" ? [t("freeShipping", { threshold })] : []),
    t("consult"),
    t("lengthRange", { min: spaced(CATALOG_FACTS.lengthMin) }),
    t("guarantee"),
  ];
  return (
    <div
      className="bg-navy text-white overflow-hidden border-t-4 border-orange relative"
      role="region"
      aria-label={th("tickerLabel")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={(e) => { if (e.target !== (buttonRef.current as EventTarget | null)) setFocused(true); }}
      onBlur={() => setFocused(false)}
    >
      <div
        className="flex gap-12 py-4 whitespace-nowrap font-mono text-xs tracking-[0.1em] uppercase"
        style={{ animation: "tl-marquee 45s linear infinite", animationPlayState: paused ? "paused" : "running" }}
      >
        {[...items, ...items, ...items].map((text, i) => (
          // Only the first run is read out; the repeats exist for the loop.
          <span key={i} aria-hidden={i >= items.length || undefined} className={i % 7 === 0 ? "opacity-100" : "opacity-70"}>{text}</span>
        ))}
      </div>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setUserPaused((p) => !p)}
        aria-pressed={userPaused}
        aria-label={userPaused ? th("tickerPlay") : th("tickerPause")}
        className="motion-reduce:hidden absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center bg-navy/90 text-white/80 hover:text-white border-0 border-l border-white/15 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-orange-light"
      >
        <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true">
          {userPaused ? <path d="M1 0.5v13l10-6.5z" /> : <path d="M1 0h3.5v14H1zM7.5 0H11v14H7.5z" />}
        </svg>
      </button>
    </div>
  );
}

// ========== INDUSTRIES ==========
// Each industry carries a photograph of that industry's actual work. A buyer
// recognises their own shop floor faster than they parse an icon, and the
// licensed photography was already sitting unused in the repo.
const industriesBase = [
  { name: "wood", Icon: IconWood, desc: "woodDesc", href: "/category/dyrvo", img: "/images/hero/craftsman-using-bandsaw-for-splitting-wood-plank-i-2023-11-27-05-19-15-utc-2.avif" },
  { name: "metal", Icon: IconMetal, desc: "metalDesc", href: "/category/metal", img: "/images/hero/metal-cutting-2023-11-27-04-59-56-utc-2.avif" },
  { name: "food", Icon: IconFood, desc: "foodDesc", href: "/category/hrani", img: "/images/hero/shutterstock_1313584316.avif" },
  { name: "hobby", Icon: IconHobby, desc: "hobbyDesc", href: "/category/hobi-bantsig", img: "/images/hero/hardworking-man-doing-his-job-woodshop-2.avif" },
  { name: "machines", Icon: IconMachine, desc: "machinesDesc", href: "/category/mashini", img: "/images/hero/man_working_bandsaw_blades.avif" },
  { name: "abrasives", Icon: IconAbrasive, desc: "abrasivesDesc", href: "/category/abrazivi", img: "/images/hero/punching.webp" },
];

function IndustriesBlock({ counts }: { counts: Record<string, number> }) {
  const t = useTranslations("home.industries");
  const th = useTranslations("homepage");
  // Counts come from the catalogue itself. They used to be hardcoded marketing
  // numbers ("1 240 артикула") that overstated the real range by tenfold.
  const industries = industriesBase.map((c) => ({
    ...c,
    count: counts[c.href.replace("/category/", "")] ?? 0,
  }));

  return (
    <section className="bg-white py-20 md:py-[120px]">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-end mb-14 md:mb-[72px]">
          <Reveal>
            <SectionNumber n="№ 02" label={t("eyebrow")} />
            <h2 className="font-display text-4xl md:text-5xl lg:text-[64px] leading-none tracking-[-0.035em] font-bold mt-7 text-ink">
              {t("title1")}<br />{t("title2")} <span className={`${accent} text-orange`}>{t("title3")}</span>.
            </h2>
          </Reveal>
          <Reveal as="p" delay={120} className="font-sans text-base leading-relaxed text-ink-70 max-w-[480px] lg:justify-self-end">
            {t("lede")}
          </Reveal>
        </div>

        <Reveal delay={80} stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-ink-15">
          {industries.map((c, i) => {
            const CIcon = c.Icon;
            return (
              <Link
                key={c.name}
                href={c.href}
                className="group relative isolate no-underline text-white min-h-[340px] flex flex-col justify-end p-7 overflow-hidden bg-ink"
              >
                <Image
                  src={c.img}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="-z-10 object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
                />
                {/* Two-stop scrim keeps the caption legible over any photo while
                    letting the top of the frame stay bright. */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/70 to-ink/15 transition-opacity duration-500 group-hover:opacity-90" />

                <div className="absolute top-7 left-7 right-7 flex justify-between items-start">
                  <CIcon size={30} strokeWidth={1.25} className="text-white/80 transition-transform duration-300 group-hover:-translate-y-0.5" />
                  <span className="font-mono text-[10px] text-white/50 tracking-[0.12em] tabular-nums">
                    0{i + 1} / 06
                  </span>
                </div>

                <div>
                  <div className="font-display text-3xl lg:text-[34px] font-bold tracking-tight mb-2">{t(c.name)}</div>
                  <p className="font-sans text-sm leading-snug text-white/70 m-0 max-w-[34ch]">{t(c.desc)}</p>
                  <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center font-mono text-[11px] text-white/60 tracking-[0.04em]">
                    {/* A category with nothing in stock is sold on request —
                        showing "0 items" kills interest for no reason. */}
                    <span className="tabular-nums">
                      {c.count > 0 ? th("itemCount", { count: c.count }) : t("onRequest")}
                    </span>
                    <span className="text-orange-light flex items-center gap-1.5">
                      {t("browse")}
                      <IconArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}

// ========== CUSTOM ORDER / QUOTE ==========
// The price tables, flattened: the services block below quotes its "from"
// rates out of them.
const SERVICE_TABLES = [
  HORIZONTAL_WOOD_BLADES,
  VERTICAL_WOOD_BLADES,
  METAL_BIMETAL_BLADES,
  METAL_CARBON_BLADES,
  MEAT_BLADES,
  BREAD_BLADES,
  TEXTILE_BLADES,
].flat();

/** Lowest non-zero rate for a service across the whole price list. */
function minRate(key: "welding" | "sharpening" | "setting" | "heatTreatment") {
  const rates = SERVICE_TABLES.map((b) => b[key]).filter((n) => n > 0);
  return rates.length ? Math.min(...rates) : 0;
}

/**
 * The homepage intro to the configurator. It used to carry its own cut-down
 * quote widget (three blade types, its own price maths); the real configurator
 * covers eight types and is the thing that actually gets maintained, so the
 * duplicate is gone and this is the intro to it.
 *
 * The dark ground stays — it is the one full-bleed dark band on the page and it
 * marks where the site stops selling and starts quoting.
 */
function ConfiguratorSection() {
  const t = useTranslations("home.quote");
  const th = useTranslations("homepage");

  return (
    <section id="custom" className="relative">
      <div className="bg-ink text-white pt-20 md:pt-[104px] pb-14 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "linear-gradient(180deg, transparent, #000 25%, #000 100%)",
          }}
        />
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 relative">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-10 lg:gap-20 items-end">
            <Reveal>
              <SectionNumber n="№ 03" label={t("eyebrow")} tone="light" />
              <h2 className="font-display text-4xl md:text-5xl lg:text-[64px] leading-[0.98] tracking-[-0.04em] font-bold mt-7 mb-0">
                {t("title1")}<br />
                <span className={`${accent} text-orange-light`}>{t("title2")}</span>
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <p className="font-sans text-[17px] leading-relaxed text-white/70 max-w-[460px] mb-6">
                {t("lede1")} {t("lede2")}
              </p>
              <div className="flex flex-wrap gap-x-8 gap-y-3 font-mono text-[10px] tracking-[0.12em] uppercase text-white/50">
                <span>{th("quoteSpecs", { count: CATALOG_FACTS.specs })}</span>
                <span>{th("quoteLength", { min: spaced(CATALOG_FACTS.lengthMin) })}</span>
                <span className="text-orange-light">{t("priceFromList")}</span>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* The real thing — eight blade types, priced from the same tables the
          order route re-checks against. */}
      <ConfiguratorPanel />
    </section>
  );
}

// ========== BESTSELLERS ==========

function BestsellersBlock({ products }: { products: ProductCardData[] }) {
  const t = useTranslations("home.best");
  const th = useTranslations("homepage");
  // "" stands for "all"; the labels are translated at render time.
  const [filter, setFilter] = useState("");
  // Only offer a tab if the catalogue actually has products behind it.
  // A filter offering one real choice is just decoration, so the row only
  // appears once there are at least two industries to switch between.
  const industries = Array.from(new Set(products.map((p) => p.industry)));
  const tabs = industries.length > 1 ? ["", ...industries] : [];
  const filtered = filter === "" ? products : products.filter((b) => b.industry === filter);

  return (
    <section className="bg-paper py-20 md:py-[120px]">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-14">
          <Reveal>
            {/* These are the products flagged TOP by hand in the CMS, not sales
                data, and carry no date — a hand-typed month goes stale. */}
            <SectionNumber n="№ 04" label={t("eyebrow")} />
            <h2 className="font-display text-4xl md:text-[56px] leading-none tracking-[-0.035em] font-bold mt-7 text-ink">
              {th("bestTitle1")}<br />{th("bestTitle2")}
            </h2>
          </Reveal>
          {tabs.length > 0 && (
            <div className="flex gap-1 bg-white border border-ink-15 p-1">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 py-2.5 font-mono text-[11px] tracking-[0.1em] uppercase cursor-pointer border-none transition-colors ${filter === tab ? "bg-ink text-white" : "bg-transparent text-ink-70 hover:text-ink"}`}
                >
                  {tab === "" ? t("all") : tab}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p, i) => (
            <Reveal key={p.sku} delay={i * 70}>
              <ProductCard p={p} />
            </Reveal>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link href="/shop"><Btn variant="dark" size="lg" iconRight={<IconArrowRight size={16} />}>{t("viewAll")}</Btn></Link>
        </div>
      </div>
    </section>
  );
}

// ========== EXPERTISE ==========
function ExpertiseBlock() {
  const t = useTranslations("home.about");
  const th = useTranslations("homepage");
  const stats: [string, string][] = [
    // Counted from the price tables, so these cannot drift away from what the
    // configurator will quote. (A "8 kinds of steel" tile was dropped: nothing
    // in the repository substantiates it.)
    [String(CATALOG_FACTS.specs), th("expertiseSpecs")],
    [String(CATALOG_FACTS.widths), th("expertiseWidths", { min: CATALOG_FACTS.widthMin, max: CATALOG_FACTS.widthMax })],
    [String(CATALOG_FACTS.profiles), th("expertiseProfiles")],
    ["1993", th("expertiseFounded")],
  ];
  return (
    <section className="bg-navy text-white py-20 md:py-[120px]">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-20 items-center">
        <Reveal>
          <Placeholder
            tone="ink"
            ratio="4/5"
            src="/images/hero/man_working_bandsaw_blades.avif"
            alt={t("imageAlt")}
            sizes="(max-width: 1024px) 100vw, 48vw"
          />
        </Reveal>
        <Reveal delay={120}>
          <SectionNumber n="№ 05" label={t("eyebrow")} tone="light" />
          <h2 className="font-display text-4xl md:text-5xl lg:text-7xl leading-none tracking-[-0.04em] font-bold mt-7 mb-8">
            {t("title1")}<br />{t("title2")}<br />
            <span className={`${accent} text-orange-light`}>{t("title3")}</span>
          </h2>
          <p className="font-sans text-[17px] leading-relaxed text-white/75 max-w-[560px] mb-10">
            {t("lede")}
          </p>
          <div className="grid grid-cols-2 gap-px bg-white/10 border border-white/10">
            {stats.map(([v, l]) => (
              <div key={l} className="p-7 bg-navy">
                <div className="font-display text-3xl md:text-5xl font-extrabold tracking-tight leading-none tl-figures">{v}</div>
                <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-white/60 mt-2">{l}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ========== SERVICES ==========
/**
 * Replaces a wall of twelve identical brand boxes. Six of those names — Sandvik,
 * Hermes, Flamme, Bahco, Starrett, Berkel — appear nowhere in the catalogue, so
 * the block asserted distribution agreements we cannot show a single product
 * for, and it gave a visitor nothing to do.
 *
 * The shop floor work is the better story and it was invisible on the site:
 * welding, sharpening, setting and heat treatment are priced per metre in the
 * same tables the quote card uses. Every "от" figure below is the real minimum
 * across those tables, so it moves when the price list moves.
 */

// Names, descriptions and units are looked up by key at render time.
const SERVICES = [
  { key: "welding", name: "weldingTitle", detail: "weldingDesc", perMetre: false, rate: minRate("welding") },
  { key: "sharpening", name: "sharpening", detail: "sharpeningDesc", perMetre: true, rate: minRate("sharpening") },
  { key: "setting", name: "setting", detail: "settingDesc", perMetre: true, rate: minRate("setting") },
  { key: "heat", name: "heatTitle", detail: "heatDesc", perMetre: true, rate: minRate("heatTreatment") },
] as const;

function ServicesBlock() {
  const tSvc = useTranslations("home.services");
  const tc = useTranslations("common");
  const tq = useTranslations("home.quote");
  const th = useTranslations("homepage");
  const { gross, amount, symbol } = usePrices();
  const company = companyFor(useLocale());
  return (
    <section className="bg-blue-deep text-white py-20 md:py-[120px] relative overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-10 lg:gap-16 items-stretch">
          {/* Photograph carries the left column full-bleed to the section edge */}
          <Reveal className="relative min-h-[320px] lg:min-h-full">
            <Image
              src="/images/hero/punching.webp"
              alt={tSvc("imageAlt")}
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-blue mix-blend-color opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-deep/85 via-blue-deep/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-7">
              <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-white/60 mb-2">
                {tSvc("workshop")}
              </div>
              <div className="font-display text-2xl font-bold tracking-tight">
                {th("servicesCaption")}
              </div>
            </div>
          </Reveal>

          <div>
            <Reveal>
              <SectionNumber n="№ 06" label={tSvc("eyebrow")} tone="light" />
              <h2 className="font-display text-4xl md:text-5xl lg:text-[56px] leading-none tracking-[-0.035em] font-bold mt-7 mb-5">
                {tSvc("title1")}<br />
                <span className={`${accent} text-orange-light`}>{tSvc("title2")}</span>
              </h2>
              <p className="font-sans text-[17px] leading-relaxed text-white/70 max-w-[520px] mb-10">
                {tSvc("lede")}
              </p>
            </Reveal>

            <Reveal delay={80} stagger className="border-t border-white/15">
              {SERVICES.map((s) => (
                <div
                  key={s.key}
                  className="group grid grid-cols-[1fr_auto] gap-6 items-baseline py-6 border-b border-white/15"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="font-display text-xl md:text-[22px] font-semibold tracking-tight m-0">
                        {s.name === "sharpening" || s.name === "setting" ? tq(s.name) : tSvc(s.name)}
                      </h3>
                    </div>
                    <p className="font-sans text-[14px] leading-snug text-white/60 m-0 max-w-[46ch]">
                      {tSvc(s.detail)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-white/45">{tSvc("from")}</div>
                    <div className="font-display text-2xl md:text-[26px] font-bold tracking-tight tabular-nums leading-none mt-0.5">
                      {amount(gross(s.rate))}
                      <span className="text-sm font-normal text-white/50 ml-1">{symbol}</span>
                    </div>
                    <div className="font-mono text-[9px] text-white/45 mt-1">{tSvc(s.perMetre ? "perMetre" : "perPiece")} · {tc("incVat")}</div>
                  </div>
                </div>
              ))}
            </Reveal>

            <div className="mt-8 flex gap-3 flex-wrap">
              <Link href="/contact">
                <Btn variant="primary" size="lg" iconRight={<IconArrowRight size={16} />}>
                  {tSvc("cta")}
                </Btn>
              </Link>
              <a href={company.phone.office.href}>
                <Btn variant="ghostLight" size="lg" icon={<IconPhone size={16} />}>{company.phone.office.display}</Btn>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ========== CONTACT CTA ==========
/**
 * The number is the interface. This used to be a flat orange band with a
 * headline and two buttons of equal weight, which buried the one action that
 * closes a custom order — a phone call to someone who can size a blade.
 * The photograph sits under the orange as a multiply layer so the panel reads
 * as the workshop rather than as a coloured rectangle.
 */
function ContactCTA() {
  const tSup = useTranslations("home.support");
  const company = companyFor(useLocale());
  return (
    <section className="relative isolate bg-orange text-white overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/hero/man_working_bandsaw_blades.avif"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-orange mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-r from-orange via-orange/90 to-orange/55" />
      </div>

      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 lg:gap-20 items-end">
          <Reveal>
            <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-white/75 mb-4">
              {tSup("eyebrow")}
            </div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-[52px] leading-[1.02] tracking-[-0.035em] font-bold m-0 max-w-[16ch]">
              {tSup("title")}
            </h2>
            <p className="font-sans text-[16px] leading-relaxed text-white/80 max-w-[440px] mt-5">
              {tSup("lede")}
            </p>
          </Reveal>

          {/* Call panel — the number set as display type, not as a button label */}
          <Reveal delay={120} className="w-full lg:w-auto">
            <div className="bg-ink text-white p-7 md:p-8 lg:min-w-[380px]">
              <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-white/50 mb-3">
                {tSup("directLine")}
              </div>
              <a
                href={company.phone.office.href}
                className="group flex items-center gap-3 no-underline text-white"
              >
                <IconPhone size={26} className="text-orange shrink-0 transition-transform duration-300 group-hover:-rotate-12" />
                <span className="font-display text-[34px] md:text-[40px] font-extrabold tracking-tight tabular-nums leading-none group-hover:text-orange-light transition-colors">
                  {company.phone.office.display}
                </span>
              </a>
              <a
                href={company.phone.mobile.href}
                className="block font-mono text-[13px] text-white/60 hover:text-white no-underline mt-3 tabular-nums transition-colors"
              >
                {company.phone.mobile.display} · {tSup("mobile")}
              </a>
              <div className="mt-6 pt-6 border-t border-white/15">
                <Link href="/contact" className="block">
                  <Btn variant="ghostLight" size="md" fullWidth iconRight={<IconArrowRight size={14} />}>
                    {tSup("orSend")}
                  </Btn>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ========== PAGE ==========
export function HomeClient({
  bestsellers,
  categoryCounts,
}: {
  bestsellers: ProductCardData[];
  categoryCounts: Record<string, number>;
}) {
  return (
    <>
      <HeroCustom />
      <TickerStrip />
      <IndustriesBlock counts={categoryCounts} />
      <ConfiguratorSection />
      <BestsellersBlock products={bestsellers} />
      <ExpertiseBlock />
      <ServicesBlock />
      <ContactCTA />
    </>
  );
}
