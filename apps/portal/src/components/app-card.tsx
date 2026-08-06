"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KimonoAppManifest } from "@kimono/app-sdk";
import { AppIcon, SearchIcon } from "./icons";

export function AppLauncher({ apps }: { apps: KimonoAppManifest[] }) {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const readyApps = useMemo(() => apps.filter((app) => `${app.name} ${app.shortDescription}`.toLowerCase().includes(query.toLowerCase())), [apps, query]);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  return (
    <div className="launcher-content">
      <label className="app-search">
        <SearchIcon />
        <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your apps" aria-label="Search your apps" />
        <kbd>/</kbd>
      </label>

      <section className="launcher-section" aria-labelledby="apps-heading">
        <div className="section-title-row">
          <h2 id="apps-heading">Your apps</h2>
          <span>{readyApps.length} ready</span>
        </div>
        {readyApps.length ? (
          <div className="launcher-grid">
            {readyApps.map((app) => (
              <a className="launcher-app" href={app.href} key={app.id} style={{ "--app-accent": app.accent } as React.CSSProperties}>
                <span className="launcher-icon"><AppIcon app={app} /></span>
                <span className="launcher-name">{app.name}</span>
                <span className="launcher-description">{app.shortDescription}</span>
              </a>
            ))}
          </div>
        ) : <p className="empty-state">No available apps match “{query}”.</p>}
      </section>

    </div>
  );
}
