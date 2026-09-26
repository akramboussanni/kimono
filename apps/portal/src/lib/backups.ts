import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { stateDir } from "./state";
import { backupCatalog } from "./backup-catalog";
import { scanAppDefinitions } from "./definitions";
import { getPlatformSettings } from "./settings";
import { publishDesiredState } from "./desired-state";

export const backupDir = join(stateDir, "backups");
export type BackupConfig = {
  version: 1; enabled: boolean; endpoint: string; bucket: string; prefix: string;
  keyId: string; applicationKey: string; password: string; recoverySaved: boolean;
  hourUTC: number; daily: number; weekly: number; monthly: number;
  platform: boolean; apps: Record<string, boolean>; items: Record<string, boolean>;
};
export type BackupStatus = {
  state: "running" | "ready" | "failed"; message: string; updatedAt: string;
  lastSuccess?: string; lastAttempt?: string; lastCheck?: string; restorePath?: string;
  overdue?: boolean;
  snapshots?: Array<{ id: string; time: string; summary?: { total_bytes_processed?: number } }>;
};
export async function readBackupConfig(): Promise<BackupConfig | null> {
  try { return JSON.parse(await readFile(join(backupDir, "config.json"), "utf8")); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
}
export async function readBackupStatus(): Promise<BackupStatus | null> {
  try {
    const status = JSON.parse(await readFile(join(backupDir, "status.json"), "utf8")) as BackupStatus;
    return { ...status, overdue: Boolean(status.lastSuccess && Date.now() - Date.parse(status.lastSuccess) > 36 * 60 * 60 * 1000) };
  } catch { return null; }
}
async function atomic(name: string, value: unknown) {
  await mkdir(backupDir, { recursive: true, mode: 0o700 });
  const temporary = join(backupDir, `.${randomUUID()}.tmp`);
  await writeFile(temporary, JSON.stringify(value, null, 2) + "\n", { mode: 0o600 });
  await rename(temporary, join(backupDir, name));
}
export async function saveBackups(form: FormData) {
  const previous = await readBackupConfig();
  const endpoint = String(form.get("endpoint") || "").trim().replace(/\/$/, "");
  if (!/^https:\/\/s3\.[a-z0-9-]+\.backblazeb2\.com$/.test(endpoint)) throw new Error("Enter your B2 HTTPS S3 endpoint, such as https://s3.us-west-004.backblazeb2.com.");
  const bucket = String(form.get("bucket") || "").trim();
  const prefix = String(form.get("prefix") || "kimono").trim();
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{4,62}$/.test(bucket)) throw new Error("Enter a valid B2 bucket name.");
  if (!/^[a-zA-Z0-9_-]+$/.test(prefix)) throw new Error("Repository folder must contain only letters, numbers, dashes, and underscores.");
  const keyId = String(form.get("keyId") || "").trim() || previous?.keyId || "";
  const applicationKey = String(form.get("applicationKey") || "").trim() || previous?.applicationKey || "";
  if (!keyId || !applicationKey || /[\r\n\0]/.test(keyId + applicationKey)) throw new Error("A B2 application key ID and key are required.");
  const integer = (name: string, min: number, max: number) => {
    const raw = String(form.get(name) ?? ""); const value = Number(raw);
    if (!raw || !Number.isInteger(value) || value < min || value > max) throw new Error(`${name} must be between ${min} and ${max}.`);
    return value;
  };
  const settings = await getPlatformSettings();
  const { definitions, errors } = await scanAppDefinitions();
  if (errors.length) throw new Error(`Fix application definition errors before saving backups: ${errors.join("; ")}`);
  const catalog = backupCatalog(settings, definitions);
  const destinationChanged = previous && (previous.endpoint !== endpoint || previous.bucket !== bucket || previous.prefix !== prefix || previous.keyId !== keyId || previous.applicationKey !== applicationKey);
  if (destinationChanged && (await readBackupStatus())?.state === "running") throw new Error("Wait for the current operation to finish before changing the storage destination or credentials.");
  const recoverySaved = !destinationChanged && (previous?.recoverySaved === true || form.get("recoverySaved") === "on");
  const enabled = form.get("enabled") === "on";
  if (enabled && (!previous || !recoverySaved)) throw new Error("Save the destination first, download your recovery kit, then confirm that you stored it safely before enabling the schedule.");
  const config: BackupConfig = {
    version: 1, enabled, endpoint, bucket, prefix, keyId, applicationKey,
    password: previous?.password || randomBytes(32).toString("hex"), recoverySaved,
    hourUTC: integer("hourUTC", 0, 23), daily: integer("daily", 1, 365), weekly: integer("weekly", 1, 104), monthly: integer("monthly", 1, 120),
    platform: form.get("platform") === "on",
    apps: Object.fromEntries([...new Set(catalog.map((item) => item.appId))].map((id) => [id, form.get(`app.${id}`) === "on"])),
    items: Object.fromEntries(catalog.map((item) => [item.id, form.get(`item.${item.id}`) === "on"])),
  };
  if (enabled && !config.platform && !catalog.some((item) => config.apps[item.appId] && config.items[item.id])) throw new Error("Select at least one backup item.");
  await publishDesiredState(settings);
  await atomic("config.json", config);
  if (destinationChanged) await atomic("status.json", { state: "ready", message: "Storage settings changed. Save the updated recovery kit, then run a backup or integrity check.", updatedAt: new Date().toISOString() });
}
export async function requestBackup(action: "backup" | "check" | "restore", snapshot = "", appId = "") {
  const config = await readBackupConfig();
  if (!config?.recoverySaved) throw new Error("Download and save the recovery kit, then confirm it in backup settings.");
  if (action === "restore" && !/^[a-f0-9]{64}$/.test(snapshot)) throw new Error("Choose a backup snapshot.");
  if (appId && !/^[a-z0-9][a-z0-9-]*$/.test(appId)) throw new Error("Invalid app.");
  if ((await readBackupStatus())?.state === "running") throw new Error("A backup operation is already running.");
  await mkdir(backupDir, { recursive: true, mode: 0o700 });
  try { await writeFile(join(backupDir, "request.json"), JSON.stringify({ id: randomUUID(), action, snapshot, appId }), { flag: "wx", mode: 0o600 }); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "EEXIST") throw new Error("A backup operation is already queued."); throw error; }
}
