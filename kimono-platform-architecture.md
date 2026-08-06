# Kimono Platform Architecture

## Vision

Kimono is a unified self-hosted application ecosystem with one account, one visual language, and one central portal.

Examples:

- **Kimono Music**
- **Kimono Movies**
- **Kimono Photos**
- **Kimono Hosting**
- **Kimono Drive**
- **Kimono Notes**
- **Kimono Admin**

The goal is for every application to feel like part of one platform, similar to the way Google applications share accounts, navigation, branding, and design patterns.

---

## Core Principles

1. **One Kimono account**
   - Central authentication through Authentik or another OIDC provider.
   - Every application exposes a **Continue with Kimono** button.
   - Applications identify users using the immutable OIDC `sub` claim.

2. **One design system**
   - Shared components, typography, spacing, icons, colors, and interaction patterns.
   - Every first-party application uses the same application shell.

3. **One portal**
   - A central application launcher.
   - Recent activity, notifications, storage usage, shortcuts, and administration.

4. **Reuse strong existing backends**
   - Avoid rewriting mature media, photo, or hosting systems unless necessary.
   - Build the Kimono experience around them.

5. **Keep forks small**
   - Prefer adapters, plugins, themes, APIs, and custom frontends.
   - Only fork upstream projects when the required changes cannot be implemented cleanly another way.

6. **Be honest about integration depth**
   - Native apps use the Kimono shell and platform contract directly.
   - Maintained forks earn a native experience by integrating the same contract.
   - Headless integrations use Kimono frontends over mature engines.
   - Connected apps use SSO and branding without pretending to be native.
   - Iframes are an opt-in compatibility capability, not the platform shell.

7. **Mobile behavior starts on day one**
   - Every shared component and application shell must work as a touch-friendly responsive web interface.
   - A native mobile client can follow after the platform contract is proven.

---

## Identity and SSO

### Recommended flow

```text
User opens Kimono Music
        ↓
Redirect to accounts.kimono.example
        ↓
User signs in once
        ↓
OIDC callback returns to Kimono Music
        ↓
App matches the user using the OIDC `sub` claim
```

Each application has its own OIDC client:

```text
kimono-portal
kimono-music
kimono-photos
kimono-movies
kimono-hosting
kimono-admin
```

### User identity model

Every application may maintain its own local user row, but it should link it to the same Kimono identity.

```text
Kimono identity ID: 01K4P8...
Immich local user ID: 42
Jellyfin local user ID: 7
Music local user ID: 19
```

The permanent link is the OIDC `sub` value, not the email address.

### What Authentik handles

- Login
- Passwords and passkeys
- MFA
- Account recovery
- User sessions
- Groups
- OIDC tokens
- Disabling accounts centrally

### What Kimono handles

- Product-specific permissions
- Application access
- Shared profile data
- Navigation
- Notifications
- Storage quotas
- Billing, if added later
- Cross-application administration

---

## Shared UX

Every Kimono application should use the same shell:

```text
┌─────────────────────────────────────────────────────┐
│ Kimono Music                  Search       ▦   User │
├─────────────────────────────────────────────────────┤
│ Sidebar                                             │
│                                                     │
│                 Application content                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Shared elements:

- Top navigation
- Application launcher
- Account menu
- Sidebar behavior
- Search field
- Notifications
- Buttons
- Forms
- Modals
- Settings pages
- Loading states
- Empty states
- Error pages
- Dark and light themes

Shared UX does not require every application to live inside the portal document.
Applications should normally own their full page and consume the Kimono shell.
Normal navigation between independently deployed apps is preferable to a
permanent iframe because it preserves deep links, browser behavior, downloads,
fullscreen media, accessibility, and application-level security policies.

### Application integration levels

```text
Native       Kimono owns the app and its interface
Headless     Kimono owns the interface; an existing engine owns core processing
Fork         Kimono maintains upstream code with the shared shell integrated
Connected    The app uses SSO and available branding hooks
Link-only    The portal launches an external service without claiming integration
```

Each registered application should state its integration level. A connected app
must not be presented as fully native merely because it can be placed in a frame.

---

## Kimono Music Strategy

### Recommended approach

Use **Navidrome as the backend** and build a custom Kimono Music client.

```text
Kimono Music
├── Custom frontend
├── Kimono UI system
├── Kimono authentication
├── Kimono navigation
└── Navidrome backend and APIs
```

This gives Kimono:

- A fully custom interface
- Consistent UX with the rest of the platform
- Mature music scanning and metadata support
- Transcoding
- Playlist support
- Existing Subsonic-compatible APIs
- Easier upstream updates

### Avoid a heavy fork initially

Prefer this order:

1. Custom frontend against Navidrome APIs
2. Small integration service if needed
3. Small backend patches
4. Full fork only as a last resort

Music servers contain a lot of hidden complexity:

- Metadata parsing
- Album artist handling
- Compilations
- Transcoding
- ReplayGain
- Lyrics
- Scrobbling
- Smart playlists
- Gapless playback
- Codec support
- Caching
- Large library scanning

Reusing Navidrome avoids rebuilding all of that.

---

## Platform Architecture

```text
                    accounts.kimono.example
                           Authentik
                               │
                              OIDC
                               │
        ┌──────────────┬───────┼──────────┬──────────────┐
        │              │       │          │              │
 home.kimono      music.kimono photos.kimono movies.kimono hosting.kimono
    Portal          Custom      Immich      Jellyfin       Pelican
                    client
                       │
                  Navidrome
