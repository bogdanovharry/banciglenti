import { INVOICE_SETTINGS } from './settings'
import { computeInvoice, distribute } from './calculate'

/**
 * What an invoice says, as data.
 *
 * `buildSnapshot` turns an order and the supplier's details into a snapshot —
 * every fact the document shows, frozen. At issue the snapshot is stored with
 * the invoice and the page renders only from it, so a later change to a price,
 * a rate, the supplier's address or a translation can never alter an issued
 * invoice. Before issue the same function draws the preview.
 *
 * Pure: no database, no clock (the date is passed in), no imports of anything
 * with side effects. Money is whole bani (1/100 leu).
 */

export type InvoiceSupplier = {
  nameBg: string
  nameLatin: string
  vatNumber: string
  registrationNumber: string
  /** Not read from the register — the owner has to confirm it. */
  registrationNumberConfirmed: boolean
  addressBg: string
  addressLatin: string
  /** МОЛ. Not stored anywhere yet. */
  representative: string | null
  bankName: string | null
  iban: string | null
  bic: string | null
}

export type InvoiceBuyer = {
  name: string
  isCompany: boolean
  /** ЕИК / CUI */
  taxId: string | null
  vatNumber: string | null
  address: string
}

export type SnapshotLine = {
  /** As stored in the catalogue (Bulgarian), or null when the order holds only a Romanian name. */
  nameBg: string | null
  nameRo: string
  quantity: number
  netBani: number
  vatBani: number
  grossBani: number
}

export type InvoiceSnapshot = {
  version: 1
  docType: 'invoice'
  series: string
  /** Ten digits; null in a preview, which has no number yet. */
  number: string | null
  /** YYYY-MM-DD, the Sofia calendar day. */
  issueDate: string
  currency: 'RON'
  language: 'bilingual'
  supplier: InvoiceSupplier
  buyer: InvoiceBuyer
  order: {
    number: string
    waybill: string | null
    paymentMethod: 'cod' | 'bank_transfer' | 'other'
  }
  taxCase: 'A'
  vatRateBp: number
  lines: SnapshotLine[]
  totals: { netBani: number; vatBani: number; totalBani: number }
  /** The rate that turned the euro price into lei at checkout — recorded, not an official rate. */
  shopRate: number
  /** Euro equivalent. Null until the rate to use is decided (INVOICE_SETTINGS.euroRate). */
  euro: null | { rate: number; rateSource: string; rateDate: string; totalCents: number; vatCents: number }
}

export type OrderForInvoice = {
  orderNumber: string
  /** EUR, as stored. */
  totalEur: number
  vatRate: number
  /** EUR → RON at checkout. */
  exchangeRate: number
  lines: { name: string; quantity: number; priceEur: number }[]
  paymentMethod: string | null
  waybill: string | null
  buyer: InvoiceBuyer
}

export type BuildInput = {
  order: OrderForInvoice
  supplier: InvoiceSupplier
  series: string
  number: string | null
  issueDate: string
  /** Romanian rendering of a catalogue name; injected so this module stays import-free. */
  toRomanian: (bulgarianName: string) => string
}

const HAS_CYRILLIC = /[А-Яа-яЁё]/

export function buildSnapshot({ order, supplier, series, number, issueDate, toRomanian }: BuildInput): InvoiceSnapshot {
  const rateBp = Math.round(order.vatRate * 10000)

  // The figure the courier collects: the order's total, in lei, rounded the same
  // way the storefront rounded what the buyer was shown.
  const grossTotalBani = Math.round(order.totalEur * order.exchangeRate * 100)

  // Each line's share of that total, by what the line cost with VAT.
  const weights = order.lines.map((l) => l.priceEur * l.quantity * (1 + order.vatRate) * order.exchangeRate * 100)
  const grossLines = distribute(weights, grossTotalBani)
  const amounts = computeInvoice(
    grossLines.map((g) => ({ grossBani: g })),
    { case: 'A', standardRateBp: rateBp },
  )

  const lines: SnapshotLine[] = order.lines.map((l, i) => ({
    nameBg: HAS_CYRILLIC.test(l.name) ? l.name : null,
    nameRo: HAS_CYRILLIC.test(l.name) ? toRomanian(l.name) : l.name,
    quantity: l.quantity,
    ...amounts.lines[i],
  }))

  return {
    version: 1,
    docType: 'invoice',
    series,
    number,
    issueDate,
    currency: 'RON',
    language: 'bilingual',
    supplier,
    buyer: order.buyer,
    order: {
      number: order.orderNumber,
      waybill: order.waybill,
      paymentMethod: order.paymentMethod === 'cod' ? 'cod' : order.paymentMethod === 'bank_transfer' ? 'bank_transfer' : 'other',
    },
    taxCase: 'A',
    vatRateBp: rateBp,
    lines,
    totals: { netBani: amounts.netBani, vatBani: amounts.vatBani, totalBani: amounts.totalBani },
    shopRate: order.exchangeRate,
    // Needs an official rate, which INVOICE_SETTINGS.euroRate does not hold yet.
    euro: null,
  }
}

