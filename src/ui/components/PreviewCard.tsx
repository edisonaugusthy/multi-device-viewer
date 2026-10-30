import { usePointerDrag } from "../hooks/usePointerDrag";
import { useVisualRegression } from "../hooks/useVisualRegression";
import { LanguagePicker, languageName } from "./LanguagePicker";
import { useStableCallback } from "../hooks/useStableCallback";
import { DesignOverlay, type DesignOverlayProps, type ScreenBox } from "./DesignOverlay";
import { readPreviewHealthReport } from "../../domain/device/preview-health";
import type { GalleryLoadResult } from "../../domain/device/gallery-load-queue";
import { PreviewSurface } from "./PreviewSurface";
import { BrowserAppearanceSettings } from "./BrowserAppearanceSettings";
import { NavigationSyncState } from "../../domain/simulator/navigation-sync";
import { chromeMajor, identityToken, slotIdentity } from "../../domain/simulator/preview-identity";
import { tagPreviewRequest } from "../../domain/simulator/preview-request";
import { clampZoom } from "../../domain/simulator/simulator-service";
import { PREVIEW_SANDBOX, previewFrameName } from "../../app/preview-frame";
import { usesTabletKeyboard } from "../../domain/device/mobile-keyboard";
import { getViewerEventTarget } from "../../app/viewer-context";
import { preparePreview } from "../../app/viewer-context";
import { AlertIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, FixPromptIcon, GlobeIcon, LayoutCheckIcon, OpenInTabIcon, ReloadIcon, SettingsIcon } from "../icons";
import type { LayoutSlotStatus } from "../hooks/useLayoutCheck";
import { PreviewToolbar, type FocusNavigation } from "./PreviewToolbar";
import { memo, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  hidesPageScrollbars,
  supportsOrientation,
  toLandscapeAwareSize,
} from "../../domain/device/device-service";
import { getFrameProfile } from "../../domain/device/frame-profiles";
import { getBrowserGeometry, nextBrowserCollapse } from "../../domain/device/browser-geometry";
import type { Device, Size } from "../../domain/device/device.types";
import type { FlowReplayRequest, FlowReplayResult, FlowStep } from "../../domain/flow/flow.types";
import type {
  DisplaySettings,
  PreviewSlot,
} from "../../domain/simulator/simulator.types";
import { useSimulatorRef, useSimulatorSelector } from "../../app/SimulatorProvider";
import { useI18n } from "../../app/i18n";
import { FEATURES } from "../../app/feature-flags";
import {
  DeviceFrame,
  estimateDeviceFrameSize,
  getMobileKeyboardHeight,
  type BrowserSurfaceColors,
  type MobileKeyboardAction,
  type MobileKeyboardState,
} from "./DeviceFrame";

const CARD_PAD = 16;
// Room above the device for its floating toolbar.
const TOOLBAR_SPACE = 64;
// Between a device and its toolbar: close enough to read as one, and to cross
// before the toolbar hides.
const TOOLBAR_GAP = 12;

interface ScrollSyncPayload {
  slotId: string;
  url?: string;
  targetSlotId?: string;
  scrollLeft: number;
  scrollTop: number;
  deltaLeft: number;
  deltaTop: number;
  scrollHeight?: number;
  scrollWidth?: number;
  viewportHeight?: number;
  viewportWidth?: number;
  scrollTargetSelector?: string;
}

interface InteractionSyncPayload {
  slotId: string;
  kind: string;
  selector?: string;
  tagName?: string;
  role?: string;
  ariaLabel?: string;
  name?: string;
  text?: string;
  x?: number;
  y?: number;
  value?: string;
  checked?: boolean;
  inputType?: string;
  key?: string;
  code?: string;
  button?: number;
  buttons?: number;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
}

interface PreviewCardProps {
  slot: PreviewSlot;
  device: Device;
  display: DisplaySettings;
  showToolbar?: boolean;
  visualsActive?: boolean;
  onScaleChange?: (scale: number, slotId: string) => void;
  onLoadStateChange?: (id: string, status: GalleryLoadResult) => void;
  removable: boolean;
  onCapture?: (slotId: string) => void;
  capturePending?: boolean;
  focused: boolean;
  first: boolean;
  last: boolean;
  flowRecording?: boolean;
  flowReplay?: FlowReplayRequest | null;
  onFlowStep?: (step: Omit<FlowStep, "id">, slotId: string) => void;
  onFlowResult?: (result: FlowReplayResult) => void;
  /** The page's HTML is ready (DOMContentLoaded); images and other resources may still be loading. */
  onPageReady?: (slotId: string) => void;
  /** A design laid over the device screen; its frame is in CSS pixels of that screen. */
  designOverlay?: DesignOverlayProps;
  /** Bottom-aligns the device so every preview in a row shares a baseline. */
  align?: "bottom" | "center";
  showCaption?: boolean;
  /** Keeps the floating toolbar visible, e.g. while the feature tour points at it. */
  revealToolbar?: boolean;
  focusNavigation?: FocusNavigation;
  // Slot-aware handlers let a parent pass one stable function to every card.
  onChangeDevice?: (slotId: string) => void;
  /** Neighbouring devices of the same type and the handler that switches to one. */
  previousDevice?: Device;
  nextDevice?: Device;
  onSwitchDevice?: (slotId: string, deviceId: string) => void;
  /** Changing this returns a dragged device to its default position. */
  positionKey?: string;
  /**
   * Devices float on one free canvas: a device and its name can be dragged
   * across the other devices' space, and its corner resizes it. Only the
   * device, its name and its toolbar take the pointer, so a device moved over
   * another's empty space stays reachable.
   */
  canvas?: boolean;
  /** The device's place in the canvas's front-to-back order (1 is furthest back). */
  layer?: number;
  /**
   * The parent decides which device's toolbar shows, so only one shows at a
   * time. Without it, each card follows its own pointer.
   */
  toolbarHovered?: boolean;
  onToolbarHover?: (slotId: string, hovered: boolean) => void;
  onExpand?: (slotId: string) => void;
  onFixPrompt?: (slotId: string) => void;
  onPageScroll?: (scrollTop: number) => void;
  expandLabel?: string;
  /** This device's part of an open Layout check: shown under the caption and on the toolbar. */
  layoutStatus?: LayoutSlotStatus;
  onLayoutCheck?: (slotId: string) => void;
  onLayoutProblems?: (slotId: string) => void;
  /** Errors and failed requests seen in this preview; the chip opens them. */
  problemCount?: number;
  onProblems?: (slotId: string) => void;
  /** Opens "What each device sends" for the whole workspace. */
  onCompareIdentities?: () => void;
  /** Track changes is on: each reload is compared with the one before. */
  tracking?: boolean;
}

type BridgeStatus = "checking" | "ready" | "unavailable" | "blocked";

function readPageSurfaces(data: Record<string, unknown>): BrowserSurfaceColors | undefined {
  const top = typeof data.topColor === "string" && CSS.supports("color", data.topColor) ? data.topColor : undefined;
  const bottom = typeof data.bottomColor === "string" && CSS.supports("color", data.bottomColor) ? data.bottomColor : undefined;
  if (!top && !bottom) return undefined;
  return {
    viewportFit: data.viewportFit === "cover" ? "cover" : "auto",
    top: top ?? bottom!,
    bottom: bottom ?? top!,
    topIsDark: typeof data.topIsDark === "boolean" ? data.topIsDark : false,
    bottomIsDark: typeof data.bottomIsDark === "boolean" ? data.bottomIsDark : false,
    topGuardColor: typeof data.topGuardColor === "string" && CSS.supports("color", data.topGuardColor) ? data.topGuardColor : undefined,
    bottomGuardColor: typeof data.bottomGuardColor === "string" && CSS.supports("color", data.bottomGuardColor) ? data.bottomGuardColor : undefined,
    rightBands: Array.isArray(data.rightBands) && data.rightBands.length > 0 && data.rightBands.length <= 128 && data.rightBands.every((band, i, bands) =>
      band && typeof band.offset === "number" && Number.isFinite(band.offset) && band.offset >= 0 && band.offset <= 1 &&
      (i === 0 ? band.offset === 0 : band.offset > bands[i - 1].offset) &&
      typeof band.color === "string" && CSS.supports("color", band.color) && typeof band.isDark === "boolean")
      ? data.rightBands.map(({ offset, color, isDark }) => ({ offset, color, isDark })) : undefined,
  };
}

