import { Crossing } from "@/components/crossing";
import { appIdentity, type KimonoApp } from "@/lib/apps";
import { AppBloom } from "@kimono/ui";

/**
 * Every app crosses on 花吹雪, whether Kimono wrote it or only hosts it. The
 * blossom marks opening an app, not leaving the house.
 */
export function AppLauncher({ apps }: { apps: KimonoApp[] }) {
  return (
    <section className="launcher-section" aria-labelledby="apps-heading">
      <h2 id="apps-heading">Applications</h2>
      <div className="launcher-grid">
        {apps.map((app, index) => (
          <Crossing className="launcher-app" kind="hanafubuki" external={app.external} href={app.href} key={app.id} style={{ "--app-order": index } as React.CSSProperties} aria-label={`Open Kimono ${app.name}: ${app.description}`}>
            <span className="app-cord" aria-hidden="true"><i /><i /><b /></span>
            <span className="app-ema">
              <span className="ema-grain" aria-hidden="true" />
              {/* A hosted app ships an icon file; Kimono's own draw their
                  bloom from the same identity the header uses. */}
              <span className="launcher-icon">
                <AppBloom identity={appIdentity(app)} glyphHref={app.iconUrl || undefined} />
              </span>
              <span className="ema-copy">
                <span className="launcher-name">{app.name}</span>
                <span className="launcher-status">Open{app.external ? " app" : ""} <span aria-hidden="true">{app.external ? "↗" : "→"}</span></span>
              </span>
            </span>
            <span className="ema-tassel" aria-hidden="true"><i /><i /><i /></span>
          </Crossing>
        ))}
      </div>
    </section>
  );
}
