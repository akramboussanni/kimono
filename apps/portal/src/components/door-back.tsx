"use client";

import { Door } from "@kimono/ui";
import { useCrossTo } from "@/components/crossing";

/** The way out. A door, because it goes somewhere. */
export function DoorBack({ href, label = "All apps" }: { href: string; label?: string }) {
  const crossTo = useCrossTo();
  return <Door label={`Back to ${label}`} onClick={() => crossTo("kakejiku", href)}>{label}</Door>;
}
