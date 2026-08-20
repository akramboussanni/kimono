"use client";

import { type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./cx";

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cx("button", className)} {...props} />;
}

export function Surface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("surface", className)} {...props} />;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

export function StatusDot({ status }: { status: "online" | "degraded" | "offline" | "setup" }) {
  return <span className={cx("status-dot", `status-${status}`)} aria-label={status} title={status} />;
}
