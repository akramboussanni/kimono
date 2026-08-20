import { auth } from "@/auth";
import { getCloudflareLogin } from "@/lib/cloudflare-login";
import { NextResponse } from "next/server";

export async function GET(_: Request, context: { params: Promise<{ sessionId: string }> }) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "owner" && session.user.role !== "admin")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = getCloudflareLogin((await context.params).sessionId);
  return result ? NextResponse.json(result) : NextResponse.json({ error: "Login session expired" }, { status: 404 });
}
