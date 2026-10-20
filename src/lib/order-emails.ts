import { companyFor } from './company'
import { escapeHtml } from './email'
import { MARKETS, formatPrice, vatLabel, type Market } from './market'

/**
 * The words of the two emails an order produces, and of the one an enquiry does.
 *
 * Kept away from the sending code so what a customer is told can be read, and
 * corrected, in one place. The customer's email is in their market's language
 * (Romanian, otherwise Bulgarian) and shows prices the way the shop did — in
 * their currency, with VAT and without. The staff email is always Bulgarian:
 * the workshop reads it, whichever market the order came from.
 *
 * Draft Romanian, to be read by a native speaker with the rest of the text.
 */

export type EmailLine = {
  name: string
  sku: string
  quantity: number
  /** EUR, without VAT. */
  price: number
  madeToMeasure: boolean
}

export type EmailOrder = {
  orderNumber: string
  /** The order document's id, for the link into /manage. */
  id: number
  contact: { name: string; email: string; phone: string; company?: string }
  address: string
  shippingMethod: 'courier' | 'pickup'
  paymentMethod: 'cod' | 'bank_transfer'
  lines: EmailLine[]
  /** EUR. */
  subtotal: number
  shippingCost: number
  tax: number
  total: number
  vatRate: number
  billing?: { company: string; taxId: string; vatNumber?: string; address: string } | null
  notes?: string
}

const shell = (body: string) => `<!doctype html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#111">
<div style="max-width:640px;margin:0 auto;background:#fff;padding:28px">${body}</div></body></html>`

const row = (a: string, b: string, strong = false) =>
  `<tr><td style="padding:4px 0;color:${strong ? '#111' : '#4d4d4d'};${strong ? 'font-weight:bold;' : ''}">${a}</td><td style="padding:4px 0;text-align:right;${strong ? 'font-weight:bold;' : ''}">${b}</td></tr>`

// --- Customer ---------------------------------------------------------------

const CUSTOMER = {
  bg: {
    subject: (n: string) => `Поръчка ${n} — получихме я`,
    hello: (name: string) => `Здравейте, ${name}!`,
    intro: 'Получихме поръчката ви. Наш човек ще се свърже с вас, за да потвърди размерите и срока за изработка.',
    number: 'Номер на поръчка',
    item: 'Артикул',
    qty: 'Бр.',
    sum: 'Сума',
    exVat: 'без ДДС',
    incVat: 'с ДДС',
    subtotal: 'Междинна сума',
    vat: 'ДДС',
    total: 'Общо',
    delivery: 'Доставка',
    deliveryAddress: 'Адрес за доставка',
    pickup: 'Лично вземане от цеха',
    cod: (amount: string) => `Плащане при доставка: ${amount} на куриера.`,
    collectFee: (couriers: string) =>
      `Доставката с ${couriers} се таксува по тегло и се плаща на куриера при получаване. Не е включена в сумата.`,
    flatFee: (fee: string) => `Доставка: ${fee} (включена в общата сума).`,
    transfer: (iban: string, ref: string) =>
      `Банков превод: IBAN ${iban}, основание ${ref}. Поръчката тръгва след потвърждение на плащането.`,
    madeToMeasure: 'Изработва се по ваш размер — не подлежи на връщане.',
    invoice: 'Фактура на',
    questions: 'Въпроси? Отговорете на този имейл или се обадете на',
    terms: 'Общи условия',
  },
  ro: {
    subject: (n: string) => `Comanda ${n} — am primit-o`,
    hello: (name: string) => `Bună ziua, ${name}!`,
    intro: 'Am primit comanda dvs. Un coleg vă va contacta pentru a confirma dimensiunile și termenul de execuție.',
    number: 'Numărul comenzii',
    item: 'Articol',
    qty: 'Buc.',
    sum: 'Sumă',
    exVat: 'fără TVA',
    incVat: 'cu TVA',
    subtotal: 'Subtotal',
    vat: 'TVA',
    total: 'Total',
    delivery: 'Livrare',
    deliveryAddress: 'Adresa de livrare',
    pickup: 'Ridicare personală de la atelier',
    cod: (amount: string) => `Plata la livrare: ${amount}, către curier.`,
    collectFee: (couriers: string) =>
      `Livrarea cu ${couriers} se taxează în funcție de greutate și se plătește curierului la primire. Nu este inclusă în total.`,
    flatFee: (fee: string) => `Livrare: ${fee} (inclusă în total).`,
    transfer: (iban: string, ref: string) =>
      `Transfer bancar: IBAN ${iban}, detalii plată ${ref}. Comanda pleacă după confirmarea plății.`,
    madeToMeasure: 'Se fabrică la dimensiunea dvs. — nu se poate returna.',
    invoice: 'Factură pe',
    questions: 'Întrebări? Răspundeți la acest e-mail sau sunați la',
    terms: 'Termeni și condiții',
  },
} as const

