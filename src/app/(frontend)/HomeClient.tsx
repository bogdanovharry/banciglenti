"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";
import { SectionNumber, Placeholder, Btn, Tag } from "@/components/ui/primitives";
import { ProductCard, type ProductCardData } from "@/components/product/ProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { useCart } from "@/lib/cart";
import {
  HORIZONTAL_WOOD_BLADES,
  VERTICAL_WOOD_BLADES,
  METAL_BIMETAL_BLADES,
  METAL_CARBON_BLADES,
  MEAT_BLADES,
  BREAD_BLADES,
  calculateBladePrice,
  getUniqueValues,
  getOptionsForWidth,
  getAvailablePitches,
  findBlade,
  BGN_RATE,
} from "@/lib/pricing";
import {
  IconArrowRight, IconCheck, IconPhone, IconWood, IconMetal, IconFood,
  IconHobby, IconMachine, IconAbrasive,
} from "@/components/ui/icons";

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
  return (
    <section className="relative isolate bg-blue-deep text-white overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/hero/shutterstock_1753030058.webp"
          alt="Заваряване на банцигова лента по размер в цеха на ТЕХНОЛЕС"
          fill
          priority
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
          <SectionNumber n="№ 01" label="Режещи инструменти по поръчка" tone="light" />
          <h1 className="font-display text-5xl md:text-7xl lg:text-[92px] font-extrabold leading-[0.94] tracking-[-0.045em] mt-8 mb-7">
            Всяка лента<br />точно по<br />
            <span className={`${accent} text-orange-light`}>вашата машина.</span>
          </h1>
          <p className="font-sans text-lg leading-relaxed text-white/75 max-w-[560px] mb-10">
            Произвеждаме и заваряваме банцигови ленти по индивидуални размери за дърво, метал и
            хранителна промишленост — от 1&nbsp;650 до 12&nbsp;000&nbsp;мм, за 24&nbsp;часа.
          </p>
          <div className="flex gap-3 items-center flex-wrap">
            <Link href="/configurator">
              <Btn variant="primary" size="lg" iconRight={<IconArrowRight size={16} />}>Конфигурирай лента</Btn>
            </Link>
            <Link href="/shop"><Btn variant="ghostLight" size="lg">Разгледай каталог</Btn></Link>
          </div>
        </div>

        {/* Proof rail */}
        <div className="mt-16 md:mt-24 grid grid-cols-2 md:grid-cols-4 gap-0 border-t border-white/20">
          {[
            ["30+", "години"],
            ["12 000", "активни клиенти"],
            ["24ч", "изработка"],
            ["±0.01", "мм точност"],
          ].map(([v, l], i) => (
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
function TickerStrip() {
  const items = ["● Над 8 000 размера на склад", "● Безплатна доставка над 200 €", "● Заваряване за 4 часа", "● Техническа консултация", "● Доставка до 48ч", "● Гаранция 12 месеца"];
  return (
    <div className="bg-navy text-white overflow-hidden border-t-4 border-orange">
      <div className="flex gap-12 py-4 whitespace-nowrap font-mono text-xs tracking-[0.1em] uppercase" style={{ animation: "tl-marquee 45s linear infinite" }}>
        {[...items, ...items, ...items].map((t, i) => (
          <span key={i} className={i % 7 === 0 ? "opacity-100" : "opacity-70"}>{t}</span>
        ))}
      </div>
    </div>
  );
}

// ========== INDUSTRIES ==========
// Each industry carries a photograph of that industry's actual work. A buyer
// recognises their own shop floor faster than they parse an icon, and the
// licensed photography was already sitting unused in the repo.
const industriesBase = [
  { name: "Дърво", Icon: IconWood, desc: "Банцигови ленти, циркулярни триони, абрихт ножове за всякаква дървообработка.", href: "/category/dyrvo", img: "/images/hero/craftsman-using-bandsaw-for-splitting-wood-plank-i-2023-11-27-05-19-15-utc-2.avif" },
  { name: "Метал", Icon: IconMetal, desc: "Биметални M42/M51 и въглеродни CS ленти за професионална металообработка.", href: "/category/metal", img: "/images/hero/metal-cutting-2023-11-27-04-59-56-utc-2.avif" },
  { name: "Храни", Icon: IconFood, desc: "Ленти и ножове за месо, риба, хляб. Резервни части за слайсъри.", href: "/category/hrani", img: "/images/hero/shutterstock_1313584316.avif" },
  { name: "Хоби банциг", Icon: IconHobby, desc: "Ленти за Einhell, Parkside, Scheppach и домашни работилници.", href: "/category/hobi-bantsig", img: "/images/hero/hardworking-man-doing-his-job-woodshop-2.avif" },
  { name: "Машини", Icon: IconMachine, desc: "Заточни машини, лентови триони, консумативи и резервни части.", href: "/category/mashini", img: "/images/hero/man_working_bandsaw_blades.avif" },
  { name: "Абразиви", Icon: IconAbrasive, desc: "Диамантени и CBN заточни дискове, камъни, полиращи състави.", href: "/category/abrazivi", img: "/images/hero/punching.webp" },
];

function IndustriesBlock({ counts }: { counts: Record<string, number> }) {
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
            <SectionNumber n="№ 02" label="Шест индустрии · един доставчик" />
            <h2 className="font-display text-4xl md:text-5xl lg:text-[64px] leading-none tracking-[-0.035em] font-bold mt-7 text-ink">
              Каталог, организиран<br />по това с което <span className={`${accent} text-orange`}>работите</span>.
            </h2>
          </Reveal>
          <Reveal as="p" delay={120} className="font-sans text-base leading-relaxed text-ink-70 max-w-[480px] lg:justify-self-end">
            Не се налага да знаете стандарти и обозначения — изберете вашата индустрия и филтрирайте по машина, материал или размер.
          </Reveal>
        </div>

        <Reveal delay={80} y={0} className="tl-stagger grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-ink-15">
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
                  <div className="font-display text-3xl lg:text-[34px] font-bold tracking-tight mb-2">{c.name}</div>
                  <p className="font-sans text-sm leading-snug text-white/70 m-0 max-w-[34ch]">{c.desc}</p>
                  <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center font-mono text-[11px] text-white/60 tracking-[0.04em]">
                    {/* Категории без наличен склад се предлагат по заявка —
                        показването на „0 артикула“ убива интереса без причина. */}
                    <span className="tabular-nums">
                      {c.count > 0 ? `${c.count} ${c.count === 1 ? "артикул" : "артикула"}` : "по заявка"}
                    </span>
                    <span className="text-orange-light flex items-center gap-1.5">
                      Разгледай
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
/**
 * A working quote, not a teaser. This previously invented its price with
 * `(len/100) * (w/10) * 0.42`, offered any width from 6 to 80 mm and any TPI
 * from 1 to 14 — combinations that are not in the price list and cannot be
 * made — and had no way to carry the result anywhere.
 *
 * It now runs on the same tables and the same `calculateBladePrice` as
 * /configurator, so every option shown is a blade that exists and every figure
 * is the real one, itemised. The result goes straight into the cart.
 */
const QUOTE_TYPES = [
  { key: "wood-h", label: "Дърво · хоризонтален", blades: HORIZONTAL_WOOD_BLADES },
  { key: "wood-v", label: "Дърво · вертикален", blades: VERTICAL_WOOD_BLADES },
  { key: "metal", label: "Метал · биметал", blades: METAL_BIMETAL_BLADES },
] as const;

const MIN_LEN = 1650;
const MAX_LEN = 12000;

/** Keeps a selection valid as its parent selection changes, without effects. */
function pick<T>(options: readonly T[], current: T | null): T | undefined {
  if (current !== null && options.includes(current)) return current;
  return options[0];
}

function CustomOrderBlock() {
  const [typeKey, setTypeKey] = useState<(typeof QUOTE_TYPES)[number]["key"]>("wood-h");
  const [selWidth, setSelWidth] = useState<number | null>(null);
  const [selThickness, setSelThickness] = useState<number | null>(null);
  const [selBrand, setSelBrand] = useState<string | null>(null);
  const [selPitch, setSelPitch] = useState<string | null>(null);
  const [lengthInput, setLengthInput] = useState("3810");
  const [welding, setWelding] = useState(true);
  const [setting, setSetting] = useState(true);
  const [sharpening, setSharpening] = useState(false);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  const blades = QUOTE_TYPES.find((t) => t.key === typeKey)!.blades;

  // Each level is derived from the one above, so an impossible combination
  // cannot be selected in the first place.
  const widths = useMemo(() => getUniqueValues(blades).widths, [blades]);
  const width = pick(widths, selWidth)!;

  const { thicknesses, brands } = useMemo(
    () => getOptionsForWidth(blades, width),
    [blades, width],
  );
  const thickness = pick(thicknesses, selThickness)!;
  const brand = pick(brands, selBrand)!;

  const pitches = useMemo(
    () => getAvailablePitches(blades, width, thickness, brand),
    [blades, width, thickness, brand],
  );
  const pitch = pick(pitches, selPitch);

  const blade = pitch ? findBlade(blades, width, thickness, pitch, brand) : undefined;

  const length = Number(lengthInput);
  const lengthValid = Number.isFinite(length) && length >= MIN_LEN && length <= MAX_LEN;

  const quote =
    blade && lengthValid
      ? calculateBladePrice(blade, length, { welding, sharpening, heatTreatment: false, setting })
      : null;

  const handleAdd = () => {
    if (!blade || !quote || !lengthValid) return;
    addItem({
      sku: `CUSTOM-${brand}-${width}x${thickness}-${pitch}-${length}`,
      name: `Банцигова лента ${brand} ${width}×${thickness} мм · стъпка ${pitch}`,
      dim: `${length} × ${width} × ${thickness} мм`,
      price: quote.totalWithoutVat,
      quantity: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  const selectClass =
    "w-full h-11 px-3 border border-ink-15 bg-white font-mono text-[13px] text-ink outline-none focus:border-blue transition-colors cursor-pointer";

  return (
    <section id="custom" className="bg-ink text-white py-20 md:py-[120px] relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "linear-gradient(180deg, transparent, #000 20%, #000 80%, transparent)",
        }}
      />
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-20">
          <Reveal>
            <SectionNumber n="№ 03" label="Изчисли цена" tone="light" />
            <h2 className="font-display text-4xl md:text-5xl lg:text-7xl leading-none tracking-[-0.04em] font-bold mt-7 mb-6">
              Кажи ни размера.<br />Ние го <span className={`${accent} text-orange-light`}>сглобяваме.</span>
            </h2>
            <p className="font-sans text-[17px] leading-relaxed text-white/70 max-w-[480px] mb-10">
              Заваряваме банциговата лента точно по вашата машина — от единичен брой до серия.
              Цената по-долу е по нашия актуален ценоразпис, не приблизителна.
            </p>
            <ul className="list-none p-0 m-0 flex flex-col gap-4">
              {[
                ["Цена от ценоразписа", "материал + заваряване + обработки"],
                ["Прецизно заваряване", "индукция + shot-blasting"],
                ["Готово за 24 часа", "доставка 24–48ч в България"],
                ["Връщане в 30 дни", "ако размерът не пасне"],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-4 py-4 border-b border-white/[0.08]">
                  <IconCheck size={22} className="text-orange-light shrink-0 mt-0.5" />
                  <div>
                    <div className="font-display text-[17px] font-semibold">{t}</div>
                    <div className="font-sans text-[13px] text-white/55 mt-0.5">{d}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Quote card */}
          <div className="bg-white text-ink p-6 md:p-9 relative">
            <div className="flex justify-between items-center mb-6">
              <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-50">Бърза оферта</div>
              <Tag tone="ok">Готово за 24ч</Tag>
            </div>

            {/* Type */}
            <div className="grid grid-cols-3 gap-1.5 mb-6">
              {QUOTE_TYPES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    setTypeKey(t.key);
                    setSelWidth(null);
                    setSelThickness(null);
                    setSelBrand(null);
                    setSelPitch(null);
                  }}
                  className={`py-2.5 px-2 font-mono text-[10px] leading-tight tracking-[0.04em] uppercase cursor-pointer border transition-colors ${
                    typeKey === t.key
                      ? "bg-ink text-white border-ink"
                      : "bg-white text-ink-70 border-ink-15 hover:border-ink-30"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-ink-50 block mb-1.5">Широчина · мм</span>
                <select
                  className={selectClass}
                  value={width}
                  onChange={(e) => { setSelWidth(Number(e.target.value)); setSelThickness(null); setSelBrand(null); setSelPitch(null); }}
                >
                  {widths.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-ink-50 block mb-1.5">Дебелина · мм</span>
                <select
                  className={selectClass}
                  value={thickness}
                  onChange={(e) => { setSelThickness(Number(e.target.value)); setSelPitch(null); }}
                >
                  {thicknesses.map((t) => <option key={t} value={t}>{t.toFixed(2)}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-ink-50 block mb-1.5">Марка</span>
                <select
                  className={selectClass}
                  value={brand}
                  onChange={(e) => { setSelBrand(e.target.value); setSelPitch(null); }}
                >
                  {brands.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-ink-50 block mb-1.5">Стъпка / зъб</span>
                <select className={selectClass} value={pitch ?? ""} onChange={(e) => setSelPitch(e.target.value)}>
                  {pitches.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
            </div>

            {/* Length is typed, not dragged — buyers know their exact length. */}
            <label className="block mt-4">
              <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-ink-50 block mb-1.5">
                Обща дължина · мм
              </span>
              <input
                type="number"
                inputMode="numeric"
                value={lengthInput}
                min={MIN_LEN}
                max={MAX_LEN}
                onChange={(e) => setLengthInput(e.target.value)}
                aria-invalid={!lengthValid}
                className={`w-full h-11 px-3 border bg-white font-mono text-[15px] font-semibold text-ink tabular-nums outline-none transition-colors ${
                  lengthValid ? "border-ink-15 focus:border-blue" : "border-danger"
                }`}
              />
              <span className={`font-mono text-[10px] mt-1.5 block ${lengthValid ? "text-ink-50" : "text-danger"}`}>
                {lengthValid ? `Заваряваме от ${MIN_LEN} до ${MAX_LEN} мм` : `Дължината трябва да е между ${MIN_LEN} и ${MAX_LEN} мм`}
              </span>
            </label>

            {/* Processing */}
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
              {([
                ["Заваряване", welding, setWelding],
                ["Чапраз", setting, setSetting],
                ["Заточване", sharpening, setSharpening],
              ] as const).map(([label, val, set]) => (
                <label key={label} className="flex items-center gap-2 font-sans text-[13px] text-ink-70 cursor-pointer">
                  <input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)} className="w-3.5 h-3.5 accent-orange" />
                  {label}
                </label>
              ))}
            </div>

            {/* Itemised price */}
            <div className="mt-6 p-5 bg-paper">
              {quote ? (
                <>
                  <div className="flex flex-col gap-1.5 font-mono text-[11px] text-ink-70 mb-4 pb-4 border-b border-ink-15">
                    <div className="flex justify-between"><span>Лента {(length / 1000).toFixed(2)} м</span><span className="tabular-nums">{quote.bladePrice.toFixed(2)} €</span></div>
                    {welding && <div className="flex justify-between"><span>Заваряване</span><span className="tabular-nums">{quote.weldingPrice.toFixed(2)} €</span></div>}
                    {setting && <div className="flex justify-between"><span>Чапраз</span><span className="tabular-nums">{quote.settingPrice.toFixed(2)} €</span></div>}
                    {sharpening && <div className="flex justify-between"><span>Заточване</span><span className="tabular-nums">{quote.sharpeningPrice.toFixed(2)} €</span></div>}
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">Цена без ДДС</div>
                      <div className="font-display text-4xl font-extrabold tracking-tight text-ink tabular-nums leading-none mt-1">
                        {quote.totalWithoutVat.toFixed(2)} <span className="text-sm text-ink-50 font-normal">€</span>
                      </div>
                      <div className="font-mono text-[10px] text-ink-50 mt-1.5 tabular-nums">
                        {(quote.totalWithoutVat * BGN_RATE).toFixed(2)} лв · с ДДС {quote.totalWithVat.toFixed(2)} €
                      </div>
                    </div>
                    <Btn variant="primary" size="lg" onClick={handleAdd} iconRight={<IconArrowRight size={16} />}>
                      {added ? "✓ Добавено" : "Добави"}
                    </Btn>
                  </div>
                </>
              ) : (
                <div className="font-sans text-sm text-ink-70">
                  Тази комбинация не е в ценоразписа.{" "}
                  <Link href="/contact" className="text-orange underline">Запитайте ни</Link> — правим и нестандартни.
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-between items-center font-mono text-[10px] text-ink-50 tracking-[0.06em]">
              <span className="tabular-nums">
                {lengthValid ? length : "—"} × {width} × {thickness.toFixed(2)} мм · {brand}
              </span>
              <Link href="/configurator" className="text-orange underline">Още 5 типа →</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ========== BESTSELLERS ==========

function BestsellersBlock({ products }: { products: ProductCardData[] }) {
  const [filter, setFilter] = useState("Всички");
  // Only offer a tab if the catalogue actually has products behind it.
  const tabs = ["Всички", ...Array.from(new Set(products.map((p) => p.industry)))];
  const filtered = filter === "Всички" ? products : products.filter((b) => b.industry === filter);

  return (
    <section className="bg-paper py-20 md:py-[120px]">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-14">
          <Reveal>
            <SectionNumber n="№ 04" label="Най-търсени · Април 2026" />
            <h2 className="font-display text-4xl md:text-[56px] leading-none tracking-[-0.035em] font-bold mt-7 text-ink">
              Каквото пазарят<br />професионалистите.
            </h2>
          </Reveal>
          <div className="flex gap-1 bg-white border border-ink-15 p-1">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-4 py-2.5 font-mono text-[11px] tracking-[0.1em] uppercase cursor-pointer border-none transition-colors ${filter === t ? "bg-ink text-white" : "bg-transparent text-ink-70 hover:text-ink"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p, i) => (
            <Reveal key={p.sku} delay={i * 70}>
              <ProductCard p={p} />
            </Reveal>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link href="/shop"><Btn variant="dark" size="lg" iconRight={<IconArrowRight size={16} />}>Виж целия каталог</Btn></Link>
        </div>
      </div>
    </section>
  );
}

// ========== EXPERTISE ==========
function ExpertiseBlock() {
  return (
    <section className="bg-navy text-white py-20 md:py-[120px]">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-20 items-center">
        <Reveal>
          <Placeholder
            tone="ink"
            ratio="4/5"
            src="/images/hero/man_working_bandsaw_blades.avif"
            alt="Производство и заваряване на банцигови ленти в цеха в Габрово"
            sizes="(max-width: 1024px) 100vw, 48vw"
          />
        </Reveal>
        <Reveal delay={120}>
          <SectionNumber n="№ 05" label="От 1993 · Габрово" tone="light" />
          <h2 className="font-display text-4xl md:text-5xl lg:text-7xl leading-none tracking-[-0.04em] font-bold mt-7 mb-8">
            Най-големият склад<br />за режещи инструменти<br />
            <span className={`${accent} text-orange-light`}>на Балканите.</span>
          </h2>
          <p className="font-sans text-[17px] leading-relaxed text-white/75 max-w-[560px] mb-10">
            30 години доставяме режещи инструменти на дървопреработвателни заводи, металообработващи цехове и хранителни производители.
          </p>
          <div className="grid grid-cols-2 gap-px bg-white/10 border border-white/10">
            {[
              ["2 400м²", "складова площ"],
              ["8 000+", "размера на склад"],
              ["156", "партньори в ЕС"],
              ["99.2%", "поръчки в срок"],
            ].map(([v, l]) => (
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
const SERVICE_TABLES = [
  HORIZONTAL_WOOD_BLADES,
  VERTICAL_WOOD_BLADES,
  METAL_BIMETAL_BLADES,
  METAL_CARBON_BLADES,
  MEAT_BLADES,
  BREAD_BLADES,
].flat();

/** Lowest non-zero rate for a service across the whole price list. */
function minRate(key: "welding" | "sharpening" | "setting" | "heatTreatment") {
  const rates = SERVICE_TABLES.map((b) => b[key]).filter((n) => n > 0);
  return rates.length ? Math.min(...rates) : 0;
}

const SERVICES = [
  {
    name: "Заваряване по размер",
    detail: "Индукционно заваряване и shot-blasting на шева. Всяка дължина между 1 650 и 12 000 мм.",
    unit: "на брой",
    rate: minRate("welding"),
    tag: "24ч",
  },
  {
    name: "Заточване",
    detail: "CBN и диамантени дискове. Възстановява геометрията на зъба вместо да купувате нова лента.",
    unit: "на метър",
    rate: minRate("sharpening"),
    tag: null,
  },
  {
    name: "Чапраз",
    detail: "Разводка по спецификация на машината — определя ширината на реза и правотата.",
    unit: "на метър",
    rate: minRate("setting"),
    tag: null,
  },
  {
    name: "Термообработка",
    detail: "Отпускане на гърба след заваряване. Удължава живота на лентата при тежък режим.",
    unit: "на метър",
    rate: minRate("heatTreatment"),
    tag: null,
  },
];

function ServicesBlock() {
  return (
    <section className="bg-blue-deep text-white py-20 md:py-[120px] relative overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-10 lg:gap-16 items-stretch">
          {/* Photograph carries the left column full-bleed to the section edge */}
          <Reveal className="relative min-h-[320px] lg:min-h-full">
            <Image
              src="/images/hero/punching.webp"
              alt="Заточване на циркулярен диск в цеха"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-blue mix-blend-color opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-deep/85 via-blue-deep/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-7">
              <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-white/60 mb-2">
                Цех · Габрово
              </div>
              <div className="font-display text-2xl font-bold tracking-tight">
                Носите лентата. Връщате я в работа.
              </div>
            </div>
          </Reveal>

          <div>
            <Reveal>
              <SectionNumber n="№ 06" label="Услуги в цеха" tone="light" />
              <h2 className="font-display text-4xl md:text-5xl lg:text-[56px] leading-none tracking-[-0.035em] font-bold mt-7 mb-5">
                Не само продаваме.<br />
                <span className={`${accent} text-orange-light`}>Обработваме.</span>
              </h2>
              <p className="font-sans text-[17px] leading-relaxed text-white/70 max-w-[520px] mb-10">
                Заточена лента реже като нова на част от цената. Цените са от актуалния ценоразпис —
                точната сума зависи от широчината и дължината.
              </p>
            </Reveal>

            <Reveal delay={80} y={0} className="tl-stagger border-t border-white/15">
              {SERVICES.map((s) => (
                <div
                  key={s.name}
                  className="group grid grid-cols-[1fr_auto] gap-6 items-baseline py-6 border-b border-white/15"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="font-display text-xl md:text-[22px] font-semibold tracking-tight m-0">
                        {s.name}
                      </h3>
                      {s.tag && (
                        <span className="font-mono text-[9px] tracking-[0.12em] uppercase bg-orange text-white px-1.5 py-0.5">
                          {s.tag}
                        </span>
                      )}
                    </div>
                    <p className="font-sans text-[14px] leading-snug text-white/60 m-0 max-w-[46ch]">
                      {s.detail}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-white/45">от</div>
                    <div className="font-display text-2xl md:text-[26px] font-bold tracking-tight tabular-nums leading-none mt-0.5">
                      {s.rate.toFixed(2)}
                      <span className="text-sm font-normal text-white/50 ml-1">€</span>
                    </div>
                    <div className="font-mono text-[9px] text-white/45 mt-1">{s.unit}</div>
                  </div>
                </div>
              ))}
            </Reveal>

            <div className="mt-8 flex gap-3 flex-wrap">
              <Link href="/contact">
                <Btn variant="primary" size="lg" iconRight={<IconArrowRight size={16} />}>
                  Заяви обработка
                </Btn>
              </Link>
              <a href="tel:066800822">
                <Btn variant="ghostLight" size="lg" icon={<IconPhone size={16} />}>066 800 822</Btn>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ========== BLOG ==========
function BlogTeaser() {
  const posts = [
    { cat: "Техническо", date: "18.04.2026", title: "Как да изберете правилната широчина на банциговата лента", read: "6 мин", img: "/images/hero/shutterstock_1510054877.avif" },
    { cat: "Казус", date: "02.04.2026", title: "Защо M42 е по-добро от M51 за въглеродна стомана", read: "4 мин", img: "/images/hero/metal-cutting-2023-11-27-04-59-56-utc-2.avif" },
    { cat: "Ръководство", date: "27.03.2026", title: "5-те най-чести причини за скъсване на лента", read: "8 мин", img: "/images/hero/shutterstock_1753030058.webp" },
  ];
  return (
    <section className="bg-bone py-20 md:py-[120px]">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-14">
          <Reveal>
            <SectionNumber n="№ 07" label="Journal · ръководства" />
            <h2 className="font-display text-4xl md:text-[56px] leading-none tracking-[-0.035em] font-bold mt-7 text-ink">Техническо ноу-хау.</h2>
          </Reveal>
          <Link href="/blog"><Btn variant="ghost" size="md" iconRight={<IconArrowRight size={14} />}>Всички статии</Btn></Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((p, i) => (
            <Reveal key={i} delay={i * 80}>
            <article className="group bg-white border border-ink-15 overflow-hidden cursor-pointer flex flex-col h-full hover:border-ink hover:shadow-[0_18px_40px_-22px_rgba(17,17,17,0.45)] hover:-translate-y-1 transition-all duration-300">
              <div className="overflow-hidden">
                <div className="transition-transform duration-500 ease-out group-hover:scale-[1.04]">
                  <Placeholder tone="paper" ratio="4/3" src={p.img} alt={p.title} sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
              </div>
              <div className="p-7 flex flex-col gap-3">
                <div className="flex justify-between font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">
                  <span className="text-orange">{p.cat}</span>
                  <span>{p.date} · {p.read}</span>
                </div>
                <h3 className="font-display text-[22px] leading-tight tracking-tight font-semibold m-0 text-ink">{p.title}</h3>
                <div className="mt-2 font-mono text-[11px] text-orange flex items-center gap-1.5 tracking-[0.05em]">
                  Прочети <IconArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            </article>
            </Reveal>
          ))}
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
              № 08 — Техническа поддръжка
            </div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-[52px] leading-[1.02] tracking-[-0.035em] font-bold m-0 max-w-[16ch]">
              Търсите размер, който не е в каталога?
            </h2>
            <p className="font-sans text-[16px] leading-relaxed text-white/80 max-w-[440px] mt-5">
              Инженер вдига телефона и оразмерява лентата с вас. Безплатно, включително ако
              машината е стара и няма маркировка.
            </p>
          </Reveal>

          {/* Call panel — the number set as display type, not as a button label */}
          <Reveal delay={120} className="w-full lg:w-auto">
            <div className="bg-ink text-white p-7 md:p-8 lg:min-w-[380px]">
              <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-white/50 mb-3">
                Пряка линия · Пн–Пт 8:00–17:30
              </div>
              <a
                href="tel:066800822"
                className="group flex items-center gap-3 no-underline text-white"
              >
                <IconPhone size={26} className="text-orange shrink-0 transition-transform duration-300 group-hover:-rotate-12" />
                <span className="font-display text-[34px] md:text-[40px] font-extrabold tracking-tight tabular-nums leading-none group-hover:text-orange-light transition-colors">
                  066 800 822
                </span>
              </a>
              <a
                href="tel:0878800162"
                className="block font-mono text-[13px] text-white/60 hover:text-white no-underline mt-3 tabular-nums transition-colors"
              >
                +359 878 800 162 · мобилен
              </a>
              <div className="mt-6 pt-6 border-t border-white/15">
                <Link href="/contact" className="block">
                  <Btn variant="ghostLight" size="md" fullWidth iconRight={<IconArrowRight size={14} />}>
                    Или изпратете запитване
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
      <CustomOrderBlock />
      <BestsellersBlock products={bestsellers} />
      <ExpertiseBlock />
      <ServicesBlock />
      <BlogTeaser />
      <ContactCTA />
    </>
  );
}
