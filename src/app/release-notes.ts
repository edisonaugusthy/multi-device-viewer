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
  "0.2.0": {
    version: "0.2.0",
    heading: "A faster responsive testing workspace",
    summary: "This release streamlines the workspace, expands the device catalog, improves AI handoff, and corrects emulator night mode.",
    notes: [
      { title: "Correct emulator night mode", description: "Dark mode now themes the workspace and device chrome without filtering or recoloring the website inside each preview." },
      { title: "More current devices", description: "Adds Pixel 10 models, Galaxy A17, Motorola Razr 70 Ultra, and Infinix Hot 70 with accurate viewport geometry." },
      { title: "Clearer synchronized testing", description: "Navigation sync is explicitly named, and duplicate environment, project, audit, and baseline workflows have been removed." },
      { title: "Actionable AI handoff", description: "Fix prompts now require the core issue context and ask coding agents for root-cause analysis, focused implementation, and concrete verification." },
      { title: "Visible recording state", description: "A live source-tab indicator and elapsed time remain visible for the full recording session." },
    ],
  },
  "0.1.5": {
    version: "0.1.5",
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
