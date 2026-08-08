import Link from "next/link";
import { KimonoMark } from "@kimono/ui";
import { GridIcon } from "./icons";
import { signOut } from "@/auth";

type Props = {
  children: React.ReactNode;
  user: {
    name?: string | null;
    username: string;
    role: string;
    image?: string | null;
  };
};

function authentikAccountUrl() {
  try {
    return process.env.AUTHENTIK_ISSUER
      ? new URL("/if/user/", process.env.AUTHENTIK_ISSUER).toString()
      : null;
  } catch {
    return null;
  }
}

export function AppShell({ children, user }: Props) {
  const displayName = user.name?.trim() || user.username;
  const initial = displayName.at(0)?.toUpperCase() || "K";
  const accountUrl = authentikAccountUrl();
  const avatarStyle = user.image
    ? { backgroundImage: `url(${JSON.stringify(user.image)})` }
    : undefined;
  const yokeContents = <>
    <i /><i />
    <strong>Kimono account</strong>
    <span>結</span>
  </>;

  return (
    <div className="app-frame">
      <header className="top-header">
        <div className="header-inner">
          <Link href="/" className="brand-link"><KimonoMark /></Link>
          <nav className="main-nav" aria-label="Main navigation">
            <Link href="/" aria-current="page" className="nav-link active">
              <span className="nav-shoji" aria-hidden="true"><i /><i /></span>
              <span className="nav-link-content"><GridIcon /><span>Home</span></span>
            </Link>
          </nav>
          <details className="profile-menu">
            <summary className="profile-chip" aria-label="Open account menu">
              <span className={user.image ? "avatar has-image" : "avatar"} style={avatarStyle}>{initial}</span>
              <span className="profile-copy"><strong>{displayName}</strong><small>@{user.username} · {user.role}</small></span>
              <span className="profile-chevron" aria-hidden="true">⌄</span>
            </summary>
            <div className="profile-popover">
              {accountUrl
                ? <a className="account-yoke" href={accountUrl} aria-label="Open your Kimono account">{yokeContents}</a>
                : <div className="account-yoke" aria-hidden="true">{yokeContents}</div>}
              <form action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}>
                <button className="signout-charm" type="submit">
                  <span className="charm-kanji" aria-hidden="true">出</span>
                  <span className="charm-copy"><strong>Sign out</strong><small>Close this session</small></span>
                  <span className="charm-arrow" aria-hidden="true">→</span>
                </button>
              </form>
            </div>
          </details>
        </div>
      </header>
      <main className="main-content">{children}</main>
    </div>
  );
}
