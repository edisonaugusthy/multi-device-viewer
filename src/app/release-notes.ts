import { version } from "../../package.json";
import type { TranslationKey } from "./i18n";

// Icon names map to UI icons in ReleaseNotesModal, keeping this module UI-free.
export type ReleaseNoteIcon =
  | "workspace" | "drag" | "frames" | "step" | "picker" | "focus" | "expand" | "gallery" | "camera"
  | "compare" | "fixPrompt" | "flow" | "record" | "languages" | "speed" | "headers"
  | "homeview" | "scrollbars" | "hover" | "adjust" | "reload" | "menus" | "layout";

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

// Raise this when the feature tour gains steps that existing users should see.
// Updated users see the steps added since their last tour once, right after
// the release notes; a fresh install sees every step.
export const FEATURE_TOUR_REVISION = "0.4.0";

// Only the current release ships with the extension. Git retains past notes.
export const CURRENT_RELEASE_NOTES: VersionReleaseNotes = {
  version,
  featured: { title: "releaseBeforeAfterTitle", description: "releaseBeforeAfterDescription", icon: "compare" },
  sections: [
    {
      title: "releaseSectionDevices",
      notes: [
        { title: "releaseNewDevicesTitle", description: "releaseNewDevicesDescription", icon: "frames" },
        { title: "releasePickerNewTitle", description: "releasePickerNewDescription", icon: "picker" },
      ],
    },
    {
      title: "releaseSectionReview",
      notes: [
        { title: "releaseLayoutCheckTitle", description: "releaseLayoutCheckDescription", icon: "layout" },
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
