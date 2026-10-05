import { version } from "../../package.json";
import type { TranslationKey } from "./i18n";

export interface ReleaseNote {
  title: TranslationKey;
  description: TranslationKey;
  featured?: boolean;
}

export interface VersionReleaseNotes {
  version: string;
  notes: ReleaseNote[];
}

export const PENDING_RELEASE_VERSION_KEY = "mdvPendingReleaseVersion";
export const LAST_SEEN_RELEASE_VERSION_KEY = "mdvLastSeenReleaseVersion";

// Only the current release ships with the extension. Git retains past notes.
export const CURRENT_RELEASE_NOTES: VersionReleaseNotes = {
  version,
  notes: [
    { title: "releaseAllDevicesTitle", description: "releaseAllDevicesDescription", featured: true },
    { title: "releaseGalleryControlsTitle", description: "releaseGalleryControlsDescription" },
    { title: "releaseStartupTitle", description: "releaseStartupDescription" },
  ],
};

export type StartupNotice =
  | { kind: "none" }
  | { kind: "welcome" }
  | { kind: "release"; version: string };

export function decideStartupNotice(input: { useCount: number; firstRunComplete: boolean; pendingVersion: string | null; lastSeenVersion: string | null }): StartupNotice {
  if (input.useCount < 1) return { kind: "none" };
  if (input.useCount === 1 && !input.firstRunComplete) return { kind: "welcome" };
  if (input.pendingVersion && input.lastSeenVersion !== CURRENT_RELEASE_NOTES.version) return { kind: "release", version: CURRENT_RELEASE_NOTES.version };
  return { kind: "none" };
}
