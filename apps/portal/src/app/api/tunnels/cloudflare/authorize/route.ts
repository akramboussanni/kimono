import { NextRequest, NextResponse } from "next/server";

// Compatibility redirect for stale bookmarks from the removed OAuth flow.
export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/admin/infrastructure/cloudflare", request.url));
}