export const PreviewCard = memo(function PreviewCard({
  slot,
  device,
  display,
  showToolbar = true,
  visualsActive = true,
  onScaleChange,
  onLoadStateChange,
  removable,
  onCapture,
  capturePending = false,
  focused,
  first,
  last,
  flowRecording = false,
  flowReplay,
  onFlowStep,
  onFlowResult,
  onPageReady,
  designOverlay,
  align = "center",
  showCaption = false,
  revealToolbar = false,
  focusNavigation,
  onChangeDevice,
  previousDevice,
  nextDevice,
  onSwitchDevice,
  positionKey,
  canvas = false,
  layer,
  toolbarHovered,
  onToolbarHover,
  onExpand,
  onFixPrompt,
  onPageScroll,
  expandLabel,
  layoutStatus,
  onLayoutCheck,
  onLayoutProblems,
  problemCount = 0,
  onProblems,
  onCompareIdentities,
  tracking = false,
}: PreviewCardProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  // The toolbar shows while the pointer is on the device itself (or its caption
  // or the toolbar), not anywhere in the column. It lingers briefly after the
  // pointer leaves so it can be reached across the gap above the device.
  const [ownHover, setOwnHover] = useState(false);
  const deviceHovered = onToolbarHover ? Boolean(toolbarHovered) : ownHover;
  const hoverTimer = useRef<number | undefined>(undefined);
  const holdToolbar = useStableCallback(() => {
    if (onToolbarHover) return onToolbarHover(slot.id, true);
    window.clearTimeout(hoverTimer.current);
    setOwnHover(true);
  });
  const releaseToolbar = useStableCallback(() => {
    if (onToolbarHover) return onToolbarHover(slot.id, false);
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setOwnHover(false), 300);
  });
  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);
  const bridgeStatusTimer = useRef<number | undefined>(undefined);
  const bridgeStatusRef = useRef<BridgeStatus>("checking");
  const previousScrollSyncRef = useRef(display.scrollSync);
  const navigationRef = useRef(new NavigationSyncState(slot.url));
  const bridgeDocumentRef = useRef<string | undefined>(undefined);
  const sampleVisuals = visualsActive && (device.type === "phone" || device.type === "tablet");
  const syncSettingsRef = useRef({ scroll: display.scrollSync, flow: flowRecording, visuals: sampleVisuals });
  syncSettingsRef.current = { scroll: display.scrollSync, flow: flowRecording, visuals: sampleVisuals };
  const currentPageUrlRef = useRef(slot.url);
  // A before/after capture briefly shows the device at the "before" zoom.
  // Local only: the slot's saved zoom never changes.
  const [captureScale, setCaptureScale] = useState<number | null>(null);
  const layoutScaleRef = useRef(1);
  const visualChecks = useVisualRegression({
    slotId: slot.id, deviceId: device.id, deviceName: device.name, orientation: slot.orientation,
    menuOpen: controlsOpen, getFrame: () => iframeRef.current,
    getUrl: () => currentPageUrlRef.current, dismissMenu: () => setControlsOpen(false),
    scaleForCapture: (factor) => new Promise(resolve => {
      setCaptureScale(factor === null ? null : layoutScaleRef.current * factor);
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }),
    tracking,
  });
  // Track changes starts with the page as it is now.
  useEffect(() => { if (tracking && bridgeStatusRef.current === "ready") visualChecks.scheduleTrack(); }, [tracking]);
  const sentFlowRunRef = useRef<string | null>(null);
  const pendingReplayStepRef = useRef<number | null>(null);
  // The step a replay continues from when one of its steps opens another page.
  const replayResumeStepRef = useRef<number | null>(null);
  const standalonePreview = Boolean((window as Window & { __MDV_STANDALONE_PREVIEW__?: boolean }).__MDV_STANDALONE_PREVIEW__);
  const [containerSize, setContainerSize] = useState<Size>({
    width: 0,
    height: 0,
  });
  const [preparedKey, setPreparedKey] = useState<string | null>(null);
  const [loadIssue, setLoadIssue] = useState<"resources" | "unverified" | null>(null);
  const healthRequest = useRef<string | null>(null);
  const healthTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    setLoadIssue(null);
    return () => { healthRequest.current = null; clearTimeout(healthTimer.current); };
  }, [slot.id, slot.url, slot.reloadToken]);
  const frameName = previewFrameName(slot.id, hidesPageScrollbars(device));
  const identityWidth = (supportsOrientation(device) ? toLandscapeAwareSize(device.cssViewport, slot.orientation) : device.cssViewport).width;
  const identity = slotIdentity(device, chromeMajor(navigator.userAgent), { language: slot.language, sendDensity: slot.sendDensity, width: identityWidth });
  // Rotating changes only the width the device reports; that updates without reloading the page.
  const identityKey = JSON.stringify([frameName, identity && { ...identity, density: identity.density && { dpr: identity.density.dpr } }]);
  const preparationKey = JSON.stringify([slot.url, slot.reloadToken, identityKey]);
  const identitiesRef = useRef({ [frameName]: identity ?? null });
  identitiesRef.current = { [frameName]: identity ?? null };
  const identityRef = useRef(identity);
  identityRef.current = identity;
  const reportedWidth = identity?.density?.width;
  const firstWidth = useRef(true);
  useEffect(() => {
    if (firstWidth.current) { firstWidth.current = false; return; }
    void preparePreview(slot.url, identitiesRef.current).catch(() => undefined);
  }, [reportedWidth]);
  const [headersReady, setHeadersReady] = useState(false);
  useEffect(() => {
    let active = true;
    setBlocked(false);
    // The frame loads only once the tab's rules fit it, so a reload after the
    // identity changed fetches the page that device gets.
    setPreparedKey(null);
    setHeadersReady(false);
    void preparePreview(slot.url, identitiesRef.current).then(({ headers }) => {
      if (!active) return;
      setPreparedKey(preparationKey);
      setHeadersReady(headers && Boolean(identity) && "fragmentDirective" in document);
    }).catch(() => {
      if (active) { setBlocked(true); onLoadStateChange?.(slot.id, "error"); }
    });
    return () => { active = false; };
  }, [slot.url, slot.reloadToken, slot.id, onLoadStateChange, identityKey]);
  const [blocked, setBlocked] = useState(false);
  // The hidden marker gives the frame's requests this device's headers, and its scripts this device's identity.
  const frameSrc = (url: string) => headersReady && identity ? tagPreviewRequest(url, frameName, undefined, identityToken(identity)) : url;
  useEffect(() => {
    const onPolicy = (event: SecurityPolicyViolationEvent) => {
      if (event.effectiveDirective !== "frame-src" && event.effectiveDirective !== "child-src") return;
      try {
        if (new URL(event.blockedURI).origin === new URL(slot.url).origin) { setBlocked(true); onLoadStateChange?.(slot.id, "error"); }
      } catch { /* Non-URL policy reports cannot identify this preview. */ }
    };
    window.addEventListener("securitypolicyviolation", onPolicy);
    return () => window.removeEventListener("securitypolicyviolation", onPolicy);
  }, [slot.url, slot.id, onLoadStateChange]);
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>("checking");
  const [keyboard, setKeyboard] = useState<MobileKeyboardState | undefined>();
  const [pageSurfaces, setPageSurfaces] = useState<BrowserSurfaceColors | undefined>();
  const [browserCollapsed, setBrowserCollapsed] = useState(0);
  const [browserSettingsOpen, setBrowserSettingsOpen] = useState(false);
  // Cards read actions and peers on demand; they re-render only when their
  // own active state changes, not whenever another preview loads or scrolls.
  const simulator = useSimulatorRef();
  const isActive = useSimulatorSelector(value => value.activeSlotId === slot.id);

  const canRotate = supportsOrientation(device);
  const effectiveOrientation = canRotate ? slot.orientation : "portrait";
  const viewportSize = canRotate
    ? toLandscapeAwareSize(device.cssViewport, effectiveOrientation)
    : device.cssViewport;
  const frameProfile = getFrameProfile(device);
  const keyboardPlatform = frameProfile.platform === "ios" ? "ios" : "android";
  const keyboardLandscape = viewportSize.width > viewportSize.height;
  const keyboardHeight = keyboard
    ? getMobileKeyboardHeight(keyboardPlatform, keyboardLandscape, usesTabletKeyboard(device.type, viewportSize), viewportSize.height)
    : 0;
  const browserGeometry = getBrowserGeometry(device, viewportSize, slot.browserPreferences, { orientation: effectiveOrientation, collapsed: browserCollapsed, keyboardHeight, viewportFit: pageSurfaces?.viewportFit });
  // The current frame resizes its usable viewport for the simulated keyboard.
  const keyboardOcclusion = 0;

  // Device chrome is always visible — no runtime toggle. Pass constants.
  const SHOW_CHROME = { showStatusBar: true, showUrlBar: true, showBattery: true } as const;

  const freeView = display.previewStyle === "free";
  const frameSize = freeView ? viewportSize : estimateDeviceFrameSize({
    device,
    showFrame: slot.showFrame,
    showStatusBar: SHOW_CHROME.showStatusBar,
    showUrlBar: SHOW_CHROME.showUrlBar,
    viewportSize,
  });

  const horizontalPad = device.type === "laptop" || device.type === "desktop" ? 40 : CARD_PAD;
  const availW = Math.max(80, containerSize.width - horizontalPad);
  const availH = Math.max(80, containerSize.height - CARD_PAD);
  const rawFitScale = Math.min(
    1,
    availW / frameSize.width,
    availH / frameSize.height,
  );
  const fitScale = rawFitScale;
  // While its corner is dragged a device follows the pointer; the zoom is saved when it is let go.
  const [liveZoom, setLiveZoom] = useState<number | null>(null);
  const layoutScale =
    liveZoom !== null
      ? fitScale * (liveZoom / 0.58)
      : slot.zoomMode === "actual"
        ? 1
        : slot.zoomMode === "fit"
          ? fitScale
          : fitScale * (slot.zoom / 0.58);
  layoutScaleRef.current = layoutScale;
  const scale = captureScale ?? layoutScale;

  useLayoutEffect(() => { onScaleChange?.(scale, slot.id); }, [onScaleChange, scale, slot.id]);

  const startDrag = usePointerDrag();
  // Devices can be dragged anywhere inside their space; resetting zoom recentres them.
  // On the canvas the spot is remembered, so a device is where it was left after a reload.
  const savedPosition = canvas ? slot.canvasPosition : undefined;
  const [offset, setOffset] = useState(() => savedPosition ?? { x: 0, y: 0 });
  const savePosition = (position: { x: number; y: number }) => {
    if (canvas) simulator.current.setSlotCanvasPosition(slot.id, position.x || position.y ? position : null);
  };
  // Switching to another device keeps where it was dragged. Rotating or Free
  // view starts from the default spot; another layout (such as showing one
  // device) starts from its default and the canvas returns to the saved spot.
  const placement = useRef({ effectiveOrientation, freeView, positionKey });
  useEffect(() => {
    const previous = placement.current;
    placement.current = { effectiveOrientation, freeView, positionKey };
    if (previous.effectiveOrientation !== effectiveOrientation || previous.freeView !== freeView) {
      setOffset({ x: 0, y: 0 });
      savePosition({ x: 0, y: 0 });
    } else if (previous.positionKey !== positionKey) {
      setOffset(savedPosition ?? { x: 0, y: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveOrientation, freeView, positionKey]);

  // On the canvas a device stops short of the row above it where its toolbar
  // shows, so the toolbar always has room above the device.
  const minOffsetY = (atScale: number) => {
    if (!canvas || !showToolbar || containerSize.height <= 0) return -Infinity;
    const free = containerSize.height - frameSize.height * atScale;
    return -(align === "bottom" ? free : free / 2);
  };
  useLayoutEffect(() => {
    const min = minOffsetY(scale);
    if (offset.y < min) setOffset(current => ({ ...current, y: min }));
  });

  function startMove(event: React.PointerEvent) {
    if (event.button !== 0) return;
    if ((event.target as Element).closest("button, a, input, textarea, select, [data-mobile-keyboard]") && event.currentTarget !== event.target && !(event.currentTarget as Element).matches("[data-move-handle]")) return;
    const origin = offset;
    let moved = origin;
    event.stopPropagation();
    startDrag(event, (deltaX, deltaY) => {
      moved = { x: origin.x + deltaX, y: Math.max(minOffsetY(scale), origin.y + deltaY) };
      setOffset(moved);
    }, () => { if (moved !== origin) savePosition(moved); });
  }

  // Dragging the corner resizes the device while its top-left corner stays
  // put: the device sits bottom-aligned and centred, so the drag offset makes up
  // for the growth.
  function startResize(event: React.PointerEvent) {
    if (event.button !== 0) return;
    event.stopPropagation();
    const origin = offset;
    const startScale = scale;
    const width = frameSize.width * startScale;
    const height = frameSize.height * startScale;
    let zoom = slot.zoomMode === "custom" ? slot.zoom : startScale / fitScale * 0.58;
    let moved = origin;
    startDrag(event, (deltaX, deltaY) => {
      const factor = Math.max((width + deltaX) / width, (height + deltaY) / height);
      zoom = clampZoom(startScale * factor / fitScale * 0.58);
      const nextScale = fitScale * (zoom / 0.58);
      const grownWidth = frameSize.width * nextScale - width;
      const grownHeight = frameSize.height * nextScale - height;
      setLiveZoom(zoom);
      moved = { x: origin.x + grownWidth / 2, y: Math.max(minOffsetY(nextScale), origin.y + (align === "bottom" ? grownHeight : grownHeight / 2)) };
      setOffset(moved);
    }, () => {
      simulator.current.setSlotZoom(slot.id, zoom);
      savePosition(moved);
      setLiveZoom(null);
    });
  }

  function resetView() {
    setOffset({ x: 0, y: 0 });
    savePosition({ x: 0, y: 0 });
    simulator.current.setSlotZoomMode(slot.id, "fit");
  }

  // The design overlay follows the logical screen wherever zoom, dragging, or
  // the frame put it. Measured in a layout effect so it lands before paint.
  const [screenBox, setScreenBox] = useState<ScreenBox | undefined>();
  const hasDesignOverlay = designOverlay !== undefined;
  useLayoutEffect(() => {
    if (!hasDesignOverlay) { setScreenBox(undefined); return; }
    const container = containerRef.current;
    // The logical screen is nested in the device box, so look for it first.
    const screen = container?.querySelector("[data-device-logical-screen]") ?? container?.querySelector("[data-device-capture]");
    if (!container || !screen) return;
    const outer = container.getBoundingClientRect();
    const inner = screen.getBoundingClientRect();
    const next = { left: inner.left - outer.left, top: inner.top - outer.top, width: inner.width, height: inner.height };
    setScreenBox(current => current && (["left", "top", "width", "height"] as const).every(key => Math.abs(current[key] - next[key]) < 0.05) ? current : next);
  }, [hasDesignOverlay, scale, offset.x, offset.y, containerSize.width, containerSize.height, device.id, effectiveOrientation, slot.showFrame, freeView, keyboardHeight, align]);

  function frameLoaded(frame: HTMLIFrameElement) {
    if (frame.getAttribute("src") === "about:blank") return;
    // Preparing the frame initially creates an empty document.
    // Its load event must not release a website's queue slot.
    try { if (frame.contentDocument?.URL === "about:blank") return; } catch { /* Cross-origin website. */ }
    clearTimeout(healthTimer.current);
    setLoadIssue(null);
    if (typeof chrome === "undefined" || !chrome.runtime?.id) {
      onLoadStateChange?.(slot.id, "loaded");
      return;
    }
    const requestId = crypto.randomUUID();
    healthRequest.current = requestId;
    frame.contentWindow?.postMessage({ type: "MDV_PREVIEW_HEALTH_REQUEST", slotId: slot.id, requestId }, "*");
    healthTimer.current = setTimeout(() => {
      if (healthRequest.current !== requestId) return;
      setLoadIssue("unverified");
      onLoadStateChange?.(slot.id, "incomplete");
    }, 5000);
  }

  const syncScrollBridge = (iframe: HTMLIFrameElement | null) => {
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
      {
        type: syncSettingsRef.current.scroll ? "MDV_SCROLL_SYNC_ENABLE" : "MDV_SCROLL_SYNC_DISABLE",
        slotId: slot.id,
      },
      "*",
    );
  };

  const syncFlowRecordingBridge = (iframe: HTMLIFrameElement | null) => {
    iframe?.contentWindow?.postMessage({
      type: syncSettingsRef.current.flow ? "MDV_FLOW_RECORDING_ENABLE" : "MDV_FLOW_RECORDING_DISABLE",
      slotId: slot.id,
    }, "*");
  };

  const syncVisualBridge = (iframe: HTMLIFrameElement | null) => {
    iframe?.contentWindow?.postMessage({
      type: "MDV_PREVIEW_ACTIVITY", slotId: slot.id,
      active: syncSettingsRef.current.visuals,
      sampleRightSurface: device.id === "apple-iphone-duo-folded-2026",
    }, "*");
  };
  useEffect(() => { syncVisualBridge(iframeRef.current); }, [sampleVisuals, slot.id, device.id]);

  const sendFlowReplay = (startIndex = 0) => {
    if (!flowReplay) return;
    iframeRef.current?.contentWindow?.postMessage({
      type: "MDV_REPLAY_FLOW",
      slotId: slot.id,
      runId: flowReplay.runId,
      startIndex,
      steps: flowReplay.steps,
    }, "*");
  };

  const sendKeyboardAction = (action: MobileKeyboardAction) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "MDV_KEYBOARD_ACTION", slotId: slot.id, ...action },
      "*",
    );
    if (action.action === "dismiss") setKeyboard(undefined);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Use the browser's measured box instead of forcing a layout per card.
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      // A hidden preview reports 0×0. Keep its last size so the document stays mounted.
      if (width === 0 && height === 0) return;
      setContainerSize(current => current.width === width && current.height === height ? current : { width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setBlocked(false);
    setBridgeStatus("checking");
    setKeyboard(undefined);
    setBrowserCollapsed(0);
    setBrowserSettingsOpen(false);
    setControlsOpen(false);
  }, [device.id, effectiveOrientation, slot.reloadToken, slot.url]);

  useEffect(() => {
    if (!controlsOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!toolbarRef.current?.contains(event.target as Node)) setControlsOpen(false);
    };
    const close = () => setControlsOpen(false);
    const target = getViewerEventTarget();
    target.addEventListener("pointerdown", closeOutside);
    window.addEventListener("blur", close);
    return () => { target.removeEventListener("pointerdown", closeOutside); window.removeEventListener("blur", close); };
  }, [controlsOpen]);

  useEffect(() => {
    if (!keyboard) return;
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      sendKeyboardAction({ action: "dismiss" });
    };
    getViewerEventTarget().addEventListener("keydown", dismissOnEscape);
    return () => getViewerEventTarget().removeEventListener("keydown", dismissOnEscape);
  }, [keyboard, slot.id]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    if (!keyboard) {
      iframe.contentWindow.postMessage({ type: "MDV_KEYBOARD_VIEWPORT_RESET", slotId: slot.id }, "*");
      return;
    }
    const animationFrame = window.requestAnimationFrame(() => {
      iframe.contentWindow?.postMessage({
        type: "MDV_KEYBOARD_VIEWPORT",
        slotId: slot.id,
        platform: keyboardPlatform,
        keyboardHeight,
        occludedBottom: keyboardOcclusion,
      }, "*");
    });
    return () => window.cancelAnimationFrame(animationFrame);
  }, [keyboard, keyboardHeight, keyboardOcclusion, keyboardPlatform, slot.id]);

  useEffect(() => {
    bridgeStatusRef.current = bridgeStatus;
  }, [bridgeStatus]);

  useEffect(() => {
    setPageSurfaces(undefined);
  }, [slot.reloadToken, slot.url]);

  // Register the iframe with the in-iframe scroll-sync bridge. The content script
  // is injected by extension-routes/messaging, so we only need to post the
  // registration + scroll-sync toggle here. Inspect / live features are removed.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const register = () => {
      if (standalonePreview) {
        setBridgeStatus("ready");
        setBlocked(false);
      } else {
        setBridgeStatus("checking");
      }
      iframe.contentWindow?.postMessage(
        {
          type: "MDV_PREVIEW_REGISTER",
          slotId: slot.id,
          hideScrollbars: hidesPageScrollbars(device),
          sampleRightSurface: device.id === "apple-iphone-duo-folded-2026",
          visualsActive: syncSettingsRef.current.visuals,
        },
        "*",
      );
      syncScrollBridge(iframe);
      syncFlowRecordingBridge(iframe);

      if (standalonePreview) return;

      window.clearTimeout(bridgeStatusTimer.current);
      bridgeStatusTimer.current = window.setTimeout(() => {
        if (bridgeStatusRef.current === "checking") {
          // Slow loading or unavailable bridge features do not prove that the
          // website itself is blocked. Keep the document visible and retryable.
          setBridgeStatus("unavailable");
        }
      }, 6000);
    };

    iframe.addEventListener("load", register);
    register();

    return () => {
      iframe.removeEventListener("load", register);
      window.clearTimeout(bridgeStatusTimer.current);
    };
  }, [blocked, containerSize.width, device.id, device.type, flowRecording, slot.id, slot.reloadToken, slot.url, standalonePreview]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data;
      if (!data || typeof data !== "object" || data.slotId !== slot.id) return;
      // A page that lost the marker (a redirect replaced its URL's hash) asks
      // again, so the pages it opens next carry the device for their scripts.
      if (data.type === "MDV_IDENTITY_TOKEN_REQUEST") {
        const current = identityRef.current;
        if (current) iframeRef.current?.contentWindow?.postMessage({ type: "MDV_IDENTITY_TOKEN", slotId: slot.id, token: identityToken(current) }, "*");
        return;
      }
      if (data.type === "MDV_PREVIEW_HEALTH") {
        const errors = readPreviewHealthReport(data, healthRequest.current);
        if (!errors) return;
        clearTimeout(healthTimer.current);
        const incomplete = errors.scripts + errors.styles > 0;
        setLoadIssue(incomplete ? "resources" : null);
        onLoadStateChange?.(slot.id, incomplete ? "incomplete" : "loaded");
        return;
      }
      if (data.type === "MDV_BROWSER_SCROLL") {
        const top = Number(data.scrollTop), delta = Number(data.deltaTop);
        if (Number.isFinite(top) && Number.isFinite(delta)) {
          setBrowserCollapsed(current => nextBrowserCollapse(current, top, delta));
          onPageScroll?.(top);
        }
        return;
      }

      if (data.type === "MDV_PREVIEW_READY") {
        const navigation = navigationRef.current.observe(data.url, typeof data.documentId === "string" ? data.documentId : undefined);
        if (!navigation) return;
        const newDocument = typeof data.documentId === "string" && data.documentId !== bridgeDocumentRef.current;
        bridgeDocumentRef.current = data.documentId;
        if (newDocument) { onPageReady?.(slot.id); visualChecks.scheduleTrack(); }
        // READY also covers a bridge injected after the iframe's load event.
        syncScrollBridge(iframeRef.current);
        syncFlowRecordingBridge(iframeRef.current);
        syncVisualBridge(iframeRef.current);
        setBridgeStatus("ready");
        setBlocked(false);
        const nextSurfaces = readPageSurfaces(data as Record<string, unknown>);
        if (nextSurfaces) setPageSurfaces(nextSurfaces);
        const resumeStep = pendingReplayStepRef.current ?? (newDocument ? replayResumeStepRef.current : null);
        if (resumeStep !== null) {
          pendingReplayStepRef.current = null;
          replayResumeStepRef.current = null;
          window.setTimeout(() => sendFlowReplay(resumeStep), 150);
        }
        currentPageUrlRef.current = navigation.url;
        simulator.current.observeSlotUrl(slot.id, navigation.url);
        if (display.navigationSync && navigation.changed) {
          window.dispatchEvent(new CustomEvent("MDV_NAVIGATION_EVENT", {
            detail: { slotId: slot.id, url: navigation.url },
          }));
        }
        if (display.scrollSync && newDocument) {
          window.dispatchEvent(new CustomEvent("MDV_SCROLL_SYNC_REQUEST", { detail: { targetSlotId: slot.id } }));
        }
        return;
      }

      if (data.type === "MDV_PAGE_SURFACE_COLORS") {
        const nextSurfaces = readPageSurfaces(data as Record<string, unknown>);
        if (nextSurfaces) setPageSurfaces(nextSurfaces);
        return;
      }

      if (data.type === "MDV_PREVIEW_BLOCKED_OR_UNAVAILABLE") {
        setBridgeStatus("blocked");
        setBlocked(true);
        return;
      }

      if (data.type === "MDV_SCROLL_SYNC_EVENT") {
        setBridgeStatus("ready");
        // Browser controls use a separate scroll event even when sync is off.
        if (flowRecording) {
          onFlowStep?.({
            kind: "scroll",
            scrollLeft: Number(data.scrollLeft ?? 0),
            scrollTop: Number(data.scrollTop ?? 0),
            scrollTargetSelector: typeof data.scrollTargetSelector === "string" ? data.scrollTargetSelector : undefined,
            url: typeof data.url === "string" ? data.url : undefined,
          }, slot.id);
        }
        if (display.scrollSync) broadcastScrollSync(data as ScrollSyncPayload);
        return;
      }

      if (data.type === "MDV_INTERACTION_EVENT") {
        const interaction = data as InteractionSyncPayload;
        if (flowRecording) {
          const { slotId: _slotId, ...step } = interaction;
          onFlowStep?.(step as Omit<FlowStep, "id">, slot.id);
        }
        if (display.scrollSync) broadcastInteractionSync(interaction);
        return;
      }

      if (data.type === "MDV_FLOW_REPLAY_RESULT") {
        pendingReplayStepRef.current = null;
        replayResumeStepRef.current = null;
        onFlowResult?.(data as FlowReplayResult);
        return;
      }

      if (data.type === "MDV_FLOW_REPLAY_PROGRESS" && flowReplay?.runId === data.runId) {
        replayResumeStepRef.current = Math.max(0, Number(data.nextStep ?? 0));
        return;
      }

      if (data.type === "MDV_KEYBOARD_FOCUS") {
        if ((device.type !== "phone" && device.type !== "tablet") || !["ios", "android"].includes(frameProfile.platform)) return;
        setKeyboard({
          inputType: typeof data.inputType === "string" ? data.inputType : "text",
          inputMode: typeof data.inputMode === "string" ? data.inputMode : "",
          multiline: Boolean(data.multiline),
          autoCapitalize: typeof data.autoCapitalize === "string" ? data.autoCapitalize : "",
          enterKeyHint: typeof data.enterKeyHint === "string" ? data.enterKeyHint : "",
          fieldKey: typeof data.selector === "string" ? data.selector : "",
          canPrevious: Boolean(data.canPrevious),
          canNext: Boolean(data.canNext),
          language: typeof data.language === "string" ? data.language : "",
        });
        return;
      }

      if (data.type === "MDV_KEYBOARD_BLUR") {
        setKeyboard(undefined);
        return;
      }

    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [device.id, device.type, frameProfile.platform, display.navigationSync, display.scrollSync, flowRecording, flowReplay, onFlowResult, onFlowStep, onLoadStateChange, onPageReady, onPageScroll, slot.id, slot.url]);

  useEffect(() => {
    if (!display.scrollSync || blocked) return;

    const onSync = (event: Event) => {
      const detail = (event as CustomEvent<ScrollSyncPayload>).detail;
      if (!detail || detail.slotId === slot.id || (detail.targetSlotId && detail.targetSlotId !== slot.id)) return;
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: "MDV_APPLY_SCROLL_SYNC",
          slotId: slot.id,
          url: detail.url,
          scrollLeft: detail.scrollLeft,
          scrollTop: detail.scrollTop,
          deltaLeft: detail.deltaLeft,
          deltaTop: detail.deltaTop,
          scrollTargetSelector: detail.scrollTargetSelector,
        },
        "*",
      );
    };

    window.addEventListener("MDV_SCROLL_SYNC_EVENT", onSync);
    return () => window.removeEventListener("MDV_SCROLL_SYNC_EVENT", onSync);
  }, [blocked, display.scrollSync, slot.id]);

  useEffect(() => {
    if (!display.scrollSync || blocked) return;
    const onRequest = (event: Event) => {
      const { targetSlotId } = (event as CustomEvent<{ targetSlotId: string }>).detail;
      const { activeSlotId, slots } = simulator.current;
      const sourceId = activeSlotId !== targetSlotId ? activeSlotId : slots.find(candidate => candidate.id !== targetSlotId)?.id;
      if (sourceId !== slot.id) return;
      iframeRef.current?.contentWindow?.postMessage({ type: "MDV_SCROLL_SYNC_SNAPSHOT", slotId: slot.id, targetSlotId }, "*");
    };
    window.addEventListener("MDV_SCROLL_SYNC_REQUEST", onRequest);
    return () => window.removeEventListener("MDV_SCROLL_SYNC_REQUEST", onRequest);
  }, [blocked, display.scrollSync, simulator, slot.id]);

  useEffect(() => {
    if (!display.scrollSync || blocked) return;

    const onSync = (event: Event) => {
      const detail = (event as CustomEvent<InteractionSyncPayload>).detail;
      if (!detail || detail.slotId === slot.id) return;
      // Navigation sync owns links. Replaying their click as well loads each
      // follower twice and makes the navigation switch ineffective when off.
      if (detail.kind === "click" && (detail.tagName === "a" || detail.ctrlKey || detail.metaKey || detail.shiftKey || detail.button)) return;
      const { slotId: _sourceSlotId, ...payload } = detail;
      iframeRef.current?.contentWindow?.postMessage(
        {
          ...payload,
          type: "MDV_APPLY_INTERACTION",
          slotId: slot.id,
        },
        "*",
      );
    };

    window.addEventListener("MDV_INTERACTION_EVENT", onSync);
    return () => window.removeEventListener("MDV_INTERACTION_EVENT", onSync);
  }, [blocked, display.scrollSync, slot.id]);

  useLayoutEffect(() => {
    syncScrollBridge(iframeRef.current);
    const enabling = display.scrollSync && !previousScrollSyncRef.current;
    if (enabling && simulator.current.activeSlotId === slot.id) {
      iframeRef.current?.contentWindow?.postMessage({
        type: "MDV_SCROLL_SYNC_SNAPSHOT",
        slotId: slot.id,
      }, "*");
    }
    previousScrollSyncRef.current = display.scrollSync;
  }, [display.scrollSync, slot.id]);

  useEffect(() => {
    syncFlowRecordingBridge(iframeRef.current);
  }, [flowRecording, slot.id]);

  useEffect(() => {
    if (!flowReplay || bridgeStatus !== "ready" || blocked || sentFlowRunRef.current === flowReplay.runId) return;
    const startIndex = flowReplay.startIndexes?.[slot.id];
    if (flowReplay.startIndexes && startIndex === undefined) return;
    sentFlowRunRef.current = flowReplay.runId;
    if (
      !flowReplay.startIndexes
      && flowReplay.startUrl
      && currentPageUrlRef.current !== flowReplay.startUrl
      && iframeRef.current
    ) {
      pendingReplayStepRef.current = 0;
      setBridgeStatus("checking");
      const startUrl = flowReplay.startUrl;
      void preparePreview(startUrl, identitiesRef.current).then(() => { if (iframeRef.current) iframeRef.current.src = frameSrc(startUrl); }).catch(() => setBlocked(true));
      return;
    }
    sendFlowReplay(startIndex ?? 0);
  }, [blocked, bridgeStatus, flowReplay, slot.id]);


  useEffect(() => {
    if (!display.navigationSync) return;
    const onNavigation = (event: Event) => {
      const detail = (event as CustomEvent<{ slotId: string; url: string }>).detail;
      if (!detail || detail.slotId === slot.id || !navigationRef.current.follow(detail.url)) return;
      simulator.current.setSlotUrl(slot.id, detail.url);
    };
    window.addEventListener("MDV_NAVIGATION_EVENT", onNavigation);
    return () => window.removeEventListener("MDV_NAVIGATION_EVENT", onNavigation);
  }, [display.navigationSync, simulator, slot.id, slot.url]);




  const scaledHeight = frameSize.height * scale;
  const deviceTop = containerSize.height > 0
    ? align === "bottom" ? containerSize.height - scaledHeight : (containerSize.height - scaledHeight) / 2
    : 0;
  // The toolbar follows a dragged device, just above it, and always stays
  // fully on screen.
  const [toolbarPlace, setToolbarPlace] = useState<{ top: number; shift: number; arrow: number }>({ top: 6, shift: 0, arrow: 0 });
  // Measured after layout changes and again just before the toolbar appears,
  // since column widths may still be animating when the layout first settles.
  const placeToolbar = useStableCallback(() => {
    const wrapper = toolbarRef.current;
    const bar = wrapper?.querySelector<HTMLElement>("[data-device-toolbar]");
    const box = containerRef.current?.querySelector<HTMLElement>("[data-device-capture]");
    if (!wrapper || !bar || !box) return;
    // The section, not the shifted wrapper, gives the card's own position.
    const card = (wrapper.parentElement ?? wrapper).getBoundingClientRect();
    const bounds = (wrapper.closest("main, [data-all-devices-view]") ?? document.documentElement).getBoundingClientRect();
    const deviceBox = box.getBoundingClientRect();
    const half = bar.offsetWidth / 2;
    const cardCenter = card.left + card.width / 2;
    const min = bounds.left + 8 + half;
    const max = bounds.right - 8 - half;
    const deviceCenter = deviceBox.left + deviceBox.width / 2;
    const center = min > max ? (bounds.left + bounds.right) / 2 : Math.min(max, Math.max(min, deviceCenter));
    // The arrow under the bar still points at the device when the bar is kept on screen.
    const arrow = Math.round(Math.max(-(half - 20), Math.min(half - 20, deviceCenter - center)));
    const top = Math.max(bounds.top + 6, deviceBox.top - TOOLBAR_GAP - (bar.offsetHeight || 40));
    setToolbarPlace(current => {
      const next = { top: Math.round(top - card.top), shift: Math.round(center - cardCenter), arrow };
      return current.top === next.top && current.shift === next.shift && current.arrow === next.arrow ? current : next;
    });
  });
  useLayoutEffect(placeToolbar, [placeToolbar, offset.x, offset.y, scale, containerSize.width, containerSize.height, device.id, showToolbar, capturePending, focusNavigation]);
  // While the pointer is on the toolbar it stays put, so repeated clicks on
  // previous/next keep hitting the same button as the device changes size.
  const [pinnedToolbar, setPinnedToolbar] = useState<{ top: number; shift: number; arrow: number } | null>(null);
  // Hiding the toolbar for a capture removes it from under the pointer without
  // a pointerleave; a pin kept from then would make it jump away on return.
  const toolbarShown = showToolbar && !capturePending && !visualChecks.capturing;
  useEffect(() => { if (!toolbarShown) setPinnedToolbar(null); }, [toolbarShown]);
  const toolbarAt = pinnedToolbar ?? toolbarPlace;
  const toolbarVisible = toolbarShown && (revealToolbar || deviceHovered || controlsOpen || languageOpen);
  // Without a stacking context per column, each part of a device is layered by
  // its place in the canvas, and a showing toolbar is drawn above every device.
  const layerStyle = layer === undefined ? undefined : { zIndex: 10 + layer };
  const statusTop = Math.max(6, TOOLBAR_SPACE * (showToolbar ? 1 : 0) + deviceTop + offset.y + 8);
  const openInTab = () => window.open(currentPageUrlRef.current || slot.url, "_blank", "noopener,noreferrer");
  const viewportLabel = `${viewportSize.width}×${viewportSize.height}`;

  return (
    <section
      data-preview-slot-id={slot.id}
      data-active-slot={isActive || undefined}
      className={`group/device @container/viewport relative flex h-full min-h-0 min-w-0 flex-col ${canvas ? "pointer-events-none" : ""}`}
      onClick={() => simulator.current.setActiveSlot(slot.id)}
      onFocus={() => { simulator.current.setActiveSlot(slot.id); placeToolbar(); }}
      onPointerEnter={placeToolbar}
    >
      {/* Clip enlarged previews here. The toolbar sits outside this clip box,
          over its top inset, so a narrow column never cuts it off. */}
      <div className={`relative min-h-0 flex-1 ${canvas ? "overflow-visible" : "overflow-hidden"} ${showToolbar ? "pt-16" : ""}`}>
        <div
          ref={containerRef}
          data-design-overlay-surface
          className={`relative flex size-full min-h-0 min-w-0 justify-center ${align === "bottom" ? "items-end" : "items-center"}`}
        >
          {containerSize.width > 0 && (
            <div
              // A device screenshot briefly paints known backdrops behind the
              // device, spread well past its edges even at small zoom, to cut it
              // out of the workspace (see captureDeviceCutout).
              className={`pointer-events-auto shrink-0 origin-center cursor-grab touch-none active:cursor-grabbing data-[capture-matte=black]:bg-black data-[capture-matte=black]:shadow-[0_0_0_32px_black] data-[capture-matte=white]:bg-white data-[capture-matte=white]:shadow-[0_0_0_32px_white] ${freeView ? "relative overflow-hidden rounded-md shadow-[0_0_0_1px_var(--color-line),0_8px_28px_rgb(15_23_42/0.08)]" : ""}`}
              data-device-capture
              data-free-device-view={freeView ? "" : undefined}
              onPointerEnter={holdToolbar}
              onPointerLeave={releaseToolbar}
              onPointerDown={startMove}
              onDoubleClick={event => { if (event.target === event.currentTarget || !(event.target as Element).closest("button")) { setOffset({ x: 0, y: 0 }); savePosition({ x: 0, y: 0 }); } }}
              style={{
                ...layerStyle,
                width: frameSize.width,
                height: frameSize.height,
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                marginTop: `${(frameSize.height * scale - frameSize.height) / 2}px`,
                marginBottom: `${(frameSize.height * scale - frameSize.height) / 2}px`,
                marginLeft: `${(frameSize.width * scale - frameSize.width) / 2}px`,
                marginRight: `${(frameSize.width * scale - frameSize.width) / 2}px`,
                ...(freeView ? {
                  "--mdv-free-width": `${viewportSize.width}px`,
                  "--mdv-free-height": `${Math.max(120, viewportSize.height - keyboardHeight)}px`,
                } : {}),
              }}
            >
              {renderFrame()}
            </div>
          )}
          {canvas && showToolbar && containerSize.width > 0 && !capturePending && (
            <button
              type="button"
              data-resize-handle
              aria-label={t("resizeDevice")}
              title={t("resizeDevice")}
              onPointerDown={startResize}
              onPointerEnter={holdToolbar}
              onPointerLeave={releaseToolbar}
              onDoubleClick={resetView}
              className="pointer-events-auto absolute z-10 grid size-6 cursor-nwse-resize place-items-center rounded-full border border-line bg-surface text-muted opacity-0 shadow-float transition-opacity hover:text-ink focus-visible:opacity-100 group-hover/device:opacity-100 outline-none focus-visible:ring-2 focus-visible:ring-accent"
              style={{
                ...(layer !== undefined && { zIndex: 10 + layer }),
                left: (containerSize.width - frameSize.width * scale) / 2 + offset.x + frameSize.width * scale - 12,
                top: deviceTop + offset.y + scaledHeight - 12,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M9 3 3 9M9 6.5 6.5 9" /></svg>
            </button>
          )}
          {designOverlay && screenBox && <DesignOverlay {...designOverlay} screen={viewportSize} screenBox={screenBox} />}
        </div>


        {loadIssue && !blocked && !capturePending && <div role="status" data-preview-load-issue={loadIssue}
          className="pointer-events-none absolute inset-x-0 z-30 flex justify-center px-3"
          style={{ ...layerStyle, top: statusTop }}>
          <div className="pointer-events-auto flex max-w-full items-center gap-1.5 rounded-lg border border-warn-line bg-warn-soft py-1 pe-1 ps-2.5 text-xs font-semibold text-warn shadow-float">
            <AlertIcon size={13} className="shrink-0"/>
            <span className="min-w-0 truncate">{t(loadIssue === "resources" ? "previewResourceError" : "previewLoadUnverified")}</span>
            <button type="button" onClick={(event) => { event.stopPropagation(); simulator.current.reloadSlot(slot.id); }} className="h-6 shrink-0 rounded-md bg-surface px-2 text-xs font-semibold text-warn">{t("retry")}</button>
          </div>
        </div>}
      </div>

      {toolbarShown && (
        <div ref={toolbarRef} className="pointer-events-none absolute inset-x-0 z-40"
          onPointerEnter={() => { holdToolbar(); setPinnedToolbar(toolbarPlace); }}
          onPointerLeave={() => { releaseToolbar(); setPinnedToolbar(null); }}
          style={{ top: toolbarAt.top, transform: `translateX(${toolbarAt.shift}px)`, ...(layer !== undefined && { zIndex: toolbarVisible ? 1000 : 10 + layer }) }}>
          <PreviewToolbar
            deviceName={device.name}
            deviceLabel={shortName(device.name)}
            arrowOffset={toolbarAt.arrow}
            zoomLabel={`${Math.round(scale * 100)}%`}
            canRotate={canRotate}
            removable={removable}
            reloading={bridgeStatus === "checking"}
            revealed={revealToolbar || deviceHovered}
            menuOpen={controlsOpen}
            tourTarget={first ? "device-controls" : undefined}
            focusNavigation={focusNavigation}
            onChangeDevice={onChangeDevice && (() => onChangeDevice(slot.id))}
            previousDeviceName={previousDevice?.name}
            nextDeviceName={nextDevice?.name}
            onPreviousDevice={previousDevice && onSwitchDevice && (() => onSwitchDevice(slot.id, previousDevice.id))}
            onNextDevice={nextDevice && onSwitchDevice && (() => onSwitchDevice(slot.id, nextDevice.id))}
            onRotate={() => simulator.current.rotateSlot(slot.id)}
            onZoomOut={() => simulator.current.zoomSlot(slot.id, "out")}
            onZoomIn={() => simulator.current.zoomSlot(slot.id, "in")}
            onResetZoom={resetView}
            onMoveStart={startMove}
            expandLabel={expandLabel}
            onReload={() => simulator.current.reloadSlot(slot.id)}
            onOpenInTab={openInTab}
            onExpand={onExpand && (() => onExpand(slot.id))}
            onScreenshot={onCapture && (() => onCapture(slot.id))}
            screenshotPending={capturePending}
            onCompareBefore={FEATURES.visualChecks && visualChecks.hasBefore() ? visualChecks.compare : undefined}
            compareBeforeLabel={t("visualCompareButton")}
            onLayoutProblems={onLayoutProblems && layoutStatus?.status === "done" && layoutStatus.count > 0 ? () => onLayoutProblems(slot.id) : undefined}
            layoutProblemCount={layoutStatus?.count}
            onMenu={() => { setLanguageOpen(false); setControlsOpen(value => !value); }}
            onLanguage={identity && onCompareIdentities ? () => { setControlsOpen(false); setLanguageOpen(value => !value); } : undefined}
            languageCode={slot.language?.split("-")[0].toUpperCase()}
            languageLabel={t("languageButton", { language: slot.language ? languageName(slot.language) : t("languageBrowserDefault") })}
            languageOpen={languageOpen}
            languagePicker={
              <LanguagePicker
                deviceName={shortName(device.name)}
                language={slot.language}
                sendDensity={slot.sendDensity !== false}
                density={identity?.density?.dpr ?? (device.pixelRatio >= 0.5 && device.pixelRatio <= 5 ? Math.round(device.pixelRatio * 1000) / 1000 : undefined)}
                onLanguage={language => { simulator.current.setSlotLocale(slot.id, { language }); setLanguageOpen(false); }}
                onDensity={sendDensity => simulator.current.setSlotLocale(slot.id, { sendDensity })}
                onCompare={() => { setLanguageOpen(false); onCompareIdentities?.(); }}
                onClose={() => setLanguageOpen(false)}
              />
            }
            onRemove={() => simulator.current.removeSlot(slot.id)}
            menu={
              <div data-viewport-actions
                onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); setControlsOpen(false); setBrowserSettingsOpen(false); } }}
                className="absolute end-0 top-full z-[60] mt-3 flex max-h-[calc(100dvh-120px)] w-72 flex-col gap-0.5 overflow-y-auto overflow-x-hidden whitespace-normal rounded-2xl bg-surface p-1.5 text-ink shadow-popover">
                {browserSettingsOpen ? (
                  <div role="group" aria-label={t("browserAppearance")} className="p-1.5">
                    <BrowserAppearanceSettings device={device} slot={slot} geometry={browserGeometry} onClose={() => setBrowserSettingsOpen(false)}/>
                  </div>
                ) : <>
                  <MenuItem label={t("openInTab")} hint={t("openInTabHint")} onClick={() => { setControlsOpen(false); openInTab(); }}><OpenInTabIcon size={15}/></MenuItem>
                  {onFixPrompt && <MenuItem label={t("fixPromptForDevice")} hint={t("fixPromptDeviceHint")} onClick={() => { setControlsOpen(false); onFixPrompt(slot.id); }}><FixPromptIcon size={15}/></MenuItem>}
                  {FEATURES.visualChecks && visualChecks.menuItems}
                  {onLayoutCheck && <MenuItem label={t("checkLayoutOnDevice")} hint={t("checkLayoutDeviceHint")} onClick={() => { setControlsOpen(false); onLayoutCheck(slot.id); }}><LayoutCheckIcon size={15}/></MenuItem>}
                  {frameProfile.platform === "ios" && <MenuItem label={t("browserAppearance")} hint={t("browserAppearanceHint")} onClick={() => setBrowserSettingsOpen(true)}><SettingsIcon size={15}/></MenuItem>}
                  {!focused && (!first || !last) && (
                    // The order devices take in One view and in screenshots.
                    <div role="group" aria-label={t("moveOrderHint")} className="mt-1 grid gap-1 border-t border-line-soft px-1 pb-0.5 pt-2">
                      <div className="flex gap-1">
                        <button type="button" disabled={first} onClick={event => { event.stopPropagation(); setControlsOpen(false); simulator.current.moveSlot(slot.id, "left"); }}
                          className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-sunken text-[12.5px] font-semibold text-ink hover:bg-line-soft disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-accent">
                          <ChevronLeftIcon size={14} className="rtl:rotate-180"/>{t("moveEarlier")}
                        </button>
                        <button type="button" disabled={last} onClick={event => { event.stopPropagation(); setControlsOpen(false); simulator.current.moveSlot(slot.id, "right"); }}
                          className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-sunken text-[12.5px] font-semibold text-ink hover:bg-line-soft disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-accent">
                          {t("moveLater")}<ChevronRightIcon size={14} className="rtl:rotate-180"/>
                        </button>
                      </div>
                      <p className="px-1 text-[11.5px] leading-snug text-muted">{t("moveOrderHint")}</p>
                    </div>
                  )}
                </>}
              </div>
            }
          />
        </div>
      )}

      {showCaption && (
        <div className={`flex h-11 shrink-0 items-center justify-center px-2 ${canvas ? "pointer-events-none [&>*]:pointer-events-auto" : ""}`}
          style={canvas ? { ...layerStyle, transform: `translate(${offset.x}px, ${offset.y}px)` } : undefined}>
          {/* Just the name; the size is in its tooltip and the device's bar. */}
          <button type="button" data-device-caption title={`${device.name} · ${viewportLabel}`} onClick={() => simulator.current.setActiveSlot(slot.id)}
            onPointerEnter={holdToolbar} onPointerLeave={releaseToolbar}
            className="flex min-w-0 max-w-full items-baseline gap-2 rounded-[7px] px-2 py-1 font-semibold text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <span className="truncate text-[13px]">{shortName(device.name)}</span>
            {layoutStatus && <LayoutChip status={layoutStatus} />}
          </button>
          {slot.language && identity && onCompareIdentities && (
            <button type="button" data-language-chip onClick={() => { setControlsOpen(false); setLanguageOpen(true); }} onPointerEnter={holdToolbar} onPointerLeave={releaseToolbar}
              aria-label={t("languageButton", { language: languageName(slot.language) })}
              className="inline-flex h-[22px] max-w-[45%] shrink items-center gap-1 whitespace-nowrap rounded-full bg-accent-soft pe-2 ps-1.5 text-[11px] font-semibold text-accent-strong outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <GlobeIcon size={11} /><span lang={slot.language} className="truncate">{languageName(slot.language)}</span>
            </button>
          )}
          {tracking && visualChecks.tracked && (
            <button type="button" data-track-chip={visualChecks.tracked.paused ? "paused" : visualChecks.tracked.count} title={visualChecks.tracked.paused ? t(visualChecks.tracked.paused) : undefined}
              onClick={visualChecks.tracked.paused ? undefined : visualChecks.showTracked} onPointerEnter={holdToolbar} onPointerLeave={releaseToolbar}
              className={`inline-flex h-[22px] shrink-0 items-center gap-1 whitespace-nowrap rounded-full pe-2 ps-1.5 text-[11px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-accent ${visualChecks.tracked.count && !visualChecks.tracked.paused ? "bg-amber-500/15 text-warn hover:bg-amber-500/20" : "bg-sunken text-muted hover:text-ink-2"}`}>
              <span aria-hidden="true" className={`size-1.5 rounded-full ${visualChecks.tracked.paused ? "bg-faint" : visualChecks.tracked.count ? "bg-amber-500" : "bg-accent"}`} />
              {visualChecks.tracked.paused ? t("trackPaused") : visualChecks.tracked.count === 0 ? t("trackWatching") : visualChecks.tracked.count === 1 ? t("trackChangesOne") : t("trackChangesMany", { count: visualChecks.tracked.count })}
            </button>
          )}
          {problemCount > 0 && onProblems && (
            <button type="button" data-problems-chip onClick={() => onProblems(slot.id)} onPointerEnter={holdToolbar} onPointerLeave={releaseToolbar}
              className="inline-flex h-[22px] shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-red-500/10 pe-2 ps-1.5 text-[11px] font-semibold text-danger outline-none hover:bg-red-500/15 focus-visible:ring-2 focus-visible:ring-accent">
              <AlertIcon size={10} strokeWidth={3} />{problemCount === 1 ? t("problemsOne") : t("problemsMany", { count: problemCount })}
            </button>
          )}
        </div>
      )}
      <div className="pointer-events-auto contents">{visualChecks.dialog}</div>
    </section>
  );

  function renderFrame() {
    return (
      <DeviceFrame
        device={device}
        showFrame={slot.showFrame}
        showStatusBar={SHOW_CHROME.showStatusBar}
        showBattery={SHOW_CHROME.showBattery}
        showUrlBar={SHOW_CHROME.showUrlBar}
        darkMode={display.darkMode}
        url={slot.url}
        viewportSize={viewportSize}
        orientation={effectiveOrientation}
        scrollProgress={browserCollapsed}
        browserPreferences={slot.browserPreferences}
        keyboard={keyboard}
        onKeyboardAction={sendKeyboardAction}
        pageSurfaces={pageSurfaces}
      >
        <PreviewSurface
          guardEdges={!freeView && slot.showFrame}
          scale={scale}
          topColor={browserGeometry.neutralChrome ? pageSurfaces?.topGuardColor : pageSurfaces?.top ?? "#ffffff"}
          bottomColor={browserGeometry.neutralChrome ? pageSurfaces?.bottomGuardColor : pageSurfaces?.bottom ?? "#ffffff"}
        >
          {blocked ? (
            <BlockedView
              url={slot.url}
              onCapture={onCapture && (() => onCapture(slot.id))}
              onReload={() => simulator.current.reloadSlot(slot.id)}
            />
          ) : (
            <iframe
              ref={iframeRef}
              key={`${slot.id}-${slot.reloadToken}`}
              name={frameName}
              title={t("devicePreview", { name: device.name })}
              src={preparedKey === preparationKey ? frameSrc(slot.url) : "about:blank"}
              loading="eager"
              className={`block size-full overflow-auto border-0 ${display.darkMode ? "bg-[#0f172a] [color-scheme:dark]" : "bg-white [color-scheme:light]"} ${hidesPageScrollbars(device) ? "[scrollbar-width:none]" : ""}`}
              // Match the page at fractional raster edges, including the clear
              // gaps between Duo's floating glass groups.
              style={pageSurfaces?.top ? { backgroundColor: pageSurfaces.top } : undefined}
              scrolling="auto"
              sandbox={PREVIEW_SANDBOX}
              onLoad={event => frameLoaded(event.currentTarget)}
              onError={() => { setBlocked(true); onLoadStateChange?.(slot.id, "error"); }}
            />
          )}
        </PreviewSurface>
      </DeviceFrame>
    );
  }
});

