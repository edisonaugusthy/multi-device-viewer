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
    heading: "A faster everyday responsive-development workspace",
    summary: "This release makes it easier to keep the viewer beside your editor, follow changes across devices, and share visual feedback.",
    notes: [
      { title: "Faster device switching", description: "Search categorized devices, keep favorites and recents close, reorder viewports, and reuse saved device sets." },
      { title: "Cleaner development workspace", description: "Focus one viewport, resize comparison panels, reload one or every preview, and resume the previous local session." },
      { title: "More reliable linked scrolling", description: "The active viewport initializes scroll sync, refreshed previews no longer reset the others, and nested scrolling areas are supported when they match." },
      { title: "Capture and share clearly", description: "Capture the active viewport or full workspace, annotate it locally, then copy or download the result." },
      { title: "Flexible design references", description: "Compare a local design beside or over a live viewport, then resize, reposition, adjust opacity, lock, and annotate it." },
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
