"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { PageHeader } from "@/components/layout/PageHeader";
import { Btn } from "@/components/ui/primitives";
import { localizeHref } from "@/lib/slugs";
import { usePrices } from "@/lib/market-context";
import type { AccountProfile, Address, Machine } from "@/lib/account";

export type OrderRow = {
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: { name: string; quantity: number }[];
};

const inputCls =
  "w-full h-11 mt-1.5 px-3.5 border border-ink-15 font-sans text-sm outline-none bg-white focus:border-blue transition-colors disabled:bg-paper disabled:text-ink-50";

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">{label}</span>
      {children}
      {hint && <span className="block mt-1 font-sans text-[12px] text-ink-50">{hint}</span>}
    </label>
  );
}

function Text({
  label, value, onChange, type = "text", required, hint, autoComplete, disabled, maxLength,
}: {
  label: string; value: string; onChange?: (v: string) => void; type?: string; required?: boolean;
  hint?: string; autoComplete?: string; disabled?: boolean; maxLength?: number;
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        type={type}
        value={value}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        maxLength={maxLength}
        onChange={(e) => onChange?.(e.target.value)}
        className={inputCls}
      />
    </Field>
  );
}

/** What the routes answer with on a failure is a code; the words are ours, in the visitor's language. */
function useErrorText() {
  const t = useTranslations("account.errors");
  return (code: string) => (t.has(code) ? t(code) : t("server"));
}

async function send(url: string, method: string, body?: unknown): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: { error: "server" } };
  }
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="border border-ink-15 bg-white">
      <div className="px-6 py-4 border-b border-ink-15 bg-paper">
        <h2 className="font-display text-lg font-bold text-ink m-0">{title}</h2>
        {hint && <p className="font-sans text-[13px] text-ink-70 m-0 mt-1">{hint}</p>}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

// ===== Logged out: log in or register =====
function AuthPanel() {
  const t = useTranslations("account");
  const locale = useLocale();
  const errorText = useErrorText();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { ok, data } = await send(
      `/api/account/${mode}`,
      "POST",
      mode === "login" ? { email, password } : { email, password, name, phone, acceptTerms: terms },
    );
    if (ok) {
      // A full load, so the header, the cart and the server-rendered page all see the new session.
      window.location.assign(localizeHref("/account", locale));
      return;
    }
    setError(errorText(String(data.error ?? "server")));
    setBusy(false);
  };

  return (
    <div className="max-w-[480px] mx-auto">
      <h2 className="font-display text-2xl font-bold text-ink m-0 mb-6">{t(`${mode}.title`)}</h2>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate={false}>
        {mode === "register" && (
          <>
            <Text label={t("fields.name")} value={name} onChange={setName} required autoComplete="name" maxLength={120} />
            <Text label={t("fields.phone")} value={phone} onChange={setPhone} type="tel" autoComplete="tel" maxLength={40} />
          </>
        )}
        <Text label={t("fields.email")} value={email} onChange={setEmail} type="email" required autoComplete="email" maxLength={160} />
        <Text
          label={t("fields.password")}
          value={password}
          onChange={setPassword}
          type="password"
          required
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          maxLength={128}
          hint={mode === "register" ? t("register.passwordHint") : undefined}
        />
        {mode === "register" && (
          <label className="flex gap-3 items-start font-sans text-[13px] text-ink-70 leading-relaxed">
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-1 w-4 h-4" required />
            <span>
              {t.rich("register.terms", {
                terms: (c) => <Link href={localizeHref("/terms", locale)} className="text-blue underline">{c}</Link>,
                privacy: (c) => <Link href={localizeHref("/privacy", locale)} className="text-blue underline">{c}</Link>,
              })}
            </span>
          </label>
        )}
        {error && <p role="alert" className="m-0 font-sans text-sm text-danger">{error}</p>}
        <Btn variant="primary" size="lg" fullWidth type="submit" disabled={busy}>
          {t(`${mode}.button`)}
        </Btn>
      </form>
      <button
        type="button"
        onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}
        className="mt-5 bg-transparent border-none p-0 cursor-pointer font-sans text-sm text-blue underline"
      >
        {t(`${mode}.switch`)}
      </button>
      {mode === "login" && (
        <p className="font-sans text-[13px] text-ink-70 mt-4 mb-0">
          {t("login.forgot")}{" "}
          <Link href={localizeHref("/contact", locale)} className="text-blue underline">{t("login.forgotLink")}</Link>
        </p>
      )}
    </div>
  );
}

