"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import type { SpecFacet } from "@/lib/category-facets";

/**
 * Loop length and machine fit — the two questions a buyer of these parts
 * actually arrives with.
 *
 * Shared rather than written per page. The shop had both (one of them dead
 * code that was computed and never rendered) and the category pages had
 * neither, which is backwards: a category page is the narrower list, so it is
 * the one where filtering by "what fits my mill" pays off most.
 *
 * Facet counts are computed from the incoming set, not from the already
 * filtered one, so the numbers beside each option stay still while you click.
 */
export type Filterable = {
  slug: string;
  specs?: { length?: number; width?: number; thickness?: number; material?: string };
  machines?: string[];
};

type FacetValue = string | number;

export function useSizeFilters<T extends Filterable>(
  products: T[],
  opts: {
    /** 'loop' for band blades (must match the machine), 'part' for something that is simply that long. */
    lengthKind?: "loop" | "part";
    /** Extra filters this category offers — see src/lib/category-facets.ts. */
    facets?: SpecFacet[];
  } = {},
) {
  const { lengthKind = "loop", facets = [] } = opts;
  const [length, setLength] = useState<number | null>(null);
  const [machines, setMachines] = useState<string[]>([]);
  const [picks, setPicks] = useState<Record<string, FacetValue>>({});

  // A facet is worth showing only when there is a choice: one value on every
  // product (all the knives 2.5 mm thick) would be a filter that cannot filter.
  const specFacets = useMemo(
    () =>
      facets
        .map((def) => {
          const counts = new Map<FacetValue, number>();
          for (const p of products) {
            const v = def.read(p);
            if (v !== null) counts.set(v, (counts.get(v) ?? 0) + 1);
          }
          const values = [...counts.entries()]
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => (typeof a.value === "number" && typeof b.value === "number" ? a.value - b.value : String(a.value).localeCompare(String(b.value))));
          return { def, values };
        })
        .filter((f) => f.values.length > 1),
    [products, facets],
  );

  const lengthFacets = useMemo(() => {
    const counts = new Map<number, number>();
    for (const p of products) {
      const l = p.specs?.length;
      if (typeof l === "number" && Number.isFinite(l)) counts.set(l, (counts.get(l) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value - b.value);
  }, [products]);

  const machineFacets = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      for (const m of p.machines ?? []) counts.set(m, (counts.get(m) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value));
  }, [products]);

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        if (length !== null && p.specs?.length !== length) return false;
        if (machines.length && !(p.machines ?? []).some((m) => machines.includes(m))) return false;
        for (const { def } of specFacets) {
          const want = picks[def.id];
          if (want !== undefined && def.read(p) !== want) return false;
        }
        return true;
      }),
    [products, length, machines, picks, specFacets],
  );

  const active = (length !== null ? 1 : 0) + machines.length + Object.keys(picks).length;
  /** False for a category of machines or consumables: nothing to filter on. */
  const hasFilters = lengthFacets.length > 0 || machineFacets.length > 0 || specFacets.length > 0;
  const clear = () => {
    setLength(null);
    setMachines([]);
    setPicks({});
  };

  const panel = (
    <SizeFilterPanel
      lengthFacets={lengthFacets}
      lengthKind={lengthKind}
      machineFacets={machineFacets}
      specFacets={specFacets}
      picks={picks}
      onPick={(id, v) =>
        setPicks((cur) => {
          const next = { ...cur };
          if (next[id] === v) delete next[id];
          else next[id] = v;
          return next;
        })
      }
      length={length}
      machines={machines}
      onLength={(v) => setLength(length === v ? null : v)}
      onMachine={(v) =>
        setMachines(machines.includes(v) ? machines.filter((m) => m !== v) : [...machines, v])
      }
      active={active}
      onClear={clear}
    />
  );

  return { filtered, panel, active, clear, hasFilters };
}

