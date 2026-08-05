import Link from "next/link";
import { Placeholder } from "@/components/ui/primitives";
import { PageHeader } from "@/components/layout/PageHeader";
import { IconArrowRight } from "@/components/ui/icons";

const posts = [
  { cat: "Техническо", date: "18.04.2026", title: "Как да изберете правилната широчина на банциговата лента", read: "6 мин", big: true },
  { cat: "Казус", date: "02.04.2026", title: "Защо M42 е по-добро от M51 за въглеродна стомана", read: "4 мин" },
  { cat: "Ръководство", date: "27.03.2026", title: "5-те най-чести причини за скъсване на банцигова лента", read: "8 мин" },
  { cat: "Ръководство", date: "14.03.2026", title: "Заточване на циркулярни триони — пълно ръководство", read: "11 мин" },
  { cat: "Техническо", date: "02.03.2026", title: "TPI — колко зъба на инч ви трябват всъщност", read: "5 мин" },
  { cat: "Казус", date: "21.02.2026", title: "Хранителна индустрия: избор на лента за месо", read: "7 мин" },
];

export default function BlogPage() {
  return (
    <>
      <PageHeader
        eyebrowNumber="Journal"
        eyebrowLabel="Ръководства, казуси и техническо ноу-хау"
        image="/images/hero/hardworking-man-doing-his-job-woodshop-2.avif"
        crumbs={[{ label: "Начало", href: "/" }, { label: "Блог" }]}
        title={
          <>
            30 години опит,<br />
            достъпни <span className="text-orange-light">на един клик.</span>
          </>
        }
        description="Как да изберете стъпка на зъба, защо лентата се къса на шева, кога заточването е по-изгодно от нова лента."
      />

      {/* Posts grid */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-16 pb-[120px]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((p, i) => (
            <article
              key={i}
              className={`${p.big ? "md:col-span-2" : ""} border border-ink-15 cursor-pointer flex flex-col hover:border-ink transition-colors`}
            >
              <Placeholder tone="paper" ratio={p.big ? "16/9" : "4/3"} caption={p.title} />
              <div className={`${p.big ? "p-9" : "p-6"} flex-1 flex flex-col gap-3`}>
                <div className="flex justify-between font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">
                  <span className="text-orange">{p.cat}</span>
                  <span>{p.date} · {p.read}</span>
                </div>
                <h3 className={`font-display ${p.big ? "text-[32px]" : "text-xl"} leading-[1.15] tracking-tight font-semibold m-0 text-ink`}>
                  {p.title}
                </h3>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
