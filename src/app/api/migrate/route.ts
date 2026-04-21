import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export const maxDuration = 60;

export async function GET() {
  try {
    // Just initializing Payload will trigger the migration/table creation
    const payload = await getPayload({ config });

    // Check if tables exist by trying a simple query
    const users = await payload.find({ collection: "users", limit: 1 });

    return NextResponse.json({
      message: "Database tables created successfully!",
      usersCount: users.totalDocs,
      nextStep: "Now visit /api/seed to populate with sample data",
    });
  } catch (error) {
    return NextResponse.json({
      error: String(error),
      hint: "Check DATABASE_URL in Vercel environment variables"
    }, { status: 500 });
  }
}
