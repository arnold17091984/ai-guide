import { NextResponse } from "next/server";

// ============================================================
// GET /api/health — Health check endpoint
// ============================================================
// Returns service status and current timestamp.
// Used by uptime monitors and load balancers.

export const runtime = "edge";

export function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
