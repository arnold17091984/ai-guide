import { NextRequest, NextResponse } from "next/server";
import { generateWeeklyDigest } from "@/lib/digest/actions";

// ============================================================
// POST /api/digest/generate — Weekly digest generator
// ============================================================
// Protected with CRON_SECRET via x-api-key header.
// Computes the weekly digest and inserts it into the database.
// Called by a cron job each Monday morning.

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Validate CRON_SECRET
  const apiKey = request.headers.get("x-api-key");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || apiKey !== cronSecret) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const digest = await generateWeeklyDigest();

    return NextResponse.json({
      success: true,
      digest,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
