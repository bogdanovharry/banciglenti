"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Btn } from "@/components/ui/primitives";
import { IconArrowRight, IconEdge, IconRuler } from "@/components/ui/icons";
import { useCart } from "@/lib/cart";
import {
  VERTICAL_WOOD_BLADES,
  HORIZONTAL_WOOD_BLADES,
  METAL_BIMETAL_BLADES,
  METAL_CARBON_BLADES,
  MEAT_BLADES,
  BREAD_BLADES,
  TEXTILE_BLADES,
  calculateBladePrice,
  getUniqueValues,
  getOptionsForWidth,
  getAvailablePitches,
  findBlade,
  isProfilePitch,
  pitchLabel,
  type BladeConfig,
} from "@/lib/pricing";
import { MAX_CUSTOM_LENGTH, MIN_CUSTOM_LENGTH, type BladeTableKey } from "@/lib/order-pricing";
import { usePrices } from "@/lib/market-context";
import { DualPrice } from "@/components/ui/DualPrice";
import { MATERIAL_EDGE_GUIDE, bladeGuide, edgeKind } from "@/lib/blade-guide";
import Image from "next/image";

// Prices here are quoted at the consumer rate of the market being served (see
// DualPrice). Business customers in another EU state are reverse charged at 0%,
// but the configurator quotes before a customer is known — checkout is where a
// validated VAT number would change it.

// ===== Configurator types =====
type ConfigType = "wood-h" | "wood-v" | "metal-bi" | "metal-cs" | "hobby" | "meat" | "bread" | "slicer";

/**
 * Tab order only. The label and subtitle come from `configurator.tabs.<key>`,
 * so a Romanian buyer sees "Lemn — Orizontal" rather than Cyrillic they cannot
 * read on the one screen that actually sells.
 *
 * The "slicer" key was labelled "Слайсъри", which named a machine this tab has
 * never sold blades for. What is actually priced here is band knives for soft
 * materials, and the label now says so in every language.
 */
const TAB_ORDER: ConfigType[] = [
  "wood-h", "wood-v", "metal-bi", "metal-cs", "hobby", "meat", "bread", "slicer",
];

/**
 * The hobby tab now quotes from METAL_CARBON_BLADES like every other tab.
 *
 * It used to be its own form with an invented formula —
 * `(1.2 + width * 0.05) * length / 1000` — which quoted 2.24 EUR for a blade
 * the catalogue sells at 6.00, ignored the thickness, pitch and all four
 * process checkboxes it rendered, and had no onClick on its Add button. Its
 * dropdowns offered 16/19 mm and 10/18/24 TPI, none of which exist in any
 * price table, and listed machine brands where every other tab lists the
 * steel. A form that cannot be bought from and lies about the price is worse
 * than no form.
 */

function Select({ label, options, required, value, onChange, format }: {
  label: string; options: string[]; required?: boolean;
  value: string; onChange: (v: string) => void;
  /** Shows something other than the stored value — tooth profiles are codes. */
  format?: (v: string) => string;
}) {
  const t = useTranslations("configurator");
  return (
    <div>
      <label className="block font-mono text-[10px] tracking-[0.14em] uppercase text-ink-50 mb-2">
        {label} {required && <span className="text-orange">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-12 px-3.5 border border-ink-15 bg-white font-sans text-[15px] text-ink outline-none focus:border-blue hover:border-ink-30 transition-colors cursor-pointer"
      >
        <option value="">{t("field.choose")}</option>
        {options.map((o) => (
          <option key={o} value={o}>{format ? format(o) : o}</option>
        ))}
      </select>
    </div>
  );
}

/**
 * The loop length, which is the one field with a floor under it.
 *
 * The workshop welds from 1 000 mm up — below that there is no machine the
 * loop will go round. The server has always enforced it (MIN_CUSTOM_LENGTH),
 * but the form did not, so a 400 mm blade could be configured, priced, added
 * to the cart and only rejected at checkout. The rule is stated up front and
 * the same constant is used on both sides, so the two can never disagree.
 */
function LengthInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const t = useTranslations("configurator");
  const tooShort = value > 0 && value < MIN_CUSTOM_LENGTH;
  const tooLong = value > MAX_CUSTOM_LENGTH;

  return (
    <div>
      <label className="block font-mono text-[10px] tracking-[0.14em] uppercase text-ink-50 mb-2">
        {t("field.length")} <span className="text-orange">*</span>
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(+e.target.value)}
          min={MIN_CUSTOM_LENGTH}
          max={MAX_CUSTOM_LENGTH}
          step={10}
          aria-invalid={tooShort || tooLong}
          className={`w-full h-12 px-3.5 border bg-white font-mono text-[15px] tabular-nums text-ink outline-none transition-colors ${
            tooShort || tooLong ? "border-orange" : "border-ink-15 focus:border-blue hover:border-ink-30"
          }`}
          placeholder={String(MIN_CUSTOM_LENGTH)}
        />
        <span className="font-mono text-sm text-ink-50 shrink-0">{t("field.mm")}</span>
      </div>

      {tooShort ? (
        <p className="font-sans text-[12px] leading-snug text-orange mt-2 mb-0">
          {t("length.tooShort", { min: MIN_CUSTOM_LENGTH })}
        </p>
      ) : tooLong ? (
        <p className="font-sans text-[12px] leading-snug text-orange mt-2 mb-0">
          {t("length.tooLong", { max: MAX_CUSTOM_LENGTH })}
        </p>
      ) : (
        <p className="font-sans text-[12px] leading-snug text-ink-50 mt-2 mb-0">
          {t("length.hint", { min: MIN_CUSTOM_LENGTH })}
        </p>
      )}
    </div>
  );
}

