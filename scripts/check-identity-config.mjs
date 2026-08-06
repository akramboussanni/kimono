import { readFileSync } from "node:fs";

function readEnv(path) {
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

const identity = readEnv("infra/compose/authentik/.env");
const portal = readEnv("apps/portal/.env");
const failures = [];

for (const [name, minimum] of [
  ["PG_PASS", 32],
  ["AUTHENTIK_SECRET_KEY", 50],
  ["KIMONO_PORTAL_OIDC_CLIENT_SECRET", 32],
]) {
  const value = identity[name] ?? "";
  if (value.length < minimum || /replace-with|generate-|use-the-same/i.test(value)) {
    failures.push(`${name} is still a placeholder or is too short`);
  }
}

for (const [name, minimum] of [["AUTH_SECRET", 32]]) {
  const value = portal[name] ?? "";
  if (value.length < minimum || /replace-with|generate-|use-the-same/i.test(value)) {
    failures.push(`${name} is still a placeholder or is too short`);
  }
}

if (portal.AUTHENTIK_CLIENT_SECRET !== identity.KIMONO_PORTAL_OIDC_CLIENT_SECRET) {
  failures.push("Portal and Authentik OIDC client secrets do not match");
}

if (failures.length) {
  console.error("Kimono identity configuration is not ready:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Kimono identity configuration looks ready.");
}