function broadcastScrollSync(detail: ScrollSyncPayload) {
  window.dispatchEvent(
    new CustomEvent<ScrollSyncPayload>("MDV_SCROLL_SYNC_EVENT", { detail }),
  );
}

function broadcastInteractionSync(detail: InteractionSyncPayload) {
  window.dispatchEvent(
    new CustomEvent<InteractionSyncPayload>("MDV_INTERACTION_EVENT", { detail }),
  );
}

function BlockedView({
  onCapture,
  onReload,
  url,
}: {
  onCapture?: () => void;
  onReload: () => void;
  url: string;
}) {
  const { t } = useI18n();
  const secondary = "flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sunken";
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-surface-2 p-6 text-center text-ink">
      <p className="text-sm font-bold">{t("iframeBlocked")}</p>
      <p className="max-w-[250px] break-all text-[11px] font-semibold leading-5 text-muted">{url}</p>
      <p className="max-w-[260px] text-xs leading-5 text-muted">{t("iframeBlockedHelp")}</p>
      <div className="grid w-full max-w-[240px] gap-2">
        <button type="button" className="flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary" onClick={() => window.open(url, "_blank", "noopener,noreferrer")}>
          <OpenInTabIcon size={13} /> {t("openInTab")}
        </button>
        <button type="button" className={secondary} onClick={onReload}>
          <ReloadIcon size={13} /> {t("reloadPreview")}
        </button>
        {onCapture && <button type="button" className={secondary} onClick={onCapture}>{t("captureCurrentTab")}</button>}
      </div>
    </div>
  );
}

