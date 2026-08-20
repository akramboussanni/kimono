/**
 * Kimono VPN reads the mesh through Headscale's HTTP API rather than shelling
 * into the container, so the Portal needs no privileges beyond an API key.
 *
 * Headscale signs people in through the same identity provider as the Portal,
 * so a node's user record and a Portal session describe the same person. The
 * match is made on email first and falls back to the login name.
 */

export type MeshDevice = {
  id: string;
  name: string;
  addresses: string[];
  online: boolean;
  lastSeen: string | null;
  expiry: string | null;
  tags: string[];
  /** Service identities are tagged by the server; people's devices are not. */
  managed: boolean;
  owner: { name: string; email: string; displayName: string };
};

export type MeshReading =
  | { available: true; devices: MeshDevice[] }
  | { available: false; reason: string };

type HeadscaleUser = { id?: string; name?: string; displayName?: string; email?: string };
type HeadscaleNode = {
  id?: string;
  name?: string;
  givenName?: string;
  user?: HeadscaleUser;
  ipAddresses?: string[];
  lastSeen?: string;
  expiry?: string;
  online?: boolean;
  validTags?: string[];
  forcedTags?: string[];
};

function endpoint() {
  return (process.env.KIMONO_MESH_API_URL || "http://headscale:8080").replace(/\/+$/, "");
}

/** An expiry Headscale has never set comes back as the zero time. */
function timestamp(value: string | undefined) {
  if (!value || value.startsWith("0001-01-01")) return null;
  return value;
}

function toDevice(node: HeadscaleNode): MeshDevice {
  const tags = [...new Set([...(node.forcedTags || []), ...(node.validTags || [])])];
  const user = node.user || {};
  return {
    id: node.id || node.name || "",
    name: node.givenName?.trim() || node.name || "Unnamed device",
    addresses: node.ipAddresses || [],
    online: Boolean(node.online),
    lastSeen: timestamp(node.lastSeen),
    expiry: timestamp(node.expiry),
    tags,
    managed: tags.some((tag) => tag.startsWith("tag:kimono-")),
    owner: {
      name: user.name || "",
      email: user.email || "",
      displayName: user.displayName?.trim() || user.name || "",
    },
  };
}

export async function readMesh(): Promise<MeshReading> {
  const key = process.env.KIMONO_MESH_API_KEY;
  if (!key) return { available: false, reason: "Kimono VPN is not connected to the mesh yet." };
  try {
    const response = await fetch(`${endpoint()}/api/v1/node`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (response.status === 401 || response.status === 403) {
      return { available: false, reason: `The mesh rejected Kimono's API key (${response.status}). Run \`sudo kimono server repair\` to mint a new one.` };
    }
    if (!response.ok) return { available: false, reason: `The mesh replied ${response.status}.` };
    const payload = await response.json() as { nodes?: HeadscaleNode[] };
    return { available: true, devices: (payload.nodes || []).map(toDevice) };
  } catch {
    return { available: false, reason: "The mesh did not answer. It may still be starting." };
  }
}

/** A person's own devices: matched on email, then on login name. */
export function devicesFor(devices: MeshDevice[], person: { email?: string | null; username: string }) {
  const email = person.email?.trim().toLowerCase();
  const username = person.username.trim().toLowerCase();
  return devices.filter((device) => {
    if (device.managed) return false;
    if (email && device.owner.email.toLowerCase() === email) return true;
    return Boolean(username) && device.owner.name.toLowerCase() === username;
  });
}

/** Everyone Headscale knows, so an administrator can see the whole mesh. */
export function groupByOwner(devices: MeshDevice[]) {
  const people = new Map<string, { label: string; devices: MeshDevice[] }>();
  for (const device of devices) {
    const key = device.owner.email || device.owner.name || "unknown";
    const label = device.owner.displayName || device.owner.name || device.owner.email || "Unclaimed";
    const entry = people.get(key) || { label, devices: [] };
    entry.devices.push(device);
    people.set(key, entry);
  }
  return [...people.values()].sort((a, b) => a.label.localeCompare(b.label));
}

/** "3 minutes ago" without pulling in a date library for one string. */
export function describeLastSeen(device: MeshDevice) {
  if (device.online) return "Connected now";
  if (!device.lastSeen) return "Never connected";
  const seen = Date.parse(device.lastSeen);
  if (Number.isNaN(seen)) return "Last seen recently";
  const minutes = Math.max(1, Math.round((Date.now() - seen) / 60000));
  if (minutes < 60) return `Last seen ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Last seen ${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `Last seen ${days} day${days === 1 ? "" : "s"} ago`;
}

async function meshRequest(path: string, init?: RequestInit) {
  const key = process.env.KIMONO_MESH_API_KEY;
  if (!key) throw new Error("Kimono is not connected to the mesh yet.");
  const response = await fetch(`${endpoint()}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`The mesh replied ${response.status} to ${path}.`);
  return response.json() as Promise<Record<string, unknown>>;
}

/**
 * Mints an enrolment key for the person asking.
 *
 * Adding your own laptop should not require someone else to open a root shell.
 * The Portal already holds a mesh credential, and it only ever mints a key for
 * the account making the request — single-use, short-lived, and scoped to that
 * person's own devices.
 */
export async function createEnrolmentKey(person: { username: string; email?: string | null }): Promise<
  { key: string; expiresAt: string } | { error: string }
> {
  const owner = person.username.toLowerCase();
  try {
    /* Headscale creates a user at first sign-in; a person adding their first
       device may not have one yet. */
    const listed = await meshRequest(`/api/v1/user?name=${encodeURIComponent(owner)}`);
    const users = (listed.users as Array<{ name?: string }> | undefined) || [];
    if (!users.some((user) => user.name === owner)) {
      await meshRequest("/api/v1/user", { method: "POST", body: JSON.stringify({ name: owner }) });
    }
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const minted = await meshRequest("/api/v1/preauthkey", {
      method: "POST",
      body: JSON.stringify({ user: owner, reusable: false, ephemeral: false, expiration: expiresAt }),
    });
    const preAuthKey = minted.preAuthKey as { key?: string; expiration?: string } | undefined;
    if (!preAuthKey?.key) return { error: "The mesh did not return a key." };
    return { key: preAuthKey.key, expiresAt: preAuthKey.expiration || expiresAt };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "The key could not be created." };
  }
}
