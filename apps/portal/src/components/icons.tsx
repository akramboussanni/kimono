import type { SVGProps } from "react";
import { BloomMark } from "@kimono/ui";

type IconProps = SVGProps<SVGSVGElement>;

export type AppIconName = "notes" | "play" | "image";

function AppGlyph({ name }: { name: AppIconName }) {
  if (name === "play") return <><path d="M44 39 64 50 44 61Z"/><path className="app-bloom-detail" d="M38 34h24M40 29l5 10m7-10 5 10m7-9 3 7"/></>;
  if (name === "image") return <><path d="m34 61 12-15 8 9 5-6 9 12Z"/><circle cx="62" cy="40" r="5"/><path className="app-bloom-detail" d="M35 36h30"/></>;
  return <><path d="M38 34h25v32H38z"/><path className="app-bloom-detail" d="M43 42h15M43 49h15M43 56h11M42 30v8m8-8v8m8-8v8"/></>;
}

export function AppIcon({ app }: { app: { id: string; icon: AppIconName; accent: string } }) {
  return <BloomMark identity={{ id: app.id, accent: app.accent }}><AppGlyph name={app.icon}/></BloomMark>;
}

export function GridIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true" {...props}><rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/></svg>;
}

export function SettingsIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><circle cx="12" cy="12" r="3"/><path d="M19 13.5v-3l-2.2-.7a7 7 0 0 0-.7-1.7l1.1-2-2.1-2.1-2 1.1a7 7 0 0 0-1.7-.7L10.5 2h-3l-.7 2.2a7 7 0 0 0-1.7.7l-2-1.1L1 5.9l1.1 2a7 7 0 0 0-.7 1.7L0 10.5v3l2.2.7a7 7 0 0 0 .7 1.7l-1.1 2L3.9 20l2-1.1a7 7 0 0 0 1.7.7l.9 2.4h3l.7-2.2a7 7 0 0 0 1.7-.7l2 1.1 2.1-2.1-1.1-2a7 7 0 0 0 .7-1.7z" transform="translate(2) scale(.83 1)"/></svg>;
}