// ===== Logged in =====
const emptyAddress = (): Address => ({ label: "", street: "", city: "", postalCode: "", isDefault: false });
const emptyMachine = (): Machine => ({ brand: "", model: "", bladeLength: null, bladeWidth: null, bladeThickness: null });

function Profile({ account }: { account: AccountProfile }) {
  const t = useTranslations("account");
  const errorText = useErrorText();
  const [form, setForm] = useState({
    name: account.name, phone: account.phone, company: account.company, taxId: account.taxId, vatNumber: account.vatNumber,
  });
  const [addresses, setAddresses] = useState<Address[]>(account.addresses);
  const [machines, setMachines] = useState<Machine[]>(account.machines);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setState("saving");
    setError(null);
    const { ok, data } = await send("/api/account/profile", "PATCH", { ...form, addresses, machines });
    if (ok) {
      setState("saved");
      setTimeout(() => setState("idle"), 2500);
    } else {
      setError(errorText(String(data.error ?? "server")));
      setState("idle");
    }
  };

  const setAddress = (i: number, patch: Partial<Address>) =>
    setAddresses((list) => list.map((a, j) => (j === i ? { ...a, ...patch } : patch.isDefault ? { ...a, isDefault: false } : a)));
  const setMachine = (i: number, patch: Partial<Machine>) => setMachines((list) => list.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  const numberValue = (n: number | null) => (n === null ? "" : String(n));

  return (
    <form onSubmit={save} className="flex flex-col gap-8">
      <Section title={t("sections.details")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Text label={t("fields.name")} value={form.name} onChange={(v) => setForm({ ...form, name: v })} required autoComplete="name" maxLength={120} />
          <Text label={t("fields.phone")} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} type="tel" autoComplete="tel" maxLength={40} />
          <Text label={t("fields.email")} value={account.email} disabled hint={t("hints.email")} />
        </div>
      </Section>

      <Section title={t("sections.invoice")} hint={t("hints.invoice")}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Text label={t("fields.company")} value={form.company} onChange={(v) => setForm({ ...form, company: v })} autoComplete="organization" maxLength={160} />
          <Text label={t("fields.taxId")} value={form.taxId} onChange={(v) => setForm({ ...form, taxId: v })} maxLength={40} />
          <Text label={t("fields.vatNumber")} value={form.vatNumber} onChange={(v) => setForm({ ...form, vatNumber: v })} maxLength={40} />
        </div>
      </Section>

      <Section title={t("sections.addresses")}>
        <div className="flex flex-col gap-6">
          {addresses.map((a, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-ink-15 last:border-0 last:pb-0">
              <Text label={t("fields.addressLabel")} value={a.label} onChange={(v) => setAddress(i, { label: v })} maxLength={60} />
              <Text label={t("fields.street")} value={a.street} onChange={(v) => setAddress(i, { street: v })} autoComplete="street-address" maxLength={300} />
              <Text label={t("fields.city")} value={a.city} onChange={(v) => setAddress(i, { city: v })} autoComplete="address-level2" maxLength={120} />
              <Text label={t("fields.postalCode")} value={a.postalCode} onChange={(v) => setAddress(i, { postalCode: v })} autoComplete="postal-code" maxLength={20} />
              <label className="flex items-center gap-2 font-sans text-sm text-ink-70">
                <input type="checkbox" checked={a.isDefault} onChange={(e) => setAddress(i, { isDefault: e.target.checked })} className="w-4 h-4" />
                {t("fields.isDefault")}
              </label>
              <div className="sm:text-right">
                <button type="button" onClick={() => setAddresses((l) => l.filter((_, j) => j !== i))} className="bg-transparent border-none p-0 cursor-pointer font-sans text-sm text-danger underline">
                  {t("actions.remove")}
                </button>
              </div>
            </div>
          ))}
          {addresses.length < 5 && (
            <div>
              <Btn variant="ghost" size="sm" type="button" onClick={() => setAddresses((l) => [...l, emptyAddress()])}>{t("actions.addAddress")}</Btn>
            </div>
          )}
        </div>
      </Section>

      <Section title={t("sections.machines")} hint={t("hints.machines")}>
        <div className="flex flex-col gap-6">
          {machines.map((m, i) => (
            <div key={i} className="grid grid-cols-2 sm:grid-cols-5 gap-4 pb-6 border-b border-ink-15 last:border-0 last:pb-0">
              <Text label={t("fields.brand")} value={m.brand} onChange={(v) => setMachine(i, { brand: v })} maxLength={80} />
              <Text label={t("fields.model")} value={m.model} onChange={(v) => setMachine(i, { model: v })} maxLength={80} />
              <Text label={t("fields.bladeLength")} value={numberValue(m.bladeLength)} onChange={(v) => setMachine(i, { bladeLength: v === "" ? null : Number(v.replace(",", ".")) || null })} />
              <Text label={t("fields.bladeWidth")} value={numberValue(m.bladeWidth)} onChange={(v) => setMachine(i, { bladeWidth: v === "" ? null : Number(v.replace(",", ".")) || null })} />
              <Text label={t("fields.bladeThickness")} value={numberValue(m.bladeThickness)} onChange={(v) => setMachine(i, { bladeThickness: v === "" ? null : Number(v.replace(",", ".")) || null })} />
              <div className="col-span-2 sm:col-span-5">
                <button type="button" onClick={() => setMachines((l) => l.filter((_, j) => j !== i))} className="bg-transparent border-none p-0 cursor-pointer font-sans text-sm text-danger underline">
                  {t("actions.remove")}
                </button>
              </div>
            </div>
          ))}
          {machines.length < 10 && (
            <div>
              <Btn variant="ghost" size="sm" type="button" onClick={() => setMachines((l) => [...l, emptyMachine()])}>{t("actions.addMachine")}</Btn>
            </div>
          )}
        </div>
      </Section>

      <div className="flex items-center gap-4">
        <Btn variant="primary" size="lg" type="submit" disabled={state === "saving"}>
          {state === "saving" ? t("actions.saving") : state === "saved" ? t("actions.saved") : t("actions.save")}
        </Btn>
        {error && <span role="alert" className="font-sans text-sm text-danger">{error}</span>}
      </div>
    </form>
  );
}

