"use client";

import { type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cx } from "./cx";

export type SealState = "running" | "private" | "wants" | "quiet";

export type SealTone = "primary" | "quiet" | "danger";

/** 判 Seal — commits an action. */
export function Seal({ tone = "primary", className, ...props }: { tone?: SealTone } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={cx("k-seal", tone !== "primary" && `k-tone-${tone}`, className)} {...props} />;
}

/** The same seal, when the action is a destination rather than a submit. */
export function SealLink({ tone = "primary", className, ...props }: { tone?: SealTone } & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a className={cx("k-seal", tone !== "primary" && `k-tone-${tone}`, className)} {...props} />;
}

/** The same seal, stamped rather than pressed: it states a fact. */
export function StatedSeal({ state = "quiet", children, className }: { state?: SealState; children: ReactNode; className?: string }) {
  return <span className={cx("k-seal", "k-stated", state !== "quiet" && `k-${state}`, className)}>{children}</span>;
}

/* ── 組 Kumi — composition. One frame per region; frames never nest. ── */

/** The single framed boundary of a workspace. Never place one inside another. */
