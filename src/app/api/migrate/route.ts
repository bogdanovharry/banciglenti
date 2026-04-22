import { NextResponse } from "next/server";
import { Pool } from "pg";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });
  }

  const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    const client = await pool.connect();

    // Create all Payload CMS tables manually
    await client.query(`
      -- Users (auth collection)
      CREATE TABLE IF NOT EXISTS "users" (
        "id" serial PRIMARY KEY,
        "name" varchar,
        "role" varchar DEFAULT 'editor',
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

      -- Categories
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" serial PRIMARY KEY,
        "name" varchar NOT NULL,
        "slug" varchar NOT NULL UNIQUE,
        "parent_id" integer REFERENCES "categories"("id"),
        "description" text,
        "image_id" integer,
        "sort_order" integer DEFAULT 0,
        "updated_at" timestamptz DEFAULT now() NOT NULL,
        "created_at" timestamptz DEFAULT now() NOT NULL
      );

      -- Brands
      CREATE TABLE IF NOT EXISTS "brands" (
        "id" serial PRIMARY KEY,
        "name" varchar NOT NULL,
        "slug" varchar NOT NULL UNIQUE,
        "logo_id" integer,
        "website" varchar,
        "updated_at" timestamptz DEFAULT now() NOT NULL,
        "created_at" timestamptz DEFAULT now() NOT NULL
      );

      -- Products
      CREATE TABLE IF NOT EXISTS "products" (
        "id" serial PRIMARY KEY,
        "name" varchar NOT NULL,
        "slug" varchar NOT NULL UNIQUE,
        "short_description" text,
        "description" jsonb,
        "brand_id" integer REFERENCES "brands"("id"),
        "base_price" numeric,
        "specs_width" numeric,
        "specs_thickness" numeric,
        "specs_material" varchar,
        "status" varchar DEFAULT 'active',
        "featured" boolean DEFAULT false,
        "updated_at" timestamptz DEFAULT now() NOT NULL,
        "created_at" timestamptz DEFAULT now() NOT NULL
      );

      -- Products-Categories junction
      CREATE TABLE IF NOT EXISTS "products_rels" (
        "id" serial PRIMARY KEY,
        "parent_id" integer NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "path" varchar NOT NULL,
        "categories_id" integer REFERENCES "categories"("id"),
        "order" integer
      );

      -- Products images
      CREATE TABLE IF NOT EXISTS "products_images" (
        "id" serial PRIMARY KEY,
        "_parent_id" integer NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "image_id" integer,
        "_order" integer NOT NULL
      );

      -- Product Variants
      CREATE TABLE IF NOT EXISTS "product_variants" (
        "id" serial PRIMARY KEY,
        "product_id" integer REFERENCES "products"("id"),
        "sku" varchar NOT NULL UNIQUE,
        "length" numeric,
        "width" numeric,
        "thickness" numeric,
        "tooth_pitch" varchar,
        "tooth_profile" varchar,
        "price" numeric NOT NULL,
        "stock" integer DEFAULT 0,
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

      -- Customers addresses
      CREATE TABLE IF NOT EXISTS "customers_addresses" (
        "id" serial PRIMARY KEY,
        "_parent_id" integer NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE,
        "label" varchar,
        "street" varchar,
        "city" varchar,
        "postal_code" varchar,
        "is_default" boolean DEFAULT false,
        "_order" integer NOT NULL
      );

      -- Orders
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" serial PRIMARY KEY,
        "order_number" varchar NOT NULL UNIQUE,
        "customer_id" integer REFERENCES "customers"("id"),
        "status" varchar DEFAULT 'pending',
        "payment_method" varchar,
        "payment_status" varchar DEFAULT 'pending',
        "payment_transaction_id" varchar,
        "shipping_method" varchar,
        "shipping_address" text,
        "shipping_cost" numeric DEFAULT 0,
        "shipping_tracking_number" varchar,
        "subtotal" numeric,
        "total" numeric NOT NULL,
        "notes" text,
        "updated_at" timestamptz DEFAULT now() NOT NULL,
        "created_at" timestamptz DEFAULT now() NOT NULL
      );

      -- Order items
      CREATE TABLE IF NOT EXISTS "orders_items" (
        "id" serial PRIMARY KEY,
        "_parent_id" integer NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
        "product_id" integer,
        "variant_id" integer,
        "name" varchar,
        "sku" varchar,
        "quantity" integer NOT NULL,
        "price" numeric NOT NULL,
        "custom_specs" jsonb,
        "_order" integer NOT NULL
      );

      -- Articles
      CREATE TABLE IF NOT EXISTS "articles" (
        "id" serial PRIMARY KEY,
        "title" varchar NOT NULL,
        "slug" varchar NOT NULL UNIQUE,
        "category" varchar,
        "excerpt" text,
        "body" jsonb,
        "featured_image_id" integer,
        "published_at" timestamptz,
        "status" varchar DEFAULT 'draft',
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

      -- Media
      CREATE TABLE IF NOT EXISTS "media" (
        "id" serial PRIMARY KEY,
        "alt" varchar,
        "filename" varchar,
        "mime_type" varchar,
        "filesize" integer,
        "width" integer,
        "height" integer,
        "url" varchar,
        "thumbnail_u_r_l" varchar,
        "sizes_thumbnail_url" varchar,
        "sizes_thumbnail_width" integer,
        "sizes_thumbnail_height" integer,
        "sizes_card_url" varchar,
        "sizes_card_width" integer,
        "sizes_card_height" integer,
        "sizes_product_url" varchar,
        "sizes_product_width" integer,
        "sizes_product_height" integer,
        "updated_at" timestamptz DEFAULT now() NOT NULL,
        "created_at" timestamptz DEFAULT now() NOT NULL
      );

      -- Payload preferences (required by Payload)
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
        "users_id" integer REFERENCES "users"("id")
      );

      -- Payload migrations (required by Payload)
      CREATE TABLE IF NOT EXISTS "payload_migrations" (
        "id" serial PRIMARY KEY,
        "name" varchar,
        "batch" integer,
        "updated_at" timestamptz DEFAULT now() NOT NULL,
        "created_at" timestamptz DEFAULT now() NOT NULL
      );
    `);

    // Verify
    const result = await client.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`);
    const tables = result.rows.map((r: { tablename: string }) => r.tablename);

    client.release();
    await pool.end();

    return NextResponse.json({
      status: "ok",
      message: "All tables created successfully!",
      tables,
      tableCount: tables.length,
      nextStep: "Now visit /api/seed to populate data, then /admin to login",
    });
  } catch (error) {
    await pool.end();
    return NextResponse.json({ status: "error", error: String(error) }, { status: 500 });
  }
}