/** Things the owner should look at before pressing "issue". Plain words, in Bulgarian. */
export function previewWarnings(s: InvoiceSnapshot, orderStatus: string | null): string[] {
  const w: string[] = []
  if (!s.supplier.registrationNumberConfirmed) w.push('ЕИК на доставчика е изведен от ДДС номера и не е потвърден.')
  if (!s.supplier.representative) w.push('Липсва МОЛ на доставчика.')
  if (!s.buyer.address.trim()) w.push('Липсва адрес на получателя.')
  if (s.buyer.isCompany && !s.buyer.vatNumber) w.push('Получателят е фирма без ДДС номер: фактурата е със стандартна ставка.')
  if (!s.order.waybill) w.push('Няма товарителница към поръчката.')
  if (!INVOICE_SETTINGS.euroRate) w.push('Колоната в евро не е включена: курсът още не е избран.')
  w.push('Румънските текстове на фактурата са чернова и трябва да се прочетат от човек, който говори румънски.')
  if (orderStatus !== 'shipped' && orderStatus !== 'delivered') w.push('Фактурата се издава при изпращане: поръчката още не е изпратена.')
  return w
}

/** Fixed wording, one entry per label: Romanian first, Bulgarian beneath. */
export const LABELS = {
  invoice: { ro: 'Factură', bg: 'Фактура' },
  number: { ro: 'Nr.', bg: '№' },
  date: { ro: 'Data emiterii', bg: 'Дата на издаване' },
  supplier: { ro: 'Furnizor', bg: 'Доставчик' },
  buyer: { ro: 'Client', bg: 'Получател' },
  vatNo: { ro: 'Cod TVA', bg: 'ДДС №' },
  regNo: { ro: 'Nr. înreg. (EIK)', bg: 'ЕИК' },
  cui: { ro: 'CUI', bg: 'ЕИК/CUI' },
  address: { ro: 'Adresa', bg: 'Адрес' },
  representative: { ro: 'Reprezentant', bg: 'МОЛ' },
  bank: { ro: 'Banca', bg: 'Банка' },
  item: { ro: 'Denumire', bg: 'Наименование' },
  qty: { ro: 'Cant.', bg: 'Кол.' },
  net: { ro: 'Valoare fără TVA', bg: 'Стойност без ДДС' },
  vat: { ro: 'TVA', bg: 'ДДС' },
  gross: { ro: 'Total cu TVA', bg: 'Общо с ДДС' },
  taxBase: { ro: 'Baza de impozitare', bg: 'Данъчна основа' },
  vatAmount: { ro: 'Valoare TVA', bg: 'Сума на ДДС' },
  totalDue: { ro: 'Total de plată', bg: 'Общо за плащане' },
  payment: { ro: 'Modalitate de plată', bg: 'Начин на плащане' },
  cod: { ro: 'Ramburs la livrare (plată către curier)', bg: 'Наложен платеж (плащане на куриера)' },
  bankTransfer: { ro: 'Transfer bancar', bg: 'Банков превод' },
  order: { ro: 'Comanda', bg: 'Поръчка' },
  waybill: { ro: 'AWB', bg: 'Товарителница' },
  currency: { ro: 'Moneda: RON (lei)', bg: 'Валута: RON (леи)' },
  rate: { ro: 'Cursul de conversie EUR → RON din magazin', bg: 'Курс EUR → RON в магазина' },
} as const
