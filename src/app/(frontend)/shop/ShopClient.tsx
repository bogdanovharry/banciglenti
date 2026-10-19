"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Btn } from "@/components/ui/primitives";
import { ProductCard, type ProductCardData } from "@/components/product/ProductCard";
import { IconClose, IconRuler, IconArrowRight } from "@/components/ui/icons";
import { PageHeader } from "@/components/layout/PageHeader";
import { ConfiguratorPanel } from "@/components/configurator/ConfiguratorPanel";
import { FilterDrawer } from "@/components/catalog/FilterDrawer";
import { SERIES, isSeriesKey, type SeriesKey } from "@/lib/series";
import { SORT_OPTIONS, compareBy, formatInt, type SortKey } from "@/lib/catalog-ui";
import { CATALOG_FACTS } from "@/lib/catalog-facts";

export type ShopFilter = { slug: string; label: string; count: number };

export type ShopProduct = ProductCardData & {
  categorySlugs: string[];
  machines?: string[];
  series?: SeriesKey | null;
};

/**
 * `label`/`sublabel` let a facet show something other than its filter value —
 * the series facets filter on "softcut" but have to read "SoftCut / Меко дърво",
 * because the series name alone tells a first-time buyer nothing.
 */
type Facet = { value: string; count: number; label?: string; sublabel?: string };

