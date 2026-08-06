import { isAppVisibleTo } from "@kimono/app-sdk";
import { AppLauncher } from "@/components/app-card";
import { AppShell } from "@/components/app-shell";
import { SakuraHeroArt } from "@/components/sakura-art";
import { applications, currentProfile } from "@/lib/registry";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const visibleApps = applications.filter((app) => isAppVisibleTo(app, session.user.role) && app.status !== "setup");
  const displayName = session.user.name?.split(" ")[0] || session.user.username || currentProfile.displayName;

  return (
    <AppShell active="home" profile={{ displayName, role: session.user.role }}>
      <div className="page home-page">
        <header className="home-hero">
          <SakuraHeroArt />
          <div className="hero-copy">
            <p className="eyebrow">ようこそ · Welcome home</p>
            <h1>Good afternoon,<br /><em>{displayName}</em></h1>
            <p>Everything shared by your household, gathered in one calm place.</p>
          </div>
          <div className="hanko hero-hanko" aria-hidden="true">家<br />庭</div>
        </header>
        <AppLauncher apps={visibleApps} />
      </div>
    </AppShell>
  );
}
