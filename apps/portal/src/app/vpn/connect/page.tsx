import { Command, Reveal, Seal, Rows } from "@kimono/ui";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { VpnRooms } from "@/components/app-rooms";
import { Panel, PanelEmpty, Panels, SectionHeading, Workspace } from "@/components/panel";
import { createEnrolmentKey } from "@/lib/mesh";
import { meshContext } from "../shared";
import { redirect } from "next/navigation";

export const metadata = { title: "Connect · Kimono VPN" };

export default async function ConnectPage({ searchParams }: { searchParams: Promise<{ key?: string; error?: string }> }) {
  const { session, settings, identity, member } = await meshContext();
  const query = await searchParams;
  const mesh = settings.meshDomain || `mesh.${settings.baseDomain}`;

  /* Adding your own device should not need anyone else, so the key is minted
     for the person asking rather than by an administrator at a shell. */
  async function mintKey() {
    "use server";
    const current = await auth();
    if (!current?.user) redirect("/login");
    const minted = await createEnrolmentKey(current.user);
    if ("error" in minted) redirect(`/vpn/connect?error=${encodeURIComponent(minted.error)}`);
    redirect(`/vpn/connect?key=${encodeURIComponent(minted.key)}`);
  }

  if (!member) {
    return <AppShell user={session.user} brandColors={settings.brand.colors} app={identity}>
      <div className="page admin-page">
        <VpnRooms here="connect" />
        <Workspace>
          <PanelEmpty title="Kimono VPN is not switched on">
            Ask whoever runs this Kimono to switch it on for @{session.user.username}. Until then a device you added would reach nothing.
          </PanelEmpty>
        </Workspace>
      </div>
    </AppShell>;
  }

  return <AppShell user={session.user} brandColors={settings.brand.colors} app={identity}>
    <div className="page admin-page">
      <VpnRooms here="connect" />

      {query.error ? <p className="admin-notice error">{query.error}</p> : null}

      <Workspace>
        <SectionHeading title="Your key" description="Every device joins with a single-use key, scoped to you." />
        <Panels>
          <Panel
            label="Key"
            title={query.key ? "Ready to use" : "Create a key"}
            wants={!query.key}
            action={query.key ? undefined : <form action={mintKey}><Seal type="submit">Create a key</Seal></form>}
          >
            {query.key
              ? <>
                  <p>It works once and expires in thirty minutes. Take it to the device you are adding.</p>
                  <Command>{query.key}</Command>
                </>
              : <p>Kimono mints it for your account — no administrator and no terminal.</p>}
          </Panel>
        </Panels>

        <SectionHeading title="Add a device" description="Pick what you are adding. Only that one unfolds." />
        <Panels>
          <Panel label="Device" title="How to join">
            <Rows>
              <Reveal title="Phone" summary="iOS or Android, using the Tailscale app">
                <p>Install <strong>Tailscale</strong>. Before signing in, open the account menu, choose a custom coordination server, and enter your mesh address.</p>
                <Command>{mesh}</Command>
                <p>Sign in with your Kimono account. The phone appears under Devices within seconds.</p>
              </Reveal>

              <Reveal title="Laptop" summary="macOS, Windows or Linux desktop">
                <p>Install Tailscale, then point it at this Kimono rather than Tailscale&rsquo;s own servers:</p>
                <Command>{`tailscale login --login-server https://${mesh}`}</Command>
              </Reveal>

              <Reveal title="Server" summary="A machine Kimono should manage, like a home server or a Pi">
                <p>Install Kimono on it, then join with the key above:</p>
                <Command>{`curl -fsSL https://${settings.baseDomain}/install.sh | sudo sh\nsudo kimono node install`}</Command>
              </Reveal>

              <Reveal title="How this works" summary="Why no port needs opening">
                <p>
                  The mesh speaks the Tailscale protocol, but the coordination server is yours, at {mesh}. Both ends
                  connect outward and meet in the middle, so nothing is opened on your router and nothing of yours
                  passes through anyone else&rsquo;s infrastructure.
                </p>
              </Reveal>
            </Rows>
          </Panel>
        </Panels>
      </Workspace>
    </div>
  </AppShell>;
}
