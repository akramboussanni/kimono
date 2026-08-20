import { auth } from "@/auth";
import { scanAppDefinitions } from "@/lib/definitions";
import { renderDeploymentPlan } from "@/lib/deployment";
import { getPlatformSettings } from "@/lib/settings";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "owner" && session.user.role !== "admin")) return Response.json({ error: "Forbidden" }, { status: 403 });
  const [settings, scan] = await Promise.all([getPlatformSettings(), scanAppDefinitions()]);
  return Response.json(renderDeploymentPlan(settings, scan.definitions), { headers: { "Cache-Control": "no-store" } });
}
