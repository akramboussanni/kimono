"use client";

import { type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./cx";

export function Tray({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("k-tray", className)} {...props} />;
}

/** A region of a tray. Siblings share one seam; they do not each get a frame. */
export function Compartment({ label, wants = false, children, className }: {
  label: string;
  wants?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return <section className={cx("k-compartment", wants && "k-wants", className)}>
    <div className="k-tab"><h3>{label}</h3></div>
    <div className="k-body">{children}</div>
  </section>;
}


/* ═══════════════════════════════════════════════════════════════
   渡 Watari — crossings.

   A crossing covers the screen completely, swaps underneath, and
   uncovers. Which one you get is decided by how far you are going,
   not by taste:

     hanafubuki  app ↔ app        1900ms, covers from 24%
     shoji       through a door    900ms, covers from 34%
     kakejiku    page ↔ page       820ms, covers from 44%
   ═══════════════════════════════════════════════════════════════ */
