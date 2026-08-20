import { auth } from "@/auth";
import { startCloudflareLogin } from "@/lib/cloudflare-login";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "owner" && session.user.role !== "admin")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const input = await request.json() as { name?: string; domain?: string };
    return NextResponse.json(await startCloudflareLogin({ name: input.name || "", domain: input.domain || "" }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Cloudflare login could not start" }, { status: 400 });
  }
}
