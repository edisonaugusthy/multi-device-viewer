import { extensionAsset, getViewerContext } from "./viewer-context";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { readStore, writeStore } from "../infrastructure/storage/local-store";

export const SUPPORTED_LOCALES = [
  { code: "en", name: "English", dir: "ltr" },
  { code: "de", name: "Deutsch", dir: "ltr" },
  { code: "es", name: "Español", dir: "ltr" },
  { code: "fr", name: "Français", dir: "ltr" },
  { code: "zh_CN", name: "简体中文", dir: "ltr" },
  { code: "zh_TW", name: "繁體中文", dir: "ltr" },
  { code: "fil", name: "Filipino", dir: "ltr" },
  { code: "nl", name: "Nederlands", dir: "ltr" },
  { code: "vi", name: "Tiếng Việt", dir: "ltr" },
  { code: "pt_BR", name: "Português (Brasil)", dir: "ltr" },
  { code: "it", name: "Italiano", dir: "ltr" },
  { code: "ja", name: "日本語", dir: "ltr" },
  { code: "ko", name: "한국어", dir: "ltr" },
  { code: "hi", name: "हिन्दी", dir: "ltr" },
  { code: "ru", name: "Русский", dir: "ltr" },
  { code: "ar", name: "العربية", dir: "rtl" },
] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]["code"];
export type TranslationValues = Record<string, string | number>;

const UI_LOCALE_KEY = "mdvUiLocale";

