import { getViewerContext } from "./viewer-context";
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
import arCatalog from "./i18n-catalogs/ar.json";
import deCatalog from "./i18n-catalogs/de.json";
import esCatalog from "./i18n-catalogs/es.json";
import filCatalog from "./i18n-catalogs/fil.json";
import frCatalog from "./i18n-catalogs/fr.json";
import hiCatalog from "./i18n-catalogs/hi.json";
import itCatalog from "./i18n-catalogs/it.json";
import jaCatalog from "./i18n-catalogs/ja.json";
import koCatalog from "./i18n-catalogs/ko.json";
import nlCatalog from "./i18n-catalogs/nl.json";
import ptBrCatalog from "./i18n-catalogs/pt_BR.json";
import ruCatalog from "./i18n-catalogs/ru.json";
import viCatalog from "./i18n-catalogs/vi.json";
import zhCnCatalog from "./i18n-catalogs/zh_CN.json";
import zhTwCatalog from "./i18n-catalogs/zh_TW.json";

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
  closeHelp: "Close help",
  helpIntro: "Share your experience or report a problem. You choose what to submit.",
  leaveStoreReview: "Review on the Chrome Web Store",
  reportIssueGitHub: "Report an issue on GitHub",
  openingReview: "Opening…",
  reviewOpenError: "The page could not be opened. Please try again.",
  reviewRequestStatus: "Why haven't I seen a review request?",
  reviewProgress: "Qualified sessions: {sessions}/{requiredsessions} · Completed actions: {actions}/{requiredactions}",
  reviewStatusDisabled: "Automatic requests are disabled in this browser or preview. Manual help remains available.",
  reviewStatusError: "Review preferences could not be read or saved. Please reopen the viewer and try again.",
  reviewStatusLoading: "Loading your local review preferences…",
  reviewStatusAge: "Requests start seven days after your review preferences are first initialized.",
  reviewStatusSessions: "A session qualifies after one minute with at least two views. Five sessions are required.",
  reviewStatusActions: "Complete three captures, saved device sets, design annotations or successful flow checks.",
  reviewStatusCooldown: "A dismissed request waits at least 30 days before its final reminder.",
  reviewStatusReturnSessions: "The final reminder requires ten additional qualified sessions.",
  reviewStatusLimit: "The request limit has been reached. You can still use the manual review link.",
  reviewStatusOpened: "The review page was opened. Automatic requests have stopped; no submitted review is inferred.",
  reviewStatusNever: "Your choice to stop requests is saved. The manual links remain available.",
  reviewStatusDialog: "The request waits while another task or dialog is open.",
  reviewStatusAction: "You're eligible. The request appears after your next qualifying completed action.",
  reviewStatusEligible: "The request is ready to appear.",
  language: "Language",
  workspaceSetup: "Workspace setup",
  openWorkspaceSetup: "Open workspace setup",
  closeWorkspaceSetup: "Close workspace setup",
  collapseWorkspaceSetup: "Collapse workspace setup",
  viewOnly: "View only",
  showWorkspaceControls: "Show workspace controls",
  quickDeviceSets: "Quick device sets",
  openDeviceSet: "Open {name}",
  phoneTablet: "Phone + tablet",
  iosAndroid: "iOS + Android",
  mobileTabletLaptop: "Mobile + tablet + laptop",
  addViewport: "Add viewport",
  copyFixPrompt: "Copy fix prompt",
  comparePageDesign: "Compare page to design",
  scrollSync: "Scroll sync",
  navigationSync: "Navigation sync",
  turnOnScrollSync: "Turn on scroll sync",
  turnOffScrollSync: "Turn off scroll sync",
  turnOnNavigationSync: "Turn on navigation sync",
  turnOffNavigationSync: "Turn off navigation sync",
  reloadAll: "Reload all",
  lightTheme: "Light theme",
  darkTheme: "Dark theme",
  deviceView: "Device",
  freeView: "Free",
  previewStyle: "Preview style",
  tools: "Tools",
  closeViewer: "Close viewer",
  devices: "Devices",
  countOf: "{count} of {max}",
  addCustomViewport: "Add custom viewport",
  customViewports: "Custom viewports",
  addNamedViewport: "Add {name} viewport",
  deleteNamed: "Delete {name}",
  savedSets: "Saved sets",
  done: "Done",
  manage: "Manage",
  reuseDeviceCombinations: "Reuse device combinations for repeated checks.",
  sessionTools: "Session tools",
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
  viewPermissions: "View extension permissions",
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
  showAllViewports: "Show all viewports",
  focusActiveViewport: "Focus active viewport",
  generateAiFixPrompt: "Generate AI fix prompt",
  capturingComparison: "Capturing comparison…",
  captureAndAnnotate: "Screenshot and annotate",
  startNewCheck: "Start a new check",
  recordingStop: "Stop",
  recordSourceTab: "Screen record",
  takeFeatureTour: "Take a feature tour",
  recordingStatus: "Screen recording in progress · {time}",
  reloadPreview: "Reload preview",
  moveViewportLeft: "Move viewport left",
  moveViewportRight: "Move viewport right",
  focusThisViewport: "Focus this viewport",
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
  chooseDevice: "Choose a device",
  results: "{count} results",
  searchDevice: "Search name, OS, type, or size",
  clearDeviceSearch: "Clear device search",
  deviceCategories: "Device categories",
  favorites: "Favorites",
  recentlyUsed: "Recently used",
  searchResults: "Search results",
  noDevicesMatch: "No devices match “{query}”",
  tablets: "Tablets",
  laptops: "Laptops",
  desktops: "Desktops",
  other: "Other",
  custom: "Custom",
  newLabel: "NEW",
  addFavorite: "Add {name} to favorites",
  removeFavorite: "Remove {name} from favorites",
  iframeBlocked: "This site blocks iframe preview.",
  iframeBlockedHelp: "The page likely keeps frame protection, uses a restricted browser URL, or prevented the preview bridge from loading.",
  openInTab: "Open in tab",
  captureCurrentTab: "Capture current tab instead",
  customViewport: "Custom viewport",
  name: "Name",
  myDevice: "My Device",
  widthPx: "Width (px)",
  heightPx: "Height (px)",
  pixelRatio: "Pixel ratio (DPR)",
  type: "Type",
  saveAddViewport: "Save and add viewport",
  close: "Close",
  phone: "Phone",
  tablet: "Tablet",
  laptop: "Laptop",
  desktop: "Desktop",
  watch: "Watch",
  tv: "TV",
  nameLayout: "Name this layout…",
  savePreset: "Save preset",
  deletePreset: "Delete preset",
  deviceCount: "{count} device",
  devicesCount: "{count} devices",
  export: "Export",
  import: "Import",
  copied: "Copied",
  whatIsNew: "What’s new",
  closeReleaseNotes: "Close release notes",
  startTesting: "Start testing",
  generateCodingPrompt: "Generate a coding-agent prompt",
  reviewPromptHelp: "Add any details you have. Every field is optional, and the preview includes the active URL, devices, and viewports automatically.",
  closeIssueReview: "Close issue review",
  issueSummary: "Issue summary",
  expectedBehavior: "Expected behavior",
  actualBehavior: "Actual behavior",
  reproductionSteps: "Reproduction steps",
  cssSelector: "CSS selector",
  constraintsContext: "Constraints and context",
  issuePlaceholder: "Navigation overlaps the hero heading",
  expectedPlaceholder: "Navigation should collapse below 768px.",
  actualPlaceholder: "Links wrap over the heading at 390px.",
  reproductionPlaceholder: "Open the page, select the phone viewport, then scroll to the hero.",
  constraintsPlaceholder: "Keep the desktop navigation unchanged. Reuse the existing menu component.",
  promptPreview: "Prompt preview",
  clipboardPrivacy: "All fields are optional. Nothing is uploaded; copying only writes the preview to your clipboard.",
  designReference: "Design reference",
  resizeDesignPanel: "Resize design reference panel",
  designReferenceHelp: "Match the intended design against the live page.",
  closeDesignReference: "Close design reference",
  referenceViewport: "Reference viewport",
  markFeedback: "Mark feedback",
  remove: "Remove",
  sideBySide: "Side by side",
  overlay: "Overlay",
  opacity: "Opacity",
  designOverlayOpacity: "Design overlay opacity",
  designReferenceZoom: "Design reference zoom",
  zoomDesignOut: "Zoom design out",
  scale: "Scale",
  zoomDesignIn: "Zoom design in",
  reset: "Reset",
  dragResizeImage: "Drag or resize image",
  adjustOverlay: "Adjust overlay",
  lockUsePage: "Lock & use page",
  resetFit: "Reset fit",
  adjustDesignPreview: "Adjust design reference preview",
  importedDesignReference: "Imported design reference",
  resizeReferenceWidth: "Resize reference width",
  resizeReferenceHeight: "Resize reference height",
  resizeReferenceBoth: "Resize reference width and height",
  chooseDesign: "Drop, paste, or choose a design",
  chooseDesignHelp: "Use a PNG, JPG, WebP, or SVG exported from Figma or another design tool. It stays on this device.",
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
  finish: "Finish",
  key: "Key {key}",
  space: "Space",
  onScreenKeyboard: "{platform} on-screen keyboard",
  shift: "Shift",
  backspace: "Backspace",
  lettersKeyboard: "Letters keyboard",
  numbersKeyboard: "Numbers keyboard",
  dismissKeyboard: "Dismiss keyboard",
  carrier: "Carrier",
  copy: "Copy",
  copiedBang: "Copied!",
  download: "Download",
  applyCrop: "Apply crop",
  cancel: "Cancel",
  showMe: "Show me",
  privateLocal: "Private and local.",
  reviewEyebrow: "A small favor",
  reviewTitle: "Has Mobile View been useful?",
  reviewBody: "An honest Chrome Web Store review helps other developers discover a faster way to test responsive layouts.",
  reviewThankYou: "Thanks for making responsive testing part of your workflow.",
  reviewValueResponsive: "Test real responsive layouts side by side",
  reviewValueLocal: "Keep screenshots and designs private and local",
  reviewValueDevelopers: "Help independent developer tools grow",
  reviewLocalMilestones: "Shown from private, browser-local milestones only",
  reviewCta: "Leave an honest review",
  reviewNotNow: "Not now",
  reviewNever: "Don’t ask again",
  reviewHonestNote: "No reward, no five-star request—just your honest experience.",
  tourWelcomeEyebrow: "Welcome",
  tourWelcomeTitle: "Test every screen without leaving your page",
  tourWelcomeText: "Mobile View opens the current tab in several real device viewports, so responsive problems are easier to find and explain.",
  tourWelcomeHint: "This quick tour takes about one minute.",
  tourWorkspaceEyebrow: "Workspace",
  tourWorkspaceTitle: "Choose the screens that matter",
  tourWorkspaceText: "Add a preset phone, tablet, laptop, or your own custom viewport. Save combinations you use for repeated checks.",
  tourWorkspaceHint: "Start with Add viewport, then choose a device in its card.",
  tourCanvasEyebrow: "Clear canvas",
  tourCanvasTitle: "Hide setup when you need more room",
  tourCanvasText: "Close Workspace setup to uncover the previews, then reopen it whenever you need tools.",
  tourCanvasHint: "Use Open workspace setup whenever you need the sidebar again.",
  releaseScrollTitle: "Scroll without visible scrollbars",
  releaseScrollDescription: "Phone and tablet previews keep native scrolling while hiding browser scrollbar chrome, including cross-origin pages.",
  releaseGalaxyTitle: "Four new 2026 Galaxy devices, with every posture",
  releaseGalaxyDescription: "Adds Galaxy Z Fold8 Ultra, Fold8, Flip8 and A27 5G. Fold8 Ultra, Fold8 and Flip8 include separate folded and unfolded presets, all marked NEW in the device picker until the next device set arrives.",
  releaseTourTitle: "A guided first run",
  releaseTourDescription: "A concise three-step tour covers the essentials: choosing devices and clearing the workspace for testing.",
  releaseNightTitle: "Correct emulator night mode",
  releaseNightDescription: "Dark mode now themes the workspace and device chrome without filtering or recoloring the website inside each preview.",
  releaseDevicesTitle: "More current devices",
  releaseDevicesDescription: "Adds Pixel 10 models, Galaxy A17, Motorola Razr 70 Ultra, and Infinix Hot 70 with accurate viewport geometry.",
  releaseSyncTitle: "Clearer synchronized testing",
  releaseSyncDescription: "Navigation sync is explicitly named, and duplicate environment, project, audit, and baseline workflows have been removed.",
  releaseAiTitle: "Actionable AI handoff",
  releaseAiDescription: "Fix prompts now require the core issue context and ask coding agents for root-cause analysis, focused implementation, and concrete verification.",
  releaseRecordingTitle: "Visible recording state",
  releaseRecordingDescription: "A live source-tab indicator and elapsed time remain visible for the full recording session.",
  releaseSwitchingTitle: "Faster device switching",
  releaseSwitchingDescription: "Search categorized devices, keep favorites and recents close, reorder viewports, and reuse saved device sets.",
  releaseWorkspaceTitle: "Cleaner development workspace",
  releaseWorkspaceDescription: "Focus one viewport, resize comparison panels, reload one or every preview, and resume the previous local session.",
  releaseLinkedScrollTitle: "More reliable linked scrolling",
  releaseLinkedScrollDescription: "The active viewport initializes scroll sync, refreshed previews no longer reset the others, and nested scrolling areas are supported when they match.",
  releaseCaptureTitle: "Capture and share clearly",
  releaseCaptureDescription: "Capture the active viewport or full workspace, annotate it locally, then copy or download the result.",
  releaseDesignTitle: "Flexible design references",
  releaseDesignDescription: "Compare a local design beside or over a live viewport, then resize, reposition, adjust opacity, lock, and annotate it.",
  releaseLatestTitle: "Latest improvements",
  releaseLatestDescription: "This version includes the newest fixes and refinements for responsive testing.",
  widthRangeError: "Width must be between 120 and 4000.",
  heightRangeError: "Height must be between 120 and 4000.",
  pixelRatioRangeError: "Pixel ratio must be between 1 and 5.",
  resizeAdjacentViewports: "Resize adjacent viewports",
  chooseDesignButton: "Choose design",
  replaceDesign: "Replace design",
} as const;

