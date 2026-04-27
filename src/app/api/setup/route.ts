import { NextResponse } from "next/server";
import { Pool } from "pg";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const step = url.searchParams.get("step") || "status";

  if (step === "reset") {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    const client = await pool.connect();
    await client.query(`
      DO $$ DECLARE r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS "' || r.tablename || '" CASCADE';
        END LOOP;
      END $$;
    `);
    await client.query(`
      DO $$ DECLARE r RECORD;
      BEGIN
        FOR r IN (SELECT typname FROM pg_type WHERE typtype = 'e' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) LOOP
          EXECUTE 'DROP TYPE IF EXISTS "' || r.typname || '" CASCADE';
        END LOOP;
      END $$;
    `);
    client.release();
    await pool.end();
    return NextResponse.json({ status: "ok", message: "Database reset. Now visit /api/setup?step=init" });
  }

  if (step === "init") {
    try {
      // FORCE push: Payload checks NODE_ENV !== 'production' AND push !== false
      // Also set PAYLOAD_FORCE_DRIZZLE_PUSH to bypass schema comparison
      (process.env as Record<string, string>).NODE_ENV = "development";
      (process.env as Record<string, string>).PAYLOAD_FORCE_DRIZZLE_PUSH = "true";

      const { getPayload } = await import("payload");
      const config = (await import("@payload-config")).default;
      const payload = await getPayload({ config });

      // Restore
      (process.env as Record<string, string>).NODE_ENV = "production";

      // Create admin
      const existing = await payload.find({ collection: "users", limit: 1 });
      if (existing.totalDocs === 0) {
        await payload.create({
          collection: "users",
          data: {
            email: "admin@tehnoles.com",
            password: "Tehnoles2026!",
            name: "Admin",
            role: "admin",
          },
        });
      }

      return NextResponse.json({
        status: "ok",
        message: "Tables created + admin user ready!",
        login: { email: "admin@tehnoles.com", password: "Tehnoles2026!" },
        next: "/admin",
      });
    } catch (error) {
      return NextResponse.json({ status: "error", error: String(error).substring(0, 800) }, { status: 500 });
    }
  }

  if (step === "seed") {
    try {
      const { getPayload } = await import("payload");
      const config = (await import("@payload-config")).default;
      const payload = await getPayload({ config });

      const cats = await payload.find({ collection: "categories", limit: 1 });
      if (cats.totalDocs > 0) {
        return NextResponse.json({ status: "already_seeded" });
      }

      const catMap: Record<string, number> = {};
      for (const cat of [
        { name: "Дърво", slug: "dyrvo" },
        { name: "Хоризонтални банцизи", slug: "horizontalni-bantsizi", p: "dyrvo" },
        { name: "Вертикални банцизи", slug: "vertikalni-bantsizi", p: "dyrvo" },
        { name: "Циркулярни триони", slug: "tsirkulyarni-trioni", p: "dyrvo" },
        { name: "Ножове за абрихт", slug: "nozhove-za-abriht", p: "dyrvo" },
        { name: "Абразиви", slug: "abrazivi" },
        { name: "Метал", slug: "metal" },
        { name: "Биметални ленти", slug: "bimetalni-lenti", p: "metal" },
        { name: "Хоби банциг", slug: "hobi-bantsig" },
        { name: "Храни", slug: "hrani" },
        { name: "Машини", slug: "mashini" },
        { name: "Консумативи", slug: "konsumativi", p: "mashini" },
      ]) {
        const created = await payload.create({
          collection: "categories",
          data: { name: cat.name, slug: cat.slug, parent: (cat as { p?: string }).p ? catMap[(cat as { p?: string }).p!] : undefined, sortOrder: Object.keys(catMap).length },
        });
        catMap[cat.slug] = created.id as number;
      }

      for (const b of ["MasterGold", "Kodiak", "Sandvik", "Böhler", "Hermes", "Tyrolit", "Tehnoles", "Bizerba"]) {
        await payload.create({ collection: "brands", data: { name: b, slug: b.toLowerCase().replace(/ö/g, "o") } });
      }

      return NextResponse.json({ status: "ok", categories: Object.keys(catMap).length, brands: 8 });
    } catch (error) {
      return NextResponse.json({ status: "error", error: String(error).substring(0, 800) }, { status: 500 });
    }
  }

  // Status
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();
  const result = await client.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`);
  client.release();
  await pool.end();
  return NextResponse.json({
    tables: result.rows.map((r: { tablename: string }) => r.tablename),
    steps: ["1: /api/setup?step=reset", "2: /api/setup?step=init", "3: /api/setup?step=seed", "4: /admin"],
  });
}
