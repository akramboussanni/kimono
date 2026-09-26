import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { AdminNavigation } from "@/components/admin-navigation";
import { Compartment, Seal, SealLink } from "@kimono/ui";
import { getPlatformSettings } from "@/lib/settings";
import { scanAppDefinitions } from "@/lib/definitions";
import { backupCatalog } from "@/lib/backup-catalog";
import { readBackupConfig, readBackupStatus, requestBackup, saveBackups } from "@/lib/backups";
import { redirect } from "next/navigation";
import { BackupRefresh } from "./refresh";

export const metadata = { title: "Backups · Admin" };
async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["owner", "admin"].includes(session.user.role)) redirect("/");
  return session;
}
const methods = { files: "Live file copy", postgres: "Online PostgreSQL export", sqlite: "Online SQLite export", settings: "Configuration file" };

export default async function BackupsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string; queued?: string }> }) {
  const session = await requireAdmin();
  const [settings, scan, config, status, query] = await Promise.all([getPlatformSettings(), scanAppDefinitions(), readBackupConfig(), readBackupStatus(), searchParams]);
  const catalog = backupCatalog(settings, scan.definitions);
  const appIds = [...new Set(catalog.map((item) => item.appId))];
  const overdue = config?.enabled && status?.overdue;
  const undeclared = Object.values(settings.apps).filter((app) => app.enabled && app.definitionId !== "kimono-portal" && !catalog.some((item) => item.appId === app.id));
  async function save(form: FormData) {
    "use server";
    await requireAdmin();
    try { await saveBackups(form); }
    catch (error) { redirect(`/admin/backups?error=${encodeURIComponent(error instanceof Error ? error.message : "Backup settings could not be saved")}`); }
    redirect("/admin/backups?saved=1");
  }
  async function run(form: FormData) {
    "use server";
    await requireAdmin();
    const action = String(form.get("action"));
    try {
      if (action !== "backup" && action !== "check" && action !== "restore") throw new Error("Unknown operation");
      await requestBackup(action, String(form.get("snapshot") || ""), String(form.get("appId") || ""));
    } catch (error) { redirect(`/admin/backups?error=${encodeURIComponent(error instanceof Error ? error.message : "Operation could not be queued")}`); }
    redirect("/admin/backups?queued=1");
  }
  return <AppShell user={session.user} brandColors={settings.brand.colors} active="admin">
    <div className="page admin-page backup-workspace">
      <BackupRefresh active={status?.state === "running" || Boolean(query.queued)} />
      <AdminNavigation active="backups" />
      <header className="admin-workspace-header"><div><h1>Backups</h1><p>Choose what to protect. Apps stay online, and data is encrypted before it leaves this server.</p></div></header>
      {query.error ? <p role="alert" className="admin-notice error">{query.error}</p> : null}
      {query.saved ? <p role="status" className="admin-notice success">Backup settings saved.</p> : null}
      {query.queued ? <p role="status" className="admin-notice">Request submitted. Status updates automatically.</p> : null}
      {scan.errors.map((error) => <p className="admin-notice error" key={error}>{error}</p>)}
      {undeclared.map((app) => <p className="admin-notice error" key={app.id}>{app.name} has no backup items declared. Its app data is not protected.</p>)}
      <Compartment label="Backup health">
        <div className="backup-section">
          <h2>{status?.state === "failed" || overdue ? "Needs attention" : status?.state === "running" ? "Working" : config?.enabled ? "Scheduled nightly" : "Schedule paused"}</h2>
          <p role="status">{status?.message || (config?.enabled ? "Waiting for the first scheduled backup. You can also start one now." : config ? "Scheduling is paused. Save your recovery kit to enable manual or scheduled backups." : "Configure a destination and save your recovery kit to get started.")}</p>
          {overdue ? <p role="alert" className="admin-notice error">No complete upload in the last 36 hours. Check that the server worker is running.</p> : null}
          <p>Last complete upload: {status?.lastSuccess ? new Date(status.lastSuccess).toUTCString() : "No successful backup yet"}</p>
          <p>Last integrity check: {status?.lastCheck ? new Date(status.lastCheck).toUTCString() : "Not checked yet"}</p>
          <form action={run} className="backup-actions"><Seal name="action" value="backup" type="submit" disabled={!config?.recoverySaved || status?.state === "running"}>Back up now</Seal><Seal name="action" value="check" type="submit" disabled={!config?.recoverySaved || status?.state === "running"}>Check stored data</Seal><SealLink href="/admin/backups">Refresh</SealLink></form>
        </div>
      </Compartment>
      <form action={save} className="backup-settings">
        <Compartment label="Encrypted storage"><div className="backup-section">
          <h2>Backblaze B2</h2><p>Use a dedicated private bucket and an application key scoped to it, with read, write, list, and delete access for retention.</p>
          <div className="backup-fields">
            <label>S3 endpoint<input name="endpoint" type="url" required defaultValue={config?.endpoint || ""} placeholder="https://s3.us-west-004.backblazeb2.com" /></label>
            <label>Bucket<input name="bucket" required defaultValue={config?.bucket || ""} /></label>
            <label>Repository folder<input name="prefix" required defaultValue={config?.prefix || "kimono"} /></label>
            <label>Application key ID<input name="keyId" autoComplete="off" defaultValue={config?.keyId || ""} /></label>
            <label>Application key<input name="applicationKey" type="password" autoComplete="new-password" placeholder={config ? "Configured — leave blank to keep" : "B2 application key"} /></label>
          </div>
          <p>Kimono generates the encryption password. Save this destination first, then download the recovery kit. The kit includes the password and storage credentials; keep it in your password manager outside this server.</p>
          {config ? <><SealLink href="/api/backups/recovery-kit">Download recovery kit</SealLink><label className="backup-toggle"><input name="recoverySaved" type="checkbox" defaultChecked={config.recoverySaved} />I have stored the recovery kit safely outside this server.</label></> : null}
        </div></Compartment>
        <Compartment label="Schedule and retention"><div className="backup-section">
          <label className="backup-toggle"><input name="enabled" type="checkbox" defaultChecked={config?.enabled || false} />Enable automatic nightly backups</label>
          <div className="backup-fields">
            <label>Hour (UTC, 0–23)<input type="number" name="hourUTC" min="0" max="23" required defaultValue={config?.hourUTC ?? 3} /></label>
            <label>Daily snapshots<input type="number" name="daily" min="1" max="365" required defaultValue={config?.daily ?? 7} /></label>
            <label>Weekly snapshots<input type="number" name="weekly" min="1" max="104" required defaultValue={config?.weekly ?? 4} /></label>
            <label>Monthly snapshots<input type="number" name="monthly" min="1" max="120" required defaultValue={config?.monthly ?? 6} /></label>
          </div><p>Missed runs are caught up after the scheduled hour. Failed runs retry hourly. Retention runs only after a complete upload; a sample of stored data is checked weekly.</p>
        </div></Compartment>
        <Compartment label="What gets backed up"><div className="backup-section">
          <h2>Platform recovery</h2>
          <label className="backup-toggle"><input name="platform" type="checkbox" defaultChecked={config?.platform ?? true} />Kimono configuration, secrets, identity, and mesh</label>
          <p>Includes platform settings and app deployment configuration even when an app’s data backups are off. Certificates can be reissued. Backups use local staging space roughly equal to the selected data.</p>
          <h2>Applications</h2><p>An app switch controls all its items and keeps your individual selections. Unchecked items will be absent from new backups; older snapshots remain until retention removes them.</p>
          {appIds.map((appId) => {
            const items = catalog.filter((item) => item.appId === appId);
            return <fieldset className="backup-app" key={appId} id={appId}>
              <legend>{items[0].appName}</legend>
              <label className="backup-toggle"><input type="checkbox" name={`app.${appId}`} defaultChecked={config?.apps[appId] ?? items[0].active} />Enable backups for this app</label>
              {!items[0].active ? <p>This app is currently disabled. Online database exports need its database container running.</p> : null}
              {items.map((item) => <label className="backup-item" key={item.id}>
                <input type="checkbox" name={`item.${item.id}`} defaultChecked={config?.items[item.id] ?? item.enabledByDefault} />
                <span><strong>{item.label}</strong><span>{item.description}</span><small>{methods[item.method]}</small></span>
              </label>)}
            </fieldset>;
          })}
          <p>Online exports keep services available. Files changing during backup can make a run fail, and databases and files are not a single point-in-time snapshot. Keep related database, file, and encryption-key items selected for a recoverable app.</p>
          <footer><Seal type="submit">Save backup settings</Seal></footer>
        </div></Compartment>
      </form>
      <Compartment label="Recovery"><div className="backup-section">
        <h2>Restore a copy</h2><p>Choose a snapshot to download and verify into a separate recovery directory. Recover one app or the entire snapshot. Replacing live data is a separate recovery step.</p>
        {status?.restorePath ? <p>Latest recovery directory: <code>{status.restorePath}</code></p> : null}
        {status?.snapshots?.length ? <form action={run} className="backup-fields">
          <input type="hidden" name="action" value="restore" />
          <label>Snapshot<select name="snapshot">{status.snapshots.map((snapshot) => <option key={snapshot.id} value={snapshot.id}>{new Date(snapshot.time).toUTCString()} · {snapshot.id.slice(0, 8)}{snapshot.summary?.total_bytes_processed ? ` · ${(snapshot.summary.total_bytes_processed / 1024 ** 3).toFixed(2)} GiB` : ""}</option>)}</select></label>
          <label>Contents<select name="appId"><option value="">Entire snapshot</option>{appIds.map((id) => <option key={id} value={id}>{catalog.find((item) => item.appId === id)?.appName}</option>)}</select></label>
          <Seal type="submit" disabled={status.state === "running"}>Restore a copy</Seal>
        </form> : <p>Completed snapshots will appear here after the first backup.</p>}
      </div></Compartment>
    </div>
  </AppShell>;
}
