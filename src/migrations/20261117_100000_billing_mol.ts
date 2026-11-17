import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/** The person who represents the buyer's company (МОЛ), asked on Bulgarian company invoices. ADDITIVE ONLY. */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "billing_mol" varchar;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" DROP COLUMN IF EXISTS "billing_mol";
  `)
}
