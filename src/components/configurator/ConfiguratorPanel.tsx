"use client";

import { useState } from "react";
import Link from "next/link";
import { Btn, Tag } from "@/components/ui/primitives";
import { IconArrowRight, IconCheck, IconRuler } from "@/components/ui/icons";
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
import type { BladeTableKey } from "@/lib/order-pricing";
import { DEFAULT_MARKET, formatPrice, vatRateFor } from "@/lib/market";
import { bladeGuide } from "@/lib/blade-guide";
import Image from "next/image";

/**
 * The rate for a consumer in the market being served. Business customers in
 * another EU state are reverse charged at 0%, but the configurator quotes
 * before a customer is known, so it shows the consumer rate — checkout
 * recalculates once a VAT number has been given and validated.
 */
const VAT_RATE = vatRateFor(DEFAULT_MARKET);

// ===== Configurator types =====
type ConfigType = "wood-h" | "wood-v" | "metal-bi" | "metal-cs" | "hobby" | "meat" | "bread" | "slicer";

const TABS: { key: ConfigType; label: string; subtitle: string }[] = [
  { key: "wood-h", label: "Дърво — Хоризонтален", subtitle: "Банцигови ленти за хоризонтален банциг" },
  { key: "wood-v", label: "Дърво — Вертикален", subtitle: "Банцигови ленти за вертикален банциг" },
  { key: "metal-bi", label: "Метал — Биметални", subtitle: "Биметални отрезни ленти M42/M51" },
  { key: "metal-cs", label: "Метал — Въглеродна CS", subtitle: "Отрезни ленти от въглеродна стомана" },
  { key: "hobby", label: "Хоби банциг", subtitle: "Ленти за Einhell, Parkside, Scheppach" },
  { key: "meat", label: "Месо и риба", subtitle: "Лентови ножове за месо и риба" },
  { key: "bread", label: "Хлебни изделия", subtitle: "Лентови ножове за хлеборезни машини" },
  { key: "slicer", label: "Слайсъри", subtitle: "Лентови ножове за слайсъри" },
];

// ===== Sample dropdown options =====
const WIDTHS_WOOD = ["20", "25", "27", "32", "35", "38", "40", "50", "60", "80"];
const WIDTHS_METAL = ["13", "19", "20", "27", "34", "41", "54", "67", "80"];
const WIDTHS_HOBBY = ["6", "8", "10", "13", "16", "19"];
const WIDTHS_FOOD = ["10", "13", "16", "19", "22"];
const THICKNESS_WOOD = ["0.6", "0.7", "0.8", "0.9", "1.0", "1.1"];
const THICKNESS_METAL = ["0.65", "0.9", "1.1", "1.3", "1.6"];
const TOOTH_PITCH_WOOD = ["15", "20", "22", "25", "30", "35"];
const TOOTH_PITCH_METAL = ["2/3", "3/4", "4/6", "5/8", "6/10", "8/12", "10/14"];
const TOOTH_PITCH_HOBBY = ["4", "6", "10", "14", "18", "24"];
const BRANDS_WOOD = ["MasterGold", "MasterBlade", "Kodiak", "Tehnoles"];
const BRANDS_HOBBY = ["Einhell", "Parkside", "Scheppach", "Metabo", "Record Power", "Jet"];
const STEEL_TYPES = ["M42 Allpower", "M42 Shark", "M51 Cobalt", "M42 Vario"];
const PROFILES_FOOD = ["4 TPI (кост)", "3 TPI (замразено)", "Вълна", "Изпъкнала вълна", "Фини зъби 10 TPI"];

function Select({ label, options, required, value, onChange, format }: {
  label: string; options: string[]; required?: boolean;
  value: string; onChange: (v: string) => void;
  /** Shows something other than the stored value — tooth profiles are codes. */
  format?: (v: string) => string;
}) {
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
        <option value="">— избери —</option>
        {options.map((o) => (
          <option key={o} value={o}>{format ? format(o) : o}</option>
        ))}
      </select>
    </div>
  );
}

