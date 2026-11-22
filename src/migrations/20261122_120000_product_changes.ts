import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Product change history (price, stock, status edited on /manage/products).
 * ADDITIVE ONLY: one new table and the matching column Payload keeps for
 * document locks. Nothing is dropped or rewritten in up().
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "product_changes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"product_id" integer NOT NULL,
  	"field" varchar NOT NULL,
  	"old_value" varchar,
  	"new_value" varchar,
  	"actor_id" integer,
  	"at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "product_changes_id" integer;
  ALTER TABLE "product_changes" ADD CONSTRAINT "product_changes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "product_changes" ADD CONSTRAINT "product_changes_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_product_changes_fk" FOREIGN KEY ("product_changes_id") REFERENCES "public"."product_changes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX IF NOT EXISTS "product_changes_product_idx" ON "product_changes" USING btree ("product_id");
  CREATE INDEX IF NOT EXISTS "product_changes_at_idx" ON "product_changes" USING btree ("at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_product_changes_id_idx" ON "payload_locked_documents_rels" USING btree ("product_changes_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "product_changes" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "product_changes_id";
  `)
}
