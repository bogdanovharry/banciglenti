# Card payments (Revolut Business)

Hosted checkout: the buyer pays on Revolut's page (card, Apple Pay, Google Pay,
Revolut Pay); card data never touches this site. Cash on delivery and bank
transfer are unchanged.

## Switching it on

Three variables on the Vercel project of each shop. Without the first, the card
option does not exist (`getMarket` only adds it when it is set).

| Variable | What |
| --- | --- |
| `REVOLUT_MERCHANT_SECRET` | Merchant API **secret** key. Sandbox key while testing. |
| `REVOLUT_WEBHOOK_SECRET` | Signing secret returned when the webhook is created. |
| `REVOLUT_ENV` | `sandbox` while testing; leave unset for live. |

Webhook: create it once per environment (Revolut Business → Merchant API → Webhooks,
or the API) pointing at `https://<shop address>/api/payments/revolut`, events
`ORDER_COMPLETED`, `ORDER_CANCELLED`, `ORDER_FAILED`. The shop also settles a payment
when the buyer comes back, so a missing webhook delays nothing the buyer sees.

Apply `src/migrations/20261113_100000_revolut.ts` (one new enum value) **before**
deploying code that stores `payment.method = 'revolut'`.

## How an order is paid

1. `/api/checkout` creates the order as usual (payment `pending`), then a Revolut
   order for the amount the buyer was shown (`total × exchange rate`, in the shop's
   currency, smallest unit), and returns its `checkout_url`. The page sends the
   buyer there. The cart is not emptied yet.
2. Revolut sends the buyer back to `/checkout/return?k=<the order's random key>`.
3. An order becomes **paid** only when Revolut, asked directly with our secret key,
   says it is `completed` **for the expected amount and currency** (`reconcileCardPayment`).
   The return page and the webhook only trigger that question; neither is believed
   on its own. The first caller to flip the flag sends the e-mails; concurrent ones
   find it flipped.
4. Revolut order cancelled or expired (2 h unpaid) → our order is cancelled
   automatically and its goods go back on the shelf.
5. A wrong amount is never marked paid; the order's history says so.

The workshop and the buyer are e-mailed **when the order is paid**, not when it is
started. If Revolut cannot be reached at checkout the order carries on as bank
transfer (Bulgaria) or cash on delivery (Romania) and the buyer is told.

## Open points

- Whether Revolut accepts RON for a Bulgarian business account, and the fee on
  card payments, must be confirmed with Revolut (sandbox first).
- Refunds are done in the Revolut Business dashboard; marking the order "refunded" is manual.
- A buyer who abandons a card payment leaves a pending order until Revolut expires it (2 h).
- The API version header defaults to `2024-09-01` (`REVOLUT_API_VERSION` to change).
- `REVOLUT_API_BASE` exists only to point tests at a stand-in server. Never set it in production.