function NumberInput({ label, unit, value, onChange, required, highlight }: {
  label: string; unit: string; value: number; onChange: (v: number) => void;
  required?: boolean; highlight?: boolean;
}) {
  return (
    <div>
      <label className="block font-mono text-[10px] tracking-[0.14em] uppercase text-ink-50 mb-2">
        {label} {required && <span className="text-orange">*</span>}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(+e.target.value)}
          min={0}
          className="w-full h-12 px-3.5 border border-ink-15 bg-white font-mono text-[15px] tabular-nums text-ink outline-none focus:border-blue hover:border-ink-30 transition-colors"
          placeholder="0"
        />
        <span className="font-mono text-sm text-ink-50 shrink-0">{unit}</span>
      </div>
    </div>
  );
}

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
  return (
    <div>
      <label className="block font-mono text-[10px] tracking-[0.14em] uppercase text-ink-50 mb-2">Количество</label>
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
        <span className="px-3 font-sans text-sm text-ink-50">бр.</span>
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
 * counter would give: the series, what it cuts, and whether that tooth pitch
 * suits the cut.
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
  const guide = bladeGuide(table, blade.brand, blade.pitch);

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
        <div className="font-display text-xl font-bold tracking-tight text-ink mt-1">
          {guide.name}
        </div>
        <div className="font-mono text-[11px] text-ink-70 tabular-nums mt-1.5">
          {blade.width} × {blade.thickness} мм · стъпка {pitchLabel(blade.pitch)}
          {length > 0 && <> · контур {length} мм</>}
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

// ===== Per-type configurator forms =====
function WoodConfigurator({ type }: { type: "h" | "v" }) {
  const blades = type === "v" ? VERTICAL_WOOD_BLADES : HORIZONTAL_WOOD_BLADES;

  const { widths, brands: allBrands } = getUniqueValues(blades);

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

  // Calculate price using real data
  const prices = selectedBlade && length > 0
    ? calculateBladePrice(selectedBlade, length, { welding, sharpening, heatTreatment: heatTreat, setting })
    : null;

  const unitPrice = prices?.totalWithoutVat ?? 0;
  const unitPriceVat = unitPrice * (1 + VAT_RATE);

  // Reset downstream when upstream changes
  const handleWidthChange = (v: string) => { setWidth(v); setThickness(""); setPitch(""); setBrand(""); };
  const handleThicknessChange = (v: string) => { setThickness(v); setPitch(""); };
  const handleBrandChange = (v: string) => { setBrand(v); setPitch(""); };

  const handleAdd = () => {
    if (!selectedBlade || length <= 0) return;
    addItem({
      sku: `CUSTOM-${type.toUpperCase()}-${width}x${thickness}-${length}`,
      name: `Лента за дърво ${width}×${thickness} ${brand}`,
      dim: `${length} × ${width} × ${thickness} мм · ${pitch} · ${brand}`,
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
        <Select label="Широчина" options={widths.map(String)} required value={width} onChange={handleWidthChange} />
        <Select label="Дебелина" options={widthNum ? widthOptions.thicknesses.map(String) : []} required value={thickness} onChange={handleThicknessChange} />
        <Select label="Марка" options={widthNum ? widthOptions.brands : []} required value={brand} onChange={handleBrandChange} />
        <Select label="Стъпка" options={availablePitches} required value={pitch} onChange={setPitch} format={pitchLabel} />
        <NumberInput label="Дължина в мм." unit="мм." value={length} onChange={setLength} required highlight />
        <QuantityStepper value={qty} onChange={setQty} />
        {selectedBlade && (
          <BladePreview table={type === "h" ? "wood-h" : "wood-v"} blade={selectedBlade} length={length} />
        )}
      </div>

      {/* Right — extras + price */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Checkbox label="Заварка" checked={welding} onChange={setWelding} />
          <Checkbox label="Чапраз" checked={setting} onChange={setSetting} />
          <Checkbox label="Заточване" checked={sharpening} onChange={setSharpening} />
          <Checkbox label="Термообработка" checked={heatTreat} onChange={setHeatTreat} />
        </div>

        {selectedBlade && (
          <div className="p-3 bg-paper font-mono text-[10px] text-ink-50 tracking-[0.05em]">
            Цена/м: {selectedBlade.pricePerMeter.toFixed(2)} €
            {welding && <> · Заварка: {selectedBlade.welding.toFixed(2)} €/бр</>}
            {sharpening && selectedBlade.sharpening > 0 && <> · Заточване: {selectedBlade.sharpening.toFixed(2)} €/м</>}
            {heatTreat && selectedBlade.heatTreatment > 0 && <> · Термо: {selectedBlade.heatTreatment.toFixed(2)} €/м</>}
            {setting && selectedBlade.setting > 0 && <> · Чапраз: {selectedBlade.setting.toFixed(2)} €/м</>}
          </div>
        )}

        {/* The figure a buyer acts on, given the weight it deserves: ex-VAT
            large because that is what a trade customer budgets against, with
            VAT stated beneath rather than shouted in red. */}
        <div className="mt-auto border-t-2 border-ink pt-4">
          <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-50">
            Цена без ДДС
          </div>
          <div className="flex items-baseline gap-2 mt-1 mb-1">
            <span className="font-display text-[40px] leading-none font-extrabold tracking-[-0.03em] text-ink tabular-nums">
              {formatPrice(unitPrice)}
            </span>
          </div>
          <div className="font-mono text-[11px] text-ink-50 tabular-nums mb-5">
            с ДДС {formatPrice(unitPriceVat)}
          </div>
          <Btn variant="primary" size="lg" fullWidth iconRight={<IconArrowRight size={16} />} onClick={handleAdd}>
            {added ? "✓ Добавено в количката!" : "Добави в количката"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

function RealDataConfigurator({
  blades,
  label,
  tableKey,
  hasProcessing = false,
}: {
  blades: BladeConfig[];
  label: string;
  // Names the price table this form quotes from, so the order route can find
  // the same row again and verify the price.
  tableKey: BladeTableKey;
  hasProcessing?: boolean;
}) {
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

  const prices = selectedBlade && length > 0
    ? calculateBladePrice(selectedBlade, length, { welding: selectedBlade.welding > 0, sharpening: false, heatTreatment: false, setting: false })
    : null;

  const unitPrice = prices?.totalWithoutVat ?? 0;
  const unitPriceVat = unitPrice * (1 + VAT_RATE);

  const handleWidthChange = (v: string) => { setWidth(v); setThickness(""); setPitch(""); setBrand(""); };
  const handleThicknessChange = (v: string) => { setThickness(v); setPitch(""); };
  const handleBrandChange = (v: string) => { setBrand(v); setPitch(""); };

  const handleAdd = () => {
    if (!selectedBlade || length <= 0) return;
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
        <Select label="Широчина" options={widths.map(String)} required value={width} onChange={handleWidthChange} />
        <Select label="Дебелина" options={widthNum ? widthOptions.thicknesses.map(String) : []} required value={thickness} onChange={handleThicknessChange} />
        {widthOptions.brands.length > 1 && (
          <Select label="Марка" options={widthOptions.brands} required value={brand} onChange={handleBrandChange} />
        )}
        <Select label={availablePitches.some(isProfilePitch) ? "Профил и стъпка" : "Стъпка"} options={availablePitches} required value={pitch} onChange={setPitch} format={pitchLabel} />
        {selectedBlade && <BladePreview table={tableKey} blade={selectedBlade} length={length} />}
      </div>
      <div className="flex flex-col gap-5">
        <NumberInput label="Дължина в мм." unit="мм." value={length} onChange={setLength} required highlight />
        <QuantityStepper value={qty} onChange={setQty} />
        {selectedBlade && (
          <div className="p-3 bg-paper font-mono text-[10px] text-ink-50 tracking-[0.05em]">
            Цена/м: {selectedBlade.pricePerMeter.toFixed(2)} €
            {selectedBlade.welding > 0 && <> · Заварка: {selectedBlade.welding.toFixed(2)} €/бр</>}
          </div>
        )}
        <div className="mt-auto border-t-2 border-ink pt-4">
          <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-50">Цена без ДДС</div>
          <div className="font-display text-[40px] leading-none font-extrabold tracking-[-0.03em] text-ink tabular-nums mt-1 mb-1">{formatPrice(unitPrice)}</div>
          <div className="font-mono text-[11px] text-ink-50 tabular-nums mb-5">с ДДС {formatPrice(unitPriceVat)}</div>
          <Btn variant="primary" size="lg" fullWidth onClick={handleAdd}>
            {added ? "✓ Добавено!" : "Добави в количката"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

function MetalBiConfigurator() {
  const [steelType, setSteelType] = useState("");
  const [width, setWidth] = useState("");
  const [thickness, setThickness] = useState("");
  const [pitch, setPitch] = useState("");
  const [length, setLength] = useState(0);
  const [qty, setQty] = useState(1);

  const pricePerMeter = steelType && width ? 4.0 + parseFloat(width || "0") * 0.12 : 0;
  const unitPrice = length > 0 ? pricePerMeter * length / 1000 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 lg:gap-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="sm:col-span-2">
          <Select label="Тип на стоманата" options={STEEL_TYPES} required value={steelType} onChange={setSteelType} />
        </div>
        <Select label="Широчина" options={WIDTHS_METAL} required value={width} onChange={setWidth} />
        <Select label="Дебелина" options={THICKNESS_METAL} required value={thickness} onChange={setThickness} />
        <Select label="Стъпка" options={TOOTH_PITCH_METAL} required value={pitch} onChange={setPitch} />
      </div>
      <div className="flex flex-col gap-5">
        <NumberInput label="Дължина в мм." unit="мм." value={length} onChange={setLength} required highlight />
        <QuantityStepper value={qty} onChange={setQty} />
        <div className="mt-auto border-t-2 border-ink pt-4">
          <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-50">Цена без ДДС</div>
          <div className="font-display text-[40px] leading-none font-extrabold tracking-[-0.03em] text-ink tabular-nums mt-1 mb-1">{formatPrice(unitPrice)}</div>
          <div className="font-mono text-[11px] text-ink-50 tabular-nums mb-5">с ДДС {formatPrice(unitPrice * (1 + VAT_RATE))}</div>
          <Btn variant="primary" size="lg" fullWidth>Добави в количката</Btn>
        </div>
      </div>
    </div>
  );
}

function SimpleConfigurator({ widths, pitchLabel, pitchOptions }: {
  widths: string[];
  pitchLabel?: string;
  pitchOptions?: string[];
}) {
  const [width, setWidth] = useState("");
  const [thickness, setThickness] = useState("");
  const [pitch, setPitch] = useState("");
  const [length, setLength] = useState(0);
  const [qty, setQty] = useState(1);

  const pricePerMeter = width ? 1.8 + parseFloat(width) * 0.06 : 0;
  const unitPrice = length > 0 ? pricePerMeter * length / 1000 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 lg:gap-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Select label="Широчина" options={widths} required value={width} onChange={setWidth} />
        {pitchOptions ? (
          <Select label={pitchLabel || "Стъпка"} options={pitchOptions} required value={pitch} onChange={setPitch} />
        ) : (
          <>
            <Select label="Дебелина" options={THICKNESS_METAL} required value={thickness} onChange={setThickness} />
            <Select label="Стъпка" options={TOOTH_PITCH_METAL} required value={pitch} onChange={setPitch} />
          </>
        )}
      </div>
      <div className="flex flex-col gap-5">
        <NumberInput label="Дължина в мм." unit="мм." value={length} onChange={setLength} required highlight />
        <QuantityStepper value={qty} onChange={setQty} />
        <div className="mt-auto border-t-2 border-ink pt-4">
          <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-50">Цена без ДДС</div>
          <div className="font-display text-[40px] leading-none font-extrabold tracking-[-0.03em] text-ink tabular-nums mt-1 mb-1">{formatPrice(unitPrice)}</div>
          <div className="font-mono text-[11px] text-ink-50 tabular-nums mb-5">с ДДС {formatPrice(unitPrice * (1 + VAT_RATE))}</div>
          <Btn variant="primary" size="lg" fullWidth>Добави в количката</Btn>
        </div>
      </div>
    </div>
  );
}

function HobbyConfigurator() {
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

  const unitPrice = length > 0 && width ? (1.2 + parseFloat(width) * 0.05) * length / 1000 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 lg:gap-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Select label="Широчина" options={WIDTHS_HOBBY} required value={width} onChange={setWidth} />
        <Select label="Дебелина" options={["0.36", "0.5", "0.65"]} required value={thickness} onChange={setThickness} />
        <Select label="Стъпка" options={TOOTH_PITCH_HOBBY} required value={pitch} onChange={setPitch} />
        <Select label="Марка" options={BRANDS_HOBBY} required value={brand} onChange={setBrand} />
        <NumberInput label="Дължина в мм." unit="мм." value={length} onChange={setLength} required highlight />
        <QuantityStepper value={qty} onChange={setQty} />
      </div>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Checkbox label="Заварка" checked={welding} onChange={setWelding} />
          <Checkbox label="Чапраз" checked={setting} onChange={setSetting} />
          <Checkbox label="Заточване" checked={sharpening} onChange={setSharpening} />
          <Checkbox label="Термообработка" checked={heatTreat} onChange={setHeatTreat} />
        </div>
        <div className="mt-auto border-t-2 border-ink pt-4">
          <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-50">Цена без ДДС</div>
          <div className="font-display text-[40px] leading-none font-extrabold tracking-[-0.03em] text-ink tabular-nums mt-1 mb-1">{formatPrice(unitPrice)}</div>
          <div className="font-mono text-[11px] text-ink-50 tabular-nums mb-5">с ДДС {formatPrice(unitPrice * (1 + VAT_RATE))}</div>
          <Btn variant="primary" size="lg" fullWidth>Добави в количката</Btn>
        </div>
      </div>
    </div>
  );
}

// ===== Main page =====
export function ConfiguratorPanel() {
  const [activeTab, setActiveTab] = useState<ConfigType>("wood-h");
  const currentTab = TABS.find((t) => t.key === activeTab)!;

  return (
    <div className="bg-white">
      {/* Tabs */}
      <div className="border-b border-ink-15 bg-paper overflow-x-auto">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 flex gap-0 min-w-max">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-4 font-mono text-[11px] tracking-[0.08em] uppercase border-none cursor-pointer whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? "bg-white text-ink border-b-2 border-orange -mb-px font-semibold"
                  : "bg-transparent text-ink-50 hover:text-ink border-b-2 border-transparent"
              }`}
            >
              {tab.label}
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
            <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-ink m-0">{currentTab.label}</h2>
            <p className="font-sans text-sm text-ink-50 mt-1">{currentTab.subtitle}</p>
          </div>
        </div>

        {/* Form */}
        {(activeTab === "wood-h") && <WoodConfigurator type="h" />}
        {(activeTab === "wood-v") && <WoodConfigurator type="v" />}
        {(activeTab === "metal-bi") && <RealDataConfigurator blades={METAL_BIMETAL_BLADES} label="Биметална отрезна лента" tableKey="metal-bi" hasProcessing={false} />}
        {(activeTab === "metal-cs") && <RealDataConfigurator blades={METAL_CARBON_BLADES} label="Лента въглеродна стомана" tableKey="metal-cs" hasProcessing={false} />}
        {(activeTab === "hobby") && <HobbyConfigurator />}
        {(activeTab === "meat") && <RealDataConfigurator blades={MEAT_BLADES} label="Лентов нож за месо/риба" tableKey="meat" hasProcessing={false} />}
        {(activeTab === "bread") && <RealDataConfigurator blades={BREAD_BLADES} label="Лентов нож за хляб" tableKey="bread" hasProcessing={false} />}
        {(activeTab === "slicer") && <RealDataConfigurator blades={TEXTILE_BLADES} label="Лента за текстил/хартия" tableKey="textile" hasProcessing={false} />}

        {/* Set as data, in the site's own idiom. The green ticks came from the
            old shop and read as a template; a numbered rail with hairline rules
            matches how every other section here presents facts. The precision
            claim is gone — it has never been substantiated. */}
        <div className="mt-14 pt-10 border-t border-ink-15 grid grid-cols-2 lg:grid-cols-4 gap-px bg-ink-15">
          {[
            ["Изработка", "по поръчка", "Срокът се потвърждава при поръчката"],
            ["Доставка", "безплатна", `При поръчка над ${DEFAULT_MARKET.freeShippingThreshold} €`],
            ["1 650–12 000", "мм контур", "Заваряваме на вашата дължина"],
            ["Гаранция", "на заварката", "Скъсване на шева — подменяме лентата"],
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
