import { NextRequest, NextResponse } from "next/server";

// Cloudflare authorization is now completed by the local cloudflared process.
export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/admin/infrastructure/cloudflare", request.url));
}
