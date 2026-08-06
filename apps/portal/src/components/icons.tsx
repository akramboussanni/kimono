import type { SVGProps } from "react";
import type { KimonoAppManifest } from "@kimono/app-sdk";
import { BloomMark } from "@kimono/ui";

type IconProps = SVGProps<SVGSVGElement>;

function AppGlyph({ name }: { name: KimonoAppManifest["icon"] }) {
  if (name === "play") return <><path d="M44 39 64 50 44 61Z"/><path className="app-bloom-detail" d="M38 34h24M40 29l5 10m7-10 5 10m7-9 3 7"/></>;
  if (name === "image") return <><path d="m34 61 12-15 8 9 5-6 9 12Z"/><circle cx="62" cy="40" r="5"/><path className="app-bloom-detail" d="M35 36h30"/></>;
  if (name === "file") return <><path d="M34 40h13l5 5h16v19H34Z"/><path className="app-bloom-detail" d="M39 51h24m-24 6h17"/></>;
  if (name === "tool") return <><path d="m38 63 6-16 18-18c4 5 4 9 0 13L48 56Z"/><path className="app-bloom-detail" d="m38 37 25 25M43 33l-7-7"/></>;
  if (name === "server") return <><path d="M33 35h34v13H33Zm0 18h34v13H33Z"/><path className="app-bloom-detail" d="M39 41h3m-3 18h3m7-18h12m-12 18h12"/></>;
  return <><path d="m31 49 19-17 19 17-4 4v15H35V53Z"/><path className="app-bloom-detail" d="M45 68V56h10v12"/></>;
}

type AppIconManifest = Pick<KimonoAppManifest, "id" | "icon" | "brand">;

export function AppIcon({ app, ...props }: IconProps & { app: AppIconManifest }) {
  return <BloomMark identity={{ id: app.id, colors: app.brand.colors }} {...props}><AppGlyph name={app.icon}/></BloomMark>;
}

export function GridIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true" {...props}><rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/></svg>;
}

export function PeopleIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true" {...props}><circle cx="9" cy="8" r="3"/><path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2M16 6.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 3.5 4.8V20"/></svg>;
}

export function SettingsIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1"/><circle cx="12" cy="12" r="4"/></svg>;
}

export function SearchIcon(props: IconProps) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" {...props}><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>; }
export function ChevronIcon(props: IconProps) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d="m9 6 6 6-6 6"/></svg>; }
