# ADR 0004: Portal-driven reconciliation

- Status: Accepted
- Date: 2026-08-18

## Context

ADR 0003 defined four layers and left the fourth — the server reconciler —
unbuilt. The Portal rendered a `DeploymentPlan` and displayed it, but nothing
applied it: an app enabled in the Admin portal never started, and its hostname
never received a DNS record. Kimono Notes shipped instead as static services in
the bootstrap Compose file, which contradicted the model in ADR 0003 and could
not represent an administrator-selected app.

Administrators must never need a terminal to run their platform. That rules out
a reconciler an administrator invokes, and a systemd unit is only a partial
answer because it still lives outside the product the administrator sees.

The Portal is an authenticated web application. Granting it the Docker socket
would make every Portal vulnerability a host compromise.

## Decision

The Portal publishes desired state as files and never executes deployments. On
every settings change it writes `plan.json` and a 0600 `secrets.env` into its
state directory, and it republishes at boot so a fresh container converges.

A `reconciler` sidecar owns execution. It watches the published plan, validates
it, materializes the Compose project and generated files, applies the
`kimono-apps` project, installs generated Authentik blueprints for connected
apps, and performs provider route actions. It writes `status.json`, which the
Portal reads and displays. Only this container receives the Docker socket, it
serves no traffic, and it accepts no request input.

Validation is part of the trust boundary rather than a formality. The
reconciler rejects a plan that targets another Compose project, names an image
that is not a plain reference, mounts an undeclared volume, escapes the project
directory, or names a provider it does not implement.

Applications leave the bootstrap Compose file. It bootstraps identity, mesh,
the Portal, and the reconciler; everything else is plan-managed.

## Consequences

- Enabling an app in the Portal deploys it, including its DNS record and its
  single sign-on client.
- The web application stays unprivileged; container execution is isolated in a
  component with no network surface.
- The plan is inert data, so it can be inspected, diffed, and validated before
  anything runs.
- Generated blueprints and Compose files are owned by the reconciler. Editing
  them by hand is pointless: the next reconcile overwrites them.
- `kimono server apply` remains as a recovery path, not an administration step.