/** A length the workshop will actually take, and the server will accept. */
const isWeldableLength = (mm: number) => mm >= MIN_CUSTOM_LENGTH && mm <= MAX_CUSTOM_LENGTH;

function Checkbox({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer font-sans text-sm text-ink group select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <span
        aria-hidden
        className={`w-4 h-4 shrink-0 border transition-colors ${checked ? "bg-orange border-orange" : "border-ink-30 group-hover:border-ink"}`}
      />
      <span className={checked ? "text-ink" : "text-ink-70"}>{label}</span>
    </label>
  );
}

function QuantityStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const t = useTranslations("configurator");
  return (
    <div>
      <label className="block font-mono text-[10px] tracking-[0.14em] uppercase text-ink-50 mb-2">{t("field.quantity")}</label>
      <div className="inline-flex items-center border border-ink-15 bg-white">
        <button
          onClick={() => onChange(Math.max(1, value - 1))}
          className="w-12 h-12 flex items-center justify-center bg-ink text-white border-none cursor-pointer text-lg font-bold hover:bg-orange transition-colors"
        >
          −
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Math.max(1, +e.target.value || 1))}
          className="w-14 h-12 text-center border-none font-mono text-base font-semibold tabular-nums outline-none"
          min={1}
        />
        <button
          onClick={() => onChange(value + 1)}
          className="w-12 h-12 flex items-center justify-center bg-ink text-white border-none cursor-pointer text-lg font-bold hover:bg-orange transition-colors"
        >
          +
        </button>
        <span className="px-3 font-sans text-sm text-ink-50">{t("field.pieces")}</span>
      </div>
    </div>
  );
}

/**
 * What you have actually configured, shown the moment the four fields resolve
 * to a real price-table row.
 *
 * The configurator could always price a blade but never say what it was — a
 * buyer picking "38 × 1.14, Kodiak, 22.2" saw a number and no confirmation
 * they had chosen the right thing for their timber. This is the answer the
 * counter would give: the series, what that width can and cannot do, and what
 * the chosen tooth pitch or edge profile is actually for.
 *
 * The whole row goes to bladeGuide(), not just the brand — width and profile
 * are what decide the job, so they are what decide the copy.
 */
