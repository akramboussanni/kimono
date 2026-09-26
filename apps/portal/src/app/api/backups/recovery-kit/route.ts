import { auth } from "@/auth";
import { readBackupConfig } from "@/lib/backups";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["owner", "admin"].includes(session.user.role)) return new Response("Forbidden", { status: 403 });
  const config = await readBackupConfig();
  if (!config) return new Response("Configure backups first", { status: 404 });
  const kit = {
    format: "kimono-recovery-v1",
    repository: `s3:${config.endpoint}/${config.bucket}/${config.prefix}`,
    password: config.password,
    keyId: config.keyId,
    applicationKey: config.applicationKey,
    instructions: "Keep this file outside your Kimono server, in a password manager or other protected storage. It grants access to your backups. See docs/backups.md for restoring with restic on a replacement server.",
  };
  return new Response(JSON.stringify(kit, null, 2) + "\n", { headers: { "Content-Type": "application/json", "Content-Disposition": 'attachment; filename="kimono-recovery-kit.json"', "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