export function customerEmail(market: Market, order: EmailOrder, origin: string) {
  const L = market.locale.startsWith('ro') ? CUSTOMER.ro : CUSTOMER.bg
  const company = companyFor(market.locale)
  const money = (eur: number) => formatPrice(eur, market)

  // Under 'collect' the courier bills the carriage at the door, so the total the
  // buyer owes the shop is goods plus VAT only.
  const collect = market.carriage === 'collect'
  const owed = order.subtotal + order.tax + (collect ? 0 : order.shippingCost)
  const lines = order.lines
  const hasMadeToMeasure = lines.some((l) => l.madeToMeasure)

  const payment =
    order.paymentMethod === 'cod'
      ? [
          L.cod(money(owed)),
          collect
            ? L.collectFee(market.couriers.join(' / '))
            : order.shippingCost > 0
              ? L.flatFee(money(order.shippingCost))
              : '',
        ]
      : [L.transfer(company.bank.iban, order.orderNumber)]
  const notes = [...payment, hasMadeToMeasure ? L.madeToMeasure : ''].filter(Boolean)

  const where = order.shippingMethod === 'pickup' ? L.pickup : `${L.deliveryAddress}:\n${order.address}`

  const text = [
    L.hello(order.contact.name),
    '',
    L.intro,
    '',
    `${L.number}: ${order.orderNumber}`,
    '',
    ...lines.map(
      (l) =>
        `- ${l.name} × ${l.quantity} — ${money(l.price * l.quantity)} ${L.exVat}${l.madeToMeasure ? ` (${L.madeToMeasure})` : ''}`,
    ),
    '',
    `${L.subtotal} (${L.exVat}): ${money(order.subtotal)}`,
    `${L.vat} ${vatLabel(order.vatRate)}: ${money(order.tax)}`,
    `${L.total} (${L.incVat}): ${money(owed)}`,
    '',
    where,
    '',
    ...notes,
    ...(order.billing ? ['', `${L.invoice}: ${order.billing.company}, ${order.billing.taxId}`] : []),
    '',
    `${L.questions} ${company.phone.office.display} · ${company.email}`,
    `${L.terms}: ${origin}/terms`,
  ].join('\n')

  const html = shell(`
    <h1 style="font-size:20px;margin:0 0 12px">${escapeHtml(L.hello(order.contact.name))}</h1>
    <p style="margin:0 0 16px;line-height:1.5">${escapeHtml(L.intro)}</p>
    <p style="margin:0 0 20px;padding:12px 14px;background:#f5f5f5"><span style="color:#4d4d4d">${L.number}</span><br><strong style="font-size:20px;font-family:monospace">${escapeHtml(order.orderNumber)}</strong></p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr style="color:#808080;font-size:11px;text-transform:uppercase"><td style="padding:4px 0">${L.item}</td><td style="text-align:right">${L.qty}</td><td style="text-align:right">${L.sum} ${L.exVat}</td></tr>
      ${lines
        .map(
          (l) =>
            `<tr style="border-top:1px solid #ededed"><td style="padding:8px 8px 8px 0">${escapeHtml(l.name)}${l.madeToMeasure ? `<br><span style="font-size:12px;color:#b45309">${escapeHtml(L.madeToMeasure)}</span>` : ''}</td><td style="text-align:right;white-space:nowrap">${l.quantity}</td><td style="text-align:right;white-space:nowrap">${escapeHtml(money(l.price * l.quantity))}</td></tr>`,
        )
        .join('')}
    </table>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:12px;border-top:2px solid #111">
      ${row(`${L.subtotal} (${L.exVat})`, escapeHtml(money(order.subtotal)))}
      ${row(`${L.vat} ${vatLabel(order.vatRate)}`, escapeHtml(money(order.tax)))}
      ${row(`${L.total} (${L.incVat})`, escapeHtml(money(owed)), true)}
    </table>
    <p style="margin:20px 0 4px;font-weight:bold">${L.delivery}</p>
    <p style="margin:0 0 16px;white-space:pre-line;line-height:1.5">${escapeHtml(where)}</p>
    ${notes.map((n) => `<p style="margin:0 0 10px;line-height:1.5">${escapeHtml(n)}</p>`).join('')}
    ${order.billing ? `<p style="margin:16px 0 0;font-size:13px;color:#4d4d4d">${L.invoice}: ${escapeHtml(order.billing.company)}, ${escapeHtml(order.billing.taxId)}</p>` : ''}
    <hr style="border:0;border-top:1px solid #ededed;margin:24px 0">
    <p style="margin:0;font-size:13px;color:#4d4d4d;line-height:1.5">${L.questions} <a href="${escapeHtml(company.phone.office.href)}">${escapeHtml(company.phone.office.display)}</a> · ${escapeHtml(company.email)}<br><a href="${escapeHtml(origin)}/terms">${L.terms}</a></p>`)

  return { subject: L.subject(order.orderNumber), html, text }
}

// --- Staff ------------------------------------------------------------------

