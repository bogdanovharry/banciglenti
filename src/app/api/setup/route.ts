import { NextResponse } from "next/server";
import { Pool } from "pg";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const step = url.searchParams.get("step") || "status";

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();

    if (step === "reset") {
      // Step 1: Drop ALL tables and types
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

      return NextResponse.json({
        status: "ok",
        message: "Database completely reset. Now visit /api/setup?step=init",
      });
    }

    if (step === "init") {
      client.release();
      await pool.end();

      // Now initialize Payload — push:true will create all tables
      try {
        const { getPayload } = await import("payload");
        const config = (await import("@payload-config")).default;
        const payload = await getPayload({ config });

        // Create admin user
        let adminMsg = "Admin already exists";
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
          adminMsg = "Admin created: admin@tehnoles.com / Tehnoles2026!";
        }

        return NextResponse.json({
          status: "ok",
          message: "Payload initialized, tables created!",
          admin: adminMsg,
          nextStep: "Visit /admin to login, then /api/setup?step=seed to populate data",
        });
      } catch (initError) {
        return NextResponse.json({
          status: "init_error",
          error: String(initError).substring(0, 800),
        }, { status: 500 });
      }
    }

    if (step === "seed") {
      client.release();
      await pool.end();

      try {
        const { getPayload } = await import("payload");
        const config = (await import("@payload-config")).default;
        const payload = await getPayload({ config });

        // Check if already seeded
        const cats = await payload.find({ collection: "categories", limit: 1 });
        if (cats.totalDocs > 0) {
          return NextResponse.json({ status: "already_seeded", categories: cats.totalDocs });
        }

        // Seed categories
        const catMap: Record<string, number> = {};
        const categories = [
          { name: "Дърво", slug: "dyrvo" },
          { name: "Хоризонтални банцизи", slug: "horizontalni-bantsizi", parent: "dyrvo" },
          { name: "Вертикални банцизи", slug: "vertikalni-bantsizi", parent: "dyrvo" },
          { name: "Циркулярни триони", slug: "tsirkulyarni-trioni", parent: "dyrvo" },
          { name: "Ножове за абрихт", slug: "nozhove-za-abriht", parent: "dyrvo" },
          { name: "Абразиви", slug: "abrazivi" },
          { name: "Метал", slug: "metal" },
          { name: "Биметални ленти", slug: "bimetalni-lenti", parent: "metal" },
          { name: "Хоби банциг", slug: "hobi-bantsig" },
          { name: "Храни", slug: "hrani" },
          { name: "Машини", slug: "mashini" },
          { name: "Консумативи", slug: "konsumativi", parent: "mashini" },
        ];

        for (const cat of categories) {
          const created = await payload.create({
            collection: "categories",
            data: {
              name: cat.name,
              slug: cat.slug,
              parent: (cat as { parent?: string }).parent ? catMap[(cat as { parent?: string }).parent!] : undefined,
              sortOrder: categories.indexOf(cat),
            },
          });
          catMap[cat.slug] = created.id as number;
        }

        // Seed brands
        for (const brand of ["MasterGold", "Kodiak", "Sandvik", "Böhler", "Hermes", "Tyrolit", "Tehnoles", "Bizerba"]) {
          await payload.create({
            collection: "brands",
            data: { name: brand, slug: brand.toLowerCase().replace(/ö/g, "o") },
          });
        }

        return NextResponse.json({
          status: "ok",
          message: "Seeded categories and brands!",
          categories: Object.keys(catMap).length,
          brands: 8,
        });
      } catch (seedError) {
        return NextResponse.json({
          status: "seed_error",
          error: String(seedError).substring(0, 800),
        }, { status: 500 });
      }
    }

    // Default: status check
    const result = await client.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    );
    const tables = result.rows.map((r: { tablename: string }) => r.tablename);
    client.release();
    await pool.end();

    return NextResponse.json({
      status: "ok",
      tables,
      tableCount: tables.length,
      steps: {
        "1_reset": "/api/setup?step=reset (drops all tables)",
        "2_init": "/api/setup?step=init (Payload creates tables + admin user)",
        "3_seed": "/api/setup?step=seed (populates categories and brands)",
        "4_admin": "/admin (login with admin@tehnoles.com)",
      },
    });
  } catch (error) {
    await pool.end();
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
