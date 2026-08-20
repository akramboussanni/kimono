import { SealLink, StatedSeal } from "@kimono/ui";
import { AppShell } from "@/components/app-shell";
import { VpnRooms } from "@/components/app-rooms";
import { Panel, PanelEmpty, Panels, SectionHeading, Workspace } from "@/components/panel";
import { describeLastSeen, devicesFor, readMesh, type MeshDevice } from "@/lib/mesh";
import { meshContext } from "./shared";

export const metadata = { title: "Devices · Kimono VPN" };

export default async function VpnPage() {
  const { session, settings, identity, member } = await meshContext();
  const mesh = await readMesh();
  const devices = mesh.available && member ? devicesFor(mesh.devices, session.user) : [];
  const connected = devices.filter((device) => device.online).length;

  return <AppShell user={session.user} brandColors={settings.brand.colors} app={identity}>
    <div className="page admin-page">
      <VpnRooms here="devices" />
      <Workspace>
        {!member
          ? <PanelEmpty title="Kimono VPN is not switched on" action={<SealLink href="/">Back to Kimono</SealLink>}>
              Ask whoever runs this Kimono to switch it on for @{session.user.username}, and your devices will appear here.
            </PanelEmpty>
          : <>
              <SectionHeading
                title="Your devices"
                description="These reach each other directly, wherever they are."
                meta={devices.length ? `${connected} of ${devices.length} connected` : undefined}
              />
              {!mesh.available
                ? <PanelEmpty title="Not connected to the mesh">{mesh.reason}</PanelEmpty>
                : devices.length
                  ? <Panels>
                      {devices.map((device) => <Panel
                        key={device.id}
                        label={device.online ? "Online" : "Offline"}
                        title={device.name}
                        state={<StatedSeal state={device.online ? "running" : "quiet"}>{device.online ? "Connected" : "Offline"}</StatedSeal>}
                        action={device.addresses.length ? <span className="device-addresses">{device.addresses.map((address) => <code key={address}>{address}</code>)}</span> : undefined}
                      >
                        <p>{describeLastSeen(device)}</p>
                      </Panel>)}
                    </Panels>
                  : <PanelEmpty title="No devices yet" action={<SealLink href="/vpn/connect">Connect a device</SealLink>}>
                      Nothing of yours has joined this mesh. Adding one takes about a minute.
                    </PanelEmpty>}
            </>}
      </Workspace>
    </div>
  </AppShell>;
}