/** Always Bulgarian: the workshop reads this, whichever market the order is from. */
export function staffOrderEmail(order: EmailOrder, market: Market, origin: string) {
  const eur = (n: number) => formatPrice(n, MARKETS.bg)
  const total = order.subtotal + order.tax + order.shippingCost
  const link = `${origin}/manage/orders/${order.id}`
  const shown =
    market.displayCurrency === 'EUR' ? '' : ` (${formatPrice(order.subtotal + order.tax, market)} за клиента)`
  const sizes = order.lines.map((l) => `${l.quantity} × ${l.name} (${l.sku})${l.madeToMeasure ? ' [по размер]' : ''}`)

  const text = [
    `Нова поръчка ${order.orderNumber} — ${market.country}`,
    `Сума: ${eur(total)} с ДДС${shown}`,
    '',
    `Клиент: ${order.contact.name}${order.contact.company ? `, ${order.contact.company}` : ''}`,
    `Телефон: ${order.contact.phone}`,
    `Имейл: ${order.contact.email}`,
    order.shippingMethod === 'pickup' ? 'Доставка: лично вземане' : `Адрес:\n${order.address}`,
    `Плащане: ${order.paymentMethod === 'cod' ? 'наложен платеж' : 'банков превод'}`,
    ...(order.billing
      ? [
          '',
          `Фактура на: ${order.billing.company}, ЕИК/CUI ${order.billing.taxId}${order.billing.vatNumber ? `, ДДС ${order.billing.vatNumber}` : ''}`,
          order.billing.address,
        ]
      : []),
    '',
    ...sizes,
    ...(order.notes ? ['', `Бележка от клиента: ${order.notes}`] : []),
    '',
    link,
  ].join('\n')

  const html = shell(`
    <h1 style="font-size:18px;margin:0 0 6px">Нова поръчка <span style="font-family:monospace">${escapeHtml(order.orderNumber)}</span></h1>
    <p style="margin:0 0 16px;color:#4d4d4d">${escapeHtml(market.country)} · <strong>${escapeHtml(eur(total))}</strong> с ДДС${escapeHtml(shown)}</p>
    <p style="margin:0 0 12px;line-height:1.6"><strong>${escapeHtml(order.contact.name)}</strong>${order.contact.company ? ` · ${escapeHtml(order.contact.company)}` : ''}<br>
    <a href="tel:${escapeHtml(order.contact.phone.replace(/\s/g, ''))}">${escapeHtml(order.contact.phone)}</a> · ${escapeHtml(order.contact.email)}</p>
    <p style="margin:0 0 12px;white-space:pre-line">${escapeHtml(order.shippingMethod === 'pickup' ? 'Лично вземане' : order.address)}</p>
    <ul style="margin:0 0 12px;padding-left:18px;line-height:1.6">${sizes.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
    ${order.billing ? `<p style="margin:0 0 12px;font-size:13px">Фактура на: <strong>${escapeHtml(order.billing.company)}</strong>, ЕИК/CUI ${escapeHtml(order.billing.taxId)}${order.billing.vatNumber ? `, ДДС ${escapeHtml(order.billing.vatNumber)}` : ''}<br>${escapeHtml(order.billing.address)}</p>` : ''}
    ${order.notes ? `<p style="margin:0 0 12px;padding:10px;background:#fef3c7">${escapeHtml(order.notes)}</p>` : ''}
    <p style="margin:16px 0 0"><a href="${escapeHtml(link)}" style="background:#111;color:#fff;padding:10px 16px;text-decoration:none">Отвори поръчката</a></p>`)

  return { subject: `Нова поръчка ${order.orderNumber} — ${eur(total)} (${market.country})`, html, text }
}

export function staffEnquiryEmail(
  enquiry: { name: string; email: string; phone?: string; company?: string; industry?: string; message: string },
  origin: string,
) {
  const text = [
    `Ново запитване от ${enquiry.name}${enquiry.company ? `, ${enquiry.company}` : ''}`,
    `Имейл: ${enquiry.email}`,
    ...(enquiry.phone ? [`Телефон: ${enquiry.phone}`] : []),
    ...(enquiry.industry ? [`Сфера: ${enquiry.industry}`] : []),
    '',
    enquiry.message,
    '',
    `${origin}/admin/collections/enquiries`,
  ].join('\n')

  const html = shell(`
    <h1 style="font-size:18px;margin:0 0 12px">Ново запитване</h1>
    <p style="margin:0 0 12px;line-height:1.6"><strong>${escapeHtml(enquiry.name)}</strong>${enquiry.company ? ` · ${escapeHtml(enquiry.company)}` : ''}<br>
    ${escapeHtml(enquiry.email)}${enquiry.phone ? ` · <a href="tel:${escapeHtml(enquiry.phone.replace(/\s/g, ''))}">${escapeHtml(enquiry.phone)}</a>` : ''}</p>
    <p style="margin:0 0 16px;padding:12px;background:#f5f5f5;white-space:pre-line;line-height:1.5">${escapeHtml(enquiry.message)}</p>
    <p style="margin:0"><a href="${escapeHtml(origin)}/admin/collections/enquiries">Отвори в админа</a></p>`)

  return { subject: `Ново запитване — ${enquiry.name}`, html, text }
}
