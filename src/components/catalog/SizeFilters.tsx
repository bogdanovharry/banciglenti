"use client";

import { useMemo, useState } from "react";

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
  specs?: { length?: number };
  machines?: string[];
};

export function useSizeFilters<T extends Filterable>(products: T[]) {
  const [length, setLength] = useState<number | null>(null);
  const [machines, setMachines] = useState<string[]>([]);

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
        return true;
      }),
    [products, length, machines],
  );

  const active = (length !== null ? 1 : 0) + machines.length;
  const clear = () => {
    setLength(null);
    setMachines([]);
  };

  const panel = (
    <SizeFilterPanel
      lengthFacets={lengthFacets}
      machineFacets={machineFacets}
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

  return { filtered, panel, active, clear };
}

function SizeFilterPanel({
  lengthFacets,
  machineFacets,
  length,
  machines,
  onLength,
  onMachine,
  active,
  onClear,
}: {
  lengthFacets: { value: number; count: number }[];
  machineFacets: { value: string; count: number }[];
  length: number | null;
  machines: string[];
  onLength: (v: number) => void;
  onMachine: (v: string) => void;
  active: number;
  onClear: () => void;
}) {
  // Nothing to filter on means no empty panel taking up a column.
  if (!lengthFacets.length && !machineFacets.length) return null;

  return (
    <div>
      {active > 0 && (
        <button
          onClick={onClear}
          className="mb-5 font-mono text-[10px] tracking-[0.1em] uppercase text-orange bg-transparent border-none cursor-pointer p-0 hover:text-ink"
        >
          Изчисти филтрите ({active})
        </button>
      )}

      {lengthFacets.length > 0 && (
        <div className="mb-6 pb-6 border-b border-ink-15">
          <h4 className="font-mono text-[11px] tracking-[0.12em] uppercase text-ink m-0 mb-1.5 font-semibold">
            Дължина на контура
          </h4>
          <p className="font-sans text-[12px] text-ink-50 m-0 mb-3">
            Трябва да съвпадне точно с машината.
          </p>
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
                  {f.value.toLocaleString("bg-BG")}
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
            Пасва на машина
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
