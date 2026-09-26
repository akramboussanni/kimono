import type { AppDefinition, BackupSource } from "./definitions";
import type { PlatformSettings } from "./settings";

export type BackupItem = BackupSource & {
  appId: string; appName: string; active: boolean; version: string;
};

export function backupCatalog(settings: PlatformSettings, definitions: AppDefinition[]): BackupItem[] {
  return Object.values(settings.apps).flatMap((app) => {
    const definition = definitions.find((item) => item.metadata.id === app.definitionId);
    if (!definition || app.definitionId === "kimono-portal") return [];
    return (definition.spec.backups || []).map((source) => ({
      ...source, id: `${app.id}/${source.id}`, appId: app.id, appName: app.name,
      volume: source.volume ? `kimono-apps_${app.id}-${source.volume}` : undefined,
      service: source.service ? `${app.id}-${source.service}` : undefined,
      active: app.enabled, version: definition.metadata.version,
    }));
  });
}
