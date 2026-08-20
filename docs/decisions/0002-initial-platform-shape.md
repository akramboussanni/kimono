# ADR 0002: Start with a small platform kernel

- Status: Superseded by ADR 0003
- Date: 2026-08-04

## Context

The architecture vision includes many eventual services. Implementing search,
notifications, provisioning, multiple SDKs, and orchestration before shipping a
single application would create boundaries without evidence.

## Decision

The first Kimono workspace contains:

- one Next.js application for Portal and `/admin`
- one shared UI package
- one small TypeScript app contract
- a local registry until persistence and authentication are selected
- room for Docker Compose infrastructure without prematurely adding it

The monorepo contains Kimono-owned code. Large upstream forks can remain separate
repositories while consuming versioned Kimono packages. Small first-party apps
may live in this workspace and remain independently deployable.

Authentication will be integrated through a provider-neutral adapter. The
identity provider owns credentials and sessions; Kimono owns household profile,
role, application access, and upstream account mappings.

## Consequences

- The initial screens use representative in-memory data and are not an
  authentication or persistence implementation.
- Admin stays inside Portal until it has a reason to deploy independently.
- A real small tool should become the reference application before platform
  services such as notifications or unified search are introduced.
