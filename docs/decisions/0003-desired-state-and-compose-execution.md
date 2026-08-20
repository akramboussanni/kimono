# ADR 0003: File-backed definitions and desired-state deployment

- Status: Accepted
- Date: 2026-08-16

## Context

Kimono must support simple containers and multi-service applications such as
Outline, which requires a web process, PostgreSQL, Redis, persistent storage,
identity configuration, and backup policy. The server may expose apps through
multiple tunnels. Cloudflare is the initial provider but cannot be a permanent
assumption in the application model. Client nodes are consumers of the cloud
system and are unrelated to workload placement.

A panel that constructs arbitrary stacks would be difficult to audit and would
eventually become an incomplete Compose editor. Conversely, a single static
server Compose file cannot represent administrator-selected apps, routes,
network isolation, or additional application definitions.

## Decision

Kimono separates four layers:

1. An `AppDefinition` directory contains `app.json` and an SVG center glyph.
   It declares services, endpoints, volumes, configurable environment, managed
   environment, and the default network policy.
2. Portal desired state persists app instances, tunnel instances, and
   routes as independent resources. Filesystem definitions layer over baked
   definitions and are revalidated on demand.
3. The control plane renders one versioned server `DeploymentPlan`. It
   contains a deterministic Compose document, generated provider files,
   provider-side route actions, warnings, and secret references—not secret
   values.
4. The server reconciler validates the plan before Docker Compose applies the
   `kimono-apps` project, separate from bootstrap control-plane services.

Every app receives its own network. An app with outbound access disabled uses
an internal Docker network. Only a service owning a routed endpoint also joins
`kimono-edge`; databases, caches, and other internal services do not. Each
tunnel instance renders its own connector on the server. The provider
registry selects the renderer; Cloudflare is merely the first entry.

The server's checked-in Compose definition remains the bootstrap mechanism for
Portal, identity, mesh, and their required state. Generated application Compose
is the normal execution format, not the source of app configuration.

## Consequences

- Complex custom app creation stays file-backed and reviewable.
- Routine instance configuration remains accessible in the Admin portal.
- Multiple tunnels of one provider can coexist and routes can move between
  them without modifying app definitions.
- Compose retains mature lifecycle, volume, and dependency behavior without
  making static Compose files the control plane database.
- Client nodes remain part of mesh enrollment and access policy only; they do
  not receive Compose plans, tunnel credentials, or application secrets.