function LayoutChip({ status }: { status: LayoutSlotStatus }) {
  const { t } = useI18n();
  const chip = "inline-flex h-5 shrink-0 items-center gap-1 self-center whitespace-nowrap rounded-full text-[11px] font-semibold";
  if (status.status === "checking") return <span className={`${chip} bg-sunken px-2 text-muted`}>{t("layoutChecking")}</span>;
  if (status.status === "failed") return <span className={`${chip} bg-warn-soft pe-2 ps-1.5 text-warn`}><AlertIcon size={10} strokeWidth={3} />{t("layoutNotChecked")}</span>;
  if (status.count === 0) return <span className={`${chip} bg-accent-soft pe-2 ps-1.5 text-accent-strong`}><CheckIcon size={10} strokeWidth={3.2} />{t("layoutFits")}</span>;
  return (
    <span className={`${chip} bg-red-500/10 pe-2 ps-1.5 text-danger`}>
      <AlertIcon size={10} strokeWidth={3} />{status.count === 1 ? t("layoutProblemOne") : t("layoutProblemMany", { count: status.count })}
    </span>
  );
}

// A menu row; with a hint, a second line says what it does.
function MenuItem({ label, hint, onClick, disabled = false, children }: { label: string; hint?: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={event => { event.stopPropagation(); onClick(); }}
      className={`flex w-full gap-2.5 rounded-[10px] px-2.5 text-start text-[13px] text-ink hover:bg-sunken focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40 ${hint ? "items-start py-2" : "h-9 items-center font-medium"}`}
    >
      <span className={`grid w-4 shrink-0 place-items-center text-ink-2 ${hint ? "mt-px" : ""}`}>{children}</span>
      {hint ? (
        <span className="grid min-w-0 gap-px">
          <span className="font-semibold">{label}</span>
          <span className="text-[11.5px] leading-snug text-muted">{hint}</span>
        </span>
      ) : <span className="min-w-0 truncate">{label}</span>}
    </button>
  );
}

export function shortName(name: string) {
  return name
    .replace(/^Apple\s+/i, "")
    .replace(/^Samsung\s+/i, "")
    .replace(/^Google\s+/i, "")
    .replace(/\s*\((?:20\d{2}|6th Gen|40mm)\)/gi, "");
}
