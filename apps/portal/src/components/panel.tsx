import { Compartment, Tray } from "@kimono/ui";
import type { ReactNode } from "react";

/**
 * The admin panel composition, as components that enforce it.
 *
 * Kimono's admin pages settled what a panel is: a section heading, then a 盆
 * tray whose compartments share one frame and one seam, each holding a copy
 * block and at most one seal. Every page that rebuilt that from `Tray`,
 * `Compartment` and hand-written markup drifted — one got the frame, another
 * the seams, a third neither.
 *
 * So `Panel` is not a convenience over those parts; it renders the compartment
 * *and* its body together, and pages never touch `Tray`, `Compartment` or the
 * body markup again. A page that reaches past these is visibly wrong on screen:
 * a compartment outside a tray has no frame and no seams.
 */

/** A tray of panels. A panel belongs in one; alone it has no frame or seams. */
export function Panels({ children }: { children: ReactNode }) {
  return <Tray className="connection-tray">{children}</Tray>;
}

/**
 * One panel: its tab, what it is, and at most one thing you can do about it.
 * `state` is a stated seal beside the title — never a second action.
 */
export function Panel({ label, title, state, wants = false, children, action }: {
  /** The vertical tab. Keep it short; it sets the panel's height. */
  label: string;
  title: ReactNode;
  state?: ReactNode;
  /** Marks a panel that needs your hands. Nothing else earns the accent. */
  wants?: boolean;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return <Compartment label={label} wants={wants}>
    <div className="connection-body">
      <div className="connection-body-copy">
        <span className="connection-name"><h3>{title}</h3>{state}</span>
        {children}
      </div>
      {action}
    </div>
  </Compartment>;
}

/** A panel whose body is a form: the fields on the left, its seal on the right. */
export function PanelForm({ label, title, action, children, submit }: {
  label: string;
  title: ReactNode;
  action: (form: FormData) => void | Promise<void>;
  children?: ReactNode;
  submit: ReactNode;
}) {
  return <Compartment label={label}>
    <form className="connection-body" action={action}>
      <div className="connection-body-copy">
        <span className="connection-name"><h3>{title}</h3></span>
        {children}
      </div>
      {submit}
    </form>
  </Compartment>;
}

/** The body of a page: sections stacked down the workspace. */
export function Workspace({ children }: { children: ReactNode }) {
  return <main className="connectivity-workspace">{children}</main>;
}

/** A section's heading, with an optional count or aside on the right. */
export function SectionHeading({ title, description, meta }: {
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
}) {
  return <header className="workspace-section-heading">
    <div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>
    {meta ? <span>{meta}</span> : null}
  </header>;
}

/** What a workspace shows before anything exists. */
export function PanelEmpty({ title, children, action }: {
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return <div className="connectivity-empty">
    <h2>{title}</h2>
    {children ? <p>{children}</p> : null}
    {action}
  </div>;
}