function SizeFilterPanel({
  lengthFacets,
  lengthKind,
  machineFacets,
  specFacets,
  picks,
  onPick,
  length,
  machines,
  onLength,
  onMachine,
  active,
  onClear,
}: {
  lengthFacets: { value: number; count: number }[];
  lengthKind: "loop" | "part";
  machineFacets: { value: string; count: number }[];
  specFacets: { def: SpecFacet; values: { value: FacetValue; count: number }[] }[];
  picks: Record<string, FacetValue>;
  onPick: (id: string, v: FacetValue) => void;
  length: number | null;
  machines: string[];
  onLength: (v: number) => void;
  onMachine: (v: string) => void;
  active: number;
  onClear: () => void;
}) {
  const t = useTranslations("catalog");
  const locale = useLocale();
  // Nothing to filter on means no empty panel taking up a column.
  if (!lengthFacets.length && !machineFacets.length && !specFacets.length) return null;

  return (
    <div>
      {active > 0 && (
        <button
          onClick={onClear}
          className="mb-5 font-mono text-[10px] tracking-[0.1em] uppercase text-orange bg-transparent border-none cursor-pointer p-0 hover:text-ink"
        >
          {t("filters.clearCount", { count: active })}
        </button>
      )}

      {specFacets.map(({ def, values }) => (
        <div key={def.id} className="mb-6 pb-6 border-b border-ink-15">
          <h4 className="font-mono text-[11px] tracking-[0.12em] uppercase text-ink m-0 mb-3 font-semibold">
            {t(`filters.${def.title}`)}
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {values.map((f) => {
              const on = picks[def.id] === f.value;
              return (
                <button
                  key={String(f.value)}
                  onClick={() => onPick(def.id, f.value)}
                  aria-pressed={on}
                  className={`px-2 py-1 border font-mono text-[11px] cursor-pointer transition-colors ${
                    on ? "bg-ink text-white border-ink" : "bg-white text-ink-70 border-ink-15 hover:border-ink"
                  }`}
                >
                  {def.messageValues
                    ? t(`filters.${f.value}`)
                    : `${def.prefix ?? ""}${typeof f.value === "number" ? f.value.toLocaleString(locale) : f.value}`}
                  <span className={`ml-1 ${on ? "text-white/50" : "text-ink-30"}`}>{f.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {lengthFacets.length > 0 && (
        <div className="mb-6 pb-6 border-b border-ink-15">
          <h4 className="font-mono text-[11px] tracking-[0.12em] uppercase text-ink m-0 mb-1.5 font-semibold">
            {lengthKind === "part" ? t("filters.partLength") : t("filters.loopLength")}
          </h4>
          {lengthKind === "loop" && (
            <p className="font-sans text-[12px] text-ink-50 m-0 mb-3">
              {t("filters.loopLengthHint")}
            </p>
          )}
          {lengthKind === "part" && <div className="mb-3" />}
          <div className="flex flex-wrap gap-1.5">
            {lengthFacets.map((f) => {
              const on = length === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => onLength(f.value)}
                  aria-pressed={on}
                  className={`px-2 py-1 border font-mono text-[11px] tabular-nums cursor-pointer transition-colors ${
                    on ? "bg-ink text-white border-ink" : "bg-white text-ink-70 border-ink-15 hover:border-ink"
                  }`}
                >
                  {f.value.toLocaleString(locale)}
                  <span className={`ml-1 ${on ? "text-white/50" : "text-ink-30"}`}>{f.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {machineFacets.length > 0 && (
        <div className="mb-6 pb-6 border-b border-ink-15">
          <h4 className="font-mono text-[11px] tracking-[0.12em] uppercase text-ink m-0 mb-3 font-semibold">
            {t("filters.fitsMachine")}
          </h4>
          <ul className="list-none p-0 m-0 flex flex-col gap-2">
            {machineFacets.map((f) => (
              <li key={f.value}>
                <label className="flex items-center gap-2.5 cursor-pointer font-sans text-[13px] text-ink-70 hover:text-ink">
                  <input
                    type="checkbox"
                    checked={machines.includes(f.value)}
                    onChange={() => onMachine(f.value)}
                    className="w-3.5 h-3.5 accent-orange shrink-0"
                  />
                  <span className="flex-1">{f.value}</span>
                  <span className="font-mono text-[10px] text-ink-30 tabular-nums">{f.count}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
