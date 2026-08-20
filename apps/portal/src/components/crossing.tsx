"use client";

import { CrossingProvider, useCrossing, type CrossingKind } from "@kimono/ui";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

export { CrossingProvider };

/**
 * A link that crosses rather than navigates. Which crossing you get is decided
 * by how far you are going, never by taste — see docs/design-system.md.
 *
 *   hanafubuki  leaving Kimono for an app, or moving between apps
 *   shoji       passing through a door you operated
 *   kakejiku    page to page inside one surface
 */
/** One place that knows how to leave. */
export function useCrossTo() {
  const cross = useCrossing();
  const router = useRouter();
  return (kind: CrossingKind, href: string, external = false) =>
    cross(kind, () => {
      if (external) window.location.assign(href);
      else router.push(href);
    });
}

export function Crossing({ href, kind, external = false, children, className, ...rest }: {
  href: string;
  kind: CrossingKind;
  external?: boolean;
  children: ReactNode;
  className?: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const crossTo = useCrossTo();

  return <a
    href={href}
    className={className}
    onClick={(event: MouseEvent<HTMLAnchorElement>) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      crossTo(kind, href, external);
    }}
    {...rest}
  >{children}</a>;
}