const en = {
  allDevices: "All devices",
  galleryLoadedPreviews: "{loaded}/{count} previews loaded",
  previewResourceError: "This page reported script or stylesheet errors.",
  previewLoadUnverified: "Could not verify this page’s resources.",
  retryIncompletePreviews: "Retry incomplete previews",
  galleryFastLoading: "Fast — parallel loading",
  galleryGentleLoading: "Gentle — fewer requests",
  galleryPauseLoading: "Pause new loads",
  galleryResumeLoading: "Resume loading",
  galleryLoadingPaused: "Paused",
  galleryQueuedPreview: "Queued for background loading…",
  galleryVerificationHelp: "If the site needs sign-in or verification, open it in a tab, then refresh this preview.",
  backToWorkspace: "Back to workspace",
  resetGalleryPreviews: "Refresh all previews to their starting page and default view",
  iosPhones: "iOS phones",
  androidPhones: "Android phones",
  enlargePreview: "Enlarge preview",
  backToGallery: "Back to gallery",
  openDeviceInWorkspace: "Open {name} in workspace",
  phones: "Phones",
  watches: "Watches",
  televisions: "TVs",
  viewportOptions: "Viewport options",
  browserAppearance: "Browser appearance",
  closeBrowserSettings: "Close browser settings",
  browserVersion: "Browser version",
  catalogBrowserVersion: "Catalog profile (iOS {version})",
  browserLayout: "Browser layout",
  separateTabs: "Separate tabs",
  compactTabs: "Compact tabs",
  compactBrowser: "Compact",
  bottomBrowser: "Bottom",
  topBrowser: "Top",
  browserPreviewNote: "These frames approximate Safari’s layout. Validate Safari-specific rendering on a real device.",
  helpAndFeedback: "Help and feedback",
  helpIntro: "Share your experience or report a problem. You choose what to submit.",
  leaveStoreReview: "Review on the Chrome Web Store",
  reportIssueGitHub: "Report an issue on GitHub",
  openingReview: "Opening…",
  reviewOpenError: "The page could not be opened. Please try again.",
  reviewRequestStatus: "Why haven't I seen a review request?",
  reviewProgress: "Qualified sessions: {sessions}/{requiredsessions}",
  reviewTracking: "Requests shown: {prompts}/{limit} · Store links opened: {opens} · Not now: {dismissals}",
  reviewTrackingNote: "Saved only on this device. Opening the Store does not confirm a submitted review.",
  reviewStatusDisabled: "Automatic requests are disabled in this browser or preview. Manual help remains available.",
  reviewStatusError: "Review preferences could not be read or saved. Please reopen the viewer and try again.",
  reviewStatusLoading: "Loading your local review preferences…",
  reviewStatusAge: "Requests start seven days after installation, or first use on older installs.",
  reviewStatusSessions: "Five sessions with at least one minute of visible multi-device use are required.",
  reviewStatusTesting: "Use at least two views for a minute in this session. Eligible requests appear after a short pause.",
  reviewStatusCooldown: "A request or Store visit waits at least 14 days before a reminder.",
  reviewStatusReturnSessions: "A reminder requires three additional qualified sessions.",
  reviewStatusLimit: "The request limit has been reached. You can still use the manual review link.",
  reviewStatusNever: "Your choice to stop requests is saved. The manual links remain available.",
  reviewStatusEligible: "You're eligible. A request appears after a quiet pause, once other dialogs or tasks close.",
  language: "Language",
  phoneTablet: "Phone + tablet",
  iosAndroid: "iOS + Android",
  mobileTabletLaptop: "Mobile + tablet + laptop",
  scrollSync: "Scroll sync",
  navigationSync: "Navigation sync",
  reloadAll: "Reload all",
  deviceView: "Device",
  freeView: "Free",
  previewStyle: "Preview style",
  closeViewer: "Close viewer",
  devices: "Devices",
  customViewports: "Custom viewports",
  deleteNamed: "Delete {name}",
  done: "Done",
  flowRecorder: "User flow",
  recordAFlow: "Record user flow",
  stopAndSaveFlow: "Recording in progress · {count} steps",
  reloadAndRerunFlow: "Rerun · {count} steps",
  recordFlowToRerun: "Record a user flow to rerun it",
  clearSavedFlow: "Clear saved flow",
  flowViewportsPassed: "{count}/{count} viewports passed",
  flowRunning: "Running on {count} viewports…",
  flowFailed: "{passed}/{count} passed · step {step} failed",
  flowVerificationPaused: "Verification paused replay. Complete it in the viewport.",
  resumeFlowAfterVerification: "Resume after verification",
  permissionsTitle: "Permissions and why they are used",
  permissionsIntro: "Only the access needed for responsive previews and the tools you choose to use.",
  closePermissions: "Close permissions",
  permissionActiveTab: "Temporarily allows a screenshot of the current tab only after you click Screenshot and annotate.",
  permissionWebsiteAccess: "Loads the website in device previews and runs sync and replay features on HTTP and HTTPS pages.",
  permissionFrameHeaders: "Removes frame-blocking response headers only for preview subframes so supported websites can render.",
  permissionScripting: "Reconnects the viewer to an already-open tab after the extension is installed or reloaded.",
  permissionStorage: "Saves devices, layouts, language, recorded flows, and local preferences on this browser.",
  permissionDownloads: "Saves screenshots, annotations, and recordings only when you choose to download them.",
  permissionContextMenus: "Adds the right-click shortcut for opening the current page in the viewer.",
  permissionTabCapture: "Records the source tab only after you press Record. Chrome only.",
  permissionOffscreen: "Keeps an active Chrome recording running while the viewer remains usable.",
  permissionsPrivacy: "No browsing history, page content, screenshots, or recordings are uploaded by the extension.",
  captureAndAnnotate: "Screenshot and annotate",
  recordingStop: "Stop",
  recordSourceTab: "Screen record",
  reloadPreview: "Reload preview",
  moveViewportLeft: "Move viewport left",
  moveViewportRight: "Move viewport right",
  rotate: "Rotate",
  zoomOut: "Zoom out",
  zoomIn: "Zoom in",
  removeDevice: "Remove device",
  devicePreview: "{name} preview",
  adjustableDesignOverlay: "Adjustable design overlay",
  designOverlay: "Design overlay",
  resizeOverlayWidth: "Resize design overlay width",
  resizeOverlayHeight: "Resize design overlay height",
  resizeOverlayBoth: "Resize design overlay width and height",
  previousDevice: "Previous device",
  nextDevice: "Next device",
  searchDevice: "Search name, OS, type, or size",
  deviceCategories: "Device categories",
  noDevicesMatch: "No devices match “{query}”",
  tablets: "Tablets",
  laptops: "Laptops",
  desktops: "Desktops",
  custom: "Custom",
  newLabel: "NEW",
  addFavorite: "Add {name} to favorites",
  removeFavorite: "Remove {name} from favorites",
  iframeBlocked: "This site blocks iframe preview.",
  iframeBlockedHelp: "The page likely keeps frame protection, uses a restricted browser URL, or prevented the preview bridge from loading.",
  openInTab: "Open in tab",
  captureCurrentTab: "Capture current tab instead",
  name: "Name",
  pixelRatio: "Pixel ratio (DPR)",
  type: "Type",
  close: "Close",
  phone: "Phone",
  tablet: "Tablet",
  laptop: "Laptop",
  desktop: "Desktop",
  watch: "Watch",
  tv: "TV",
  deviceCount: "{count} device",
  devicesCount: "{count} devices",
  export: "Export",
  import: "Import",
  copied: "Copied",
  whatIsNew: "What’s new",
  closeReleaseNotes: "Close release notes",
  startTesting: "Start testing",
  reproductionSteps: "Reproduction steps",
  cssSelector: "CSS selector",
  constraintsContext: "Constraints and context",
  promptPreview: "Prompt preview",
  markFeedback: "Mark feedback",
  remove: "Remove",
  sideBySide: "Side by side",
  overlay: "Overlay",
  opacity: "Opacity",
  designOverlayOpacity: "Design overlay opacity",
  reset: "Reset",
  resetFit: "Reset fit",
  importedDesignReference: "Imported design reference",
  pen: "Pen",
  box: "Box",
  arrow: "Arrow",
  text: "Text",
  crop: "Crop",
  size: "Size {size}",
  fontSize: "Font size {size}",
  undo: "Undo",
  cropSelection: "Crop to selection?",
  typeHere: "Type here…",
  noScreenshot: "No screenshot available",
  skipFeatureTour: "Skip feature tour",
  skipTour: "Skip tour",
  tourStep: "Tour step {current} of {total}",
  goToTourStep: "Go to step {current}: {title}",
  previousTourStep: "Previous tour step",
  previousField: "Previous field",
  next: "Next",
  key: "Key {key}",
  space: "Space",
  onScreenKeyboard: "{platform} on-screen keyboard",
  shift: "Shift",
  backspace: "Backspace",
  dismissKeyboard: "Dismiss keyboard",
  carrier: "Carrier",
  copy: "Copy",
  copiedBang: "Copied!",
  download: "Download",
  applyCrop: "Apply crop",
  cancel: "Cancel",
  showMe: "Show me",
  reviewTitle: "Has Mobile View & Responsive Tester helped you?",
  reviewOpenSource: "This is an open source project.",
  reviewBody: "Your review helps others discover it and motivates me to keep improving it and adding new features. If it’s been useful, a quick, honest review would mean a lot.",
  reviewCta: "Leave an honest review",
  reviewNotNow: "Not helpful yet",
  reviewNever: "Don’t ask again",
  tourAllDevicesText: "Preview the page on every available device in one click. Sections run from iOS and Android phones to tablets, computers, and watches, with smaller screens first.",
  tourAllDevicesHint: "Zoom or expand a card for a closer look. Refresh all restores every preview to its starting page and default view.",
  releaseAllDevicesTitle: "All devices in one click",
  releaseAllDevicesDescription: "Compare every device from smaller to larger screens, with zoom and large popups. Previews load in the background and stay open as you scroll.",
  releaseGalleryControlsTitle: "Compact controls and refresh-all",
  releaseGalleryControlsDescription: "A single-row toolbar frees preview space. Refresh all restores the starting page, top scroll position, fit zoom, and initial browser settings.",
  releaseStartupTitle: "Folded Duo by default",
  releaseStartupDescription: "Fresh sessions start with iPhone 18 Pro, iPhone Duo folded, and MacBook Pro. Saved device selections are preserved.",
  widthRangeError: "Width must be between 120 and 4000.",
  heightRangeError: "Height must be between 120 and 4000.",
  resizeAdjacentViewports: "Resize adjacent viewports",
  replaceDesign: "Replace design",
  workspace: "Workspace",
  views: "Views",
  addDevice: "Add device",
  sync: "Sync",
  scroll: "Scroll",
  navigation: "Navigation",
  syncBetweenDevices: "Sync between devices",
  syncBetweenDevicesHint: "Keep devices in step",
  scrollSyncHint: "Scrolling, clicks, and typing follow the device you use",
  navigationSyncHint: "Opening a page in one device opens it in all",
  compareWithDesign: "Compare with design",
  fixPrompt: "Fix prompt",
  record: "Record",
  recordTabVideo: "Record this tab",
  viewMode: "Focus mode",
  settings: "Settings",
  starred: "Starred",
  recent: "Recent",
  allTypes: "All types",
  deviceType: "Device type",
  addADevice: "Add a device",
  replaceNamed: "Replace {name}",
  replacingNamed: "Replacing {name}",
  addInstead: "Add instead",
  searchReplacement: "Search for a replacement",
  searchDevicesHint: "Search devices or type 390×844",
  slotsFull: "All {count} slots are in use",
  addToWorkspace: "Add to workspace",
  switchToDevice: "Switch to this device",
  showingNow: "Showing now",
  alreadyInWorkspace: "Already in the workspace",
  sets: "Sets",
  deviceSets: "Device sets",
  customSize: "Custom size",
  backToDevices: "Back to devices",
  restoreBuiltIn: "Restore built-in",
  yourSets: "Your sets",
  builtInSets: "Built-in sets",
  inUse: "In use",
  saveSetAs: "Save these {count} devices as…",
  setName: "Name for this set",
  defaultSetName: "Set {count}",
  noSavedSets: "No device sets yet.",
  noCustomSizes: "No custom sizes yet.",
  save: "Save",
  savedSizes: "Saved sizes",
  add: "Add",
  customWidth: "Custom width",
  customHeight: "Custom height",
  theme: "Theme",
  light: "Light",
  dark: "Dark",
  browserBar: "Browser bar",
  featureTour: "Feature tour",
  whatsNew: "What's new",
  permissions: "Permissions",
  fixPromptHelp: "Copy it into your AI coding tool. Nothing is sent from here.",
  whatsWrong: "What's wrong?",
  whatsWrongPlaceholder: "The hero heading wraps to three lines on phones and pushes the button down.",
  whatShouldHappen: "What should happen?",
  whatShouldHappenPlaceholder: "Two short lines, button visible without scrolling",
  optional: "Optional",
  whereItHappens: "Where it happens",
  devicesToInclude: "Devices to include",
  moreDetails: "More details",
  moreDetailsHint: "steps, element, constraints",
  selectorPlaceholder: "Element or CSS selector, e.g. .hero h1",
  constraintsShortPlaceholder: "Constraints, e.g. keep the desktop layout",
  preview: "Preview",
  hidePreview: "Hide preview",
  copyPrompt: "Copy prompt",
  deviceControls: "{name} controls",
  changeDevice: "Change device",
  focusDevice: "Expand this device",
  fixPromptForDevice: "Fix prompt for this device",
  showAll: "Show all",
  showAllDevices: "Show all devices",
  viewModeControls: "Focus mode controls",
  show: "Show",
  viewAll: "All",
  viewOne: "One",
  exit: "Exit",
  retry: "Retry",
  design: "Design",
  livePage: "Page",
  under: "under",
  hasDesign: "Design",
  noDesign: "No design",
  deviceToCompare: "Device to compare",
  comparisonMode: "Comparison mode",
  addDesignFor: "Add a design for {name}",
  addDesignToOverlay: "Add a design to overlay",
  dropDesignHint: "Drop, paste, or choose a PNG, JPG, WebP, or SVG",
  comparisonControls: "Comparison controls",
  blend: "Blend",
  normal: "Normal",
  difference: "Difference",
  differenceHint: "Highlights pixels that differ",
  locked: "Locked",
  unlocked: "Unlocked",
  lockOverlayHint: "Lock the overlay so you can use the page underneath",
  resetOverlayHint: "Reset size and position",
  scrollDesignWithPage: "Scroll design with page",
  removeDesign: "Remove design",
  loading: "Loading",
  pauseLoading: "Pause loading",
  resumeLoading: "Resume loading",
  retryCount: "Retry {count}",
  fast: "Fast",
  gentle: "Gentle",
  previewLoadingSpeed: "Preview loading speed",
  queuedPosition: "Queued",
  incomplete: "incomplete",
  scriptErrors: "Script or stylesheet errors",
  tourAddDeviceText: "Fresh sessions start with iPhone 18 Pro, iPhone Duo folded, and MacBook Pro. Add a device to compare another screen.",
  tourAddDeviceHint: "Pick from starred, recent, or every device type.",
  tourSyncText: "Keep scrolling and page navigation in step across every device, or turn either off.",
  tourChangeDeviceText: "Hover a device to show its controls, then switch it to another screen size.",
  annotate: "Annotate",
  galleryWidthRange: "{range} CSS px wide · smallest first",
  moveDevice: "Drag to move",
  closeFixPrompt: "Close fix prompt",
  tipBackToWorkspace: "Return to your workspace and its devices.",
  removeFromWorkspace: "Remove from workspace",
  maxDevicesReached: "You can compare up to {count} devices. Remove one to add another.",
  saveCurrentSetHint: "Save the devices on screen as a preset",
  previousInCategory: "Previous device of this type",
  nextInCategory: "Next device of this type",
  tipDeviceView: "Show each page inside a realistic device frame.",
  tipFreeView: "Show only the page at its exact size, without a frame.",
  tipReloadAll: "Reload every device on the page it is showing.",
  tipCompare: "Check a device against a design image, side by side or overlaid.",
  tipScreenshot: "Capture all devices, then mark up, copy or download the image.",
  tipFixPrompt: "Describe a layout bug and copy a prompt for your AI coding assistant.",
  tipRecord: "Record this tab as a video, or record a user flow to replay on every device.",
  tipFocusMode: "Hide the controls and show only the devices. Press Esc to exit.",
  tipSettings: "Theme, browser bar position, language, help and the feature tour.",
  tipCloseViewer: "Close the viewer and return to the page.",
  tipAddDevice: "Add another device to compare, up to four.",
  tipAllDevices: "Preview the page on every device in a category.",
  tourRecordText: "Record a journey once so you can rerun the same interactions across your devices.",
} as const;

