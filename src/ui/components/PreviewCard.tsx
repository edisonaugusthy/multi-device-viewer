import { usePointerDrag } from "../hooks/usePointerDrag";
import { useStableCallback } from "../hooks/useStableCallback";
import { adjustPlacement, type PlacementAdjustment } from "../interactions/placement";
import { readPreviewHealthReport } from "../../domain/device/preview-health";
import type { GalleryLoadResult } from "../../domain/device/gallery-load-queue";
import { PreviewSurface } from "./PreviewSurface";
import { BrowserAppearanceSettings } from "./BrowserAppearanceSettings";
import { NavigationSyncState } from "../../domain/simulator/navigation-sync";
import { usesTabletKeyboard } from "../../domain/device/mobile-keyboard";
import { getViewerEventTarget } from "../../app/viewer-context";
import { preparePreview } from "../../app/viewer-context";
import { AlertIcon, CameraIcon, ChevronLeftIcon, ChevronRightIcon, OpenInTabIcon, ReloadIcon, SettingsIcon } from "../icons";
import { PreviewToolbar, type FocusNavigation } from "./PreviewToolbar";
import { memo, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
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
const TOOLBAR_SPACE = 56;

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
  onFlowStep?: (step: Omit<FlowStep, "id">) => void;
  onFlowResult?: (result: FlowReplayResult) => void;
  designOverlay?: {
    image: string;
    opacity: number;
    adjusting: boolean;
    blend?: "normal" | "difference";
    placement?: { x: number; y: number; width: number; height: number };
    onPlacementChange: (placement: { x: number; y: number; width: number; height: number }) => void;
  };
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
  onExpand?: (slotId: string) => void;
  onFixPrompt?: (slotId: string) => void;
  onPageScroll?: (scrollTop: number) => void;
  expandLabel?: string;
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
  onExpand,
  onFixPrompt,
  onPageScroll,
  expandLabel,
}: PreviewCardProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const [controlsOpen, setControlsOpen] = useState(false);
  const bridgeStatusTimer = useRef<number | undefined>(undefined);
  const bridgeStatusRef = useRef<BridgeStatus>("checking");
  const previousScrollSyncRef = useRef(display.scrollSync);
  const navigationRef = useRef(new NavigationSyncState(slot.url));
  const bridgeDocumentRef = useRef<string | undefined>(undefined);
  const sampleVisuals = visualsActive && (device.type === "phone" || device.type === "tablet");
  const syncSettingsRef = useRef({ scroll: display.scrollSync, flow: flowRecording, visuals: sampleVisuals });
  syncSettingsRef.current = { scroll: display.scrollSync, flow: flowRecording, visuals: sampleVisuals };
  const currentPageUrlRef = useRef(slot.url);
  const sentFlowRunRef = useRef<string | null>(null);
  const pendingReplayStepRef = useRef<number | null>(null);
  const replayContinuationTimerRef = useRef<number | undefined>(undefined);
  const standalonePreview = Boolean((window as Window & { __MDV_STANDALONE_PREVIEW__?: boolean }).__MDV_STANDALONE_PREVIEW__);
  const [containerSize, setContainerSize] = useState<Size>({
    width: 0,
    height: 0,
  });
  const [preparedUrl, setPreparedUrl] = useState<string | null>(null);
  const [loadIssue, setLoadIssue] = useState<"resources" | "unverified" | null>(null);
  const healthRequest = useRef<string | null>(null);
  const healthTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    setLoadIssue(null);
    return () => { healthRequest.current = null; clearTimeout(healthTimer.current); };
  }, [slot.id, slot.url, slot.reloadToken]);
  useEffect(() => {
    let active = true;
    setBlocked(false);
    void preparePreview(slot.url).then(() => { if (active) setPreparedUrl(slot.url); }).catch(() => {
      if (active) { setBlocked(true); onLoadStateChange?.(slot.id, "error"); }
    });
    return () => { active = false; };
  }, [slot.url, slot.reloadToken, slot.id, onLoadStateChange]);
  const [blocked, setBlocked] = useState(false);
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
  // Manufacturer crops contain less surrounding whitespace than legacy assets.
  // Preserve a consistent default margin without changing actual-size mode.
  const previewScale = device.mockupAssets.find((asset) => (asset.kind === "transparent-png" || asset.kind === "transparent-svg"))?.previewScale ?? 1;
  const fitScale = rawFitScale * (freeView ? 1 : previewScale);
  const scale =
    slot.zoomMode === "actual"
      ? 1
      : slot.zoomMode === "fit"
        ? fitScale
        : fitScale * (slot.zoom / 0.58);

  useLayoutEffect(() => { onScaleChange?.(scale, slot.id); }, [onScaleChange, scale, slot.id]);

  const startDrag = usePointerDrag();
  // Devices can be dragged anywhere inside their space; resetting zoom recentres them.
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  // Switching to another device keeps where it was dragged; rotating, Free view
  // or a new layout (such as showing one device) starts from the default spot.
  useEffect(() => { setOffset({ x: 0, y: 0 }); }, [effectiveOrientation, freeView, positionKey]);

  function startMove(event: React.PointerEvent) {
    if (event.button !== 0) return;
    if ((event.target as Element).closest("button, a, input, textarea, select, [data-mobile-keyboard]") && event.currentTarget !== event.target && !(event.currentTarget as Element).matches("[data-move-handle]")) return;
    const origin = offset;
    event.stopPropagation();
    startDrag(event, (deltaX, deltaY) => setOffset({ x: origin.x + deltaX, y: origin.y + deltaY }));
  }

  function resetView() {
    setOffset({ x: 0, y: 0 });
    simulator.current.setSlotZoomMode(slot.id, "fit");
  }

  const fittedOverlayPlacement = {
    x: containerSize.width > 0 ? (((containerSize.width - frameSize.width * scale) / 2 + offset.x) / containerSize.width) * 100 : 0,
    y: containerSize.height > 0 ? (((containerSize.height - frameSize.height * scale) / (align === "bottom" ? 1 : 2) + offset.y) / containerSize.height) * 100 : 0,
    width: containerSize.width > 0 ? (frameSize.width * scale / containerSize.width) * 100 : 100,
    height: containerSize.height > 0 ? (frameSize.height * scale / containerSize.height) * 100 : 100,
  };
  const overlayPlacement = designOverlay?.placement ?? fittedOverlayPlacement;


  function startOverlayAdjustment(event: React.PointerEvent, kind: PlacementAdjustment) {
    if (!designOverlay?.adjusting || event.button !== 0) return;
    const surface = event.currentTarget.closest("[data-design-overlay-surface]")?.getBoundingClientRect();
    if (!surface?.width || !surface.height) return;
    event.stopPropagation();
    startDrag(event, (deltaX, deltaY) => designOverlay.onPlacementChange(adjustPlacement(
      overlayPlacement, kind, deltaX / surface.width * 100, deltaY / surface.height * 100,
      { x: [-1000, 1000], y: [-1000, 1000], size: [1, 1000] },
    )));
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
      sampleRightSurface: device.id.startsWith("apple-iphone-duo-"),
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
          hideScrollbars: device.type === "phone" || device.type === "tablet",
          sampleRightSurface: device.id.startsWith("apple-iphone-duo-"),
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
        // READY also covers a bridge injected after the iframe's load event.
        syncScrollBridge(iframeRef.current);
        syncFlowRecordingBridge(iframeRef.current);
        syncVisualBridge(iframeRef.current);
        setBridgeStatus("ready");
        setBlocked(false);
        const nextSurfaces = readPageSurfaces(data as Record<string, unknown>);
        if (nextSurfaces) setPageSurfaces(nextSurfaces);
        if (pendingReplayStepRef.current !== null) {
          const nextStep = pendingReplayStepRef.current;
          pendingReplayStepRef.current = null;
          window.clearTimeout(replayContinuationTimerRef.current);
          window.setTimeout(() => sendFlowReplay(nextStep), 150);
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
          });
        }
        if (display.scrollSync) broadcastScrollSync(data as ScrollSyncPayload);
        return;
      }

      if (data.type === "MDV_INTERACTION_EVENT") {
        const interaction = data as InteractionSyncPayload;
        if (flowRecording) {
          const { slotId: _slotId, ...step } = interaction;
          onFlowStep?.(step as Omit<FlowStep, "id">);
        }
        if (display.scrollSync) broadcastInteractionSync(interaction);
        return;
      }

      if (data.type === "MDV_FLOW_REPLAY_RESULT") {
        pendingReplayStepRef.current = null;
        window.clearTimeout(replayContinuationTimerRef.current);
        onFlowResult?.(data as FlowReplayResult);
        return;
      }

      if (data.type === "MDV_FLOW_REPLAY_CONTINUE" && flowReplay?.runId === data.runId) {
        const nextStep = Math.max(0, Number(data.nextStep ?? 0));
        pendingReplayStepRef.current = nextStep;
        setBridgeStatus("checking");
        window.clearTimeout(replayContinuationTimerRef.current);
        replayContinuationTimerRef.current = window.setTimeout(() => {
          if (pendingReplayStepRef.current !== nextStep) return;
          pendingReplayStepRef.current = null;
          sendFlowReplay(nextStep);
        }, 1500);
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
  }, [device.id, device.type, frameProfile.platform, display.navigationSync, display.scrollSync, flowRecording, flowReplay, onFlowResult, onFlowStep, onLoadStateChange, onPageScroll, slot.id, slot.url]);

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
      void preparePreview(startUrl).then(() => { if (iframeRef.current) iframeRef.current.src = startUrl; }).catch(() => setBlocked(true));
      return;
    }
    sendFlowReplay(startIndex ?? 0);
  }, [blocked, bridgeStatus, flowReplay, slot.id]);

  useEffect(() => () => window.clearTimeout(replayContinuationTimerRef.current), []);

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
  const toolbarTop = Math.max(6, TOOLBAR_SPACE + deviceTop + offset.y - 48);
  // The toolbar follows a dragged device sideways but always stays fully on
  // screen; a toolbar wider than its column is centred and may overlap
  // neighbours (the hovered column is raised above them).
  const [toolbarShift, setToolbarShift] = useState(0);
  // Measured after layout changes and again just before the toolbar appears,
  // since column widths may still be animating when the layout first settles.
  const placeToolbar = useStableCallback(() => {
    const wrapper = toolbarRef.current;
    const bar = wrapper?.querySelector<HTMLElement>("[data-device-toolbar]");
    if (!wrapper || !bar) return;
    // The section, not the shifted wrapper, gives the card's own position.
    const card = (wrapper.parentElement ?? wrapper).getBoundingClientRect();
    const bounds = (wrapper.closest("main, [data-all-devices-view]") ?? document.documentElement).getBoundingClientRect();
    const half = bar.offsetWidth / 2;
    const cardCenter = card.left + card.width / 2;
    const min = bounds.left + 8 + half;
    const max = bounds.right - 8 - half;
    const center = min > max ? (bounds.left + bounds.right) / 2 : Math.min(max, Math.max(min, cardCenter + offset.x));
    setToolbarShift(Math.round(center - cardCenter));
  });
  useLayoutEffect(placeToolbar, [placeToolbar, offset.x, containerSize.width, device.id, showToolbar, capturePending, focusNavigation]);
  // While the pointer is on the toolbar it stays put, so repeated clicks on
  // previous/next keep hitting the same button as the device changes size.
  const [pinnedToolbar, setPinnedToolbar] = useState<{ top: number; shift: number } | null>(null);
  const statusTop = Math.max(6, TOOLBAR_SPACE * (showToolbar ? 1 : 0) + deviceTop + offset.y + 8);
  const openInTab = () => window.open(currentPageUrlRef.current || slot.url, "_blank", "noopener,noreferrer");
  const viewportLabel = `${viewportSize.width}×${viewportSize.height}`;

  return (
    <section
      data-preview-slot-id={slot.id}
      data-active-slot={isActive || undefined}
      className="group/device @container/viewport relative flex h-full min-h-0 min-w-0 flex-col"
      onClick={() => simulator.current.setActiveSlot(slot.id)}
      onFocus={() => { simulator.current.setActiveSlot(slot.id); placeToolbar(); }}
      onPointerEnter={placeToolbar}
    >
      {/* Clip enlarged previews here. The toolbar sits outside this clip box,
          over its top inset, so a narrow column never cuts it off. */}
      <div className={`relative min-h-0 flex-1 overflow-hidden ${showToolbar ? "pt-14" : ""}`}>
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
              className={`shrink-0 origin-center cursor-grab touch-none active:cursor-grabbing data-[capture-matte=black]:bg-black data-[capture-matte=black]:shadow-[0_0_0_32px_black] data-[capture-matte=white]:bg-white data-[capture-matte=white]:shadow-[0_0_0_32px_white] ${freeView ? "relative overflow-hidden rounded-md shadow-[0_0_0_1px_var(--color-line),0_8px_28px_rgb(15_23_42/0.08)]" : ""}`}
              data-device-capture
              data-free-device-view={freeView ? "" : undefined}
              onPointerDown={startMove}
              onDoubleClick={event => { if (event.target === event.currentTarget || !(event.target as Element).closest("button")) setOffset({ x: 0, y: 0 }); }}
              style={{
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
          {designOverlay && <div
            className={`absolute z-30 touch-none select-none ${designOverlay.blend === "difference" ? "mix-blend-difference" : ""} ${designOverlay.adjusting ? "cursor-move outline-2 outline-design shadow-[0_0_0_1px_rgba(0,0,0,0.35)]" : "pointer-events-none outline-2 outline-design"}`}
            style={{ left: `${overlayPlacement.x}%`, top: `${overlayPlacement.y}%`, width: `${overlayPlacement.width}%`, height: `${overlayPlacement.height}%`, opacity: designOverlay.opacity / 100 }}
            onPointerDown={(event) => startOverlayAdjustment(event, "move")}
            aria-label={t("adjustableDesignOverlay")}
          >
            <img src={designOverlay.image} alt={t("designOverlay")} draggable={false} className="block size-full" />
            {designOverlay.adjusting && <>
              <button type="button" aria-label={t("resizeOverlayWidth")} onPointerDown={(event) => startOverlayAdjustment(event, "width")} className="absolute -right-2 top-1/2 h-8 w-4 -translate-y-1/2 cursor-ew-resize rounded-full border-2 border-white bg-design shadow" />
              <button type="button" aria-label={t("resizeOverlayHeight")} onPointerDown={(event) => startOverlayAdjustment(event, "height")} className="absolute -bottom-2 left-1/2 h-4 w-8 -translate-x-1/2 cursor-ns-resize rounded-full border-2 border-white bg-design shadow" />
              <button type="button" aria-label={t("resizeOverlayBoth")} onPointerDown={(event) => startOverlayAdjustment(event, "both")} className="absolute -bottom-2 -right-2 size-5 cursor-nwse-resize rounded-full border-2 border-white bg-design shadow" />
            </>}
          </div>}
        </div>


        {loadIssue && !blocked && !capturePending && <div role="status" data-preview-load-issue={loadIssue}
          className="pointer-events-none absolute inset-x-0 z-30 flex justify-center px-3"
          style={{ top: statusTop }}>
          <div className="pointer-events-auto flex max-w-full items-center gap-1.5 rounded-lg border border-warn-line bg-warn-soft py-1 pe-1 ps-2.5 text-xs font-semibold text-warn shadow-float">
            <AlertIcon size={13} className="shrink-0"/>
            <span className="min-w-0 truncate">{t(loadIssue === "resources" ? "previewResourceError" : "previewLoadUnverified")}</span>
            <button type="button" onClick={(event) => { event.stopPropagation(); simulator.current.reloadSlot(slot.id); }} className="h-6 shrink-0 rounded-md bg-surface px-2 text-xs font-semibold text-warn">{t("retry")}</button>
          </div>
        </div>}
      </div>

      {showToolbar && !capturePending && (
        <div ref={toolbarRef} className="pointer-events-none absolute inset-x-0 z-40"
          onPointerEnter={() => setPinnedToolbar({ top: toolbarTop, shift: toolbarShift })}
          onPointerLeave={() => setPinnedToolbar(null)}
          style={{ top: pinnedToolbar?.top ?? toolbarTop, transform: `translateX(${pinnedToolbar?.shift ?? toolbarShift}px)` }}>
          <PreviewToolbar
            deviceName={device.name}
            zoomLabel={`${Math.round(scale * 100)}%`}
            canRotate={canRotate}
            removable={removable}
            reloading={bridgeStatus === "checking"}
            revealed={revealToolbar}
            menuOpen={controlsOpen}
            tourTarget={first ? "change-device" : undefined}
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
            onFixPrompt={onFixPrompt && (() => onFixPrompt(slot.id))}
            onMenu={() => setControlsOpen(value => !value)}
            onRemove={() => simulator.current.removeSlot(slot.id)}
            menu={
              <div data-viewport-actions
                onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); setControlsOpen(false); setBrowserSettingsOpen(false); } }}
                className="absolute end-0 top-full z-[60] mt-2 flex max-h-[calc(100dvh-120px)] w-64 flex-col gap-0.5 overflow-y-auto rounded-xl border border-line bg-surface p-1.5 text-ink shadow-popover">
                {browserSettingsOpen ? (
                  <div role="group" aria-label={t("browserAppearance")} className="p-1.5">
                    <BrowserAppearanceSettings device={device} slot={slot} geometry={browserGeometry} onClose={() => setBrowserSettingsOpen(false)}/>
                  </div>
                ) : <>
                  <MenuItem label={t("openInTab")} onClick={() => { setControlsOpen(false); openInTab(); }}><OpenInTabIcon size={15}/></MenuItem>
                  {onCapture && <MenuItem label={t("captureAndAnnotate")} disabled={capturePending} onClick={() => { setControlsOpen(false); onCapture(slot.id); }}><CameraIcon size={15}/></MenuItem>}
                  {frameProfile.platform === "ios" && <MenuItem label={t("browserAppearance")} onClick={() => setBrowserSettingsOpen(true)}><SettingsIcon size={15}/></MenuItem>}
                  {!focused && !first && <MenuItem label={t("moveViewportLeft")} onClick={() => { setControlsOpen(false); simulator.current.moveSlot(slot.id, "left"); }}><ChevronLeftIcon size={15}/></MenuItem>}
                  {!focused && !last && <MenuItem label={t("moveViewportRight")} onClick={() => { setControlsOpen(false); simulator.current.moveSlot(slot.id, "right"); }}><ChevronRightIcon size={15}/></MenuItem>}
                </>}
              </div>
            }
          />
        </div>
      )}

      {showCaption && (
        <div className="flex h-11 shrink-0 items-center justify-center px-2">
          <button type="button" data-device-caption onClick={() => simulator.current.setActiveSlot(slot.id)}
            className={`flex min-w-0 max-w-full items-baseline gap-2 rounded-[7px] px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-accent ${isActive ? "font-semibold text-ink" : "font-medium text-ink-2"}`}>
            <span className="truncate text-[13px]">{shortName(device.name)}</span>
            <span className="shrink-0 font-mono text-xs font-medium text-muted">{viewportLabel}</span>
          </button>
        </div>
      )}
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
              name={
                device.type === "phone" || device.type === "tablet"
                  ? `mdv-mobile-preview-${slot.id}`
                  : `mdv-preview-${slot.id}`
              }
              title={t("devicePreview", { name: device.name })}
              src={preparedUrl === slot.url ? preparedUrl : "about:blank"}
              loading="eager"
              className={`block size-full overflow-auto border-0 ${display.darkMode ? "bg-[#0f172a] [color-scheme:dark]" : "bg-white [color-scheme:light]"} ${device.type === "phone" || device.type === "tablet" ? "[scrollbar-width:none]" : ""}`}
              // Match the page at fractional raster edges, including the clear
              // gaps between Duo's floating glass groups.
              style={pageSurfaces?.top ? { backgroundColor: pageSurfaces.top } : undefined}
              scrolling="auto"
              sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-storage-access-by-user-activation"
              onLoad={event => {
                const frame = event.currentTarget;
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
              }}
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

function MenuItem({ label, onClick, disabled = false, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={event => { event.stopPropagation(); onClick(); }}
      className="flex h-9 w-full items-center gap-2.5 rounded-[7px] px-2 text-start text-[13px] font-medium text-ink hover:bg-sunken focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40"
    >
      <span className="grid w-4 shrink-0 place-items-center text-ink-2">{children}</span>
      <span className="min-w-0 truncate">{label}</span>
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
