import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { stateDir } from "./state";

/**
 * Who Kimono has seen sign in.
 *
 * Granting Kimono VPN needs a real account to point at, and the identity
 * provider already tells Kimono who someone is at sign-in. Recording that is
 * enough to offer a proper picker, and it costs no API token and no extra
 * permission on the identity provider — which is the whole point of an
 * appliance that should not hold more privilege than it needs.
 */
export type Account = {
  username: string;
  name: string;
  email: string;
  lastSeen: string;
};

/** The Authentik group that carries Kimono VPN access. */
export const meshGroup = "kimono-vpn";
/** The user attribute holding who that person has invited into their mesh. */
export const meshGuestsAttribute = "kimono_vpn_guests";

export type MeshMember = {
  username: string;
  displayName: string;
  guests: string[];
};

const directoryPath = join(stateDir, "directory.json");

export async function listAccounts(): Promise<Account[]> {
  try {
    const parsed = JSON.parse(await readFile(directoryPath, "utf8")) as { accounts?: unknown };
    if (!parsed.accounts || typeof parsed.accounts !== "object") return [];
    return Object.values(parsed.accounts as Record<string, Account>)
      .filter((account) => account && typeof account.username === "string" && account.username)
      .sort((a, b) => (a.name || a.username).localeCompare(b.name || b.username));
  } catch {
    return [];
  }
}

type IdentityUser = {
  pk?: number;
  username?: string;
  name?: string;
  email?: string;
  is_active?: boolean;
  type?: string;
  groups?: string[];
  groups_obj?: Array<{ name?: string }>;
  attributes?: Record<string, unknown>;
};

function identityEndpoint() {
  return (process.env.KIMONO_IDENTITY_API_URL || "http://authentik-server:9000").replace(/\/+$/, "");
}

async function identityRequest(path: string, init?: RequestInit) {
  const token = process.env.KIMONO_IDENTITY_API_TOKEN;
  if (!token) throw new Error("Kimono cannot reach the account directory yet.");
  const response = await fetch(`${identityEndpoint()}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    throw new Error(response.status === 401 || response.status === 403
      ? `The identity provider refused Kimono's directory token (${response.status}). Run \`sudo kimono server repair\`.`
      : `The identity provider replied ${response.status} to ${path}.`);
  }
  return response;
}

function guestsOf(user: IdentityUser): string[] {
  const raw = user.attributes?.[meshGuestsAttribute];
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((item): item is string => typeof item === "string" && item !== user.username))];
}

async function fetchPeople(): Promise<IdentityUser[]> {
  const response = await identityRequest("/api/v3/core/users/?page_size=500&include_groups=true");
  const payload = await response.json() as { results?: IdentityUser[] };
  return (payload.results || []).filter((user) =>
    Boolean(user.username) && user.is_active !== false && user.type !== "service_account" && user.type !== "internal_service_account");
}

/**
 * Kimono VPN membership lives in the identity provider, not in Kimono's own
 * settings: it is an entitlement on an account, and duplicating it here would
 * let the two drift. Access is the `kimono-vpn` group; the people a member has
 * invited are an attribute on that member.
 */
export async function readMeshMembers(): Promise<Record<string, MeshMember>> {
  const members: Record<string, MeshMember> = {};
  const people = await fetchPeople();
  const granted = people.filter((user) => (user.groups_obj || []).some((group) => group.name === meshGroup));
  for (const user of granted) {
    const username = (user.username as string).toLowerCase();
    members[username] = {
      username,
      displayName: user.name?.trim() || username,
      guests: guestsOf(user),
    };
  }
  /* An invitation to somebody without access cannot become a policy rule. */
  for (const member of Object.values(members)) {
    member.guests = member.guests.filter((guest) => members[guest]);
  }
  return members;
}

async function findUser(username: string): Promise<IdentityUser> {
  const response = await identityRequest(`/api/v3/core/users/?username=${encodeURIComponent(username)}&include_groups=true`);
  const payload = await response.json() as { results?: IdentityUser[] };
  const user = (payload.results || []).find((item) => item.username?.toLowerCase() === username.toLowerCase());
  if (!user?.pk) throw new Error(`${username} is not an account on this Kimono`);
  return user;
}

