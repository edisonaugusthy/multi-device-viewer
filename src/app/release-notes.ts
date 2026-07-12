export interface ReleaseNote {
  title: string;
  description: string;
}

export interface VersionReleaseNotes {
  version: string;
  heading: string;
  summary: string;
  notes: ReleaseNote[];
}

export const PENDING_RELEASE_VERSION_KEY = "mdvPendingReleaseVersion";
export const LAST_SEEN_RELEASE_VERSION_KEY = "mdvLastSeenReleaseVersion";

export type StartupNotice =
  | { kind: "welcome" }
  | { kind: "release"; version: string }
  | { kind: "none" };

export function decideStartupNotice(input: { useCount: number; firstRunComplete: boolean; pendingVersion: string | null; lastSeenVersion: string | null }): StartupNotice {
  if (input.useCount < 1) return { kind: "none" };
  if (input.useCount === 1 && !input.firstRunComplete) return { kind: "welcome" };
  if (input.pendingVersion && input.pendingVersion !== input.lastSeenVersion) return { kind: "release", version: input.pendingVersion };
  return { kind: "none" };
}

const RELEASE_NOTES: Record<string, VersionReleaseNotes> = {
  "0.1.4": {
    version: "0.1.4",
    heading: "Faster viewport setup and clearer design review",
    summary: "This release makes it easier to choose, create, reuse, and manage the viewports used in responsive reviews.",
    notes: [
      { title: "Cleaner device chooser", description: "Browse iOS, Android, tablets, laptops, desktops, other hardware, and saved custom profiles in focused categories." },
      { title: "Custom viewport management", description: "Create custom dimensions, add them to a session, reuse them from the sidebar, or delete profiles you no longer need." },
      { title: "Clearer design comparison", description: "The design-reference workflow now uses direct, action-oriented labels throughout the workspace." },
    ],
  },
};

export function releaseNotesFor(version: string): VersionReleaseNotes {
  return RELEASE_NOTES[version] ?? {
    version,
    heading: "Responsive Tester was updated",
    summary: "You are now running the latest version with reliability and usability improvements.",
    notes: [{ title: "Latest improvements", description: "This version includes the newest fixes and refinements for responsive testing." }],
  };
}
