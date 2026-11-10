# Invoicing — decisions log

Decisions the owner has taken about invoices for Romania. Newest last. Anything
not here is still open (see `claude-code-instructions` section 8).

| Date | Decision |
|---|---|
| 2026-11-10 | The automatic VIES check is **removed** from checkout. Zero-rating (case B) therefore has no basis yet; until the owner decides how a buyer's VAT number is accepted, every invoice is at the standard rate. |
| 2026-11-10 | The invoice is issued **in lei**, as **one** invoice showing lei and the euro equivalent side by side. **No second "mirror" invoice** in euro. |
| 2026-11-10 | The cash-on-delivery money is paid out **in euro to the company's account in Bulgaria**. |
| 2026-11-10 | The euro exchange rate (source and date) is **not decided yet**. Meanwhile the invoice shows the euro amounts of the order itself, i.e. at the shop's own fixed rate (5.2567), labelled as such, with a warning in the preview. It is exact for what the buyer was charged but not an official rate for the day of the tax event. Switch with `INVOICE_SETTINGS.euroRate` once the accountant chooses (ECB or BNR, which date). |

## Open points that follow from these
- The courier collects lei and pays out euro, so the euro that arrives can differ
  from the euro on the invoice. Ask the courier (Speedy / DPD) at which rate it
  converts, and let the accountant book the difference.
- Which rate the accountant wants on the invoice (ECB or BNR, dispatch or
  delivery date). The OSS return itself is in euro at the ECB rate of the last
  day of the quarter (stated by HMRC and Skatteverket; confirm with the NRA).
- When the invoice is issued, who numbers it, and its language (items 2–4 of
  section 8) are still open.

## 2026-11-10 (later)
| Decision | Detail |
|---|---|
| **When** | The invoice is issued **when the order has shipped**, but **never automatically**: the owner opens the preview (`/manage/orders/<id>/invoice`), reads it, and presses "Издай фактурата". Only an administrator can press it. |
| **Language** | **Bilingual**: Romanian first, Bulgarian beneath, label by label. The Romanian wording is a draft and needs a native reader. |
| **Numbering** | Chosen by Claude, **provisional**, accountant has not seen it: separate series `RO` for the website, ten digits, starting at 9 000 000 001 so it cannot collide with the company's own invoices; given by a counter inside the same transaction that stores the invoice (no duplicates, no gaps). See `INVOICE_SETTINGS.series`. |

## Not built yet
- **PDF.** The invoice is an HTML page that prints cleanly ("Печат" → save as PDF). A stored PDF with its hash comes next.
- E-mailing the invoice to the buyer (only with the consent box ticked) — no mail provider is configured yet.
- Credit notes (refused parcel, returned blade), and the three exports (sales journal, VIES list, OSS).
- Zero-rating: every invoice is at the standard rate until the owner decides how a buyer's VAT number is accepted.
- The official euro rate (see above): the euro shown is at the shop's rate for now.
- Supplier's representative (МОЛ) and a confirmed ЕИК are shown as warnings in the preview.

## Careful
An issued invoice **cannot be changed or deleted** (database trigger). Do not press "Издай" on a test order in production: it would take number 9 000 000 001 for good. The button stays disabled until the order is shipped.