export type TranslationKey = keyof typeof en;
export const UI_TRANSLATION_KEYS = Object.keys(en) as TranslationKey[];
export type TranslationCatalog = Record<TranslationKey, string>;
export const englishCatalog: TranslationCatalog = en;

// Only English is bundled. Other languages are separate files (see
// scripts/ui-locale-assets.ts), fetched once when a viewer needs them.
const catalogRequests = new Map<AppLocale, Promise<TranslationCatalog>>();

export function loadTranslationCatalog(locale: AppLocale): Promise<TranslationCatalog> {
  if (locale === "en") return Promise.resolve(en);
  let request = catalogRequests.get(locale);
  if (!request) {
    request = fetch(extensionAsset(`/ui-locales/${locale}.json`))
      .then(response => {
        if (!response.ok) throw new Error(`Missing UI catalog: ${locale}`);
        return response.json() as Promise<TranslationCatalog>;
      })
      .catch(error => {
        catalogRequests.delete(locale);
        throw error;
      });
    catalogRequests.set(locale, request);
  }
  return request;
}

function normalizeLocale(value: string): AppLocale {
  const normalized = value.replace("-", "_").toLowerCase();
  if (normalized.startsWith("zh_tw") || normalized.startsWith("zh_hk")) return "zh_TW";
  if (normalized.startsWith("zh")) return "zh_CN";
  if (normalized.startsWith("pt")) return "pt_BR";
  if (normalized.startsWith("fil") || normalized.startsWith("tl")) return "fil";
  const match = SUPPORTED_LOCALES.find(({ code }) => normalized.startsWith(code.toLowerCase()));
  return match?.code ?? "en";
}

