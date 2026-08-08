import { AppShell } from "@/components/app-shell";
import { AppLauncher, type MockApp } from "@/components/app-card";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

const mockApps: MockApp[] = [
  { id: "movies", name: "Movies", kanji: "映", icon: "play", colors: ["#c85d70", "#71384b", "#f1c3b4"] },
  { id: "photos", name: "Photos", kanji: "写", icon: "image", colors: ["#7f987c", "#405a70", "#d9dfc8"] },
];

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const displayName = session.user.name?.split(" ")[0] || session.user.username || "home";

  return (
    <AppShell user={session.user}>
      <div className="page home-page">
        <header className="home-hero">
          <div className="hero-copy">
            <p className="hero-japanese" lang="ja">おかえり</p>
            <h1>Welcome home, <strong>{displayName}.</strong></h1>
          </div>
          <div className="hero-petals" aria-hidden="true">
            <i /><i /><i /><i /><i />
          </div>
        </header>
        <AppLauncher apps={mockApps} />
      </div>
    </AppShell>
  );
}