/** Multi-select facet list with live counts. */
function FacetGroup({
  title,
  facets,
  selected,
  onToggle,
}: {
  title: string;
  facets: Facet[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  if (facets.length === 0) return null;

  return (
    <div className="mb-6 pb-6 border-b border-ink-15">
      <h4 className="font-mono text-[11px] tracking-[0.12em] uppercase text-ink m-0 mb-3.5 font-semibold">
        {title}
      </h4>
      <ul className="list-none m-0 p-0 flex flex-col gap-1">
        {facets.map((f) => {
          const on = selected.includes(f.value);
          return (
            <li key={f.value}>
              <button
                onClick={() => onToggle(f.value)}
                aria-pressed={on}
                className={`w-full flex justify-between items-center gap-2 px-2.5 py-1.5 border-none cursor-pointer text-left font-sans text-[13px] transition-colors ${
                  on ? "bg-ink text-white" : "bg-transparent text-ink-70 hover:bg-paper"
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    aria-hidden
                    className={`w-3 h-3 shrink-0 border ${on ? "bg-orange border-orange" : "border-ink-30"}`}
                  />
                  <span className="min-w-0">
                    <span className="block truncate">{f.label ?? f.value}</span>
                    {f.sublabel && (
                      <span
                        className={`block truncate font-mono text-[10px] tracking-[0.04em] ${
                          on ? "text-white/60" : "text-ink-50"
                        }`}
                      >
                        {f.sublabel}
                      </span>
                    )}
                  </span>
                </span>
                <span
                  className={`font-mono text-[11px] tabular-nums shrink-0 ${on ? "text-white/60" : "text-ink-50"}`}
                >
                  {f.count}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type Mode = "stock" | "custom";

export function ShopClient({
  products,
  filters,
}: {
  products: ShopProduct[];
  filters: ShopFilter[];
}) {
  const t = useTranslations("catalog");
  const tc = useTranslations("common");
  const tSort = useTranslations("sort");
  const locale = useLocale();

  // Deep links land pre-filtered: /shop?brand=Einhell&category=hobi-bantsig.
  // The URL is read as the initial state, and again whenever it changes — a
  // search typed into the header while this page is already open is a new
  // `?q=` on the same route, which must take effect. Between URL changes the
  // controls are the source of truth, so a click is never overwritten.
  const params = useSearchParams();
  const paramsKey = params.toString();

  // Ready stock and made-to-order are the same decision for a buyer — "can I get
  // this size?" — so they live on one page rather than behind separate routes.
  // ?mode=custom deep-links straight into the configurator.
  const [mode, setMode] = useState<Mode>(() => (params.get("mode") === "custom" ? "custom" : "stock"));

  const [sort, setSort] = useState<SortKey>("popularity");
  const [query, setQuery] = useState(() => params.get("q") ?? "");
  const [activeCategory, setActiveCategory] = useState(() => params.get("category") ?? "");
  const [materials, setMaterials] = useState<string[]>(() => params.getAll("material"));
  const [brands, setBrands] = useState<string[]>(() => params.getAll("brand"));
  const [series, setSeries] = useState<string[]>(() => params.getAll("series").filter(isSeriesKey));
  const [inStockOnly, setInStockOnly] = useState(false);
  const [machines, setMachines] = useState<string[]>(() => params.getAll("machine"));
  // Width and loop length are how buyers actually search — they know what their
  // machine takes, and length is the figure that must match exactly.
  const [widthMin, setWidthMin] = useState("");
  const [widthMax, setWidthMax] = useState("");
  const [lengthMin, setLengthMin] = useState(() => params.get("lengthMin") ?? "");
  const [lengthMax, setLengthMax] = useState(() => params.get("lengthMax") ?? "");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Follow the URL: when it changes, take its filters (and drop the ones it does
  // not carry). Done while rendering, not in an effect, so the first paint
  // after navigation already shows the new results.
  const [seenParams, setSeenParams] = useState(paramsKey);
  if (seenParams !== paramsKey) {
    setSeenParams(paramsKey);
    setMode(params.get("mode") === "custom" ? "custom" : "stock");
    setQuery(params.get("q") ?? "");
    setActiveCategory(params.get("category") ?? "");
    setMaterials(params.getAll("material"));
    setBrands(params.getAll("brand"));
    setSeries(params.getAll("series").filter(isSeriesKey));
    setMachines(params.getAll("machine"));
    setInStockOnly(false);
    setWidthMin("");
    setWidthMax("");
    setLengthMin(params.get("lengthMin") ?? "");
    setLengthMax(params.get("lengthMax") ?? "");
  }

  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  // Facets are computed from everything in the current category, not from the
  // fully-filtered set, so counts stay stable while you tick boxes.
  const inCategory = useMemo(
    () => (activeCategory ? products.filter((p) => p.categorySlugs.includes(activeCategory)) : products),
    [products, activeCategory],
  );

  const materialFacets = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of inCategory) {
      const m = p.specs?.material;
      if (m) counts.set(m, (counts.get(m) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  }, [inCategory]);

  /**
   * "SoftCut · Меко дърво" — the series alone means nothing to a first-time
   * buyer, so the facet carries what it cuts. Ordered as the range sheet is,
   * not by count, because the five lines read as a range.
   */
  const seriesFacets = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of inCategory) {
      if (p.series) counts.set(p.series, (counts.get(p.series) ?? 0) + 1);
    }
    return Object.keys(SERIES)
      .filter((k) => counts.has(k))
      .map((k) => ({
        value: k,
        count: counts.get(k)!,
        label: SERIES[k as SeriesKey].name,
        sublabel: t(`series.${k}.application`),
      }));
  }, [inCategory, t]);

  const brandFacets = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of inCategory) {
      const b = p.brandName;
      if (b) counts.set(b, (counts.get(b) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  }, [inCategory]);

  const machineFacets = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of inCategory) {
      for (const m of p.machines ?? []) counts.set(m, (counts.get(m) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value));
  }, [inCategory]);

  /**
   * The loop lengths actually stocked, as one-click values.
   *
   * The from–to boxes above them are right for someone browsing and wrong for
   * everyone else: a buyer does not want blades between 3 500 and 4 200 mm,
   * they want 4 013 because that is what their mill takes. Typing the same
   * number into two boxes to say so is a chore, and mistyping it returns an
   * empty grid that looks like "we do not stock it".
   */
  const lengthFacets = useMemo(() => {
    const counts = new Map<number, number>();
    for (const p of inCategory) {
      const l = p.specs?.length;
      if (typeof l === "number" && Number.isFinite(l)) counts.set(l, (counts.get(l) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value - b.value);
  }, [inCategory]);

  const pickLength = (mm: number) => {
    const already = lengthMin === String(mm) && lengthMax === String(mm);
    setLengthMin(already ? "" : String(mm));
    setLengthMax(already ? "" : String(mm));
  };

  const filtered = useMemo(() => {
    const num = (s: string) => (s === "" ? null : Number(s));
    const inRange = (v: unknown, min: number | null, max: number | null) => {
      if (min === null && max === null) return true;
      // A product with no recorded figure cannot satisfy a range filter.
      if (typeof v !== "number") return false;
      if (min !== null && !Number.isNaN(min) && v < min) return false;
      if (max !== null && !Number.isNaN(max) && v > max) return false;
      return true;
    };

    const wMin = num(widthMin), wMax = num(widthMax);
    const lMin = num(lengthMin), lMax = num(lengthMax);

    // Free text matches name, brand, dimensions and machine names, so a header
    // search for "Holzmann BS128" or "3810×27" both land somewhere useful.
    // Normalised so "3810x27", "3810×27" and "3810 27" behave the same.
    const normalise = (s: string) => s.toLowerCase().replace(/[×хx]/g, "x").replace(/\s+/g, " ").trim();
    const terms = normalise(query).split(" ").filter(Boolean);

    return inCategory.filter((p) => {
      if (terms.length) {
        const haystack = normalise(
          [p.name, p.brandName ?? "", p.dim, ...(p.machines ?? [])].join(" "),
        );
        if (!terms.every((t) => haystack.includes(t))) return false;
      }
      if (materials.length && !(p.specs?.material && materials.includes(p.specs.material))) return false;
      if (brands.length && !(p.brandName && brands.includes(p.brandName))) return false;
      if (series.length && !(p.series && series.includes(p.series))) return false;
      if (machines.length && !(p.machines ?? []).some((m) => machines.includes(m))) return false;
      if (inStockOnly && p.stock === "out") return false;
      if (!inRange(p.specs?.width, wMin, wMax)) return false;
      if (!inRange(p.specs?.length, lMin, lMax)) return false;
      return true;
    });
  }, [inCategory, query, materials, brands, series, machines, inStockOnly, widthMin, widthMax, lengthMin, lengthMax]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort(compareBy(sort));
    return list;
  }, [filtered, sort]);

  const mm = t("unit.mm");
  const filterChips = [
    ...(activeCategory ? [{ label: filters.find((f) => f.slug === activeCategory)?.label ?? activeCategory, clear: () => setActiveCategory("") }] : []),
    ...materials.map((m) => ({ label: m, clear: () => toggle(materials, setMaterials, m) })),
    ...brands.map((b) => ({ label: b, clear: () => toggle(brands, setBrands, b) })),
    ...series
      .filter(isSeriesKey)
      .map((s) => ({ label: SERIES[s].name, clear: () => toggle(series, setSeries, s) })),
    ...machines.map((m) => ({ label: m, clear: () => toggle(machines, setMachines, m) })),
    ...(inStockOnly ? [{ label: t("shop.inStockOnly"), clear: () => setInStockOnly(false) }] : []),
    ...(widthMin || widthMax
      ? [{ label: t("shop.chipWidth", { min: widthMin || "0", max: widthMax || "∞", unit: mm }), clear: () => { setWidthMin(""); setWidthMax(""); } }]
      : []),
    ...(lengthMin || lengthMax
      ? [{ label: t("shop.chipLength", { min: lengthMin || "0", max: lengthMax || "∞", unit: mm }), clear: () => { setLengthMin(""); setLengthMax(""); } }]
      : []),
  ];
  // The search text is shown as a chip too, but it is not one of the panel's
  // filters, so it does not count towards the badge on the "Filters" button.
  const activeChips = [
    ...(query.trim() ? [{ label: t("shop.chipQuery", { q: query.trim() }), clear: () => setQuery("") }] : []),
    ...filterChips,
  ];

  const clearAll = () => {
    setQuery("");
    setActiveCategory("");
    setMaterials([]);
    setBrands([]);
    setSeries([]);
    setMachines([]);
    setInStockOnly(false);
    setWidthMin("");
    setWidthMax("");
    setLengthMin("");
    setLengthMax("");
  };

  const lengthMinLabel = formatInt(CATALOG_FACTS.lengthMin, locale);

  /** The whole filter panel — one copy in the sidebar, one in the phone sheet. */
  const filterPanel: ReactNode = (
    <>
      {/* Find by machine — a buyer knows their machine before they know a
          blade size, so this sits above the dimensional filters. */}
      {machineFacets.length > 0 && (
        <div className="mb-6 pb-6 border-b border-ink-15">
          <h4 className="font-mono text-[11px] tracking-[0.12em] uppercase text-ink m-0 mb-1.5 font-semibold">
            {t("shop.findByMachine")}
          </h4>
          <p className="font-sans text-[12px] text-ink-50 m-0 mb-3">{t("shop.findByMachineHint")}</p>
          <select
            value=""
            onChange={(e) => { if (e.target.value) toggle(machines, setMachines, e.target.value); }}
            aria-label={t("shop.pickMachine")}
            className="w-full h-10 px-2.5 border border-ink-15 bg-white font-sans text-[13px] text-ink outline-none focus:border-blue cursor-pointer"
          >
            <option value="">{t("shop.pickMachineOption")}</option>
            {machineFacets
              .filter((f) => !machines.includes(f.value))
              .map((f) => (
                <option key={f.value} value={f.value}>{f.value} ({f.count})</option>
              ))}
          </select>
          {machines.length > 0 && (
            <ul className="list-none m-0 mt-2 p-0 flex flex-wrap gap-1.5">
              {machines.map((m) => (
                <li key={m}>
                  <button
                    onClick={() => toggle(machines, setMachines, m)}
                    className="inline-flex items-center gap-1.5 px-2 py-1 bg-ink text-white font-mono text-[10px] cursor-pointer border-none"
                  >
                    {m} <IconClose size={10} className="text-white/60" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Loop length — the figure that must match the machine exactly */}
      <div className="mb-6 pb-6 border-b border-ink-15">
        <h4 className="font-mono text-[11px] tracking-[0.12em] uppercase text-ink m-0 mb-1.5 font-semibold">
          {t("shop.findByLength")}
        </h4>
        <p className="font-sans text-[12px] text-ink-50 m-0 mb-3">{t("shop.findByLengthHint")}</p>

        {lengthFacets.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {lengthFacets.map((f) => {
              const on = lengthMin === String(f.value) && lengthMax === String(f.value);
              return (
                <button
                  key={f.value}
                  onClick={() => pickLength(f.value)}
                  aria-pressed={on}
                  className={`px-2 py-1 border font-mono text-[11px] tabular-nums cursor-pointer transition-colors ${
                    on
                      ? "bg-ink text-white border-ink"
                      : "bg-white text-ink-70 border-ink-15 hover:border-ink"
                  }`}
                >
                  {f.value.toLocaleString(locale)}
                  <span className={`ml-1 ${on ? "text-white/50" : "text-ink-30"}`}>{f.count}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex gap-2 items-center">
          <input
            type="number"
            inputMode="numeric"
            value={lengthMin}
            onChange={(e) => setLengthMin(e.target.value)}
            placeholder={t("shop.from")}
            aria-label={t("shop.lengthMinAria")}
            className="w-1/2 h-10 px-2.5 border border-ink-15 font-mono text-xs tabular-nums focus:border-blue outline-none"
          />
          <span className="font-mono text-ink-30 text-xs">–</span>
          <input
            type="number"
            inputMode="numeric"
            value={lengthMax}
            onChange={(e) => setLengthMax(e.target.value)}
            placeholder={t("shop.to")}
            aria-label={t("shop.lengthMaxAria")}
            className="w-1/2 h-10 px-2.5 border border-ink-15 font-mono text-xs tabular-nums focus:border-blue outline-none"
          />
        </div>
      </div>

      {/* Width */}
      <div className="mb-6 pb-6 border-b border-ink-15">
        <h4 className="font-mono text-[11px] tracking-[0.12em] uppercase text-ink m-0 mb-1.5 font-semibold">
          {t("shop.findByWidth")}
        </h4>
        <p className="font-sans text-[12px] text-ink-50 m-0 mb-3">{t("shop.findByWidthHint")}</p>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            inputMode="numeric"
            value={widthMin}
            onChange={(e) => setWidthMin(e.target.value)}
            placeholder={t("shop.from")}
            aria-label={t("shop.widthMinAria")}
            className="w-1/2 h-10 px-2.5 border border-ink-15 font-mono text-xs tabular-nums focus:border-blue outline-none"
          />
          <span className="font-mono text-ink-30 text-xs">–</span>
          <input
            type="number"
            inputMode="numeric"
            value={widthMax}
            onChange={(e) => setWidthMax(e.target.value)}
            placeholder={t("shop.to")}
            aria-label={t("shop.widthMaxAria")}
            className="w-1/2 h-10 px-2.5 border border-ink-15 font-mono text-xs tabular-nums focus:border-blue outline-none"
          />
        </div>
      </div>

      {/* Category */}
      <div className="mb-6 pb-6 border-b border-ink-15">
        <h4 className="font-mono text-[11px] tracking-[0.12em] uppercase text-ink m-0 mb-3.5 font-semibold">{t("shop.category")}</h4>
        <ul className="list-none m-0 p-0 flex flex-col gap-1">
          {filters.map((cat) => (
            <li key={cat.slug}>
              <button
                onClick={() => setActiveCategory(cat.slug)}
                aria-pressed={activeCategory === cat.slug}
                className={`w-full text-left px-2.5 py-1.5 font-sans text-[13px] border-none cursor-pointer transition-colors flex justify-between items-center gap-2 ${
                  activeCategory === cat.slug ? "bg-ink text-white" : "bg-transparent text-ink-70 hover:bg-paper"
                }`}
              >
                <span className="truncate">{cat.slug === "" ? t("shop.allCategories") : cat.label}</span>
                <span className={`font-mono text-[11px] tabular-nums shrink-0 ${activeCategory === cat.slug ? "text-white/60" : "text-ink-50"}`}>
                  {cat.count}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <FacetGroup
        title={t("shop.series")}
        facets={seriesFacets}
        selected={series}
        onToggle={(v) => toggle(series, setSeries, v)}
      />
      <FacetGroup
        title={t("shop.material")}
        facets={materialFacets}
        selected={materials}
        onToggle={(v) => toggle(materials, setMaterials, v)}
      />
      <FacetGroup
        title={t("shop.brand")}
        facets={brandFacets}
        selected={brands}
        onToggle={(v) => toggle(brands, setBrands, v)}
      />
      {/* Machines. The facet was being computed and then thrown away — it
          was never rendered, so the one filter that answers "will this fit
          my mill?" did not exist on screen. */}
      <FacetGroup
        title={t("filters.fitsMachine")}
        facets={machineFacets}
        selected={machines}
        onToggle={(v) => toggle(machines, setMachines, v)}
      />

      <label className="flex items-center gap-2.5 mb-6 pb-6 border-b border-ink-15 cursor-pointer font-sans text-[13px] text-ink-70">
        <input
          type="checkbox"
          checked={inStockOnly}
          onChange={(e) => setInStockOnly(e.target.checked)}
          className="w-3.5 h-3.5 accent-orange"
        />
        {t("shop.inStockOnly")}
      </label>
    </>
  );

  const configuratorCard = (
    <Link href="/configurator" className="block no-underline mb-6">
      <div className="bg-ink text-white p-5 hover:bg-ink-80 transition-colors">
        <div className="flex items-center gap-3 mb-3">
          <IconRuler size={24} className="text-orange" />
          <div className="font-display text-lg font-bold">{tc("configurator")}</div>
        </div>
        <p className="font-sans text-[13px] text-white/70 m-0 mb-4">{t("shop.sideCardText")}</p>
        <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.08em] uppercase text-orange">
          {t("shop.sideCardCta")} <IconArrowRight size={12} />
        </div>
      </div>
    </Link>
  );

  return (
    <>
      <PageHeader
        eyebrowNumber="№ 05"
        eyebrowLabel={tc("catalogue")}
        image="/images/hero/craftsman-using-bandsaw-for-splitting-wood-plank-i-2023-11-27-05-19-15-utc-2.avif"
        imageAlt={t("shop.heroAlt")}
        crumbs={[{ label: tc("home"), href: "/" }, { label: tc("catalogue") }]}
        title={
          <>
            {t("shop.titleLead")} <span className="text-orange-light">{t("shop.titleAccent")}</span>
          </>
        }
        description={t("shop.description")}
      />

      {/* Mode switch */}
      <div className="border-b border-ink-15 bg-paper">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 flex gap-0">
          {([
            ["stock", t("shop.modeStock"), t("shop.modeStockHint", { count: products.length })],
            ["custom", t("shop.modeCustom"), t("shop.modeCustomHint")],
          ] as const).map(([key, label, hint]) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              aria-pressed={mode === key}
              className={`px-5 md:px-7 py-4 text-left border-none cursor-pointer transition-colors ${
                mode === key
                  ? "bg-white border-b-2 border-orange -mb-px"
                  : "bg-transparent border-b-2 border-transparent hover:bg-white/60"
              }`}
            >
              <span className={`block font-display text-[15px] font-bold tracking-tight ${mode === key ? "text-ink" : "text-ink-50"}`}>
                {label}
              </span>
              <span className="block font-mono text-[10px] tracking-[0.06em] text-ink-50 mt-0.5">{hint}</span>
            </button>
          ))}
        </div>
      </div>

      {mode === "custom" ? (
        <ConfiguratorPanel />
      ) : (
      <>
      {/* Toolbar. Sticks under the header: 169-173px is the tablet/desktop header (utility
          bar + brand row + nav); a phone's header is the shorter one-row
          version, so the offset is smaller there. */}
      <div className="border-b border-ink-15 bg-white sticky top-[114px] md:top-[169px] lg:top-[173px] z-30">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 min-h-14 py-2 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Below 1024px the sidebar is not shown; the same panel opens as a sheet. */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 h-9 px-3 border border-ink-15 bg-white font-mono text-[11px] uppercase tracking-[0.08em] text-ink cursor-pointer hover:border-ink transition-colors"
            >
              {t("filters.button")}
              {filterChips.length > 0 && (
                <span className="min-w-5 h-5 px-1 inline-flex items-center justify-center bg-orange text-white text-[10px] tabular-nums">
                  {filterChips.length}
                </span>
              )}
            </button>
            <span className="font-mono text-[11px] text-ink-50 tabular-nums">
              {t("shop.count", { shown: sorted.length, total: products.length })}
            </span>
            {activeChips.map((chip) => (
              <button
                key={chip.label}
                onClick={chip.clear}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-paper font-mono text-[11px] text-ink cursor-pointer border border-ink-15 hover:border-ink transition-colors"
              >
                {chip.label} <IconClose size={11} className="text-ink-50" />
              </button>
            ))}
            {activeChips.length > 1 && (
              <button
                onClick={clearAll}
                className="font-mono text-[11px] text-orange underline cursor-pointer bg-transparent border-none"
              >
                {t("shop.clearAll")}
              </button>
            )}
          </div>
          <label className="flex items-center gap-2 font-mono text-[11px] text-ink-50">
            {t("shop.sortBy")}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="font-mono text-[11px] p-2 border border-ink-15 bg-white text-ink"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {tSort(o.msg)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-10 pb-20 md:pb-[120px] grid grid-cols-1 lg:grid-cols-[264px_1fr] gap-10">
        <aside className="hidden lg:block">
          {filterPanel}
          {configuratorCard}
        </aside>

        <div className="min-w-0">
          {sorted.length === 0 ? (
            // An empty result is the single best moment to sell the configurator:
            // the buyer has just told us exactly what they could not find.
            <div className="border border-ink-15 bg-paper p-10 text-center">
              <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-ink-50 mb-3">{t("shop.noMatches")}</div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-ink tracking-tight m-0 mb-3">
                {t("shop.emptyTitle")}
              </h2>
              <p className="font-sans text-[15px] text-ink-70 max-w-[440px] mx-auto mb-7">
                {t("shop.emptyText", { min: lengthMinLabel })}
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link href="/configurator">
                  <Btn variant="primary" size="lg" iconRight={<IconArrowRight size={16} />}>{t("shop.emptyCta")}</Btn>
                </Link>
                <button onClick={clearAll} className="bg-transparent border-none cursor-pointer">
                  <Btn variant="ghost" size="lg">{t("filters.clearAll")}</Btn>
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link href="/configurator" className="no-underline block mb-6">
                <div className="bg-paper border border-ink-15 p-5 flex items-center justify-between gap-4 hover:border-ink transition-colors">
                  <div className="flex items-center gap-4">
                    <IconRuler size={28} className="text-blue shrink-0" />
                    <div>
                      <div className="font-display text-base font-bold text-ink">{t("shop.bannerTitle")}</div>
                      <div className="font-mono text-[11px] text-ink-50 mt-0.5 tracking-[0.04em]">
                        {t("shop.bannerHint", { types: 8, min: lengthMinLabel })}
                      </div>
                    </div>
                  </div>
                  <Btn variant="primary" size="sm" iconRight={<IconArrowRight size={12} />}>{tc("configurator")}</Btn>
                </div>
              </Link>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {sorted.map((p) => (
                  <ProductCard key={p.sku} p={p} compact />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {drawerOpen && (
        <FilterDrawer
          title={t("filters.title")}
          onClose={() => setDrawerOpen(false)}
          footer={
            <div className="flex flex-col gap-2">
              <Btn variant="primary" size="lg" fullWidth onClick={() => setDrawerOpen(false)}>
                {t("filters.show", { count: sorted.length })}
              </Btn>
              {filterChips.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="font-mono text-[11px] text-orange underline cursor-pointer bg-transparent border-none py-1"
                >
                  {t("shop.clearAll")}
                </button>
              )}
            </div>
          }
        >
          {filterPanel}
          {configuratorCard}
        </FilterDrawer>
      )}
      </>
      )}
    </>
  );
}
