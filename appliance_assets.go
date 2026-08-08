package kimono

import "embed"

// ApplianceFiles contains the production server definition and the shared
// visual assets required by `kimono server install`.
//
//go:embed infra/compose/server/compose.yml infra/compose/server/Caddyfile infra/compose/server/.env.example infra/compose/server/authentik/blueprints/* infra/compose/server/authentik/certs/.gitkeep infra/compose/server/authentik/custom-templates/.gitkeep infra/compose/server/headscale/* infra/compose/server/scripts/* apps/portal/public/art/sakura-branch-v2.png apps/portal/public/kimono-sakura-mark.svg
var ApplianceFiles embed.FS
