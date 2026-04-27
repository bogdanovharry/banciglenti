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

    // Drop ALL existing tables so Payload can recreate them properly
    await client.query(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS "' || r.tablename || '" CASCADE';
        END LOOP;
      END $$;
    `);

    // Also drop enums
    await client.query(`
      DO $$ DECLARE
        r RECORD;
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
      message: "All tables dropped. Now redeploy to let Payload recreate them with push:true, or visit /admin which will trigger schema creation.",
    });
  } catch (error) {
    await pool.end();
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
