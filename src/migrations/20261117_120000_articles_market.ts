import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/** Which shop an article belongs to (the blog is written per language). ADDITIVE ONLY. */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
     CREATE TYPE "public"."enum_articles_market" AS ENUM('bg', 'ro', 'all');
   EXCEPTION WHEN duplicate_object THEN NULL; END $$;
   ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "market" "enum_articles_market" DEFAULT 'bg' NOT NULL;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "articles" DROP COLUMN IF EXISTS "market";
   DROP TYPE IF EXISTS "public"."enum_articles_market";
  `)
}
