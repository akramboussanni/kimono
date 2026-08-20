import "server-only";

import { join } from "node:path";

const productionRoot = "/var/lib/kimono-portal";
const developmentRoot = "/tmp/kimono-portal";

export const stateDir = process.env.KIMONO_STATE_DIR || (process.env.NODE_ENV === "production" ? productionRoot : developmentRoot);
export const settingsPath = join(stateDir, "settings.json");
export const secretsPath = join(stateDir, "secrets.json");
export const deploymentDir = join(stateDir, "deployment");
export const planPath = join(deploymentDir, "plan.json");
export const planSecretsPath = join(deploymentDir, "secrets.env");

/**
 * The connector image runs as a non-root user and cannot read the 0600 login
 * credentials the Portal owns. A group/world-readable copy lives inside the
 * 0700 deployment directory, so only a container that mounts the file directly
 * can see it.
 */
export function tunnelCredentialsPath(tunnelId: string) {
  return join(deploymentDir, `tunnel-${tunnelId}.json`);
}

/** Pre-1.0 layout wrote settings beside the state directory rather than inside it. */
export const legacySettingsPath = process.env.NODE_ENV === "production" ? join(productionRoot, "settings.json") : "/tmp/kimono-portal-settings.json";