export type TranslationKey = keyof typeof en;
export const UI_TRANSLATION_KEYS = Object.keys(en) as TranslationKey[];
const generatedCatalogs: Record<AppLocale, Record<TranslationKey, string>> = {
  en,
  de: deCatalog,
  es: esCatalog,
  fr: frCatalog,
  zh_CN: zhCnCatalog,
  zh_TW: zhTwCatalog,
  fil: filCatalog,
  nl: nlCatalog,
  vi: viCatalog,
  pt_BR: ptBrCatalog,
  it: itCatalog,
  ja: jaCatalog,
  ko: koCatalog,
  hi: hiCatalog,
  ru: ruCatalog,
  ar: arCatalog,
};

export function translationCatalog(locale: AppLocale) {
  return generatedCatalogs[locale];
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
  const [locale, setLocaleState] = useState<AppLocale>(browserLocale);

  useEffect(() => {
    void readStore<AppLocale>(UI_LOCALE_KEY, browserLocale()).then((stored) => {
      if (SUPPORTED_LOCALES.some(({ code }) => code === stored)) setLocaleState(stored);
    });
  }, []);

  useEffect(() => {
    const selected = SUPPORTED_LOCALES.find(({ code }) => code === locale)!;
    const languageRoot = getViewerContext()?.root ?? document.documentElement;
    languageRoot.lang = locale.replace("_", "-");
    languageRoot.dir = selected.dir;
  }, [locale]);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    void writeStore(UI_LOCALE_KEY, next);
  }, []);

  const t = useCallback(
    (key: TranslationKey, values?: TranslationValues) =>
      interpolate(generatedCatalogs[locale][key] ?? en[key], values),
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}