function BladePreview({
  table,
  blade,
  length,
}: {
  table: BladeTableKey;
  blade: BladeConfig;
  length: number;
}) {
  const t = useTranslations("configurator");
  const guide = bladeGuide(table, blade);
  const kind = edgeKind(table, blade.pitch);
  // "3 TPI" is a tooth spacing; "Изпъкнала вълна" is a ground shape. Naming a
  // pitch a profile reads as a mistake to anyone who buys these.
  const isProfile = kind === "straight" || kind === "wave" || kind === "scallop" || kind === "convex";

  return (
    <div className="sm:col-span-2 mt-2 border border-ink-15 bg-paper flex flex-col sm:flex-row">
      <div className="sm:w-[190px] shrink-0 bg-white border-b sm:border-b-0 sm:border-r border-ink-15 p-5 flex items-center justify-center">
        <Image
          src={guide.image}
          alt={guide.name}
          width={190}
          height={190}
          className="w-full h-auto max-h-[150px] object-contain mix-blend-multiply"
        />
      </div>

      <div className="p-5 md:p-6 min-w-0">
        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-50">
          {guide.type} · {guide.application}
        </div>
        {/* The name, with the edge drawn next to it — the profile is a shape,
            and the shape is faster to read than its name. */}
        <div className="flex items-center gap-3 flex-wrap mt-1">
          <span className="font-display text-xl font-bold tracking-tight text-ink">
            {guide.name}
          </span>
          {kind !== "none" && (
            <span className="inline-flex items-center gap-1.5 border border-ink-15 bg-white px-2 py-1">
              <IconEdge kind={kind} size={40} className="text-ink" aria-hidden />
              <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-ink-70">
                {pitchLabel(blade.pitch)}
              </span>
            </span>
          )}
        </div>
        <div className="font-mono text-[11px] text-ink-70 tabular-nums mt-1.5">
          {blade.width} × {blade.thickness} {t("field.mm")} ·{" "}
          {isProfile ? t("preview.profile") : t("preview.pitch")} {pitchLabel(blade.pitch)}
          {length > 0 && <> · {t("preview.loop", { length })}</>}
        </div>

        <p className="font-sans text-[13px] leading-relaxed text-ink-70 mt-3.5 mb-0 max-w-[60ch]">
          {guide.description}
        </p>

        {guide.pitchNote && (
          <p className="font-sans text-[13px] leading-relaxed text-ink mt-3 mb-0 border-l-2 border-orange pl-3.5 max-w-[60ch]">
            {guide.pitchNote}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Which grind for which material, on the soft-materials tab.
 *
 * The four edges sit on one axis — how hard the edge bites — and the material
 * picks the point on it. Only the knife edge is priced in the table today, so
 * the other three are marked as quoted on enquiry rather than quietly omitted:
 * a customer cutting felt or rubber hose should learn that the right blade
 * exists, not conclude we do not make it.
 */
function EdgeProfileGuide() {
  const t = useTranslations("configurator");
  return (
    <div className="mt-10 border-t border-ink-15 pt-8">
      <h3 className="font-display text-lg font-bold tracking-tight text-ink m-0">
        {t("edgeGuide.title")}
      </h3>
      <p className="font-sans text-sm text-ink-50 mt-1.5 mb-6 max-w-[70ch]">
        {t("edgeGuide.intro")}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-ink-15 border border-ink-15">
        {MATERIAL_EDGE_GUIDE.map((edge) => (
          <div key={edge.code} className="bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <IconEdge kind={edge.kind} size={56} className="text-ink" aria-hidden />
              <span
                className={`font-mono text-[9px] tracking-[0.12em] uppercase px-1.5 py-0.5 border ${
                  edge.stocked ? "text-orange border-orange" : "text-ink-50 border-ink-15"
                }`}
              >
                {edge.stocked ? t("edgeGuide.stocked") : t("edgeGuide.onRequest")}
              </span>
            </div>
            <div className="font-display text-base font-bold tracking-tight text-ink mt-3">
              {edge.name}
            </div>
            <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-ink-50 mt-1.5 leading-relaxed">
              {edge.materials}
            </div>
            <p className="font-sans text-[13px] leading-relaxed text-ink-70 mt-3 mb-0">
              {edge.note}
            </p>
          </div>
        ))}
      </div>

      <p className="font-sans text-[13px] leading-relaxed text-ink-50 mt-5 mb-0 max-w-[70ch]">
        {t("edgeGuide.footnote")}
      </p>
    </div>
  );
}

// ===== Per-type configurator forms =====
function WoodConfigurator({ type }: { type: "h" | "v" }) {
  const t = useTranslations("configurator");
  const tc = useTranslations("common");
  const { price } = usePrices();
  const blades = type === "v" ? VERTICAL_WOOD_BLADES : HORIZONTAL_WOOD_BLADES;

  const { widths } = getUniqueValues(blades);

  const [width, setWidth] = useState("");
  const [thickness, setThickness] = useState("");
  const [pitch, setPitch] = useState("");
  const [brand, setBrand] = useState("");
  const [length, setLength] = useState(0);
  const [qty, setQty] = useState(1);
  const [welding, setWelding] = useState(true);
  const [setting, setSetting] = useState(true);
  const [sharpening, setSharpening] = useState(true);
  const [heatTreat, setHeatTreat] = useState(false);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  // Cascading dropdowns
  const widthNum = parseFloat(width) || 0;
  const thicknessNum = parseFloat(thickness) || 0;
  const widthOptions = getOptionsForWidth(blades, widthNum);
  const availablePitches = brand && widthNum && thicknessNum
    ? getAvailablePitches(blades, widthNum, thicknessNum, brand)
    : [];

  // Find selected blade config
  const selectedBlade = width && thickness && pitch && brand
    ? findBlade(blades, widthNum, thicknessNum, pitch, brand)
    : null;

  // Only quote a length the workshop will actually weld — a price against a
  // 400 mm loop is a promise the checkout would then break.
  const prices = selectedBlade && isWeldableLength(length)
    ? calculateBladePrice(selectedBlade, length, { welding, sharpening, heatTreatment: heatTreat, setting })
    : null;

  const unitPrice = prices?.totalWithoutVat ?? 0;

  // Reset downstream when upstream changes
  const handleWidthChange = (v: string) => { setWidth(v); setThickness(""); setPitch(""); setBrand(""); };
  const handleThicknessChange = (v: string) => { setThickness(v); setPitch(""); };
  const handleBrandChange = (v: string) => { setBrand(v); setPitch(""); };

  const canAdd = !!selectedBlade && isWeldableLength(length);

  const handleAdd = () => {
    if (!canAdd || !selectedBlade) return;
    addItem({
      sku: `CUSTOM-${type.toUpperCase()}-${width}x${thickness}-${length}`,
      name: t("item.wood", { width, thickness, brand }),
      dim: `${length} × ${width} × ${thickness} мм · ${pitchLabel(pitch)} · ${brand}`,
      price: unitPrice,
      quantity: qty,
      customSpecs: {
        table: type === "h" ? "wood-h" : "wood-v",
        length,
        width: widthNum,
        thickness: thicknessNum,
        pitch,
        brand,
        welding,
        setting,
        sharpening,
        heatTreatment: heatTreat,
      },
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 lg:gap-12">
      {/* Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Select label={t("field.width")} options={widths.map(String)} required value={width} onChange={handleWidthChange} />
        <Select label={t("field.thickness")} options={widthNum ? widthOptions.thicknesses.map(String) : []} required value={thickness} onChange={handleThicknessChange} />
        <Select label={t("field.brand")} options={widthNum ? widthOptions.brands : []} required value={brand} onChange={handleBrandChange} />
        <Select label={t("field.pitch")} options={availablePitches} required value={pitch} onChange={setPitch} format={pitchLabel} />
        <LengthInput value={length} onChange={setLength} />
        <QuantityStepper value={qty} onChange={setQty} />
        {selectedBlade && (
          <BladePreview table={type === "h" ? "wood-h" : "wood-v"} blade={selectedBlade} length={length} />
        )}
      </div>

      {/* Right — extras + price */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Checkbox label={t("extras.welding")} checked={welding} onChange={setWelding} />
          <Checkbox label={t("extras.setting")} checked={setting} onChange={setSetting} />
          <Checkbox label={t("extras.sharpening")} checked={sharpening} onChange={setSharpening} />
          <Checkbox label={t("extras.heatTreatment")} checked={heatTreat} onChange={setHeatTreat} />
        </div>

        {selectedBlade && (
          // The rates the quote is built from, all without VAT — said once at
          // the end rather than after every figure.
          <div className="p-3 bg-paper font-mono text-[10px] text-ink-50 tracking-[0.05em]">
            {t("price.perMeter")}: {price(selectedBlade.pricePerMeter)}
            {welding && <> · {t("extras.welding")}: {t("price.perPiece", { price: price(selectedBlade.welding) })}</>}
            {sharpening && selectedBlade.sharpening > 0 && <> · {t("extras.sharpening")}: {t("price.perMetreUnit", { price: price(selectedBlade.sharpening) })}</>}
            {heatTreat && selectedBlade.heatTreatment > 0 && <> · {t("extras.heatShort")}: {t("price.perMetreUnit", { price: price(selectedBlade.heatTreatment) })}</>}
            {setting && selectedBlade.setting > 0 && <> · {t("extras.setting")}: {t("price.perMetreUnit", { price: price(selectedBlade.setting) })}</>}
            {" "}· {tc("exVat")}
          </div>
        )}

        {/* The figure a buyer acts on, stated both ways — see DualPrice. */}
        <div className="mt-auto border-t-2 border-ink pt-4">
          <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-50">
            {t("price.label")}
          </div>
          <DualPrice net={unitPrice} size="lg" className="mt-1 mb-5" />
          <Btn variant="primary" size="lg" fullWidth iconRight={<IconArrowRight size={16} />} onClick={handleAdd} disabled={!canAdd}>
            {added ? t("price.added") : t("price.add")}
          </Btn>
        </div>
      </div>
    </div>
  );
}

function RealDataConfigurator({
  blades,
  tableKey,
}: {
  blades: BladeConfig[];
  // Names the price table this form quotes from, so the order route can find
  // the same row again and verify the price. It also names the cart line, via
  // `configurator.item.<tableKey>` — the label used to be passed in as a
  // Bulgarian string, which put untranslatable copy in the render tree.
  tableKey: BladeTableKey;
}) {
  const t = useTranslations("configurator");
  const label = t(`item.${tableKey}`);
  const tc = useTranslations("common");
  const { price } = usePrices();
  const { widths } = getUniqueValues(blades);
  const [width, setWidth] = useState("");
  const [thickness, setThickness] = useState("");
  const [pitch, setPitch] = useState("");
  const [brand, setBrand] = useState("");
  const [length, setLength] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  const widthNum = parseFloat(width) || 0;
  const thicknessNum = parseFloat(thickness) || 0;
  const widthOptions = getOptionsForWidth(blades, widthNum);

  // Auto-select brand if only one
  const effectiveBrand = widthOptions.brands.length === 1 ? widthOptions.brands[0] : brand;
  const availablePitches = effectiveBrand && widthNum && thicknessNum
    ? getAvailablePitches(blades, widthNum, thicknessNum, effectiveBrand)
    : [];

  const selectedBlade = width && thickness && pitch && effectiveBrand
    ? findBlade(blades, widthNum, thicknessNum, pitch, effectiveBrand)
    : null;

  const prices = selectedBlade && isWeldableLength(length)
    ? calculateBladePrice(selectedBlade, length, { welding: selectedBlade.welding > 0, sharpening: false, heatTreatment: false, setting: false })
    : null;

  const unitPrice = prices?.totalWithoutVat ?? 0;

  const handleWidthChange = (v: string) => { setWidth(v); setThickness(""); setPitch(""); setBrand(""); };
  const handleThicknessChange = (v: string) => { setThickness(v); setPitch(""); };
  const handleBrandChange = (v: string) => { setBrand(v); setPitch(""); };

  const canAdd = !!selectedBlade && isWeldableLength(length);

  const handleAdd = () => {
    if (!canAdd || !selectedBlade) return;
    addItem({
      sku: `CUSTOM-${widthNum}x${thicknessNum}-${length}-${pitch}`,
      name: label,
      dim: `${length} × ${width} × ${thickness} мм · ${pitch} · ${effectiveBrand}`,
      price: unitPrice,
      quantity: qty,
      customSpecs: {
        table: tableKey,
        length,
        width: widthNum,
        thickness: thicknessNum,
        pitch,
        brand: effectiveBrand,
        welding: selectedBlade.welding > 0,
      },
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 lg:gap-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Select label={t("field.width")} options={widths.map(String)} required value={width} onChange={handleWidthChange} />
        <Select label={t("field.thickness")} options={widthNum ? widthOptions.thicknesses.map(String) : []} required value={thickness} onChange={handleThicknessChange} />
        {widthOptions.brands.length > 1 && (
          <Select label={t("field.brand")} options={widthOptions.brands} required value={brand} onChange={handleBrandChange} />
        )}
        <Select label={availablePitches.some(isProfilePitch) ? t("field.profileAndPitch") : t("field.pitch")} options={availablePitches} required value={pitch} onChange={setPitch} format={pitchLabel} />
        {/* Length belongs with width, thickness and profile — it is the fourth
            dimension of the blade, not a commercial control like quantity.
            Sitting alone in the price column it read as an afterthought on the
            one product where it is the whole point. */}
        <LengthInput value={length} onChange={setLength} />
        {selectedBlade && <BladePreview table={tableKey} blade={selectedBlade} length={length} />}
      </div>
      <div className="flex flex-col gap-5">
        <QuantityStepper value={qty} onChange={setQty} />
        {selectedBlade && (
          <div className="p-3 bg-paper font-mono text-[10px] text-ink-50 tracking-[0.05em]">
            {t("price.perMeter")}: {price(selectedBlade.pricePerMeter)}
            {selectedBlade.welding > 0 && <> · {t("extras.welding")}: {t("price.perPiece", { price: price(selectedBlade.welding) })}</>}
            {" "}· {tc("exVat")}
          </div>
        )}
        <div className="mt-auto border-t-2 border-ink pt-4">
          <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-50">{t("price.label")}</div>
          <DualPrice net={unitPrice} size="lg" className="mt-1 mb-5" />
          <Btn variant="primary" size="lg" fullWidth onClick={handleAdd} disabled={!canAdd}>
            {added ? t("price.addedShort") : t("price.add")}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ===== Main page =====
export function ConfiguratorPanel() {
  const t = useTranslations("configurator");
  const tc = useTranslations("common");
  const { market, price } = usePrices();
  const [activeTab, setActiveTab] = useState<ConfigType>("wood-h");

  return (
    <div className="bg-white">
      {/* Tabs */}
      <div className="border-b border-ink-15 bg-paper overflow-x-auto">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 flex gap-0 min-w-max">
          {TAB_ORDER.map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-5 py-4 font-mono text-[11px] tracking-[0.08em] uppercase border-none cursor-pointer whitespace-nowrap transition-colors ${
                activeTab === key
                  ? "bg-white text-ink border-b-2 border-orange -mb-px font-semibold"
                  : "bg-transparent text-ink-50 hover:text-ink border-b-2 border-transparent"
              }`}
            >
              {t(`tabs.${key}.label`)}
            </button>
          ))}
        </div>
      </div>

      {/* Configurator body */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-10 md:py-14">
        {/* Title */}
        <div className="flex items-center gap-4 mb-8">
          <IconRuler size={28} className="text-blue" />
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-ink m-0">{t(`tabs.${activeTab}.label`)}</h2>
            <p className="font-sans text-sm text-ink-50 mt-1">{t(`tabs.${activeTab}.subtitle`)}</p>
          </div>
        </div>

        {/* Form */}
        {(activeTab === "wood-h") && <WoodConfigurator type="h" />}
        {(activeTab === "wood-v") && <WoodConfigurator type="v" />}
        {(activeTab === "metal-bi") && <RealDataConfigurator blades={METAL_BIMETAL_BLADES} tableKey="metal-bi" />}
        {(activeTab === "metal-cs") && <RealDataConfigurator blades={METAL_CARBON_BLADES} tableKey="metal-cs" />}
        {(activeTab === "hobby") && <RealDataConfigurator blades={METAL_CARBON_BLADES} tableKey="metal-cs" />}
        {(activeTab === "meat") && <RealDataConfigurator blades={MEAT_BLADES} tableKey="meat" />}
        {(activeTab === "bread") && <RealDataConfigurator blades={BREAD_BLADES} tableKey="bread" />}
        {(activeTab === "slicer") && (
          <>
            <RealDataConfigurator blades={TEXTILE_BLADES} tableKey="textile" />
            <EdgeProfileGuide />
          </>
        )}

        {/* Set as data, in the site's own idiom. The green ticks came from the
            old shop and read as a template; a numbered rail with hairline rules
            matches how every other section here presents facts. The precision
            claim is gone — it has never been substantiated. */}
        <div className="mt-14 pt-10 border-t border-ink-15 grid grid-cols-2 lg:grid-cols-4 gap-px bg-ink-15">
          {[
            [t("facts.madeToOrderFigure"), t("facts.madeToOrderUnit"), t("facts.madeToOrderNote")],
            market.carriage === "collect"
              ? [t("facts.shippingFigure"), market.couriers.join(" · "), tc("courierFeeNote", { couriers: market.couriers.join(" / ") })]
              : [t("facts.shippingFigure"), t("facts.shippingUnit"), t("facts.shippingNote", { threshold: `${price(market.freeShippingThreshold)} ${tc("exVat")}` })],
            [`${MIN_CUSTOM_LENGTH.toLocaleString("bg-BG")} — ∞`, t("facts.lengthUnit"), t("facts.lengthNote")],
            [t("facts.warrantyFigure"), t("facts.warrantyUnit"), t("facts.warrantyNote")],
          ].map(([figure, unit, desc]) => (
            <div key={desc} className="bg-white p-5">
              <div className="font-display text-lg font-bold tracking-tight text-ink tabular-nums leading-none">
                {figure}
              </div>
              <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-orange mt-1.5">{unit}</div>
              <div className="font-sans text-[12px] leading-snug text-ink-50 mt-2.5">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
