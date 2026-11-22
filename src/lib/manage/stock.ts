import { sql } from '@payloadcms/db-postgres'

import { getClient } from '@/lib/manage/session'

/**
 * Stock moves with the order, in one atomic statement.
 *
 * The checkout takes goods off the shelf; a line added to an order by hand must
 * do the same, a line removed must put them back, and a cancelled order returns
 * what it held. Doing it as one `update` (not read, then write) means two
 * people ordering the last piece at the same moment cannot both get it.
 *
 * Made-to-order products have no stock and are left alone. A product that runs
 * out goes "out_of_stock"; one that is restocked from exactly that state goes
 * back on sale (an "inactive" product stays inactive).
 *
 * `delta` is negative to take stock, positive to return it. Returns false when
 * taking more than is there — nothing is changed then.
 */
export async function adjustStock(productId: number, delta: number): Promise<boolean> {
  if (!Number.isInteger(delta) || delta === 0) return true
  const payload = await getClient()
  const result = await payload.db.drizzle.execute(sql`
    update products
       set stock = coalesce(stock, 0) + ${delta}::int,
           status = case
             when coalesce(stock, 0) + ${delta}::int <= 0 and status = 'active' then 'out_of_stock'::enum_products_status
             when coalesce(stock, 0) + ${delta}::int > 0 and status = 'out_of_stock' then 'active'::enum_products_status
             else status
           end
     where id = ${productId}::int
       and coalesce(made_to_order, false) = false
       and coalesce(stock, 0) + ${delta}::int >= 0
    returning id
  `)
  if (result.rows.length > 0) return true

  // Nothing updated: either made to order (fine), or not enough stock.
  const check = await payload.db.drizzle.execute(
    sql`select coalesce(made_to_order, false) as m from products where id = ${productId}::int`,
  )
  return check.rows.length === 0 ? true : Boolean((check.rows[0] as { m: unknown }).m)
}

/** How many are on the shelf, or null when the product is made to order. */
export async function stockOf(productId: number): Promise<number | null> {
  const payload = await getClient()
  const r = await payload.db.drizzle.execute(
    sql`select coalesce(stock, 0)::int as s, coalesce(made_to_order, false) as m from products where id = ${productId}::int`,
  )
  const row = r.rows[0] as { s: unknown; m: unknown } | undefined
  if (!row || row.m) return null
  return Number(row.s)
}