async function meshGroupId(): Promise<string> {
  const response = await identityRequest(`/api/v3/core/groups/?name=${encodeURIComponent(meshGroup)}`);
  const payload = await response.json() as { results?: Array<{ pk?: string; name?: string }> };
  const group = (payload.results || []).find((item) => item.name === meshGroup);
  if (!group?.pk) throw new Error("The Kimono VPN group is missing. Run `sudo kimono server repair`.");
  return group.pk;
}

export async function setMeshAccess(username: string, granted: boolean) {
  const user = await findUser(username);
  const group = await meshGroupId();
  // Written from the user rather than through the group's add_user endpoint:
  // Authentik checks change_group against the group object, so a global grant
  // never satisfies it, while change_user is checked globally.
  const current = user.groups || [];
  const groups = granted
    ? [...new Set([...current, group])]
    : current.filter((item) => item !== group);
  await identityRequest(`/api/v3/core/users/${user.pk}/`, {
    method: "PATCH",
    body: JSON.stringify({ groups }),
  });
  if (!granted) {
    /* Somebody who has lost access must also stop reaching everyone else. */
    for (const other of await fetchPeople()) {
      const guests = guestsOf(other);
      if (!guests.includes(username.toLowerCase())) continue;
      await writeGuests(other, guests.filter((guest) => guest !== username.toLowerCase()));
    }
  }
}

async function writeGuests(user: IdentityUser, guests: string[]) {
  await identityRequest(`/api/v3/core/users/${user.pk}/`, {
    method: "PATCH",
    body: JSON.stringify({ attributes: { ...(user.attributes || {}), [meshGuestsAttribute]: guests } }),
  });
}

export async function setMeshGuests(username: string, guests: string[]) {
  const user = await findUser(username);
  await writeGuests(user, [...new Set(guests.map((guest) => guest.toLowerCase()))]);
}

/**
 * Pulls the account list from the identity provider so the picker is complete
 * the moment Kimono is installed, rather than filling in as people sign in.
 * Sign-in recording stays as a fallback for when this is unavailable.
 */
export async function syncAccountsFromIdentity(): Promise<{ synced: number } | { error: string }> {
  const token = process.env.KIMONO_IDENTITY_API_TOKEN;
  const base = (process.env.KIMONO_IDENTITY_API_URL || "http://authentik-server:9000").replace(/\/+$/, "");
  if (!token) return { error: "Kimono cannot read the account directory yet." };
  try {
    const response = await fetch(`${base}/api/v3/core/users/?page_size=500`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (response.status === 401 || response.status === 403) {
      return { error: `The identity provider refused Kimono's directory token (${response.status}). Run \`sudo kimono server repair\`.` };
    }
    if (!response.ok) return { error: `The identity provider replied ${response.status} when listing accounts.` };
    const payload = await response.json() as { results?: IdentityUser[] };
    const people = (payload.results || []).filter((user) =>
      Boolean(user.username) && user.is_active !== false && user.type !== "service_account" && user.type !== "internal_service_account");
    for (const person of people) {
      await recordAccount({ username: person.username as string, name: person.name, email: person.email });
    }
    return { synced: people.length };
  } catch {
    return { error: "The identity provider did not answer." };
  }
}

export async function recordAccount(input: { username: string; name?: string | null; email?: string | null }) {
  const username = input.username?.trim().toLowerCase();
  if (!username) return;
  const accounts = Object.fromEntries((await listAccounts()).map((account) => [account.username, account]));
  const existing = accounts[username];
  const name = input.name?.trim() || existing?.name || username;
  const email = input.email?.trim().toLowerCase() || existing?.email || "";
  /* A write per page load would be wasteful; only a real change is persisted. */
  if (existing && existing.name === name && existing.email === email) return;
  accounts[username] = { username, name, email, lastSeen: new Date().toISOString() };
  await mkdir(dirname(directoryPath), { recursive: true, mode: 0o700 });
  const temporary = `${directoryPath}.new`;
  await writeFile(temporary, `${JSON.stringify({ accounts }, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, directoryPath);
}

/** Whether an account carries Kimono VPN, without pulling the whole mesh. */
export async function holdsMeshAccess(username: string): Promise<boolean> {
  try {
    const user = await findUser(username);
    return (user.groups_obj || []).some((group) => group.name === meshGroup);
  } catch {
    return false;
  }
}
