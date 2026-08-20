/**
 * 型 Kata — Kimono's design system.
 *
 * This file is a table of contents and nothing else. Every component lives in
 * the module named for the part of the system it belongs to, and the CSS that
 * styles it sits beside it in `styles/`.
 *
 * See docs/design-system.md for the contract these implement.
 */

export { cx } from "./cx";

/* Identity — an app is a name and one accent; the rest is derived. */
export * from "./accent";
export * from "./bloom";
export * from "./glyphs";
export * from "./app-identity";

/* The three primitives. Everything interactive is one of these. */
export * from "./door";
export * from "./joint";
export * from "./seal";

/* Surfaces and the things that go inside them. */
export * from "./tray";
export * from "./rows";
export * from "./form";

/* Crossings — the press is the page change. */
export * from "./crossing";

/* Pre-system leftovers, kept until their callers are converted. */
export * from "./surface";
