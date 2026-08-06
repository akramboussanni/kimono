# Kimono identity development stack

This stack follows Authentik's supported small-installation Compose shape and is
pinned to `2026.5.6`. It intentionally omits the Docker socket mount from the
official template. Native OIDC does not require an outpost, and the identity
worker should not control the Docker daemon by default.

## Configure

```bash
cp infra/compose/authentik/.env.example infra/compose/authentik/.env
openssl rand -base64 36
openssl rand -base64 60
openssl rand -hex 32
```

Put the three generated values in `PG_PASS`, `AUTHENTIK_SECRET_KEY`, and
`KIMONO_PORTAL_OIDC_CLIENT_SECRET`. Keep the generated `.env` private.
Copy `KIMONO_PORTAL_OIDC_CLIENT_SECRET` into the Portal's
`AUTHENTIK_CLIENT_SECRET`, and generate a separate `AUTH_SECRET` for the Portal.

Verify that no example credentials remain:

```bash
pnpm identity:check
```

## Start

```bash
pnpm identity:up
```

Open `http://localhost:9000/if/flow/initial-setup/` and set the initial `akadmin`
password. This bootstrap screen is the only Authentik interface a normal Kimono
owner should need. Routine user management will eventually call Authentik's API
through Kimono Admin.

The mounted blueprint automatically creates a confidential OIDC application for
the Portal. Its development callback is:

```text
http://localhost:3000/api/auth/callback/authentik
```

The provider uses a provider-specific issuer because Auth.js validates that the
discovered `issuer` exactly matches `AUTHENTIK_ISSUER`, including its trailing
slash. Kimono still correlates users across applications through Authentik's
immutable user UUID subject.

## Production notes

- Replace every development URL with the final HTTPS domain.
- Back up the PostgreSQL volume and test restoration.
- Configure email before relying on account recovery.
- Put Authentik behind the same reverse proxy as the other Kimono services.
- Add an outpost only for applications that cannot speak OIDC. If automatic
  outpost deployment is needed, use a constrained Docker socket proxy rather
  than mounting the daemon socket directly.
