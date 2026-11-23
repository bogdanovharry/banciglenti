"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Measures where Safari really puts the fixed header, and lets each suspect be switched off one at a time,
 * on the live page, so the cause is found by looking rather than by deploying guesses.
 */
export function DiagClient() {
  const probe = useRef<HTMLDivElement>(null);
  const [read, setRead] = useState<Record<string, string>>({});
  const [opts, setOpts] = useState({ grain: true, position: "fixed", cover: true, pad: true, spacer: true });

  const measure = useCallback(() => {
    const h = document.querySelector("header");
    const vv = window.visualViewport;
    const r = h?.getBoundingClientRect();
    setRead({
      "header top (px)": r ? r.top.toFixed(1) : "-",
      "header height": r ? r.height.toFixed(1) : "-",
      "header position": h ? getComputedStyle(h).position : "-",
      "window.innerHeight": String(window.innerHeight),
      "documentElement.clientHeight": String(document.documentElement.clientHeight),
      "visualViewport.height": vv ? vv.height.toFixed(1) : "-",
      "visualViewport.offsetTop": vv ? vv.offsetTop.toFixed(1) : "-",
      "visualViewport.pageTop": vv ? vv.pageTop.toFixed(1) : "-",
      "scrollY": window.scrollY.toFixed(1),
      "safe-area top (px)": probe.current ? getComputedStyle(probe.current).paddingTop : "-",
      "screen": `${screen.width}x${screen.height} @${devicePixelRatio}`,
      "standalone": String((navigator as unknown as { standalone?: boolean }).standalone ?? false),
    });
  }, []);

  useEffect(() => {
    measure();
    const vv = window.visualViewport;
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    vv?.addEventListener("resize", measure);
    vv?.addEventListener("scroll", measure);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      vv?.removeEventListener("resize", measure);
      vv?.removeEventListener("scroll", measure);
    };
  }, [measure]);

  // Apply the switches to the real header and page.
  useEffect(() => {
    document.body.classList.toggle("tl-grain", opts.grain);
    const h = document.querySelector("header") as HTMLElement | null;
    if (h) {
      h.style.setProperty("position", opts.position, "important");
      h.style.setProperty("top", "0", "important");
      h.style.paddingTop = opts.pad ? "env(safe-area-inset-top)" : "0px";
    }
    const spacer = h?.previousElementSibling as HTMLElement | null;
    if (spacer && spacer.getAttribute("aria-hidden")) spacer.style.display = opts.position === "fixed" && opts.spacer ? "" : "none";
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      const c = (meta.getAttribute("content") ?? "").replace(/,?\s*viewport-fit=\w+/, "");
      meta.setAttribute("content", opts.cover ? `${c}, viewport-fit=cover` : c);
    }
    measure();
  }, [opts, measure]);

  const btn = (label: string, on: boolean, click: () => void) => (
    <button
      key={label}
      onClick={click}
      className={`px-3 py-2 border text-[13px] ${on ? "bg-blue text-white border-blue" : "bg-white border-ink-15"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="px-4 py-6 text-[14px]">
      <div ref={probe} aria-hidden style={{ paddingTop: "env(safe-area-inset-top)", height: 0, overflow: "hidden" }} />
      <h1 className="text-[20px] font-semibold mb-1">Диагностика на хедъра</h1>
      <p className="text-ink-70 mb-4">
        Скролни надолу до средата на страницата, виж има ли ивица над хедъра, после пробвай бутоните долу един по един и
        наблюдавай. Прави екранни снимки на таблицата с числата, докато ивицата се вижда, и след всеки бутон.
      </p>

      <table className="w-full text-[12.5px] mb-6">
        <tbody>
          {Object.entries(read).map(([k, v]) => (
            <tr key={k} className="border-b border-ink-08">
              <td className="py-1 pr-3 text-ink-70">{k}</td>
              <td className="py-1 font-mono">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="space-y-4 mb-10">
        <div>
          <div className="font-mono text-[10px] uppercase mb-1">1. Зърнест слой (fixed на целия екран)</div>
          <div className="flex gap-2">
            {btn("Включен", opts.grain, () => setOpts({ ...opts, grain: true }))}
            {btn("Изключен", !opts.grain, () => setOpts({ ...opts, grain: false }))}
          </div>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase mb-1">2. Позиция на хедъра</div>
          <div className="flex gap-2 flex-wrap">
            {["fixed", "sticky", "relative"].map((p) => btn(p, opts.position === p, () => setOpts({ ...opts, position: p })))}
          </div>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase mb-1">3. viewport-fit=cover</div>
          <div className="flex gap-2">
            {btn("cover", opts.cover, () => setOpts({ ...opts, cover: true }))}
            {btn("без", !opts.cover, () => setOpts({ ...opts, cover: false }))}
          </div>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase mb-1">4. Отстъп за безопасната зона в хедъра</div>
          <div className="flex gap-2">
            {btn("с отстъп", opts.pad, () => setOpts({ ...opts, pad: true }))}
            {btn("без отстъп", !opts.pad, () => setOpts({ ...opts, pad: false }))}
          </div>
        </div>
      </div>

      {Array.from({ length: 30 }, (_, i) => (
        <div
          key={i}
          className="h-24 mb-2 flex items-center justify-center text-white font-mono"
          style={{ background: i % 2 ? "#e07a00" : "#0a3fb5" }}
        >
          ред {i + 1} — цветна лента, за да се вижда какво минава под хедъра
        </div>
      ))}
    </div>
  );
}
