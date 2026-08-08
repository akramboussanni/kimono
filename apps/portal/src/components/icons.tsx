import type { SVGProps } from "react";
import { BloomMark } from "@kimono/ui";

type IconProps = SVGProps<SVGSVGElement>;

export type MockAppIcon = "play" | "image";

function AppGlyph({ name }: { name: MockAppIcon }) {
  if (name === "play") return <><path d="M44 39 64 50 44 61Z"/><path className="app-bloom-detail" d="M38 34h24M40 29l5 10m7-10 5 10m7-9 3 7"/></>;
  return <><path d="m34 61 12-15 8 9 5-6 9 12Z"/><circle cx="62" cy="40" r="5"/><path className="app-bloom-detail" d="M35 36h30"/></>;
}

export function AppIcon({ app }: { app: { id: string; icon: MockAppIcon; colors: readonly [`#${string}`, `#${string}`, `#${string}`] } }) {
  return <BloomMark identity={{ id: app.id, colors: app.colors }}><AppGlyph name={app.icon}/></BloomMark>;
}

export function GridIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true" {...props}><rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/></svg>;
}
