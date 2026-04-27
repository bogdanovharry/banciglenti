import { NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { getPayload } = await import("payload");
    const config = (await import("@payload-config")).default;

    // This will initialize Payload and with push:true it should create/sync tables
    const payload = await getPayload({ config });

    // If we get here, tables were created
    const users = await payload.find({ collection: "users", limit: 1 });

    return NextResponse.json({
      status: "ok",
      message: "Payload initialized successfully! Tables are ready.",
      usersCount: users.totalDocs,
      nextStep: users.totalDocs === 0
        ? "Visit /admin to create your first admin user, then /api/seed to populate data"
        : "Visit /admin to login",
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      error: String(error).substring(0, 500),
    }, { status: 500 });
  }
}
