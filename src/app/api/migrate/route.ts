import { NextResponse } from "next/server";
import { Pool } from "pg";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();

    // Create all tables that Payload CMS expects (including sessions, enums, rels)
    await client.query(`

      -- Enums
      DO $$ BEGIN
        CREATE TYPE "enum_products_status" AS ENUM ('active','inactive','out_of_stock');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "enum_orders_status" AS ENUM ('pending','confirmed','processing','shipped','delivered','cancelled');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "enum_orders_payment_method" AS ENUM ('mypos','cod','bank_transfer');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "enum_orders_payment_status" AS ENUM ('pending','paid','failed','refunded');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "enum_orders_shipping_method" AS ENUM ('courier','pickup');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "enum_articles_category" AS ENUM ('blog','technical');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "enum_articles_status" AS ENUM ('draft','published');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "enum_users_role" AS ENUM ('admin','editor');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      -- Users
      CREATE TABLE IF NOT EXISTS "users" (
        "id" serial PRIMARY KEY,
        "name" varchar,
        "role" "enum_users_role" DEFAULT 'editor',
        "email" varchar NOT NULL UNIQUE,
        "reset_password_token" varchar,
        "reset_password_expiration" timestamptz,
        "salt" varchar,
        "hash" varchar,
        "login_attempts" integer DEFAULT 0,
        "lock_until" timestamptz,
        "updated_at" timestamptz DEFAULT now() NOT NULL,
        "created_at" timestamptz DEFAULT now() NOT NULL
      );

      -- User sessions (required by Payload auth)
      CREATE TABLE IF NOT EXISTS "users_sessions" (
        "id" serial PRIMARY KEY,
        "_parent_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "_order" integer NOT NULL,
        "created_at" timestamptz DEFAULT now(),
        "expires_at" timestamptz
      );

      -- Media
      CREATE TABLE IF NOT EXISTS "media" (
        "id" serial PRIMARY KEY,
        "alt" varchar,
        "updated_at" timestamptz DEFAULT now() NOT NULL,
        "created_at" timestamptz DEFAULT now() NOT NULL,
        "url" varchar,
        "thumbnail_u_r_l" varchar,
        "filename" varchar,
        "mime_type" varchar,
        "filesize" numeric,
        "width" numeric,
        "height" numeric,
        "focal_x" numeric,
        "focal_y" numeric,
        "sizes_thumbnail_url" varchar,
        "sizes_thumbnail_width" numeric,
        "sizes_thumbnail_height" numeric,
        "sizes_thumbnail_mime_type" varchar,
        "sizes_thumbnail_filesize" numeric,
        "sizes_thumbnail_filename" varchar,
        "sizes_card_url" varchar,
        "sizes_card_width" numeric,
        "sizes_card_height" numeric,
        "sizes_card_mime_type" varchar,
        "sizes_card_filesize" numeric,
        "sizes_card_filename" varchar,
        "sizes_product_url" varchar,
        "sizes_product_width" numeric,
        "sizes_product_height" numeric,
        "sizes_product_mime_type" varchar,
        "sizes_product_filesize" numeric,
        "sizes_product_filename" varchar
      );

      -- Categories
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" serial PRIMARY KEY,
        "name" varchar NOT NULL,
        "slug" varchar NOT NULL UNIQUE,
        "parent_id" integer REFERENCES "categories"("id") ON DELETE SET NULL,
        "description" varchar,
        "image_id" integer REFERENCES "media"("id") ON DELETE SET NULL,
        "sort_order" numeric DEFAULT 0,
        "updated_at" timestamptz DEFAULT now() NOT NULL,
        "created_at" timestamptz DEFAULT now() NOT NULL
      );

      -- Brands
      CREATE TABLE IF NOT EXISTS "brands" (
        "id" serial PRIMARY KEY,
        "name" varchar NOT NULL,
        "slug" varchar NOT NULL UNIQUE,
        "logo_id" integer REFERENCES "media"("id") ON DELETE SET NULL,
        "website" varchar,
        "updated_at" timestamptz DEFAULT now() NOT NULL,
        "created_at" timestamptz DEFAULT now() NOT NULL
      );

      -- Products
      CREATE TABLE IF NOT EXISTS "products" (
        "id" serial PRIMARY KEY,
        "name" varchar NOT NULL,
        "slug" varchar NOT NULL UNIQUE,
        "short_description" varchar,
        "description" jsonb,
        "brand_id" integer REFERENCES "brands"("id") ON DELETE SET NULL,
        "base_price" numeric,
        "specs_width" numeric,
        "specs_thickness" numeric,
        "specs_material" varchar,
        "status" "enum_products_status" DEFAULT 'active',
        "featured" boolean DEFAULT false,
        "updated_at" timestamptz DEFAULT now() NOT NULL,
        "created_at" timestamptz DEFAULT now() NOT NULL
      );

      -- Products images array
      CREATE TABLE IF NOT EXISTS "products_images" (
        "id" serial PRIMARY KEY,
        "_parent_id" integer NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "_order" integer NOT NULL,
        "image_id" integer REFERENCES "media"("id") ON DELETE SET NULL
      );

      -- Products relationships (categories many-to-many)
      CREATE TABLE IF NOT EXISTS "products_rels" (
        "id" serial PRIMARY KEY,
        "parent_id" integer NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "path" varchar NOT NULL,
        "categories_id" integer REFERENCES "categories"("id") ON DELETE CASCADE,
        "order" integer
      );

      -- Product Variants
      CREATE TABLE IF NOT EXISTS "product_variants" (
        "id" serial PRIMARY KEY,
        "product_id" integer REFERENCES "products"("id") ON DELETE SET NULL,
        "sku" varchar NOT NULL UNIQUE,
        "length" numeric,
        "width" numeric,
        "thickness" numeric,
        "tooth_pitch" varchar,
        "tooth_profile" varchar,
        "price" numeric NOT NULL,
        "stock" numeric DEFAULT 0,
        "updated_at" timestamptz DEFAULT now() NOT NULL,
        "created_at" timestamptz DEFAULT now() NOT NULL
      );

      -- Customers
      CREATE TABLE IF NOT EXISTS "customers" (
        "id" serial PRIMARY KEY,
        "name" varchar NOT NULL,
        "email" varchar NOT NULL,
        "phone" varchar,
        "company" varchar,
        "eik" varchar,
        "vat_number" varchar,
        "updated_at" timestamptz DEFAULT now() NOT NULL,
        "created_at" timestamptz DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "customers_addresses" (
        "id" serial PRIMARY KEY,
        "_parent_id" integer NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE,
        "_order" integer NOT NULL,
        "label" varchar,
        "street" varchar,
        "city" varchar,
        "postal_code" varchar,
        "is_default" boolean DEFAULT false
      );

      -- Orders
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" serial PRIMARY KEY,
        "order_number" varchar NOT NULL UNIQUE,
        "customer_id" integer REFERENCES "customers"("id") ON DELETE SET NULL,
        "status" "enum_orders_status" DEFAULT 'pending',
        "payment_method" "enum_orders_payment_method",
        "payment_status" "enum_orders_payment_status" DEFAULT 'pending',
        "payment_transaction_id" varchar,
        "shipping_method" "enum_orders_shipping_method",
        "shipping_address" varchar,
        "shipping_cost" numeric DEFAULT 0,
        "shipping_tracking_number" varchar,
        "subtotal" numeric,
        "total" numeric NOT NULL,
        "notes" varchar,
        "updated_at" timestamptz DEFAULT now() NOT NULL,
        "created_at" timestamptz DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "orders_items" (
        "id" serial PRIMARY KEY,
        "_parent_id" integer NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
        "_order" integer NOT NULL,
        "product_id" integer,
        "variant_id" integer,
        "name" varchar,
        "sku" varchar,
        "quantity" numeric NOT NULL,
        "price" numeric NOT NULL,
        "custom_specs" jsonb
      );

      -- Articles
      CREATE TABLE IF NOT EXISTS "articles" (
        "id" serial PRIMARY KEY,
        "title" varchar NOT NULL,
        "slug" varchar NOT NULL UNIQUE,
        "category" "enum_articles_category",
        "excerpt" varchar,
        "body" jsonb,
        "featured_image_id" integer REFERENCES "media"("id") ON DELETE SET NULL,
        "published_at" timestamptz,
        "status" "enum_articles_status" DEFAULT 'draft',
        "updated_at" timestamptz DEFAULT now() NOT NULL,
        "created_at" timestamptz DEFAULT now() NOT NULL
      );

      -- Pages
      CREATE TABLE IF NOT EXISTS "pages" (
        "id" serial PRIMARY KEY,
        "title" varchar NOT NULL,
        "slug" varchar NOT NULL UNIQUE,
        "body" jsonb,
        "updated_at" timestamptz DEFAULT now() NOT NULL,
        "created_at" timestamptz DEFAULT now() NOT NULL
      );

      -- Payload internal tables
      CREATE TABLE IF NOT EXISTS "payload_locked_documents" (
        "id" serial PRIMARY KEY,
        "global_slug" varchar,
        "updated_at" timestamptz DEFAULT now() NOT NULL,
        "created_at" timestamptz DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "payload_locked_documents_rels" (
        "id" serial PRIMARY KEY,
        "parent_id" integer NOT NULL REFERENCES "payload_locked_documents"("id") ON DELETE CASCADE,
        "path" varchar NOT NULL,
        "users_id" integer REFERENCES "users"("id") ON DELETE CASCADE,
        "products_id" integer REFERENCES "products"("id") ON DELETE CASCADE,
        "product_variants_id" integer REFERENCES "product_variants"("id") ON DELETE CASCADE,
        "categories_id" integer REFERENCES "categories"("id") ON DELETE CASCADE,
        "brands_id" integer REFERENCES "brands"("id") ON DELETE CASCADE,
        "orders_id" integer REFERENCES "orders"("id") ON DELETE CASCADE,
        "customers_id" integer REFERENCES "customers"("id") ON DELETE CASCADE,
        "articles_id" integer REFERENCES "articles"("id") ON DELETE CASCADE,
        "pages_id" integer REFERENCES "pages"("id") ON DELETE CASCADE,
        "media_id" integer REFERENCES "media"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "payload_preferences" (
        "id" serial PRIMARY KEY,
        "key" varchar,
        "value" jsonb,
        "updated_at" timestamptz DEFAULT now() NOT NULL,
        "created_at" timestamptz DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "payload_preferences_rels" (
        "id" serial PRIMARY KEY,
        "parent_id" integer NOT NULL REFERENCES "payload_preferences"("id") ON DELETE CASCADE,
        "path" varchar NOT NULL,
        "users_id" integer REFERENCES "users"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "payload_migrations" (
        "id" serial PRIMARY KEY,
        "name" varchar,
        "batch" numeric,
        "updated_at" timestamptz DEFAULT now() NOT NULL,
        "created_at" timestamptz DEFAULT now() NOT NULL
      );
    `);

    // Verify
    const result = await client.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    );
    const tables = result.rows.map((r: { tablename: string }) => r.tablename);

    client.release();
    await pool.end();

    return NextResponse.json({
      status: "ok",
      message: "All tables created! Visit /admin to create first user.",
      tables,
      tableCount: tables.length,
    });
  } catch (error) {
    await pool.end();
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
