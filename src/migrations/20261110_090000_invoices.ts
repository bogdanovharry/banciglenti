import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Invoicing tables (Romania). ADDITIVE ONLY: new tables, new enums, two new
 * nullable/defaulted columns on `orders`, two new columns on the Payload
 * bookkeeping table. Nothing is dropped, renamed or rewritten in up().
 *
 * Written by hand, in the style of the baseline, because `payload migrate:create`
 * does not start in the build environment. The matching drizzle snapshot
 * (`.json`) has NOT been generated — see docs/INVOICING-MIGRATION.md before the
 * next `migrate:create`.
 *
 * Immutability: a trigger refuses UPDATE and DELETE on issued documents, VIES
 * checks and the audit trail, even from the Local API. Corrections are new rows.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_invoices_doc_type" AS ENUM('invoice', 'credit_note', 'debit_note');
  CREATE TYPE "public"."enum_invoices_tax_case" AS ENUM('A', 'B', 'C');
  CREATE TYPE "public"."enum_invoices_language" AS ENUM('ro', 'bg', 'bilingual');
  CREATE TYPE "public"."enum_vies_checks_stage" AS ENUM('order', 'before_issue');
  CREATE TYPE "public"."enum_vies_checks_result" AS ENUM('valid', 'invalid', 'unavailable');
  CREATE TYPE "public"."enum_invoice_events_action" AS ENUM('held', 'issued', 'credit_note', 'debit_note', 'sent');

  CREATE TABLE "vies_checks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order_id" integer NOT NULL,
  	"vat_number" varchar NOT NULL,
  	"country_code" varchar NOT NULL,
  	"stage" "enum_vies_checks_stage" NOT NULL,
  	"result" "enum_vies_checks_result" NOT NULL,
  	"checked_at" timestamp(3) with time zone NOT NULL,
  	"request_identifier" varchar,
  	"raw" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "invoices" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"doc_type" "enum_invoices_doc_type" NOT NULL,
  	"series" varchar NOT NULL,
  	"number" varchar NOT NULL,
  	"issued_at" timestamp(3) with time zone NOT NULL,
  	"tax_point_at" timestamp(3) with time zone,
  	"order_id" integer NOT NULL,
  	"related_invoice_id" integer,
  	"tax_case" "enum_invoices_tax_case" NOT NULL,
  	"currency" varchar DEFAULT 'RON' NOT NULL,
  	"language" "enum_invoices_language" NOT NULL,
  	"net_bani" numeric NOT NULL,
  	"vat_bani" numeric NOT NULL,
  	"total_bani" numeric NOT NULL,
  	"snapshot" jsonb NOT NULL,
  	"pdf_sha256" varchar,
  	"shipping_proof" jsonb,
  	"vies_check_id" integer,
  	"issued_by_id" integer,
  	"reason" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	CONSTRAINT "invoices_number_ten_digits" CHECK ("number" ~ '^[0-9]{10}$')
  );

  CREATE TABLE "invoice_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"invoice_id" integer,
  	"order_id" integer,
  	"action" "enum_invoice_events_action" NOT NULL,
  	"actor_id" integer,
  	"reason" varchar,
  	"at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "invoice_counters" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"series" varchar NOT NULL,
  	"last_value" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "orders" ADD COLUMN "billing_einvoice_consent" boolean DEFAULT false;
  ALTER TABLE "orders" ADD COLUMN "billing_einvoice_consent_at" timestamp(3) with time zone;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "invoices_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "vies_checks_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "invoice_events_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "invoice_counters_id" integer;

  -- RESTRICT everywhere: a delete or an ON DELETE SET NULL would be an UPDATE/DELETE
  -- the immutability trigger refuses, so the database says no up front instead.
  ALTER TABLE "vies_checks" ADD CONSTRAINT "vies_checks_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;
  ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;
  ALTER TABLE "invoices" ADD CONSTRAINT "invoices_related_invoice_id_invoices_id_fk" FOREIGN KEY ("related_invoice_id") REFERENCES "public"."invoices"("id") ON DELETE restrict ON UPDATE no action;
  ALTER TABLE "invoices" ADD CONSTRAINT "invoices_vies_check_id_vies_checks_id_fk" FOREIGN KEY ("vies_check_id") REFERENCES "public"."vies_checks"("id") ON DELETE restrict ON UPDATE no action;
  ALTER TABLE "invoices" ADD CONSTRAINT "invoices_issued_by_id_users_id_fk" FOREIGN KEY ("issued_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
  ALTER TABLE "invoice_events" ADD CONSTRAINT "invoice_events_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE restrict ON UPDATE no action;
  ALTER TABLE "invoice_events" ADD CONSTRAINT "invoice_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;
  ALTER TABLE "invoice_events" ADD CONSTRAINT "invoice_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_invoices_fk" FOREIGN KEY ("invoices_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_vies_checks_fk" FOREIGN KEY ("vies_checks_id") REFERENCES "public"."vies_checks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_invoice_events_fk" FOREIGN KEY ("invoice_events_id") REFERENCES "public"."invoice_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_invoice_counters_fk" FOREIGN KEY ("invoice_counters_id") REFERENCES "public"."invoice_counters"("id") ON DELETE cascade ON UPDATE no action;

  -- No duplicate numbers, ever: unique per series.
  CREATE UNIQUE INDEX "invoices_series_number_idx" ON "invoices" USING btree ("series", "number");
  CREATE UNIQUE INDEX "invoice_counters_series_idx" ON "invoice_counters" USING btree ("series");
  CREATE INDEX "invoices_order_idx" ON "invoices" USING btree ("order_id");
  CREATE INDEX "invoices_related_invoice_idx" ON "invoices" USING btree ("related_invoice_id");
  CREATE INDEX "invoices_issued_at_idx" ON "invoices" USING btree ("issued_at");
  CREATE INDEX "vies_checks_order_idx" ON "vies_checks" USING btree ("order_id");
  CREATE INDEX "invoice_events_invoice_idx" ON "invoice_events" USING btree ("invoice_id");
  CREATE INDEX "invoice_events_order_idx" ON "invoice_events" USING btree ("order_id");
  CREATE INDEX "payload_locked_documents_rels_invoices_id_idx" ON "payload_locked_documents_rels" USING btree ("invoices_id");
  CREATE INDEX "payload_locked_documents_rels_vies_checks_id_idx" ON "payload_locked_documents_rels" USING btree ("vies_checks_id");
  CREATE INDEX "payload_locked_documents_rels_invoice_events_id_idx" ON "payload_locked_documents_rels" USING btree ("invoice_events_id");
  CREATE INDEX "payload_locked_documents_rels_invoice_counters_id_idx" ON "payload_locked_documents_rels" USING btree ("invoice_counters_id");

  CREATE FUNCTION "forbid_issued_document_change"() RETURNS trigger AS $fn$
  BEGIN
    RAISE EXCEPTION '% rows are immutable (% refused)', TG_TABLE_NAME, TG_OP;
  END;
  $fn$ LANGUAGE plpgsql;
  CREATE TRIGGER "invoices_immutable" BEFORE UPDATE OR DELETE ON "invoices" FOR EACH ROW EXECUTE FUNCTION "forbid_issued_document_change"();
  CREATE TRIGGER "vies_checks_immutable" BEFORE UPDATE OR DELETE ON "vies_checks" FOR EACH ROW EXECUTE FUNCTION "forbid_issued_document_change"();
  CREATE TRIGGER "invoice_events_immutable" BEFORE UPDATE OR DELETE ON "invoice_events" FOR EACH ROW EXECUTE FUNCTION "forbid_issued_document_change"();
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "invoice_events" CASCADE;
  DROP TABLE "invoices" CASCADE;
  DROP TABLE "vies_checks" CASCADE;
  DROP TABLE "invoice_counters" CASCADE;
  DROP FUNCTION "forbid_issued_document_change"();
  ALTER TABLE "orders" DROP COLUMN "billing_einvoice_consent";
  ALTER TABLE "orders" DROP COLUMN "billing_einvoice_consent_at";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "invoices_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "vies_checks_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "invoice_events_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "invoice_counters_id";
  DROP TYPE "public"."enum_invoices_doc_type";
  DROP TYPE "public"."enum_invoices_tax_case";
  DROP TYPE "public"."enum_invoices_language";
  DROP TYPE "public"."enum_vies_checks_stage";
  DROP TYPE "public"."enum_vies_checks_result";
  DROP TYPE "public"."enum_invoice_events_action";
  `)
}