function browserLocale(): AppLocale {
  const detected = typeof chrome !== "undefined" && chrome.i18n?.getUILanguage
    ? chrome.i18n.getUILanguage()
    : typeof navigator !== "undefined"
      ? navigator.language
      : "en";
  return normalizeLocale(detected);
}

function interpolate(message: string, values?: TranslationValues) {
  if (!values) return message;
  return message.replace(/\{(\w+)\}/g, (token, key) =>
    values[key.toLowerCase()] === undefined
      ? token
      : String(values[key.toLowerCase()]),
  );
}

interface I18nValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (key: TranslationKey, values?: TranslationValues) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ locale: AppLocale; catalog: TranslationCatalog } | null>(null);

  // Resolve the saved language and its catalog before the first render, so
  // non-English viewers never flash English. Any failure falls back to English.
  useEffect(() => {
    let active = true;
    void readStore<AppLocale>(UI_LOCALE_KEY, browserLocale())
      .then(stored => SUPPORTED_LOCALES.some(({ code }) => code === stored) ? stored : browserLocale())
      .catch(() => browserLocale())
      .then(locale => loadTranslationCatalog(locale).then(catalog => ({ locale, catalog })))
      .catch(() => ({ locale: "en" as AppLocale, catalog: en }))
      .then(next => { if (active) setState(current => current ?? next); });
    return () => { active = false; };
  }, []);

  const locale = state?.locale;
  useEffect(() => {
    if (!locale) return;
    const selected = SUPPORTED_LOCALES.find(({ code }) => code === locale)!;
    const languageRoot = getViewerContext()?.root ?? document.documentElement;
    languageRoot.lang = locale.replace("_", "-");
    languageRoot.dir = selected.dir;
  }, [locale]);

  const setLocale = useCallback((next: AppLocale) => {
    void writeStore(UI_LOCALE_KEY, next);
    // Keep the current language on screen until the new catalog is ready.
    void loadTranslationCatalog(next)
      .then(catalog => setState({ locale: next, catalog }))
      .catch(() => setState({ locale: "en", catalog: en }));
  }, []);

  const catalog = state?.catalog;
  const t = useCallback(
    (key: TranslationKey, values?: TranslationValues) => interpolate(catalog?.[key] ?? en[key], values),
    [catalog],
  );

  const value = useMemo(() => locale ? { locale, setLocale, t } : null, [locale, setLocale, t]);
  if (!value) return null;
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}
