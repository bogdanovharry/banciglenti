"use client";

import { useState } from "react";
import { Btn } from "@/components/ui/primitives";
import { PageHeader } from "@/components/layout/PageHeader";
import { IconPhone, IconMail, IconFactory, IconArrowRight, IconCheck } from "@/components/ui/icons";

function Input({ label, placeholder = "", type = "text", required, value, onChange }: {
  label: string; placeholder?: string; type?: string; required?: boolean;
  value: string; onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">
        {label} {required && <span className="text-danger">*</span>}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 mt-1.5 px-3.5 border border-ink-15 font-sans text-sm outline-none bg-white focus:border-blue transition-colors"
      />
    </label>
  );
}

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("Метал");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — see /api/enquiries
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, company, industry, message, website }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        // Only claim it was sent when the server says it stored it — the form
        // used to show a tick unconditionally and drop the enquiry.
        setError(data.error ?? "Възникна грешка при изпращането.");
        return;
      }
      setSent(true);
    } catch {
      setError("Няма връзка със сървъра. Проверете интернет връзката или се обадете.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-paper">
      <PageHeader
        eyebrowNumber="№ 09"
        eyebrowLabel="Техническа поддръжка"
        image="/images/hero/bandsaw-cta-img.avif"
        imageAlt="Заваряване на банцигова лента в цеха"
        crumbs={[{ label: "Начало", href: "/" }, { label: "Контакти" }]}
        title={
          <>
            Свържи се с<br />
            <span className="text-orange-light">инженера.</span>
          </>
        }
        description="Консултацията е безплатна: избор на лента, диагностика на проблем, индивидуален проект. Работно време Пн–Пт 8:00–17:30."
      />

      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-16 pb-[120px]">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-20">
          {/* Left */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border border-ink-15 bg-white">
              {[
                { Icon: IconPhone, title: "066 800 822", desc: "Главен офис · Габрово", href: "tel:066800822" },
                { Icon: IconPhone, title: "0878 800 162", desc: "Мобилен · 24/7", href: "tel:0878800162" },
                { Icon: IconMail, title: "tehnoles@tehnoles.com", desc: "Технически въпроси", href: "mailto:tehnoles@tehnoles.com" },
                { Icon: IconFactory, title: "ул. Негенска 2", desc: "5300 Габрово, България", href: undefined },
              ].map((item, i) => (
                <a
                  key={i}
                  href={item.href}
                  className={`p-6 no-underline text-inherit block hover:bg-paper transition-colors ${i % 2 === 0 ? "sm:border-r border-ink-15" : ""} ${i < 2 ? "border-b border-ink-15" : ""}`}
                >
                  <item.Icon size={22} className="text-orange" />
                  <div className="font-display text-[17px] font-semibold mt-4 text-ink">{item.title}</div>
                  <div className="font-mono text-[10px] text-ink-50 mt-1 tracking-[0.05em]">{item.desc}</div>
                </a>
              ))}
            </div>
          </div>

          {/* Right — form */}
          <div className="bg-white border border-ink-15 p-8 md:p-10">
            {sent ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-ok/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <IconCheck size={32} className="text-ok" />
                </div>
                <h3 className="font-display text-2xl font-bold text-ink mb-3">Запитването е изпратено!</h3>
                <p className="font-sans text-ink-50">Ще се свържем с вас възможно най-скоро. Благодарим!</p>
              </div>
            ) : (
              <>
                <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-50 mb-4">Запитване</div>
                <h3 className="font-display text-[28px] font-bold m-0 mb-7 text-ink tracking-tight">Опишете задачата</h3>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <Input label="Име" required value={name} onChange={setName} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input label="Имейл" type="email" required value={email} onChange={setEmail} />
                    <Input label="Телефон" type="tel" value={phone} onChange={setPhone} />
                  </div>
                  <Input label="Компания" value={company} onChange={setCompany} />

                  <div>
                    <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">Индустрия</label>
                    <div className="grid grid-cols-3 gap-1.5 mt-2">
                      {["Дърво", "Метал", "Храни", "Хоби", "Абразиви", "Друго"].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setIndustry(t)}
                          className={`py-2.5 font-mono text-[11px] cursor-pointer border transition-colors ${industry === t ? "bg-ink text-white border-ink" : "bg-white text-ink border-ink-15 hover:border-ink-30"}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="block">
                    <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">Съобщение <span className="text-danger">*</span></span>
                    <textarea
                      rows={5}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full mt-1.5 p-3.5 border border-ink-15 font-sans text-sm outline-none resize-y focus:border-blue transition-colors"
                    />
                  </label>

                  {/* Honeypot — hidden from people, filled in by bots. */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="absolute -left-[9999px] w-px h-px opacity-0"
                  />

                  {error && (
                    <div
                      role="alert"
                      className="border border-danger bg-danger/5 px-4 py-3 font-sans text-[13px] text-ink"
                    >
                      {error}{" "}
                      <a href="tel:066800822" className="text-danger underline">
                        066 800 822
                      </a>
                    </div>
                  )}

                  <Btn
                    variant="primary"
                    size="lg"
                    fullWidth
                    iconRight={<IconArrowRight size={16} />}
                    type="submit"
                    disabled={sending}
                  >
                    {sending ? "Изпращане..." : "Изпрати запитване"}
                  </Btn>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
