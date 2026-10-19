"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Btn } from "@/components/ui/primitives";
import { PageHeader } from "@/components/layout/PageHeader";
import { IconPhone, IconMail, IconFactory, IconArrowRight, IconCheck } from "@/components/ui/icons";
import type { IndustryCode } from "@/lib/catalog-ui";
import { companyFor } from "@/lib/company";

/** The codes are what gets stored on an enquiry; the labels come from the messages. */
const INDUSTRY_CODES: IndustryCode[] = ["wood", "metal", "food", "hobby", "abrasives", "other"];

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
  const t = useTranslations("contact");
  const tc = useTranslations("common");
  const co = companyFor(useLocale());
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState<IndustryCode>("metal");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — see /api/contact
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, company, industry, message, website }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        // Only claim it was sent when the server says it stored it — the form
        // used to show a tick unconditionally and drop the enquiry.
        setError(data.error ?? t("genericError"));
        return;
      }
      setSent(true);
    } catch {
      setError(t("networkError"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-paper">
      <PageHeader
        eyebrowNumber="№ 09"
        eyebrowLabel={t("eyebrow")}
        image="/images/hero/bandsaw-cta-img.avif"
        imageAlt={t("imageAlt")}
        crumbs={[{ label: tc("home"), href: "/" }, { label: tc("contact") }]}
        title={
          <>
            {t("titleA")}<br />
            <span className="text-orange-light">{t("titleB")}</span>
          </>
        }
        description={t("description")}
      />

      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-16 pb-[120px]">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-20">
          {/* Left */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border border-ink-15 bg-white">
              {[
                { Icon: IconPhone, title: co.phone.office.display, desc: t("officeDesc", { city: co.address.city }), href: co.phone.office.href },
                { Icon: IconPhone, title: co.phone.mobile.display, desc: t("mobileDesc"), href: co.phone.mobile.href },
                { Icon: IconMail, title: co.email, desc: t("emailDesc"), href: `mailto:${co.email}` },
                { Icon: IconFactory, title: co.address.street, desc: `${co.address.postalCode} ${co.address.city}, ${co.address.country}`, href: undefined },
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
                <h3 className="font-display text-2xl font-bold text-ink mb-3">{t("sentTitle")}</h3>
                <p className="font-sans text-ink-50">{t("sentText")}</p>
              </div>
            ) : (
              <>
                <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-50 mb-4">{t("formEyebrow")}</div>
                <h3 className="font-display text-[28px] font-bold m-0 mb-7 text-ink tracking-tight">{t("formTitle")}</h3>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <Input label={t("fieldName")} required value={name} onChange={setName} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input label={t("fieldEmail")} type="email" required value={email} onChange={setEmail} />
                    <Input label={t("fieldPhone")} type="tel" value={phone} onChange={setPhone} />
                  </div>
                  <Input label={t("fieldCompany")} value={company} onChange={setCompany} />

                  <div>
                    <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">{t("fieldIndustry")}</label>
                    <div className="grid grid-cols-3 gap-1.5 mt-2">
                      {INDUSTRY_CODES.map((code) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => setIndustry(code)}
                          aria-pressed={industry === code}
                          className={`py-2.5 font-mono text-[11px] cursor-pointer border transition-colors ${industry === code ? "bg-ink text-white border-ink" : "bg-white text-ink border-ink-15 hover:border-ink-30"}`}
                        >
                          {t(`industry.${code}`)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="block">
                    <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">{t("fieldMessage")} <span className="text-danger">*</span></span>
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
                      <a href={co.phone.office.href} className="text-danger underline">
                        {co.phone.office.display}
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
                    {sending ? t("sending") : t("send")}
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
