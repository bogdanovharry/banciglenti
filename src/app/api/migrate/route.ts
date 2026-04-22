import { NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Import payload dynamically to catch any initialization errors
    const { getPayload } = await import("payload");
    const config = (await import("@payload-config")).default;

    const payload = await getPayload({ config });

    // Try a simple query — if tables don't exist, Payload with push:true should create them
    try {
      const users = await payload.find({ collection: "users", limit: 1 });
      return NextResponse.json({
        status: "ok",
        message: "Database tables exist and are ready!",
        usersCount: users.totalDocs,
        nextStep: "Visit /api/seed to populate with sample data, then /admin to login",
      });
    } catch (queryError) {
      return NextResponse.json({
        status: "tables_error",
        error: String(queryError),
        hint: "Tables may not exist yet. Payload push:true should create them on next restart.",
      }, { status: 500 });
    }
  } catch (error) {
    const errorMsg = String(error);
    return NextResponse.json({
      status: "init_error",
      error: errorMsg,
      hint: errorMsg.includes("DATABASE_URL") || errorMsg.includes("connect")
        ? "Check DATABASE_URL in Vercel Environment Variables"
        : errorMsg.includes("PAYLOAD_SECRET")
        ? "Check PAYLOAD_SECRET in Vercel Environment Variables"
        : "Unknown initialization error",
      env_check: {
        has_database_url: !!process.env.DATABASE_URL,
        has_payload_secret: !!process.env.PAYLOAD_SECRET,
        database_url_prefix: process.env.DATABASE_URL?.substring(0, 30) + "...",
      }
    }, { status: 500 });
  }
}
