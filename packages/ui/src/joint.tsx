"use client";

import { useRef, useState, type ButtonHTMLAttributes } from "react";
import { cx } from "./cx";

export type JointProfile = "ari" | "hozo" | "aikaki";

/**
 * 継手 Joint — the only switch in the system. Apart is off, seated is on.
 *
 * The profile is a promise about the setting, not decoration: `ari` (dovetail)
 * cannot be drawn back out the way it went in, so it suits something meant to
 * stay on; `aikaki` (half-lap) merely overlaps, so it suits something you
 * expect to flip often.
 */
export function Joint({ checked, onChange, label, profile = "ari", onText = "ON", offText = "OFF", className, ...rest }: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  profile?: JointProfile;
  onText?: string;
  offText?: string;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange">) {
  const [phase, setPhase] = useState<"" | "k-seating" | "k-parting">("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return <span className="k-joint-field">
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={cx("k-joint", `k-${profile}`, phase, className)}
      onClick={() => {
        if (phase) return;
        const next = !checked;
        setPhase(next ? "k-seating" : "k-parting");
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setPhase(""), next ? 580 : 400);
        onChange(next);
      }}
      {...rest}
    >
      <span className="k-pc k-pc-a">{checked ? onText : offText}</span>
      <span className="k-pc k-pc-b" />
      <span className="k-burst" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
    </button>
    <span className="k-label">{label}</span>
  </span>;
}
