import { version } from "../../package.json";
import type { TranslationKey } from "./i18n";

// Icon names map to UI icons in ReleaseNotesModal, keeping this module UI-free.
export type ReleaseNoteIcon =
  | "workspace" | "drag" | "frames" | "step" | "picker" | "focus" | "expand" | "gallery" | "camera"
  | "compare" | "fixPrompt" | "flow" | "record" | "languages" | "speed" | "headers"
  | "homeview" | "scrollbars" | "hover" | "adjust" | "reload" | "menus";

export interface ReleaseNote {
  title: TranslationKey;
  description: TranslationKey;
  icon: ReleaseNoteIcon;
}

export interface ReleaseSection {
  title: TranslationKey;
  notes: ReleaseNote[];
}

export interface VersionReleaseNotes {
  version: string;
  featured: ReleaseNote;
  sections: ReleaseSection[];
}

export const PENDING_RELEASE_VERSION_KEY = "mdvPendingReleaseVersion";
export const LAST_SEEN_RELEASE_VERSION_KEY = "mdvLastSeenReleaseVersion";
export const LAST_SEEN_TOUR_KEY = "mdvLastSeenTour";

// Raise this when the feature tour changes enough that existing users should
// see it again. Updated users see it once, right after the release notes.
export const FEATURE_TOUR_REVISION = "0.3.0";

// Only the current release ships with the extension. Git retains past notes.
export const CURRENT_RELEASE_NOTES: VersionReleaseNotes = {
  version,
  featured: { title: "releaseWorkspaceTitle", description: "releaseWorkspaceDescription", icon: "workspace" },
  sections: [
    {
      title: "releaseSectionDevices",
      notes: [
        { title: "releaseDragTitle", description: "releaseDragDescription", icon: "drag" },
        { title: "releaseFramesTitle", description: "releaseFramesDescription", icon: "frames" },
        { title: "releaseStepTitle", description: "releaseStepDescription", icon: "step" },
        { title: "releasePickerTitle", description: "releasePickerDescription", icon: "picker" },
        { title: "releaseHomeViewTitle", description: "releaseHomeViewDescription", icon: "homeview" },
        { title: "releaseScrollbarsTitle", description: "releaseScrollbarsDescription", icon: "scrollbars" },
      ],
    },
    {
      title: "releaseSectionViews",
      notes: [
        { title: "releaseFocusTitle", description: "releaseFocusDescription", icon: "focus" },
        { title: "releaseExpandTitle", description: "releaseExpandDescription", icon: "expand" },
        { title: "releaseGalleryTitle", description: "releaseGalleryDescription", icon: "gallery" },
        { title: "releaseGalleryShotTitle", description: "releaseGalleryShotDescription", icon: "camera" },
        { title: "releaseToolbarHoverTitle", description: "releaseToolbarHoverDescription", icon: "hover" },
      ],
    },
    {
      title: "releaseSectionReview",
      notes: [
        { title: "releaseCompareTitle", description: "releaseCompareDescription", icon: "compare" },
        { title: "releaseAdjustDesignTitle", description: "releaseAdjustDesignDescription", icon: "adjust" },
        { title: "releaseFixPromptTitle", description: "releaseFixPromptDescription", icon: "fixPrompt" },
        { title: "releaseFlowTitle", description: "releaseFlowDescription", icon: "flow" },
        { title: "releaseRecordingTitle", description: "releaseRecordingDescription", icon: "record" },
      ],
    },
    {
      title: "releaseSectionGeneral",
      notes: [
        { title: "releaseLanguagesTitle", description: "releaseLanguagesDescription", icon: "languages" },
        { title: "releaseFasterTitle", description: "releaseFasterDescription", icon: "speed" },
        { title: "releaseHeadersTitle", description: "releaseHeadersDescription", icon: "headers" },
        { title: "releaseReloadTitle", description: "releaseReloadDescription", icon: "reload" },
        { title: "releaseMenusTitle", description: "releaseMenusDescription", icon: "menus" },
      ],
    },
  ],
};

export type StartupNotice =
  | { kind: "none" }
  | { kind: "welcome" }
  | { kind: "release"; version: string; tourAfter: boolean }
  | { kind: "tour" };

export function decideStartupNotice(input: {
  useCount: number;
  firstRunComplete: boolean;
  pendingVersion: string | null;
  lastSeenVersion: string | null;
  lastSeenTour: string | null;
}): StartupNotice {
  if (input.useCount < 1) return { kind: "none" };
  // A fresh install gets only the tour.
  if (input.useCount === 1 && !input.firstRunComplete) return { kind: "welcome" };
  const tourDue = input.lastSeenTour !== FEATURE_TOUR_REVISION;
  if (input.pendingVersion && input.lastSeenVersion !== CURRENT_RELEASE_NOTES.version) {
    return { kind: "release", version: CURRENT_RELEASE_NOTES.version, tourAfter: tourDue };
  }
  // Someone who closed the viewer before reaching the new tour sees it next time.
  if (tourDue) return { kind: "tour" };
  return { kind: "none" };
}
