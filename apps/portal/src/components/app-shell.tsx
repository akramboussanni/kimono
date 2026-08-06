import Link from "next/link";
import { KimonoMark } from "@kimono/ui";
import { GridIcon, SettingsIcon } from "./icons";
import { signOut } from "@/auth";

type Props = {
  active: "home" | "admin";
  children: React.ReactNode;
  profile: { displayName: string; role: string };
};

export function AppShell({ active, children, profile }: Props) {
  const initial = profile.displayName.trim().at(0)?.toUpperCase() || "K";
  const canAdmin = profile.role === "owner" || profile.role === "admin";
  return (
    <div className="app-frame">
      <header className="top-header">
        <div className="header-inner">
          <Link href="/" className="brand-link"><KimonoMark /></Link>
          <nav className="main-nav" aria-label="Main navigation">
            <Link href="/" className={active === "home" ? "nav-link active" : "nav-link"}><GridIcon /><span>Apps</span></Link>
            {canAdmin ? <Link href="/admin" className={active === "admin" ? "nav-link active" : "nav-link"}><SettingsIcon /><span>Settings</span></Link> : null}
          </nav>
          <div className="header-actions">
            <details className="profile-menu">
              <summary className="profile-chip" aria-label="Open account menu">
                <span className="avatar">{initial}</span>
                <span className="profile-copy"><strong>{profile.displayName}</strong><small>{profile.role}</small></span>
                <span className="profile-chevron">⌄</span>
              </summary>
              <div className="profile-popover">
                <span><strong>{profile.displayName}</strong><small>Kimono {profile.role}</small></span>
                <Link href="/">My applications</Link>
                {canAdmin ? <Link href="/admin">Household settings</Link> : null}
                <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
                  <button type="submit">Sign out</button>
                </form>
              </div>
            </details>
          </div>
        </div>
      </header>
      <main className="main-content">{children}</main>
    </div>
  );
}
