# A real admin panel for banciglenti.com

## Context

The admin is Payload's generated edit form. Over one session it was reshaped
eight times — card surfaces, a summary component, hidden duplicate fields, row
layouts, print styles — and after every round the owner's verdict was the same:
it still reads like a spreadsheet, and every improvement had to be asked for
individually.

That is not a failure of effort. Payload's admin is built to author content: a
column of inputs, one field per row, derived from the schema. An order is the
opposite kind of object — read many times, edited in three places, and needing
to be scanned in one glance. No amount of CSS turns one into the other, because
the shape is wrong, not the styling.

The owner's own PHP screen is the proof: it fits an entire order — customer,
items, specs, address, totals, comments, status — in one view, with no styling
to speak of. It wins on **information design**, which is a layout decision made
before any CSS is written.

**Decision: stop styling Payload's admin. Keep Payload as the headless data
layer and build the commerce screens as a real application.**

## Why this shape, and not the obvious alternatives

**Payload stays.** It already exposes REST (`src/app/(payload)/api/[...slug]`)
and GraphQL, its auth works, the schema is right, and the storefront reads
through it (`src/lib/catalog.ts`). None of that is the problem. Only the
generated UI is.

**Not Medusa or Shopify.** The business is 684 lines of bespoke pricing —
`src/lib/pricing.ts` holds 133 blade specifications priced per metre, and
`src/lib/order-pricing.ts` re-derives every line server-side from width,
thickness, pitch, length and four optional processes. No e-commerce platform
models a product whose price is a function of five dimensions chosen at order
time. Migrating means rebuilding the thing that makes this shop work.

**Not Retool or Appsmith.** Per-seat monthly cost that grows with the Romanian
and Greek teams, and the screens live outside the repository — no review, no
branch, no rollback.

**Not a downloaded template.** Flatlogic, AdminLTE and the rest are standalone
apps; they cannot be installed into Payload, which is why the last attempt
became hand-written CSS against Payload's class names.

**The decisive argument for building it:** the storefront already has a design
system — tokens in `src/app/globals.css` (blue `#004FC6`, orange `#D97706`, ink,
paper), a type treatment, and components. An admin built on that will look like
*this business*, not like a template someone else designed. That is the one
outcome no purchased kit can deliver.

## What gets built

A route group `src/app/(manage)/` in the same Next.js app. Five screens — that
is the whole scope, and it is why this is a week rather than a quarter.

| Screen | What it is for |
|---|---|
| **Orders list** | Status filter, search by number, sortable by date and total. The list is scanned for "what needs doing", so status and total lead. |
| **Order detail** | Everything the PHP screen has, in one view: customer with click-to-call, line items with the made-to-measure sizes as fields, address, totals, customer comment, internal history, status control, print. Plus the two it lacks in the new system — adding a line, and the courier office. |
| **Customers (CRM)** | The ask that has no equivalent today. Per customer: contact and tax details, order history with totals, enquiries, and **which machines they own** — the strongest asset here, because a customer with a Holzmann BS128HDR always needs 1 638 mm. |
| **Products** | Bulk stock editing and price review across 132 products. Payload's list is adequate for one-off edits and poor for a stock-take. |
| **Dashboard** | Already built and already good — `src/payload/components/Dashboard.tsx` moves across largely unchanged. |

## Stack

Everything is already in the project. No new framework.

- **Next.js 16 route group** `(manage)` — server components fetch through
  Payload's local API, exactly as `src/lib/catalog.ts` does. No HTTP hop, no
  API client to maintain.
- **Payload auth** — `payload.auth({ headers })` reads the existing session
  cookie. Same login, same users, no second auth system.
- **Tailwind v4 + the storefront's own tokens.** The admin inherits the brand
  rather than importing a theme.
- **Server actions** for status changes, comments and tracking numbers, so
  mutations stay server-side and re-price through the same code the order
  route uses.

## Decisions taken

| | |
|---|---|
| Location | **Same repo**, route group `src/app/(manage)/` |
| Build order | **Orders end to end, then CRM**, without pausing between |
| Payload's role | **Content only** — Orders, Customers and Enquiries leave its nav once the new screens work |

## Phasing

Orders and CRM run together as agreed; each phase is still usable on its own,
so nothing is wasted if we stop.

1. **Shell and orders list** — layout, nav, auth guard, filters, search.
   The moment this exists, daily work moves off Payload.
2. **Order detail** — the screen from the PHP reference, in full, including
   adding a line and the courier office.
3. **Customers / CRM** — profile, order history, machines owned, enquiries.
4. **Products** — stock-take and price review across 132 products.
5. **Retire the Payload commerce screens** — hide Orders, Customers and
   Enquiries from its nav. Payload keeps Articles, Pages and Media.

Steps 1–3 are the agreed run. Step 5 waits until the new screens have taken a
real order end to end, so there is never a period with no working admin.

## Verification

- Place an order through the storefront and work it end to end in the new
  admin: confirm, add a comment, set a tracking number, print. Nothing should
  require opening Payload.
- Totals shown must equal the values `/api/orders` computed — compare against
  the `orders` table directly, as was done for the storefront prices.
- Every mutation goes through a server action; confirm no money field can be
  written from the browser.
- `npx tsc --noEmit`, `npx eslint src`, `npx next build` per phase.

## What this does not change

The multi-market plan stands and is not superseded. Its open items:

- **Migrations** — `push: true` is still on. It has now cost a hung dev server
  and blocked `payload generate:importmap` twice. Fix before Romania.
- **~600 storefront strings** still untranslated; the homepage is done.
- **EUR→RON rate** unset, so Romania renders EUR.
- **Romanian domain**, Resend key, Vercel Pro, lawyer review of `/terms`.
- **"12 000 активни клиенти"** — the last unverified figure, now in three
  languages.

Also worth stating plainly: there are no real customers yet. This admin is
worth building because it is where the team will live for years, not because
anything is on fire today.