function Orders({ orders }: { orders: OrderRow[] }) {
  const t = useTranslations("account");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { amount, symbol } = usePrices();
  const date = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso));

  return (
    <Section title={t("sections.orders")} hint={t("orders.note")}>
      {orders.length === 0 ? (
        <p className="font-sans text-sm text-ink-70 m-0">{t("orders.empty")}</p>
      ) : (
        <ul className="list-none m-0 p-0 flex flex-col">
          {orders.map((o, i) => (
            <li key={o.orderNumber} className={i > 0 ? "border-t border-ink-15" : ""}>
              <details className="group py-4">
                <summary className="cursor-pointer list-none flex flex-wrap items-baseline gap-x-6 gap-y-1">
                  <span className="font-mono text-[13px] font-semibold text-ink">{o.orderNumber}</span>
                  <span className="font-sans text-[13px] text-ink-50">{date(o.createdAt)}</span>
                  <span className="font-mono text-[11px] tracking-[0.08em] uppercase text-ink-70">
                    {t.has(`orders.statuses.${o.status}`) ? t(`orders.statuses.${o.status}`) : o.status}
                  </span>
                  <span className="ml-auto font-display text-[15px] font-bold text-ink tabular-nums">
                    {amount(o.total)} {symbol}
                    <span className="font-mono text-[10px] font-normal text-ink-50 ml-1.5">{tc("incVat")}</span>
                  </span>
                </summary>
                <ul className="list-none m-0 mt-3 p-0 flex flex-col gap-1">
                  {o.items.map((it, j) => (
                    <li key={j} className="font-sans text-[13px] text-ink-70">
                      {it.quantity} × {it.name}
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function Security() {
  const t = useTranslations("account");
  const errorText = useErrorText();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const change = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const { ok, data } = await send("/api/account/password", "POST", { currentPassword: current, newPassword: next });
    if (ok) {
      setCurrent("");
      setNext("");
      setMessage({ ok: true, text: t("actions.passwordChanged") });
    } else {
      setMessage({ ok: false, text: errorText(String(data.error ?? "server")) });
    }
  };

  const remove = async (e: FormEvent) => {
    e.preventDefault();
    setDeleteError(null);
    const { ok, data } = await send("/api/account/profile", "DELETE", { password: confirmPassword });
    if (ok) window.location.assign("/");
    else setDeleteError(errorText(String(data.error ?? "server")));
  };

  return (
    <div className="flex flex-col gap-8">
      <Section title={t("sections.security")}>
        <form onSubmit={change} className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[640px]">
          <Text label={t("actions.currentPassword")} value={current} onChange={setCurrent} type="password" required autoComplete="current-password" maxLength={128} />
          <Text label={t("actions.newPassword")} value={next} onChange={setNext} type="password" required autoComplete="new-password" maxLength={128} hint={t("register.passwordHint")} />
          <div className="sm:col-span-2 flex items-center gap-4">
            <Btn variant="dark" size="md" type="submit">{t("actions.changePassword")}</Btn>
            {message && (
              <span role={message.ok ? "status" : "alert"} className={`font-sans text-sm ${message.ok ? "text-ok" : "text-danger"}`}>{message.text}</span>
            )}
          </div>
        </form>
      </Section>

      <Section title={t("sections.danger")}>
        {!deleting ? (
          <button type="button" onClick={() => setDeleting(true)} className="bg-transparent border-none p-0 cursor-pointer font-sans text-sm text-danger underline">
            {t("actions.deleteAccount")}
          </button>
        ) : (
          <form onSubmit={remove} className="flex flex-col gap-4 max-w-[420px]">
            <p className="font-sans text-sm text-ink-70 m-0">{t("actions.deleteWarning")}</p>
            <Text label={t("actions.deleteConfirm")} value={confirmPassword} onChange={setConfirmPassword} type="password" required autoComplete="current-password" maxLength={128} />
            {deleteError && <p role="alert" className="m-0 font-sans text-sm text-danger">{deleteError}</p>}
            <div>
              <Btn variant="dark" size="md" type="submit">{t("actions.deleteNow")}</Btn>
            </div>
          </form>
        )}
      </Section>
    </div>
  );
}

export function AccountClient({ account, orders }: { account: AccountProfile | null; orders: OrderRow[] }) {
  const t = useTranslations("account");
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    setLoggingOut(true);
    await send("/api/account/logout", "POST");
    window.location.assign("/");
  };

  return (
    <>
      <PageHeader eyebrowNumber={t("eyebrowNumber")} eyebrowLabel={t("eyebrow")} title={t("title")} description={t("intro")}>
        {account && (
          <div className="mt-6 flex items-center gap-4 font-mono text-[12px] text-white/80">
            <span>{account.email}</span>
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className="bg-transparent border border-white/40 text-white px-3 py-1.5 cursor-pointer font-mono text-[11px] tracking-[0.08em] uppercase hover:bg-white/10"
            >
              {t("actions.logout")}
            </button>
          </div>
        )}
      </PageHeader>
      <div className="max-w-[1000px] mx-auto px-4 md:px-10 py-12 md:py-16">
        {account ? (
          <div className="flex flex-col gap-8">
            <Profile account={account} />
            <Orders orders={orders} />
            <Security />
          </div>
        ) : (
          <AuthPanel />
        )}
      </div>
    </>
  );
}
