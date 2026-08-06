export const KIMONO_APP_CONTRACT_VERSION = "0.1" as const;

export type KimonoAppKind = "native" | "fork" | "connected";
export type KimonoAppStatus = "online" | "degraded" | "offline" | "setup";
export type KimonoRole = "owner" | "admin" | "member" | "guest";
export type KimonoPresentation = "standalone" | "embedded";

export type KimonoAppManifest = {
  id: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  href: string;
  kind: KimonoAppKind;
  presentation: KimonoPresentation;
  status: KimonoAppStatus;
  accent: `#${string}`;
  category: "media" | "files" | "tools" | "home" | "system";
  icon: "play" | "image" | "file" | "tool" | "server" | "home";
  brand: {
    colors: readonly [`#${string}`, `#${string}`, `#${string}`];
  };
  enabled: boolean;
  visibleTo: KimonoRole[];
  contractVersion: typeof KIMONO_APP_CONTRACT_VERSION;
};

export type KimonoProfile = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  role: KimonoRole;
};

export type IdentityProvider = {
  createUser(input: Omit<KimonoProfile, "id">): Promise<KimonoProfile>;
  disableUser(identityId: string): Promise<void>;
  updateProfile(identityId: string, profile: Partial<KimonoProfile>): Promise<void>;
};

export function isAppVisibleTo(app: KimonoAppManifest, role: KimonoRole) {
  return app.enabled && app.visibleTo.includes(role);
}
