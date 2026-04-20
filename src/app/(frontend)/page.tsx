"use client";

import Link from "next/link";
import { useState } from "react";
import { SectionNumber, Placeholder, Btn, Tag, TickRule } from "@/components/ui/primitives";
import { ProductCard, type ProductCardData } from "@/components/product/ProductCard";
import {
  IconArrowRight, IconCheck, IconPhone, IconWood, IconMetal, IconFood,
  IconHobby, IconMachine, IconAbrasive,
} from "@/components/ui/icons";

// ========== HERO ==========
function HeroCustom() {
  return (
    <section className="bg-paper relative overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-16 md:py-[64px] grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-10 lg:gap-16 items-end">
        <div>
          <SectionNumber n="№ 01" label="Режещи инструменти по поръчка" />
          <h1 className="font-display text-5xl md:text-7xl lg:text-[104px] font-extrabold leading-[0.95] tracking-[-0.045em] mt-8 mb-8 text-ink">
            Всяка лента<br />точно по<br />
            <span className="italic font-medium text-orange">вашата машина.</span>
          </h1>
          <p className="font-sans text-lg leading-relaxed text-ink-70 max-w-[560px] mb-10">
            Произвеждаме и заваряваме банцигови ленти по индивидуални размери за дърво, метал и хранителна промишленост — от 1&nbsp;650 до 12&nbsp;000&nbsp;мм, за 24&nbsp;часа.
          </p>
          <div className="flex gap-3 items-center flex-wrap">
            <Link href="/contact"><Btn variant="primary" size="lg" iconRight={<IconArrowRight size={16} />}>Конфигурирай лента</Btn></Link>
            <Link href="/shop"><Btn variant="ghost" size="lg">Разгледай каталог</Btn></Link>
          </div>
          {/* Spec rail */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-0 border-t border-ink-15">
            {[
              ["30+", "години"],
              ["12 000", "активни клиенти"],
              ["24ч", "изработка"],
              ["±0.01", "мм точност"],
            ].map(([v, l], i) => (
              <div key={i} className={`pt-5 pr-4 ${i > 0 ? "border-l border-ink-15 pl-5" : ""}`}>
                <div className="font-display text-3xl font-bold tracking-tight text-ink">{v}</div>
                <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 mt-1.5">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — spec card */}
        <div className="relative hidden lg:block">
          <div className="bg-ink text-white p-7 relative shadow-[0_40px_80px_-24px_rgba(11,30,51,0.4)]">
            <div className="flex justify-between items-start mb-5">
              <div>
                <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-white/50">Spec sheet · template</div>
                <div className="font-display text-xl font-semibold mt-1">Биметална M42 · поръчка</div>
              </div>
              <Tag tone="orange">custom</Tag>
            </div>
            <Placeholder tone="ink" ratio="16/9" caption="Техническа схема на лента" />
            <div className="mt-5 grid grid-cols-2 gap-3 font-mono text-[11px]">
              {[
                ["Дължина", "3 810 мм"], ["Широчина", "27 мм"], ["Дебелина", "0.9 мм"],
                ["Зъби/инч", "3 TPI"], ["Материал", "M42 HSS"], ["Срок", "24 часа"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-white/[0.08]">
                  <span className="text-white/50 tracking-[0.05em]">{k}</span>
                  <span className="text-white">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-between items-center pt-4 border-t border-white/15">
              <div>
                <div className="font-mono text-[10px] text-white/50 tracking-[0.1em] uppercase">от</div>
                <div className="font-display text-[28px] font-bold">48.90 лв<span className="text-xs text-white/50 font-normal ml-1">/бр</span></div>
              </div>
              <Link href="/contact"><Btn variant="primary" size="md">Отвори конфигуратор</Btn></Link>
            </div>
          </div>
          <div className="absolute -top-2.5 -left-2.5 font-mono text-[9px] text-ink-50 tracking-[0.15em]">TL · SPEC-01</div>
        </div>
      </div>
    </section>
  );
}

// ========== TICKER ==========
function TickerStrip() {
  const items = ["● Над 8 000 размера на склад", "● Безплатна доставка над 200 лв", "● TÜV NORD ISO 9001", "● Заваряване за 4 часа", "● Техническа консултация", "● Доставка до 48ч", "● Гаранция 12 месеца"];
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
const industries = [
  { name: "Дърво", Icon: IconWood, desc: "Банцигови ленти, циркулярни триони, абрихт ножове за всякаква дървообработка.", count: "1 240 артикула", href: "/category/dyrvo" },
  { name: "Метал", Icon: IconMetal, desc: "Биметални M42/M51 и въглеродни CS ленти за професионална металообработка.", count: "820 артикула", href: "/category/metal" },
  { name: "Храни", Icon: IconFood, desc: "Ленти и ножове за месо, риба, хляб. Резервни части за слайсъри.", count: "310 артикула", href: "/category/hrani" },
  { name: "Хоби банциг", Icon: IconHobby, desc: "Ленти за Einhell, Parkside, Scheppach и домашни работилници.", count: "180 размера", href: "/category/hobi-bantsig" },
  { name: "Машини", Icon: IconMachine, desc: "Заточни машини, лентови триони, консумативи и резервни части.", count: "94 артикула", href: "/category/mashini" },
  { name: "Абразиви", Icon: IconAbrasive, desc: "Диамантени и CBN заточни дискове, камъни, полиращи състави.", count: "460 артикула", href: "/category/abrazivi" },
];

function IndustriesBlock() {
  return (
    <section className="bg-white py-20 md:py-[120px]">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-end mb-14 md:mb-[72px]">
          <div>
            <SectionNumber n="№ 02" label="Шест индустрии · един доставчик" />
            <h2 className="font-display text-4xl md:text-5xl lg:text-[64px] leading-none tracking-[-0.035em] font-bold mt-7 text-ink">
              Каталог, организиран<br />по това с което <span className="italic text-orange font-medium">работите</span>.
            </h2>
          </div>
          <p className="font-sans text-base leading-relaxed text-ink-70 max-w-[480px] lg:justify-self-end">
            Не се налага да знаете стандарти и обозначения — изберете вашата индустрия и филтрирайте по машина, материал или размер.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border border-ink-15">
          {industries.map((c, i) => {
            const CIcon = c.Icon;
            const col = i % 3;
            const row = Math.floor(i / 3);
            return (
              <Link
                key={c.name}
                href={c.href}
                className={`p-9 no-underline text-ink min-h-[260px] flex flex-col gap-5 bg-white hover:bg-paper transition-colors relative
                  ${col < 2 ? "lg:border-r lg:border-ink-15" : ""}
                  ${row === 0 ? "border-b border-ink-15" : ""}
                  ${i % 2 === 0 && i < 4 ? "md:border-r md:border-ink-15" : ""}
                `}
              >
                <div className="flex justify-between items-start">
                  <CIcon size={40} strokeWidth={1.25} className="text-navy" />
                  <span className="font-mono text-[10px] text-ink-50 tracking-[0.12em]">0{i + 1} / 06</span>
                </div>
                <div className="mt-auto">
                  <div className="font-display text-3xl lg:text-4xl font-bold tracking-tight text-ink mb-2">{c.name}</div>
                  <p className="font-sans text-sm leading-snug text-ink-70 m-0">{c.desc}</p>
                  <div className="mt-4 pt-4 border-t border-ink-15 flex justify-between items-center font-mono text-[11px] text-ink-50 tracking-[0.04em]">
                    <span>{c.count}</span>
                    <span className="text-orange flex items-center gap-1.5">Разгледай <IconArrowRight size={12} /></span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ========== CUSTOM ORDER ==========
function CustomOrderBlock() {
  const [len, setLen] = useState(3810);
  const [w, setW] = useState(27);
  const [tpi, setTpi] = useState(3);
  const [mat, setMat] = useState("M42");

  const price = ((len / 100) * (w / 10) * (mat === "M42" ? 0.42 : mat === "M51" ? 0.58 : mat === "CBN" ? 1.2 : 0.22)).toFixed(2);

  return (
    <section id="custom" className="bg-ink text-white py-20 md:py-[120px] relative overflow-hidden">
      <div aria-hidden className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "48px 48px", maskImage: "linear-gradient(180deg, transparent, #000 20%, #000 80%, transparent)" }} />
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-20">
          <div>
            <SectionNumber n="№ 03" label="Конфигуратор" tone="light" />
            <h2 className="font-display text-4xl md:text-5xl lg:text-7xl leading-none tracking-[-0.04em] font-bold mt-7 mb-6">
              Кажи ни размера.<br />Ние го <span className="italic text-orange-light font-medium">сглобяваме.</span>
            </h2>
            <p className="font-sans text-[17px] leading-relaxed text-white/70 max-w-[480px] mb-10">
              Завареждаме банциговата лента точно по вашата машина — от кратки серии до масов клиент. Доставка за 24–48 часа в България.
            </p>
            <ul className="list-none p-0 m-0 flex flex-col gap-4">
              {[
                ["Над 8 000 комбинации", "размер × материал × зъби"],
                ["Прецизно заваряване", "индукция + shot-blasting"],
                ["Сертификат за всяка партида", "MTR по ISO 9001"],
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
          </div>

          {/* Configurator card */}
          <div className="bg-white text-ink p-6 md:p-10 relative">
            <div className="flex justify-between items-center mb-7">
              <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-50">Конфигуратор · 01</div>
              <Tag tone="ok">Готово за 24ч</Tag>
            </div>
            <div className="font-display text-[28px] font-bold tracking-tight mb-7">Вашата лента</div>

            <div className="flex flex-col gap-6">
              <ConfigSlider label="Обща дължина" unit="мм" value={len} min={1650} max={12000} step={10} onChange={setLen} />
              <ConfigSlider label="Широчина" unit="мм" value={w} min={6} max={80} step={1} onChange={setW} />
              <ConfigSlider label="Зъби на инч" unit="TPI" value={tpi} min={1} max={14} step={0.5} onChange={setTpi} />

              <div>
                <label className="font-mono text-[11px] tracking-[0.1em] uppercase text-ink-50 block mb-2.5">Материал</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {["CS", "M42", "M51", "CBN"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setMat(m)}
                      className={`py-3 font-mono text-xs font-semibold cursor-pointer border transition-colors ${mat === m ? "bg-ink text-white border-ink" : "bg-white text-ink border-ink-15 hover:border-ink-30"}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 p-5 bg-paper flex justify-between items-center">
              <div>
                <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">Ориентировъчна цена</div>
                <div className="font-display text-4xl font-extrabold tracking-tight text-ink">
                  {price} <span className="text-sm text-ink-50 font-normal">лв</span>
                </div>
              </div>
              <Link href="/contact"><Btn variant="primary" size="lg" iconRight={<IconArrowRight size={16} />}>Добави</Btn></Link>
            </div>
            <div className="mt-4 font-mono text-[10px] text-ink-50 tracking-[0.08em] text-center">
              L={len} × W={w} × TPI={tpi} · {mat} · LOT-{Math.floor((len * w) / 10).toString(16).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ConfigSlider({ label, unit, value, min, max, step, onChange }: { label: string; unit: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2.5">
        <label className="font-mono text-[11px] tracking-[0.1em] uppercase text-ink-50">{label}</label>
        <span className="font-mono text-sm font-semibold text-ink">{value} <span className="text-ink-50 font-normal">{unit}</span></span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-orange" />
      <div className="flex justify-between font-mono text-[9px] text-ink-50 mt-1">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

// ========== BESTSELLERS ==========
const BESTSELLERS: ProductCardData[] = [
  { sku: "M42-3810-27-09", slug: "bimetalna-lenta-m42-hss", name: "Биметална лента M42 HSS", dim: "3810 × 27 × 0.9 мм · 3 TPI", price: 48.90, industry: "Метал", stock: "На склад", badge: "TOP" },
  { sku: "CS-2240-13-06", slug: "vyglerodna-cs-hardback", name: "Въглеродна CS Hardback", dim: "2240 × 13 × 0.65 мм · 6 TPI", price: 18.40, industry: "Дърво", stock: "На склад", badge: null },
  { sku: "SL-2455-16-05", slug: "lenta-za-slaysyr-bizerba", name: "Лента за слайсър Bizerba", dim: "2455 × 16 × 0.5 мм · 4 TPI", price: 32.00, industry: "Храни", stock: "Ниска наличност", badge: "NEW" },
  { sku: "CBN-200-3-10", slug: "cbn-zatochen-disk", name: "CBN заточен диск", dim: "Ø200 × 3 × 10 мм", price: 188.00, industry: "Абразиви", stock: "На склад", badge: null },
  { sku: "CIR-350-72-30", slug: "tsirkulyaren-trion-hm-350", name: "Циркулярен трион HM", dim: "Ø350 × 3.2 · 72 зъба", price: 96.40, industry: "Дърво", stock: "На склад", badge: null },
  { sku: "M51-5280-41-13", slug: "bimetalna-lenta-m51-cobalt", name: "Биметална лента M51 Cobalt", dim: "5280 × 41 × 1.3 мм · 2/3 TPI", price: 112.50, industry: "Метал", stock: "Изчерпан", badge: null },
];

function BestsellersBlock() {
  const [filter, setFilter] = useState("Всички");
  const tabs = ["Всички", "Дърво", "Метал", "Храни", "Абразиви"];
  const filtered = filter === "Всички" ? BESTSELLERS : BESTSELLERS.filter((b) => b.industry === filter);

  return (
    <section className="bg-paper py-20 md:py-[120px]">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-14">
          <div>
            <SectionNumber n="№ 04" label="Най-търсени · Април 2026" />
            <h2 className="font-display text-4xl md:text-[56px] leading-none tracking-[-0.035em] font-bold mt-7 text-ink">
              Каквото пазарят<br />професионалистите.
            </h2>
          </div>
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
          {filtered.map((p) => (
            <ProductCard key={p.sku} p={p} />
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link href="/shop"><Btn variant="dark" size="lg" iconRight={<IconArrowRight size={16} />}>Всички 3 247 артикула</Btn></Link>
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
        <div>
          <Placeholder tone="ink" ratio="4/5" caption="Производствен цех, Габрово · 2026" />
        </div>
        <div>
          <SectionNumber n="№ 05" label="От 1993 · Габрово" tone="light" />
          <h2 className="font-display text-4xl md:text-5xl lg:text-7xl leading-none tracking-[-0.04em] font-bold mt-7 mb-8">
            Най-големият склад<br />за режещи инструменти<br />
            <span className="italic text-orange-light font-medium">на Балканите.</span>
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
                <div className="font-display text-3xl md:text-5xl font-extrabold tracking-tight leading-none">{v}</div>
                <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-white/60 mt-2">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ========== BRANDS ==========
function BrandsBlock() {
  const brands = ["MasterGold", "Sandvik", "Hermes", "Tyrolit", "Böhler", "Kodiak", "Flamme", "Bahco", "Starrett", "Bizerba", "Berkel", "Tehnoles"];
  return (
    <section className="bg-white py-[100px] border-t border-b border-ink-15">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10">
        <div className="text-center mb-12">
          <SectionNumber n="№ 06" label="Оторизиран дистрибутор" />
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 border border-ink-15">
          {brands.map((b, i) => (
            <div
              key={b}
              className={`py-9 px-4 text-center font-display text-lg md:text-[22px] font-bold text-ink-70 tracking-tight hover:text-ink transition-colors
                ${(i + 1) % 6 !== 0 ? "md:border-r md:border-ink-15" : ""}
                ${(i + 1) % 3 !== 0 ? "border-r border-ink-15" : ""}
                ${i < 6 ? "border-b border-ink-15" : ""}
              `}
            >
              {b}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ========== BLOG ==========
function BlogTeaser() {
  const posts = [
    { cat: "Техническо", date: "18.04.2026", title: "Как да изберете правилната широчина на банциговата лента", read: "6 мин" },
    { cat: "Казус", date: "02.04.2026", title: "Защо M42 е по-добро от M51 за въглеродна стомана", read: "4 мин" },
    { cat: "Ръководство", date: "27.03.2026", title: "5-те най-чести причини за скъсване на лента", read: "8 мин" },
  ];
  return (
    <section className="bg-bone py-20 md:py-[120px]">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-14">
          <div>
            <SectionNumber n="№ 07" label="Journal · ръководства" />
            <h2 className="font-display text-4xl md:text-[56px] leading-none tracking-[-0.035em] font-bold mt-7 text-ink">Техническо ноу-хау.</h2>
          </div>
          <Link href="/blog"><Btn variant="ghost" size="md" iconRight={<IconArrowRight size={14} />}>Всички статии</Btn></Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((p, i) => (
            <article key={i} className="bg-white border border-ink-15 overflow-hidden cursor-pointer flex flex-col hover:border-ink transition-colors">
              <Placeholder tone="paper" ratio="4/3" caption={p.title} />
              <div className="p-7 flex flex-col gap-3">
                <div className="flex justify-between font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">
                  <span className="text-orange">{p.cat}</span>
                  <span>{p.date} · {p.read}</span>
                </div>
                <h3 className="font-display text-[22px] leading-tight tracking-tight font-semibold m-0 text-ink">{p.title}</h3>
                <div className="mt-2 font-mono text-[11px] text-orange flex items-center gap-1.5 tracking-[0.05em]">
                  Прочети <IconArrowRight size={12} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ========== CONTACT CTA ==========
function ContactCTA() {
  return (
    <section className="bg-orange text-white py-16 md:py-20">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 grid grid-cols-1 lg:grid-cols-[2fr_1fr] items-center gap-10">
        <div>
          <div className="font-mono text-[11px] tracking-[0.15em] uppercase opacity-80 mb-3">№ 08 — Техническа поддръжка</div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-[56px] leading-none tracking-[-0.035em] font-bold m-0">
            Търсите размер, който не е в каталога? Обадете се.
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          <a href="tel:066800822" className="flex items-center gap-3 p-[18px] px-6 bg-ink text-white no-underline font-mono text-[15px] tracking-[0.05em] hover:brightness-110 transition-all">
            <IconPhone size={18} /> 066 800 822
          </a>
          <Link href="/contact"><Btn variant="ghostLight" size="lg" className="w-full !border-white/40">Контактна форма</Btn></Link>
        </div>
      </div>
    </section>
  );
}

// ========== PAGE ==========
export default function HomePage() {
  return (
    <>
      <HeroCustom />
      <TickerStrip />
      <IndustriesBlock />
      <CustomOrderBlock />
      <BestsellersBlock />
      <ExpertiseBlock />
      <BrandsBlock />
      <BlogTeaser />
      <ContactCTA />
    </>
  );
}
