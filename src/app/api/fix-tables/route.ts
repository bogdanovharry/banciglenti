import { NextResponse } from "next/server";
import { Pool } from "pg";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    const client = await pool.connect();

    // Add missing SEO columns from @payloadcms/plugin-seo
    const alterQueries = [
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "meta_title" varchar`,
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "meta_description" varchar`,
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "meta_image_id" integer`,
      `ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "meta_title" varchar`,
      `ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "meta_description" varchar`,
      `ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "meta_image_id" integer`,
      `ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "meta_title" varchar`,
      `ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "meta_description" varchar`,
      `ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "meta_image_id" integer`,
      // Fix products_rels to match Payload's expected schema
      `ALTER TABLE "products_rels" ADD COLUMN IF NOT EXISTS "brands_id" integer`,
    ];

    for (const q of alterQueries) {
      await client.query(q).catch(() => {});
    }

    client.release();
    await pool.end();

    return NextResponse.json({
      status: "ok",
      message: "Missing columns added! Now visit /api/seed",
    });
  } catch (error) {
    await pool.end();
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
