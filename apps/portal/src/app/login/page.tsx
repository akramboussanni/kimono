import { auth, signIn } from "@/auth";
import { KimonoMark } from "@kimono/ui";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/");

  return (
    <main className="login-page">
      <section className="login-panel">
        <KimonoMark />
        <div className="login-copy">
          <p className="eyebrow">おかえりなさい · Welcome back</p>
          <h1>Come<br /><em>home.</em></h1>
          <p>One private place for your household’s people, tools, and shared memories.</p>
        </div>
        <form action={async () => {
          "use server";
          await signIn("authentik", { redirectTo: "/" });
        }}>
          <button className="login-button" type="submit">Continue to Kimono <span aria-hidden="true">→</span></button>
        </form>
      </section>
      <aside className="login-art" aria-hidden="true">
        <span className="sun-disc" />
        <span className="vertical-word">着物 · KIMONO · 家</span>
        <div className="color-folds"><i /><i /><i /><i /></div>
      </aside>
    </main>
  );
}
