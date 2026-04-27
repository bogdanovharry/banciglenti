import { NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { getPayload } = await import("payload");
    const config = (await import("@payload-config")).default;
    const payload = await getPayload({ config });

    // Check if admin exists
    const existing = await payload.find({
      collection: "users",
      where: { email: { equals: "admin@tehnoles.com" } },
      limit: 1,
    });

    if (existing.totalDocs > 0) {
      return NextResponse.json({
        status: "exists",
        message: "Admin user already exists. Go to /admin to login.",
        email: "admin@tehnoles.com",
      });
    }

    // Create admin user via Payload API
    await payload.create({
      collection: "users",
      data: {
        email: "admin@tehnoles.com",
        password: "Tehnoles2026!",
        name: "Admin",
        role: "admin",
      },
    });

    return NextResponse.json({
      status: "ok",
      message: "Admin user created! Go to /admin to login.",
      email: "admin@tehnoles.com",
      password: "Tehnoles2026!",
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      error: String(error).substring(0, 500),
    }, { status: 500 });
  }
}
