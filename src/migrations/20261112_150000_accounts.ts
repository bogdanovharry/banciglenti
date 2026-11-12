import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Customer accounts. ADDITIVE ONLY: new tables and enum, one new nullable
 * column on `orders`, and the relation columns Payload keeps on its own
 * bookkeeping tables for every collection. Nothing is dropped or rewritten in up().
 *
 * Hand-written in the style of the baseline (`payload migrate:create` does not
 * start in the build environment); it does not touch the invoicing migration,
 * so the Bulgarian shop, which has no invoicing tables, can take it alone.
 * `orders.account_id` is ON DELETE SET NULL: deleting a profile keeps the order.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_accounts_market" AS ENUM('bg', 'ro', 'gr');

  CREATE TABLE "accounts_addresses" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"street" varchar,
  	"city" varchar,
  	"postal_code" varchar,
  	"is_default" boolean
  );

  CREATE TABLE "accounts_machines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"brand" varchar,
  	"model" varchar,
  	"blade_length" numeric,
  	"blade_width" numeric,
  	"blade_thickness" numeric
  );

  CREATE TABLE "accounts_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );

  CREATE TABLE "accounts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"phone" varchar,
  	"company" varchar,
  	"tax_id" varchar,
  	"vat_number" varchar,
  	"market" "enum_accounts_market",
  	"terms_accepted_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );

  ALTER TABLE "orders" ADD COLUMN "account_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "accounts_id" integer;
  ALTER TABLE "payload_preferences_rels" ADD COLUMN "accounts_id" integer;

  ALTER TABLE "accounts_addresses" ADD CONSTRAINT "accounts_addresses_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "accounts_machines" ADD CONSTRAINT "accounts_machines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "accounts_sessions" ADD CONSTRAINT "accounts_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_accounts_fk" FOREIGN KEY ("accounts_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_accounts_fk" FOREIGN KEY ("accounts_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;

  CREATE INDEX "accounts_addresses_order_idx" ON "accounts_addresses" USING btree ("_order");
  CREATE INDEX "accounts_addresses_parent_id_idx" ON "accounts_addresses" USING btree ("_parent_id");
  CREATE INDEX "accounts_machines_order_idx" ON "accounts_machines" USING btree ("_order");
  CREATE INDEX "accounts_machines_parent_id_idx" ON "accounts_machines" USING btree ("_parent_id");
  CREATE INDEX "accounts_sessions_order_idx" ON "accounts_sessions" USING btree ("_order");
  CREATE INDEX "accounts_sessions_parent_id_idx" ON "accounts_sessions" USING btree ("_parent_id");
  CREATE INDEX "accounts_updated_at_idx" ON "accounts" USING btree ("updated_at");
  CREATE INDEX "accounts_created_at_idx" ON "accounts" USING btree ("created_at");
  CREATE UNIQUE INDEX "accounts_email_idx" ON "accounts" USING btree ("email");
  CREATE INDEX "orders_account_idx" ON "orders" USING btree ("account_id");
  CREATE INDEX "payload_locked_documents_rels_accounts_id_idx" ON "payload_locked_documents_rels" USING btree ("accounts_id");
  CREATE INDEX "payload_preferences_rels_accounts_id_idx" ON "payload_preferences_rels" USING btree ("accounts_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" DROP COLUMN "account_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "accounts_id";
  ALTER TABLE "payload_preferences_rels" DROP COLUMN "accounts_id";
  DROP TABLE "accounts_addresses" CASCADE;
  DROP TABLE "accounts_machines" CASCADE;
  DROP TABLE "accounts_sessions" CASCADE;
  DROP TABLE "accounts" CASCADE;
  DROP TYPE "public"."enum_accounts_market";
  `)
}
