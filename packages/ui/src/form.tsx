"use client";

import { type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./cx";

/** A labelled control. The label is the only uppercase in the system. */
export function Field({ label, children, className }: { label: ReactNode; children: ReactNode; className?: string }) {
  return <label className={cx("k-field", className)}><span>{label}</span>{children}</label>;
}

/** A form inside a compartment. After a list, it seams itself off. */
export function Form({ afterRows = false, className, ...props }: { afterRows?: boolean } & HTMLAttributes<HTMLFormElement> & { action?: unknown }) {
  return <form className={cx("k-form", afterRows && "k-after-rows", className)} {...props as HTMLAttributes<HTMLFormElement>} />;
}

/** Where a form's seals sit. */
export function FormActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("k-form-actions", className)} {...props} />;
}
