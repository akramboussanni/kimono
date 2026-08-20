"use client";

import { type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./cx";

/* ═══════════════════════════════════════════════════════════════
   列 Retsu — the pieces a compartment is made of.

   A compartment's body is a list more often than it is prose. Writing that
   list by hand per page is what let cards drift apart — one got the hairlines,
   another the padding, a third neither. These are the only way to build one.
   ═══════════════════════════════════════════════════════════════ */

/** A hairline-divided list. Rows are its only children. */
export function Rows({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("k-rows", className)} {...props} />;
}

/**
 * One entry in a list: what it is, and at most one thing you can do about it.
 * `action` is a seal or a form; anything more belongs on its own page.
 */
export function Row({ title, children, action, lead, className }: {
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  /** Sits beside the title — a stated seal, never a second action. */
  lead?: ReactNode;
  className?: string;
}) {
  return <div className={cx("k-row", className)}>
    <div className="k-row-copy">
      {lead ? <span className="k-row-lead"><h3>{title}</h3>{lead}</span> : <h3>{title}</h3>}
      {children ? <p>{children}</p> : null}
    </div>
    {action}
  </div>;
}

/** A muted aside. It states something; it never lists. */
export function Note({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cx("k-note", className)} {...props} />;
}

/** An address or a command — the only two things mono is for. */
export function Command({ children, className }: { children: ReactNode; className?: string }) {
  return <pre className={cx("k-command", className)}><code>{children}</code></pre>;
}

/**
 * A row that opens.
 *
 * Instructions for a platform you do not own are noise until you want them, so
 * a compartment lists the choices and only the one you pick unfolds. Closed, it
 * is a row; open, it is a row with its detail beneath.
 */
export function Reveal({ title, children, summary, open = false }: {
  title: ReactNode;
  /** One line shown while closed, so the choice can be made without opening. */
  summary?: ReactNode;
  children: ReactNode;
  open?: boolean;
}) {
  return <details className="k-reveal" open={open}>
    <summary>
      <span className="k-reveal-cue" aria-hidden="true" />
      <span className="k-reveal-copy">
        <h3>{title}</h3>
        {summary ? <p>{summary}</p> : null}
      </span>
    </summary>
    <div className="k-reveal-body">{children}</div>
  </details>;
}

/**
 * An address or a number sitting in a row. Mono, and nothing else — a
 * compartment carries no fill, so anything inside it that paints one reads as
 * a raised object when it is only text.
 */
export function Mono({ items, className }: { items: readonly string[]; className?: string }) {
  return <span className={cx("k-mono", className)}>
    {items.map((item) => <span key={item}>{item}</span>)}
  </span>;
}

/** A sequence where the order is the information, not decoration. */
export function Steps({ className, ...props }: HTMLAttributes<HTMLOListElement>) {
  return <ol className={cx("k-steps", className)} {...props} />;
}

export function Step({ title, children, command }: { title: ReactNode; children?: ReactNode; command?: ReactNode }) {
  return <li>
    <h3>{title}</h3>
    {children ? <p>{children}</p> : null}
    {command ? <Command>{command}</Command> : null}
  </li>;
}
