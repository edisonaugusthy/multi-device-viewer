export interface ReleaseNote {
  title: string;
  description: string;
  featured?: boolean;
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
  "0.2.5": {
    version: "0.2.5",
    heading: "A clearer workspace and better device previews",
    summary: "Design updates, Device and Free views, corrected rendering, and improvements to everyday testing.",
    notes: [
      { title: "Updated workspace design", description: "Clearer borders, compact controls and an improved device picker, with familiar button positions and zoom and close controls at the top of each viewport." },
      { title: "Device, Free and View only", description: "Switch between device frames and a frameless view without reloading your previews. Use View only to hide workspace controls and focus on the page." },
      { title: "Corrected device rendering", description: "Improved screen fit, dimensions, rounded corners and browser-header alignment across phones, tablets, laptops and desktops, including header seams at smaller zoom levels." },
      { title: "Improved navigation and scroll sync", description: "More reliable page navigation, reload recovery and nested scrolling, with reduced scroll drift when switching between viewports." },
      { title: "Reuse your website session", description: "The viewer opens over your existing page. Same-site previews reuse its browser storage context while the original page stays open; some sites may still require sign-in." },
      { title: "Website dark-mode support", description: "Device appearance now passes the light or dark preference to previewed websites that support system themes, without inverting page colors." },
      { title: "Better phone and tablet keyboards", description: "Refined iOS and Android keyboard layouts, input-specific keys and focused-field visibility in portrait and landscape." },
      { title: "Clearer feedback and help", description: "Updated the review prompt styling, made failed review-link actions retryable, and added clearer review and issue-report options in Help." },
      { title: "Scrollable release notes", description: "The changelog now fits within your window and scrolls through longer updates while keeping the close and Start testing buttons visible." },
    ],
  },
  "0.2.4": {
    version: "0.2.4",
    heading: "What’s new",
    summary: "",
    notes: [
      { title: "New devices", description: "Added Google Pixel 11, Pixel 11 Pro, Pixel 11 Pro XL, and Pixel 11 Pro Fold to the responsive testing catalog." },
      { title: "New review option", description: "You can now leave an honest Chrome Web Store review from the responsive testing workspace." },
    ],
  },
  "0.2.3": {
    version: "0.2.3",
    heading: "Localized testing and reusable user flows",
    summary: "This release makes the responsive workspace easier to use worldwide, adds repeatable user journeys, and refines the latest iPhone previews.",
    notes: [
      { title: "A localized workspace", description: "Use the responsive testing interface in 16 supported languages, including Arabic, Chinese, French, German, Hindi, Japanese, Korean, Portuguese, Spanish, and more." },
      { title: "Record user flow", description: "Record clicks, typing, and scrolling once, then rerun the saved journey across your device viewports to check the same experience consistently.", featured: true },
      { title: "Refined Liquid Glass previews", description: "The latest iPhone devices now render Safari and system surfaces with corrected Liquid Glass color blending, notch boundaries, and bottom-bar treatment." },
    ],
  },
  "0.2.2": {
    version: "0.2.2",
    heading: "Smoother mobile previews",
    summary: "",
    notes: [
      { title: "Scroll without visible scrollbars", description: "Phone and tablet previews keep native scrolling while hiding browser scrollbar chrome, including cross-origin pages." },
    ],
  },
  "0.2.1": {
    version: "0.2.1",
    heading: "What’s new",
    summary: "",
    notes: [
      { title: "Four new 2026 Galaxy devices, with every posture", description: "Adds Galaxy Z Fold8 Ultra, Fold8, Flip8 and A27 5G. Fold8 Ultra, Fold8 and Flip8 include separate folded and unfolded presets, all marked NEW in the device picker until the next device set arrives." },
      { title: "A guided first run", description: "An eight-step product tour now covers clearing the sidebar, focusing one viewport, comparing against a design, and synchronization without clipping controls at the window edge." },
    ],
  },
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