```

Recommended infrastructure:

- **Reverse proxy:** Caddy or Traefik
- **Identity:** Authentik
- **Database:** PostgreSQL
- **Cache / queues:** Redis only where needed
- **Object storage:** S3-compatible storage if the platform grows
- **Internal APIs:** REST or ConnectRPC/gRPC
- **Frontend:** React, Next.js, or another framework used consistently
- **Backend:** Go is a strong fit for Kimono services

---

## Recommended Repository Architecture

A monorepo is the simplest approach while the platform is young.

```text
kimono/
├── apps/
│   ├── portal/
│   │   ├── web/
│   │   └── api/
│   ├── music/
│   │   ├── web/
│   │   └── gateway/
│   ├── admin/
│   │   ├── web/
│   │   └── api/
│   ├── notifications/
│   └── search/
│
├── packages/
│   ├── ui/
│   ├── icons/
│   ├── auth-client/
│   ├── app-shell/
│   ├── config/
│   ├── api-client/
│   └── types/
│
├── services/
│   ├── identity-sync/
│   ├── app-registry/
│   ├── provisioning/
│   ├── notifications/
│   ├── search-indexer/
│   └── gateway/
│
├── integrations/
│   ├── navidrome/
│   ├── immich/
│   ├── jellyfin/
│   ├── pelican/
│   └── authentik/
│
├── forks/
│   ├── README.md
│   └── patches/
│       ├── jellyfin/
│       ├── immich/
│       └── pelican/
│
├── sdk/
│   ├── go/
│   ├── typescript/
│   └── protocol/
│
├── infra/
│   ├── compose/
│   ├── kubernetes/
│   ├── caddy/
│   ├── authentik/
│   ├── postgres/
│   └── monitoring/
│
├── docs/
│   ├── architecture/
│   ├── design-system/
│   ├── integrations/
│   ├── security/
│   └── decisions/
│
├── scripts/
├── .github/
├── go.work
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

---

## Important Repository Rules

### `apps/`

Contains user-facing Kimono applications.

Examples:

- Portal
- Music frontend
- Admin dashboard
- Search interface

### `packages/`

Contains shared frontend code.

The most important package is:

```text
@kimono/ui
```

Suggested exports:

```text
AppShell
TopBar
Sidebar
AppLauncher
AccountMenu
Button
Card
Dialog
Input
DataTable
EmptyState
ErrorState
ThemeProvider
```

### `services/`

Contains Kimono-owned backend services.

Examples:

- App registry
- User provisioning
- Shared notifications
- Unified search
- Identity synchronization

### `integrations/`

Contains adapters for third-party software.

An integration should hide upstream-specific details from the rest of Kimono.

Example interface:

```go
type AppIntegration interface {
    CreateUser(ctx context.Context, user KimonoUser) error
    DisableUser(ctx context.Context, userID string) error
    SyncProfile(ctx context.Context, user KimonoUser) error
    Health(ctx context.Context) error
}
```

### `forks/`

Do not place entire upstream repositories directly inside the main monorepo unless necessary.

Prefer storing:

- Patch files
- Fork documentation
- Upstream commit references
- Rebase instructions
- Branding changes

Large forks should usually remain separate repositories under the same organization.

Example:

```text
github.com/kimono-platform/jellyfin
 github.com/kimono-platform/immich
 github.com/kimono-platform/pelican
```

### `sdk/`

The Kimono SDK should provide shared platform capabilities.

Potential API:

```go
kimono.CurrentUser(ctx)
kimono.HasPermission(ctx, "music.admin")
kimono.Notify(ctx, userID, notification)
kimono.GetQuota(ctx, userID)
kimono.OpenAppURL("photos")
kimono.Search(ctx, query)
```

The TypeScript SDK should provide equivalent browser and server APIs.

---

## App Registry

Kimono should maintain a central registry of applications.

Example:

```json
{
  "id": "music",
  "name": "Kimono Music",
  "description": "Stream your music library",
  "icon": "music",
  "url": "https://music.kimono.example",
  "requiredPermission": "music.access",
  "statusEndpoint": "/health"
}
```

The portal uses the registry to render the application launcher and determine which applications a user can access.

---

## Suggested Development Phases

### Phase 1 — Foundation

- Deploy Authentik
- Create the Kimono organization and branding
- Build the portal
- Build `@kimono/ui`
- Build the Kimono app launcher
- Add OIDC authentication to the portal

### Phase 2 — Kimono Music

- Deploy Navidrome
- Build the custom music frontend
- Add Kimono authentication
- Add automatic user provisioning
- Add the shared Kimono app shell

### Phase 3 — Existing applications

- Integrate Immich
- Integrate Jellyfin
- Integrate Pelican
- Add branding and launcher links
- Add provisioning adapters

### Phase 4 — Platform services

- Shared notifications
- Unified search
- Storage quotas
- Application health dashboard
- User and role management

### Phase 5 — Deep ecosystem integration

- Cross-application search
- Shared activity feed
- Central billing
- Mobile application
- Desktop application
- Shared file picker
- Shared media picker

---

## Recommended Initial Stack

```text
Frontend:          React + TypeScript
Monorepo tooling:  pnpm + Turborepo
Backend:           Go
Identity:          Authentik
Database:          PostgreSQL
Reverse proxy:     Caddy
Music backend:     Navidrome
API format:        REST initially
Deployment:        Docker Compose initially
Observability:     Prometheus + Grafana later
```

Keep the first version simple. Avoid Kubernetes, event buses, and microservice-heavy architecture until the platform actually needs them.

---

## Final Recommendation

Start Kimono as a modular monorepo with:

- One shared design system
- One portal
- One identity provider
- One application registry
- Small adapters around third-party applications
- A custom Kimono Music frontend backed by Navidrome
- Separate repositories only for large upstream forks

The key is to own the **experience and platform layer** while reusing mature backend systems wherever possible.
