import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Card payments through Revolut: one new value for the payment method of an order.
 * ADDITIVE ONLY. Postgres cannot drop an enum value, so down() leaves it in place.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_orders_payment_method" ADD VALUE IF NOT EXISTS 'revolut';
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // An enum value cannot be removed; an order already paid by card would need it.
}
