import { AppIcon, type MockAppIcon } from "./icons";

export type MockApp = {
  id: string;
  name: string;
  kanji: string;
  icon: MockAppIcon;
  colors: readonly [`#${string}`, `#${string}`, `#${string}`];
};

export function AppLauncher({ apps }: { apps: MockApp[] }) {
  return (
    <section className="launcher-section" aria-labelledby="apps-heading">
      <h2 id="apps-heading">Applications</h2>
      <div className="launcher-grid">
        {apps.map((app, index) => (
          <div className="launcher-app" aria-disabled="true" key={app.id} style={{ "--app-order": index } as React.CSSProperties}>
            <span className="app-cord" aria-hidden="true"><i /><i /><b /></span>
            <span className="app-ema">
              <span className="ema-grain" aria-hidden="true" />
              <span className="launcher-icon"><AppIcon app={app} /></span>
              <span className="ema-copy">
                <span className="launcher-name">{app.name}</span>
                <span className="launcher-status">Coming soon</span>
              </span>
              <span className="ema-seal" aria-hidden="true">{app.kanji}</span>
            </span>
            <span className="ema-tassel" aria-hidden="true"><i /><i /><i /></span>
          </div>
        ))}
      </div>
    </section>
  );
}
