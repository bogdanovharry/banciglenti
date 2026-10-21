# Deploying

What a production deployment needs, in the order it goes wrong if skipped.

## 1. Environment variables

See `.env.example` for the full list with explanations. Required for the shop to
work at all:

| Variable | Why |
|---|---|
| `DATABASE_URL` | Postgres. Use the **pooled** connection string (Neon: the host with `-pooler`), or serverless instances exhaust connections. |
| `PAYLOAD_SECRET` | Signs sessions. 32+ random characters, different from development. |
| `NEXT_PUBLIC_SITE_URL` | The main domain. |
| `S3_BUCKET`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Image uploads. Without all four, uploads go to the local disk and **vanish on the next deploy**. |
| `RESEND_API_KEY`, `EMAIL_FROM`, `STAFF_NOTIFY_EMAIL` | Order and enquiry emails. Without them the shop works but nobody is told about an order — check `/manage` for pending orders. |

Leave `SETUP_TOKEN` **empty** in production: it disables the `/api/seed/*`
endpoints entirely.

## 2. Region

Put the serverless functions in the same region as the database (Neon is in
Frankfurt: `fra1` on Vercel). The default region is the US, and every page makes
several queries — each one would cross the Atlantic.

## 3. The database schema (read before the first deploy)

Payload creates and alters tables automatically **only in development**
(`push: true` is ignored when `NODE_ENV=production`). Production gets its schema
from the migration files in `src/migrations/`.

There is one: `…_baseline`, which creates every table. How to apply it depends on
what the production database is:

**A new, empty database** (the normal case for a separate production project):

```bash
npm run migrate          # runs against DATABASE_URL
```

**A database that already has the tables** (for example the one used in
development): the baseline would fail with "already exists". Do not run it.
Tell Payload it has been applied instead:

```sql
-- once, in the SQL console of the database
INSERT INTO payload_migrations (name, batch) VALUES ('<name of the baseline file, without .ts>', 1);
```

Only do that if the existing tables really match the current schema (the dev
server's `push` keeps them in step). Check with `npm run migrate:status`.

Migrations are **not** run automatically at startup: two instances starting
together would both try, and a database that is already current would make the
first one fail and take the site down. Run them as a deploy step, once.

### After changing a collection

Development applies the change by itself. For production, generate a migration
file and commit it:

```bash
npm run migrate:create <what-changed>
```

On Node 24 this command fails resolving the project's imports (a `tsx` /
extensionless-import problem inside Payload's CLI). It works on Node 22; or, as
was done for the baseline, call `payload.db.createMigration(...)` from a
throw-away dev-only route and delete the route afterwards.

## 4. Domains

`src/i18n/locale.ts` maps each domain to a market. A domain that is not in the
list is served as Bulgaria. Add the Romanian domain **and its `www.` form**
there before pointing DNS at the deployment, then add both to the Vercel project.

`robots.txt` and `sitemap.xml` are generated per domain. Preview deployments
(`*.vercel.app`) disallow all crawling, so they do not compete with the real
domain.

## 5. First admin

The seed admin from development must not exist in production. Create the first
user through `/admin` (Payload shows "create first user" on an empty database),
with a password of at least 12 characters. Do this **before** the domain goes
live — until the first user exists, anyone who reaches `/admin` first can claim
it.

## 6. Smoke test after the first deploy

1. `/` loads in the right language on each domain; the logo is the right one.
2. `/robots.txt`, `/sitemap.xml` answer on that domain, with that domain's URLs.
3. Place a test order (cash on delivery) and check: the order appears in
   `/manage/orders`, the customer email and the staff email arrive, the totals
   match what the cart showed.
4. Delete the test order from `/manage`.

## 7. Data that is not in code

`madeToOrder` is a flag on each product. The seeds set it for the Vector range
and the machine-size blades, but a database filled before the flag existed has it
unset, which shows those products as sold out. On such a database, once:

```sql
UPDATE products SET made_to_order = true
WHERE status = 'active' AND coalesce(stock, 0) = 0;
```

(All 22 products matching that in the development database are loops cut to one
machine's exact length — made to order by nature. Check before running it on a
database with a different catalogue.)

## 8. Loading the catalogue range into production

The ready-made blades by machine are generated from `src/lib/machines.ts` and
`src/lib/products-data.ts`, not typed into the database. On the production
database, after the migration in section 3 has run, load them once.

Do **not** point a local dev server at the production database to do this: dev
runs with `push: true` and would change the schema. Instead set `SETUP_TOKEN` on
the deployed app, redeploy, run the calls below, then **remove `SETUP_TOKEN`
again** (see section 1).

```sh
T=…   # the token you just set
curl -X POST https://<domain>/api/seed/blades   -H "x-setup-token: $T"
curl -X POST https://<domain>/api/seed/machines -H "x-setup-token: $T"
curl -X POST https://<domain>/api/seed/series   -H "x-setup-token: $T"
```

In that order: `blades` makes the Wood-Mizer, Norwood and Logosol sizes (and
retires the superseded 4013 mm and Serra 3570 mm ones), `machines` attaches
machines to the blades that fit and creates the missing sizes, `series` puts the
Saw-Meister names on them. Each is safe to run twice. `machines` takes about ten
minutes against a remote database — raise the request timeout, and let it finish.

Two things the seeds do not do:

- **Prices of products that already exist** are only re-computed for the
  machine blades the `machines` call creates itself. Check
  `lenta-optimum-s-275-g-s-275-n-2480` by hand: it must be 24.08 EUR (it was
  created at 20.41 from the wrong price row).
- **Orders already taken** for a withdrawn size (Wood-Mizer 4013 mm) keep their
  line; read them before the blade is cut.

Every `verified: false` machine in `machines.ts` has a size taken from a dealer
listing rather than the maker. Have the workshop confirm those before the first
order for them.
