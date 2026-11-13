# Invoicing migration — read before running `migrate:create`

File: `src/migrations/20261110_090000_invoices.ts`. **Not applied anywhere.**
Applying it to any database (`npm run migrate`) needs the owner's approval.

## What it does
Additive only: tables `invoices`, `vies_checks`, `invoice_events`,
`invoice_counters`; their enums; two columns on `orders`
(`billing_einvoice_consent`, `billing_einvoice_consent_at`); four relation
columns on `payload_locked_documents_rels`. Nothing is dropped or rewritten.
A trigger refuses UPDATE/DELETE on `invoices`, `vies_checks`, `invoice_events`.
`number` must be ten digits (CHECK); `(series, number)` is unique.

## Known gap: no drizzle snapshot
`payload migrate:create` does not start in the build environment
(`@next/env` import fails under tsx on Node 22), so the migration was written by
hand and the matching `.json` snapshot does **not** exist. The next time someone
runs `migrate:create`, Payload diffs against the *baseline* snapshot and will
re-emit these tables. Before that: generate the snapshot on a machine where the
CLI works (against an empty scratch database, then discard the generated `.ts`
and keep only the `.json` renamed to match this migration), or delete the
duplicate statements from the new migration by hand.

Also: with `push: true` in development, Payload may try to change the `RESTRICT`
foreign keys to its default. Do not accept that prompt.

## How it was checked
Baseline + this migration were run on an in-memory Postgres (PGlite): up, down,
up again; duplicate number refused; 9-digit and non-digit numbers refused;
UPDATE/DELETE on all three immutable tables refused; deleting an invoiced order
refused; the counter statement (`INSERT … ON CONFLICT DO UPDATE … RETURNING`)
gives 1, 2, 3. Not checked: the real Neon database, ten truly concurrent
connections (PGlite has one).
