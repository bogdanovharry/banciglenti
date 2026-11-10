# Invoicing — decisions log

Decisions the owner has taken about invoices for Romania. Newest last. Anything
not here is still open (see `claude-code-instructions` section 8).

| Date | Decision |
|---|---|
| 2026-11-10 | The automatic VIES check is **removed** from checkout. Zero-rating (case B) therefore has no basis yet; until the owner decides how a buyer's VAT number is accepted, every invoice is at the standard rate. |
| 2026-11-10 | The invoice is issued **in lei**, as **one** invoice showing lei and the euro equivalent side by side. **No second "mirror" invoice** in euro. |
| 2026-11-10 | The cash-on-delivery money is paid out **in euro to the company's account in Bulgaria**. |
| 2026-11-10 | The euro exchange rate (source and date) is **not decided yet**. The euro column stays off until it is (`INVOICE_SETTINGS.euroRate`). |

## Open points that follow from these
- The courier collects lei and pays out euro, so the euro that arrives can differ
  from the euro on the invoice. Ask the courier (Speedy / DPD) at which rate it
  converts, and let the accountant book the difference.
- Which rate the accountant wants on the invoice (ECB or BNR, dispatch or
  delivery date). The OSS return itself is in euro at the ECB rate of the last
  day of the quarter (stated by HMRC and Skatteverket; confirm with the NRA).
- When the invoice is issued, who numbers it, and its language (items 2–4 of
  section 8) are still open.
