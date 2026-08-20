import { randomBytes } from "node:crypto";
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";

const identityPath = "infra/compose/authentik/.env";
const identityExamplePath = "infra/compose/authentik/.env.example";
const portalPath = "apps/portal/.env";
const portalExamplePath = "apps/portal/.env.example";

function readEnvironment(text) {
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

function usable(value, minimum) {
  return Boolean(
    value &&
      value.length >= minimum &&
      !/replace-with|generate-|use-the-same/i.test(value),
  );
}

function setValue(text, name, value) {
  const line = `${name}=${value}`;
  const pattern = new RegExp(`^${name}=.*$`, "m");
  return pattern.test(text)
    ? text.replace(pattern, line)
    : `${text.replace(/\s*$/, "")}\n${line}\n`;
}

function source(path, examplePath) {
  return existsSync(path)
    ? readFileSync(path, "utf8")
    : readFileSync(examplePath, "utf8");
}

let identityText = source(identityPath, identityExamplePath);
let portalText = source(portalPath, portalExamplePath);
const identity = readEnvironment(identityText);
const portal = readEnvironment(portalText);

const pgPassword = usable(identity.PG_PASS, 32)
  ? identity.PG_PASS
  : randomBytes(32).toString("hex");
const authentikSecret = usable(identity.AUTHENTIK_SECRET_KEY, 50)
  ? identity.AUTHENTIK_SECRET_KEY
  : randomBytes(64).toString("hex");
const oidcSecret = usable(identity.KIMONO_PORTAL_OIDC_CLIENT_SECRET, 32)
  ? identity.KIMONO_PORTAL_OIDC_CLIENT_SECRET
  : usable(portal.AUTHENTIK_CLIENT_SECRET, 32)
    ? portal.AUTHENTIK_CLIENT_SECRET
    : randomBytes(32).toString("hex");
const sessionSecret = usable(portal.AUTH_SECRET, 32)
  ? portal.AUTH_SECRET
  : randomBytes(32).toString("hex");

identityText = setValue(identityText, "PG_PASS", pgPassword);
identityText = setValue(identityText, "AUTHENTIK_SECRET_KEY", authentikSecret);
identityText = setValue(
  identityText,
  "KIMONO_PORTAL_OIDC_CLIENT_SECRET",
  oidcSecret,
);
portalText = setValue(portalText, "AUTHENTIK_CLIENT_SECRET", oidcSecret);
portalText = setValue(portalText, "AUTH_SECRET", sessionSecret);

writeFileSync(identityPath, identityText, { mode: 0o600 });
writeFileSync(portalPath, portalText, { mode: 0o600 });
chmodSync(identityPath, 0o600);
chmodSync(portalPath, 0o600);

console.log("Local Authentik and Portal configuration is ready.");
