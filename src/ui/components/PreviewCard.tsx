import { PreviewSurface } from "./PreviewSurface";
import { NavigationSyncState } from "../../domain/simulator/navigation-sync";
import { usesTabletKeyboard } from "../../domain/device/mobile-keyboard";
import { getViewerEventTarget } from "../../app/viewer-context";
import { preparePreview } from "../../app/viewer-context";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ExternalLink,
  ImageDown,
  Minus,
  MoreHorizontal,
  Plus,
  RefreshCw,
  RotateCw,
  Search,
  Settings2,
  Star,
  X,
} from "lucide-react";
import { forwardRef, useEffect, useLayoutEffect, useMemo, useRef, useState, useId, type ReactNode } from "react";
import {
  supportsOrientation,
  toLandscapeAwareSize,
} from "../../domain/device/device-service";
import { getFrameProfile } from "../../domain/device/frame-profiles";
import { getBrowserGeometry, nextBrowserCollapse, supportsIos26, type SafariLayout } from "../../domain/device/browser-geometry";
import type { Device, Size } from "../../domain/device/device.types";
import type { FlowReplayRequest, FlowReplayResult, FlowStep } from "../../domain/flow/flow.types";
import type {
  DisplaySettings,
  PreviewSlot,
} from "../../domain/simulator/simulator.types";
import { useSimulator } from "../../app/SimulatorProvider";
import { useDeviceCatalog } from "../../app/DeviceCatalogProvider";
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
  removable: boolean;
  onCapture: () => void;
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
    placement?: { x: number; y: number; width: number; height: number };
    onPlacementChange: (placement: { x: number; y: number; width: number; height: number }) => void;
  };
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
  };
}

export function PreviewCard({
  slot,
  device,
  display,
  showToolbar = true,
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
  const syncSettingsRef = useRef({ scroll: display.scrollSync, flow: flowRecording });
  syncSettingsRef.current = { scroll: display.scrollSync, flow: flowRecording };
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
  useEffect(() => {
    let active = true;
    void preparePreview(slot.url).then(() => { if (active) setPreparedUrl(slot.url); }).catch(() => { if (active) setBlocked(true); });
    return () => { active = false; };
  }, [slot.url, slot.reloadToken]);
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    const onPolicy = (event: SecurityPolicyViolationEvent) => {
      if (event.effectiveDirective !== "frame-src" && event.effectiveDirective !== "child-src") return;
      try { if (new URL(event.blockedURI).origin === new URL(slot.url).origin) setBlocked(true); } catch { /* Non-URL policy reports cannot identify this preview. */ }
    };
    window.addEventListener("securitypolicyviolation", onPolicy);
    return () => window.removeEventListener("securitypolicyviolation", onPolicy);
  }, [slot.url]);
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>("checking");
  const [keyboard, setKeyboard] = useState<MobileKeyboardState | undefined>();
  const [pageSurfaces, setPageSurfaces] = useState<BrowserSurfaceColors | undefined>();
  const [browserCollapsed, setBrowserCollapsed] = useState(0);
  const [browserSettingsOpen, setBrowserSettingsOpen] = useState(false);
  const {
    slots,
    activeSlotId,
    setActiveSlot,
    removeSlot,
    rotateSlot,
    zoomSlot,
    setSlotDevice,
    setSlotBrowserPreferences,
    setSlotUrl,
    observeSlotUrl,
    reloadSlot,
    moveSlot,
  } = useSimulator();

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
  const browserGeometry = getBrowserGeometry(device, viewportSize, slot.browserPreferences, { collapsed: browserCollapsed, keyboardHeight, viewportFit: pageSurfaces?.viewportFit });
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

  const fittedOverlayPlacement = {
    x: containerSize.width > 0 ? ((containerSize.width - frameSize.width * scale) / 2 / containerSize.width) * 100 : 0,
    y: containerSize.height > 0 ? ((containerSize.height - frameSize.height * scale) / 2 / containerSize.height) * 100 : 0,
    width: containerSize.width > 0 ? (frameSize.width * scale / containerSize.width) * 100 : 100,
    height: containerSize.height > 0 ? (frameSize.height * scale / containerSize.height) * 100 : 100,
  };
  const overlayPlacement = designOverlay?.placement ?? fittedOverlayPlacement;

  function startOverlayAdjustment(event: React.PointerEvent, kind: "move" | "width" | "height" | "both") {
    if (!designOverlay?.adjusting || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    const pointerId = event.pointerId;
    const surface = event.currentTarget.closest("[data-design-overlay-surface]")?.getBoundingClientRect();
    if (!surface) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const initial = overlayPlacement;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", finish);
      target.removeEventListener("pointercancel", finish);
      target.removeEventListener("lostpointercapture", finish);
      window.removeEventListener("blur", finish);
      if (target.hasPointerCapture(pointerId)) target.releasePointerCapture(pointerId);
    };
    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId || (moveEvent.buttons & 1) !== 1) return finish();
      const deltaX = ((moveEvent.clientX - startX) / surface.width) * 100;
      const deltaY = ((moveEvent.clientY - startY) / surface.height) * 100;
      if (kind === "move") {
        designOverlay.onPlacementChange({ ...initial, x: Math.max(-1000, Math.min(1000, initial.x + deltaX)), y: Math.max(-1000, Math.min(1000, initial.y + deltaY)) });
      } else {
        designOverlay.onPlacementChange({
          ...initial,
          width: kind === "width" || kind === "both" ? Math.max(1, Math.min(1000, initial.width + deltaX)) : initial.width,
          height: kind === "height" || kind === "both" ? Math.max(1, Math.min(1000, initial.height + deltaY)) : initial.height,
        });
      }
    };
    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", finish);
    target.addEventListener("pointercancel", finish);
    target.addEventListener("lostpointercapture", finish);
    window.addEventListener("blur", finish);
    target.setPointerCapture(pointerId);
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
    const update = () => {
      const r = el.getBoundingClientRect();
      setContainerSize({ width: r.width, height: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
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
  }, [blocked, containerSize.width, device.type, flowRecording, slot.id, slot.reloadToken, slot.url, standalonePreview]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data;
      if (!data || typeof data !== "object" || data.slotId !== slot.id) return;
      if (data.type === "MDV_BROWSER_SCROLL") {
        const top = Number(data.scrollTop), delta = Number(data.deltaTop);
        if (Number.isFinite(top) && Number.isFinite(delta)) setBrowserCollapsed(current => nextBrowserCollapse(current, top, delta));
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
        observeSlotUrl(slot.id, navigation.url);
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
  }, [device.type, frameProfile.platform, display.navigationSync, display.scrollSync, flowRecording, flowReplay, onFlowResult, onFlowStep, observeSlotUrl, slot.id, slot.url]);

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
      const sourceId = activeSlotId !== targetSlotId ? activeSlotId : slots.find(candidate => candidate.id !== targetSlotId)?.id;
      if (sourceId !== slot.id) return;
      iframeRef.current?.contentWindow?.postMessage({ type: "MDV_SCROLL_SYNC_SNAPSHOT", slotId: slot.id, targetSlotId }, "*");
    };
    window.addEventListener("MDV_SCROLL_SYNC_REQUEST", onRequest);
    return () => window.removeEventListener("MDV_SCROLL_SYNC_REQUEST", onRequest);
  }, [activeSlotId, blocked, display.scrollSync, slot.id, slots]);

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
    if (enabling && activeSlotId === slot.id) {
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
      setSlotUrl(slot.id, detail.url);
    };
    window.addEventListener("MDV_NAVIGATION_EVENT", onNavigation);
    return () => window.removeEventListener("MDV_NAVIGATION_EVENT", onNavigation);
  }, [display.navigationSync, setSlotUrl, slot.id, slot.url]);




  return (
    <section
      data-preview-slot-id={slot.id}
      className={`@container/viewport flex h-full min-h-0 flex-col overflow-visible border-t transition-colors ${showToolbar && activeSlotId === slot.id ? "border-t-teal-500" : "border-t-transparent"}`}
      style={{ minWidth: 0 }}
      onClick={() => setActiveSlot(slot.id)}
      onFocus={() => setActiveSlot(slot.id)}
    >
      {/* ── Per-card header ── */}
      {showToolbar && <div
        ref={toolbarRef}
        data-device-toolbar
        className={`relative flex h-9 shrink-0 flex-nowrap items-center gap-0.5 border-b px-2 transition-colors ${
          display.darkMode
            ? "border-white/10 bg-[#151922]"
            : "border-black/[0.06] bg-white"
        }`}
      >
        <DeviceSwitcher
          currentDevice={device}
          dark={display.darkMode}
          onSwitch={(id) => setSlotDevice(slot.id, id)}
          tourTarget={first ? "change-device" : undefined}
          alignEnd={last}
        />

        <span className={`hidden @min-[300px]/viewport:inline shrink-0 px-1 text-[9px] font-bold ${display.darkMode ? "text-slate-500" : "text-slate-400"}`}>
          {viewportSize.width} × {viewportSize.height}
        </span>
        <div data-viewport-zoom className={`hidden @min-[240px]/viewport:flex shrink-0 items-center rounded-md border ${display.darkMode ? "border-white/15" : "border-slate-200"}`}>
          <CardBtn dark={display.darkMode} label={t("zoomOut")} onClick={() => zoomSlot(slot.id, "out")}><Minus size={13} /></CardBtn>
          <CardBtn dark={display.darkMode} label={t("zoomIn")} onClick={() => zoomSlot(slot.id, "in")}><Plus size={13} /></CardBtn>
        </div>
        <button type="button" aria-label={t("viewportOptions")} title={t("viewportOptions")} aria-expanded={controlsOpen} onClick={() => setControlsOpen(value => !value)}
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border ${display.darkMode ? "border-white/15 text-slate-400 hover:bg-white/10" : "border-slate-200 text-slate-500 hover:bg-slate-100"}`}><MoreHorizontal size={15}/></button>
        {removable && <button type="button" data-remove-viewport aria-label={t("removeDevice")} title={t("removeDevice")}
          onClick={event => { event.stopPropagation(); removeSlot(slot.id); }}
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border transition focus-visible:outline-2 focus-visible:outline-teal-500 ${display.darkMode ? "border-white/15 text-slate-400 hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-300" : "border-slate-200 text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600"}`}><X size={14}/></button>}
        <div data-viewport-actions="compact"
          onKeyDown={event => { if (event.key === "Escape") { setControlsOpen(false); setBrowserSettingsOpen(false); } }}
          className={`${controlsOpen ? "flex" : "hidden"} absolute end-2 top-9 z-[60] max-h-[calc(100dvh-120px)] w-64 flex-col gap-1 overflow-y-auto rounded-xl border p-2 shadow-xl ${display.darkMode ? "border-white/15 bg-[#171a21]" : "border-slate-200 bg-white"}`}>
        <div className="flex @min-[240px]/viewport:hidden">
          <CardBtn dark={display.darkMode} label={t("zoomOut")} onClick={() => zoomSlot(slot.id, "out")}><Minus size={13} /></CardBtn>
          <CardBtn dark={display.darkMode} label={t("zoomIn")} onClick={() => zoomSlot(slot.id, "in")}><Plus size={13} /></CardBtn>
        </div>
        {frameProfile.platform === "ios" && <div className="relative">
          <CardBtn expanded dark={display.darkMode} label={t("browserAppearance")} onClick={() => setBrowserSettingsOpen(value => !value)}><Settings2 size={13}/></CardBtn>
          {browserSettingsOpen && <div role="group" aria-label={t("browserAppearance")} className={`absolute right-0 top-8 z-[60] w-60 rounded-xl border p-3 shadow-xl ${display.darkMode ? "border-white/10 bg-[#171a21] text-white" : "border-slate-200 bg-white text-slate-900"}`}>
            <div className="mb-2 flex items-center justify-between text-xs font-bold">{t("browserAppearance")}<button type="button" aria-label={t("closeBrowserSettings")} onClick={() => setBrowserSettingsOpen(false)}><X size={14}/></button></div>
            {supportsIos26(device) && frameProfile.osMajor < 26 && <label className="mb-2 block text-xs">{t("browserVersion")}<select aria-label={t("browserVersion")} className="mt-1 w-full rounded border border-slate-500/25 bg-transparent p-1.5" value={slot.browserPreferences?.version ?? "ios26"} onChange={event => setSlotBrowserPreferences(slot.id, { version: event.target.value as "catalog" | "ios26", layout: undefined })}><option value="ios26">Safari 26</option><option value="catalog">{t("catalogBrowserVersion", { version: frameProfile.osMajor })}</option></select></label>}
            {browserGeometry.duoControls ? <div className="text-xs">iPhone Duo · iOS 27</div> : <label className="block text-xs">{t("browserLayout")}<select aria-label={t("browserLayout")} className="mt-1 w-full rounded border border-slate-500/25 bg-transparent p-1.5" value={browserGeometry.layout} onChange={event => setSlotBrowserPreferences(slot.id, { layout: event.target.value as SafariLayout })}>
              {device.type === "tablet" ? <><option value="tabs">{t("separateTabs")}</option><option value="compact-tabs">{t("compactTabs")}</option></> : <>{browserGeometry.variant === "ios-liquid-glass" && <option value="compact">{t("compactBrowser")}</option>}<option value="bottom">{t("bottomBrowser")}</option><option value="top">{t("topBrowser")}</option></>}
            </select></label>}
            <p className="mt-2 text-[10px] leading-4 opacity-60">{t("browserPreviewNote")}</p>
          </div>}
        </div>}

        <CardBtn expanded
          dark={display.darkMode}
          label={t("reloadPreview")}
          onClick={() => reloadSlot(slot.id)}
        >
          <RefreshCw size={14} className={bridgeStatus === "checking" ? "animate-spin" : ""} />
        </CardBtn>
        {bridgeStatus === "unavailable" && <CardBtn expanded dark={display.darkMode} label={t("openInTab")} onClick={() => window.open(currentPageUrlRef.current || slot.url, "_blank", "noopener,noreferrer")}><ExternalLink size={14}/></CardBtn>}
        <CardBtn expanded dark={display.darkMode} label={t("captureAndAnnotate")} onClick={() => { setControlsOpen(false); setBrowserSettingsOpen(false); onCapture(); }} disabled={capturePending}>
          <ImageDown size={13} className={capturePending ? "animate-pulse" : undefined} />
        </CardBtn>
        {canRotate && (
          <CardBtn expanded
            dark={display.darkMode}
            label={t("rotate")}
            onClick={() => rotateSlot(slot.id)}
          >
            <RotateCw size={14} />
          </CardBtn>
        )}
        <CardBtn expanded dark={display.darkMode} label={t("openInTab")} onClick={() => window.open(currentPageUrlRef.current || slot.url, "_blank", "noopener,noreferrer")}><ExternalLink size={13} /></CardBtn>
        {!focused && !first && <CardBtn expanded dark={display.darkMode} label={t("moveViewportLeft")} onClick={() => moveSlot(slot.id, "left")}><ArrowLeft size={13} /></CardBtn>}
        {!focused && !last && <CardBtn expanded dark={display.darkMode} label={t("moveViewportRight")} onClick={() => moveSlot(slot.id, "right")}><ArrowRight size={13} /></CardBtn>}
        </div>
      </div>}

      {/* ── Canvas ── */}
      {/* Clip enlarged previews here; toolbar menus and column resize handles
          remain outside the clip. The canvas must not grow to the device size. */}
      <div
        ref={containerRef}
        data-design-overlay-surface
        className={`relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden transition-colors ${display.darkMode ? "bg-[#101217]" : "bg-[#f5f5f3]"}`}
      >
        {containerSize.width > 0 && (
          <div
            className="shrink-0 origin-center"
            data-device-capture
            data-free-device-view={freeView ? "" : undefined}
            style={{
              width: frameSize.width,
              height: frameSize.height,
              transform: `scale(${scale})`,
              marginTop: `${(frameSize.height * scale - frameSize.height) / 2}px`,
              marginBottom: `${(frameSize.height * scale - frameSize.height) / 2}px`,
              marginLeft: `${(frameSize.width * scale - frameSize.width) / 2}px`,
              marginRight: `${(frameSize.width * scale - frameSize.width) / 2}px`,
              ...(freeView ? {
                "--mdv-free-width": `${viewportSize.width}px`,
                "--mdv-free-height": `${Math.max(120, viewportSize.height - keyboardHeight)}px`,
                position: "relative" as const,
                overflow: "hidden",
                borderRadius: 6,
                boxShadow: `0 0 0 1px ${display.darkMode ? "#475569" : "#cbd5e1"},0 8px 28px #0f172a14`,
              } : {}),
            }}
          >
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
                    dark={display.darkMode}
                    onCapture={onCapture}
                    onReload={() => reloadSlot(slot.id)}
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
                    className={`block h-full w-full overflow-auto border-0 ${
                      display.darkMode ? "bg-[#0f172a]" : "bg-white"
                    }`}
                    style={{
                      width: "100%",
                      colorScheme: display.darkMode ? "dark" : "light",
                      // The iframe's own backing can peek through fractional
                      // raster edges too; keep it neutral on the new Apple frames.
                      backgroundColor: browserGeometry.neutralChrome
                        ? display.darkMode ? "#1c1c1e" : "#ffffff"
                        : pageSurfaces?.top ?? (display.darkMode ? "#0f172a" : "#ffffff"),
                      scrollbarWidth: device.type === "phone" || device.type === "tablet" ? "none" : "auto",
                    }}
                    scrolling="auto"
                    sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                    onError={() => setBlocked(true)}
                  />
                )}
              </PreviewSurface>
            </DeviceFrame>
          </div>
        )}
        {designOverlay && <div
          className={`absolute z-30 touch-none select-none ${designOverlay.adjusting ? "cursor-move border-2 border-amber-400 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]" : "pointer-events-none"}`}
          style={{ left: `${overlayPlacement.x}%`, top: `${overlayPlacement.y}%`, width: `${overlayPlacement.width}%`, height: `${overlayPlacement.height}%`, opacity: designOverlay.opacity / 100 }}
          onPointerDown={(event) => startOverlayAdjustment(event, "move")}
          aria-label={t("adjustableDesignOverlay")}
        >
          <img src={designOverlay.image} alt={t("designOverlay")} draggable={false} className="block h-full w-full" />
          {designOverlay.adjusting && <>
            <button type="button" aria-label={t("resizeOverlayWidth")} onPointerDown={(event) => startOverlayAdjustment(event, "width")} className="absolute -right-2 top-1/2 h-8 w-4 -translate-y-1/2 cursor-ew-resize rounded-full border-2 border-white bg-amber-500 shadow" />
            <button type="button" aria-label={t("resizeOverlayHeight")} onPointerDown={(event) => startOverlayAdjustment(event, "height")} className="absolute -bottom-2 left-1/2 h-4 w-8 -translate-x-1/2 cursor-ns-resize rounded-full border-2 border-white bg-amber-500 shadow" />
            <button type="button" aria-label={t("resizeOverlayBoth")} onPointerDown={(event) => startOverlayAdjustment(event, "both")} className="absolute -bottom-2 -right-2 h-5 w-5 cursor-nwse-resize rounded-full border-2 border-white bg-amber-500 shadow" />
          </>}
        </div>}
      </div>
    </section>
  );
}

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

// ─── Device switcher ──────────────────────────────────────────────────────────
// Device categories mirror the way responsive developers scan target hardware.
// Special-purpose hardware (kiosks, control panels, watches, TVs, custom) stays
// in Other instead of being mixed with tablets and computers.
type MenuGroupId = "ios" | "android" | "tablet" | "laptop" | "desktop" | "other" | "custom";
type MenuSection = { key: MenuGroupId | "favorite" | "recent" | "search"; label: string; devices: Device[] };

const MENU_GROUP_ORDER: MenuGroupId[] = ["ios", "android", "tablet", "laptop", "desktop", "other", "custom"];
export function menuGroupFor(device: Device): MenuGroupId {
  if (device.brand === "Custom") return "custom";
  if (device.type === "tablet") return "tablet";
  if (device.type === "laptop") return "laptop";
  if (device.type === "desktop") return "desktop";
  if (device.type === "phone") {
    const os = device.os.trim().toLowerCase().split(/\s+/)[0];
    if (os === "ios") return "ios";
    if (os === "android") return "android";
  }
  return "other";
}

function newestDevicesFirst(left: Device, right: Device): number {
  const yearDifference = (right.year ?? -1) - (left.year ?? -1);
  if (yearDifference !== 0) return yearDifference;
  const updatedDifference = right.updatedAt.localeCompare(left.updatedAt);
  return updatedDifference || left.name.localeCompare(right.name);
}

const RECENT_LIMIT = 4;

function DeviceSwitcher({
  currentDevice,
  dark,
  onSwitch,
  tourTarget,
  alignEnd = false,
}: {
  currentDevice: Device;
  dark: boolean;
  onSwitch: (id: string) => void;
  tourTarget?: string;
  alignEnd?: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState<MenuGroupId>(() => menuGroupFor(currentDevice));
  const [panelPosition, setPanelPosition] = useState({left: 12, top: 80, width: 380, maxHeight: 400});
  const panelId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);
  const { devices, favorites, recents, addRecent, toggleFavorite, isFavorite } = useDeviceCatalog();
  function closePicker() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  useLayoutEffect(() => {
    if (!open) return;
    const position = () => {
      const anchor = triggerRef.current?.getBoundingClientRect();
      if (!anchor) return;
      const width = Math.min(380, window.innerWidth - 24);
      const below = window.innerHeight - anchor.bottom - 20;
      const above = anchor.top - 20;
      const openAbove = below < 240 && above > below;
      const useWindowHeight = Math.max(above, below) < 280;
      const maxHeight = Math.max(100, Math.min(480, useWindowHeight ? window.innerHeight - 24 : openAbove ? above : below));
      setPanelPosition({
        width, maxHeight,
        left: Math.max(12, Math.min(window.innerWidth - width - 12, alignEnd ? anchor.right - width : anchor.left)),
        top: useWindowHeight ? 12 : openAbove ? Math.max(12, anchor.top - maxHeight - 8) : anchor.bottom + 8,
      });
    };
    position();
    const observer = new ResizeObserver(position);
    if (triggerRef.current) observer.observe(triggerRef.current);
    window.addEventListener("resize", position);
    return () => { observer.disconnect(); window.removeEventListener("resize", position); };
  }, [open, alignEnd]);

  const groupLabels: Record<MenuGroupId, string> = {
    ios: "iOS",
    android: "Android",
    tablet: t("tablets"),
    laptop: t("laptops"),
    desktop: t("desktops"),
    other: t("other"),
    custom: t("custom"),
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !e.composedPath().includes(ref.current))
        setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.isComposing) {
        event.preventDefault();
        closePicker();
      }
    };
    const target = getViewerEventTarget();
    target.addEventListener("mousedown", handler);
    target.addEventListener("keydown", escape);
    return () => { target.removeEventListener("mousedown", handler); target.removeEventListener("keydown", escape); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const focused = (ref.current?.getRootNode() as Document | ShadowRoot | undefined)?.activeElement;
      if (!focused || focused === triggerRef.current || !ref.current?.contains(focused)) inputRef.current?.focus();
      const item = activeItemRef.current;
      const list = listRef.current;
      if (item && list) list.scrollTop = Math.max(0, item.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop - 8);
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (open && listRef.current) listRef.current.scrollTop = 0;
  }, [query, activeGroup]);

  const sections = useMemo<MenuSection[]>(() => {
    const normalize = (value: string) => value.normalize("NFKD").toLowerCase().replace(/\p{M}/gu, "").replace(/×/g, "x").replace(/(\d)\s*x\s*(?=\d)/g, "$1x").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    const q = normalize(query);
    const queryTerms = q.split(/\s+/).filter(Boolean);
    const filterByQuery = (list: Device[]): Device[] =>
      q
        ? list.filter((device) => {
          const haystack = normalize(`${device.name} ${device.brand} ${device.family} ${device.os} ${device.type} ${device.year ?? ""} ${device.tags.join(" ")} ${device.cssViewport.width}x${device.cssViewport.height} ${device.cssViewport.height}x${device.cssViewport.width}`);
          return queryTerms.every((term) => haystack.includes(term));
        })
        : list;

    const findById = (id: string) => devices.find((device) => device.id === id);
    const favoriteDevices = favorites
      .map(findById)
      .filter((device): device is Device => !!device && menuGroupFor(device) === activeGroup);
    const favoriteSection: MenuSection | null = favoriteDevices.length > 0
      ? { key: "favorite", label: t("favorites"), devices: filterByQuery(favoriteDevices) }
      : null;

    // Recently used — most recent first, capped, never reorder when picking.
    const usedInRecents = new Set<string>();
    const recentDevices = recents
      .map(findById)
      .filter((d): d is Device => (
        !!d
        && menuGroupFor(d) === activeGroup
        && !usedInRecents.has(d.id)
        && (usedInRecents.add(d.id), true)
      ))
      .filter(device => !favorites.includes(device.id))
      .slice(0, RECENT_LIMIT);
    const recentSection: MenuSection | null = (() => {
      const filtered = filterByQuery(recentDevices).filter(
        (d) => d.id !== currentDevice.id,
      );
      if (filtered.length === 0) return null;
      return { key: "recent", label: t("recentlyUsed"), devices: filtered };
    })();

    if (q) {
      const matches = filterByQuery(devices).sort(newestDevicesFirst);
      return matches.length > 0 ? [{ key: "search", label: t("searchResults"), devices: matches }] : [];
    }

    const promoted = new Set([...(favoriteSection?.devices ?? []), ...(recentSection?.devices ?? [])].map(device => device.id));
    const categoryDevices = devices
      .filter((device) => menuGroupFor(device) === activeGroup && !promoted.has(device.id))
      .sort(newestDevicesFirst);
    const categorySection: MenuSection = {
      key: activeGroup,
      label: groupLabels[activeGroup],
      devices: categoryDevices,
    };

    return [favoriteSection, recentSection, categorySection].filter((section): section is MenuSection => !!section && section.devices.length > 0);
  }, [activeGroup, devices, favorites, query, recents, currentDevice.id, t]);

  const groupCounts = useMemo(() => Object.fromEntries(
    MENU_GROUP_ORDER.map((group) => [group, devices.filter((device) => menuGroupFor(device) === group).length]),
  ) as Record<MenuGroupId, number>, [devices]);

  const visibleGroups = MENU_GROUP_ORDER.filter(group => groupCounts[group] > 0);

  return (
    <div ref={ref} className="relative min-w-0 flex-[1.45]">
      <button
        type="button"
        data-tour={tourTarget}
        ref={triggerRef}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? panelId : undefined}
        title={`${t("chooseDevice")}: ${currentDevice.name}`}
        data-testid="device-switcher-button"
        onClick={(e) => {
          e.stopPropagation();
          if (!open) { setQuery(""); setActiveGroup(menuGroupFor(currentDevice)); }
          setOpen((v) => !v);
        }}
        className={`flex h-7 w-full min-w-0 items-center gap-1 whitespace-nowrap rounded-[7px] border px-1.5 text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-teal-500 ${open ? dark ? "border-teal-400/60 bg-teal-400/10 text-white" : "border-teal-500 bg-teal-50 text-teal-900" :
          dark
            ? "border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
            : "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100"
        }`}
      >
        <span className="min-w-0 flex-1 truncate">
          {shortName(currentDevice.name)}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""} ${dark ? "text-slate-400" : "text-slate-500"}`}
        />
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={t("chooseDevice")}
          style={panelPosition}
          data-testid="device-switcher-panel"
          className={`fixed z-50 flex flex-col overflow-hidden rounded-[10px] border shadow-[0_12px_36px_rgba(15,23,42,0.2)] ${
            dark ? "border-slate-600 bg-[#171b24]" : "border-slate-300 bg-white"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`shrink-0 border-b p-2.5 ${dark ? "border-white/10 bg-[#1d2330]" : "border-slate-200 bg-slate-50/70"}`}>
            <div className="mb-2 flex items-center justify-between px-0.5">
              <p className={`text-xs font-bold ${dark ? "text-white" : "text-slate-800"}`}>{t("chooseDevice")}</p>
              <div className="flex items-center gap-2">
                <span aria-live="polite" className={`text-[10px] font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}>{t("results", { count: sections.reduce((count, section) => count + section.devices.length, 0) })}</span>
                <button type="button" onClick={closePicker} aria-label={t("close")} className="grid h-6 w-6 place-items-center rounded-[5px] hover:bg-slate-500/10 focus-visible:outline-2 focus-visible:outline-teal-500"><X size={13}/></button>
              </div>
            </div>
            <div className={`flex h-8 items-center gap-2 rounded-[6px] border px-2 transition-colors focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/15 ${dark ? "border-slate-600 bg-[#111722]" : "border-slate-300 bg-white"}`}>
              <Search size={13} className={dark ? "text-slate-500" : "text-slate-400"} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label={t("searchDevice")}
                onKeyDown={event => {
                  if (event.nativeEvent.isComposing) return;
                  if (event.key === "ArrowDown") { event.preventDefault(); listRef.current?.querySelector<HTMLButtonElement>("[data-device-pick]")?.focus(); }
                  if (event.key === "Enter") { event.preventDefault(); listRef.current?.querySelector<HTMLButtonElement>("[data-device-pick]")?.click(); }
                }}
                placeholder={t("searchDevice")}
                className={`min-w-0 flex-1 bg-transparent text-[11px] font-medium outline-none placeholder:text-slate-500 ${dark ? "text-white" : "text-slate-800"}`}
              />
              {query && <button type="button" onClick={() => { setQuery(""); inputRef.current?.focus(); }} aria-label={t("clearDeviceSearch")} className={`grid h-5 w-5 place-items-center rounded ${dark ? "text-slate-500 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-200 hover:text-slate-700"}`}><X size={11} /></button>}
            </div>
            {!query && <div className="mt-2 grid grid-cols-3 gap-1" role="tablist" aria-label={t("deviceCategories")}>
              {visibleGroups.map((group) => <button
                key={group}
                type="button"
                role="tab"
                id={`${panelId}-${group}`}
                aria-controls={`${panelId}-results`}
                tabIndex={activeGroup === group ? 0 : -1}
                onKeyDown={event => {
                  const direction = getComputedStyle(event.currentTarget).direction === "rtl" ? -1 : 1;
                  const offsets: Record<string, number> = {ArrowRight: direction, ArrowLeft: -direction, ArrowDown: 3, ArrowUp: -3};
                  if (!(event.key in offsets) && event.key !== "Home" && event.key !== "End") return;
                  event.preventDefault();
                  const index = visibleGroups.indexOf(group);
                  const next = event.key === "Home" ? 0 : event.key === "End" ? visibleGroups.length - 1 : Math.max(0, Math.min(visibleGroups.length - 1, index + offsets[event.key]));
                  setActiveGroup(visibleGroups[next]);
                  const tabs = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
                  tabs?.[next]?.focus();
                }}
                aria-selected={activeGroup === group}
                onClick={() => setActiveGroup(group)}
                className={`flex h-7 items-center justify-between gap-1 rounded-[5px] border px-2 text-[10px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-500 ${activeGroup === group ? dark ? "border-teal-400/70 bg-teal-400/15 text-teal-200" : "border-teal-600 bg-teal-50 text-teal-900" : dark ? "border-white/10 bg-white/[0.025] text-slate-300 hover:border-slate-500 hover:bg-white/[0.07]" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-100"}`}
              ><span>{groupLabels[group]}</span><span className={activeGroup === group ? "opacity-80" : "opacity-60"}>{groupCounts[group]}</span></button>)}
            </div>}
          </div>

          {/* List */}
          <div ref={listRef} id={`${panelId}-results`} role={query ? "region" : "tabpanel"}
            aria-labelledby={query ? undefined : `${panelId}-${activeGroup}`} aria-label={query ? t("searchResults") : undefined} className="min-h-0 overflow-y-auto overscroll-contain py-1.5" onKeyDown={event => {
            if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
            const buttons = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>("[data-device-pick]") ?? []);
            const index = buttons.indexOf(event.target as HTMLButtonElement);
            if (index < 0) return;
            event.preventDefault();
            const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)));
            if (event.key === "ArrowUp" && index === 0) inputRef.current?.focus();
            else buttons[next]?.focus();
          }}>
            {sections.map((section) => (
              <div key={section.key}>
                {(section.key !== activeGroup || sections.length > 1) && <p className={`flex items-center justify-between px-3 pb-1 pt-2 text-[9px] font-bold uppercase tracking-wider ${dark ? "text-slate-400" : "text-slate-500"}`}>
                  <span>{section.label}</span><span>{section.devices.length}</span>
                </p>}
                <div className="flex flex-col gap-0.5 px-1.5">
                  {section.devices.map((d) => (
                    <DeviceSwitcherItem
                      key={d.id}
                      ref={d.id === currentDevice.id ? activeItemRef : undefined}
                      device={d}
                      active={d.id === currentDevice.id}
                      dark={dark}
                      favorite={isFavorite(d.id)}
                      onToggleFavorite={() => {
                        toggleFavorite(d.id);
                        requestAnimationFrame(() => listRef.current?.querySelector<HTMLButtonElement>(`[data-device-favorite="${CSS.escape(d.id)}"]`)?.focus());
                      }}
                      onPick={() => {
                        addRecent(d.id);
                        onSwitch(d.id);
                        closePicker();
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
            {sections.length === 0 && (
              <p className="break-words px-4 py-6 text-center text-[11px] text-slate-500">
                {t("noDevicesMatch", { query })}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

const DeviceSwitcherItem = forwardRef<HTMLButtonElement, {
  device: Device;
  active: boolean;
  dark: boolean;
  favorite: boolean;
  onToggleFavorite: () => void;
  onPick: () => void;
}>(function DeviceSwitcherItem({ device, active, dark, favorite, onToggleFavorite, onPick }, ref) {
  const { t } = useI18n();
  const rowClass = `group flex min-h-10 w-full min-w-0 items-center rounded-[6px] border transition-colors ${
    active
      ? dark ? "border-teal-400/50 bg-teal-400/10 text-teal-100" : "border-teal-500/60 bg-teal-50 text-teal-900"
      : dark
        ? "border-white/[0.07] text-slate-200 hover:border-slate-500 hover:bg-white/[0.05]"
        : "border-slate-200/70 text-slate-800 hover:border-slate-400 hover:bg-slate-50"
  }`;

  return (
    <div className={rowClass}>
      <button
        ref={ref}
        data-device-pick={device.id}
        aria-pressed={active}
        type="button"
        title={device.name}
        className="flex min-h-10 min-w-0 flex-1 items-center gap-2.5 rounded-s-[6px] px-2.5 py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500"
        onClick={onPick}
      >
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="min-w-0 flex-1 line-clamp-2 text-[11px] font-semibold leading-tight">{shortName(device.name)}</span>
            {device.tags.includes("new") && <span data-device-new={device.id} className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${dark ? "bg-emerald-400/15 text-emerald-300" : "bg-emerald-100 text-emerald-700"}`}>{t("newLabel")}</span>}
            {device.year && <span className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] font-medium ${active ? dark ? "bg-teal-400/15 text-teal-300" : "bg-teal-100 text-teal-700" : dark ? "bg-white/[0.06] text-slate-400" : "bg-slate-100 text-slate-500"}`}>{device.year}</span>}
          </span>
          <span className={`mt-0.5 block truncate text-[9px] font-medium leading-tight ${active ? dark ? "text-teal-300" : "text-teal-700" : dark ? "text-slate-400" : "text-slate-500"}`}>
            {device.os.toLowerCase() === "android" ? `${device.brand} · ` : ""}{device.os} · {device.cssViewport.width} × {device.cssViewport.height}
          </span>
        </span>
      </button>
      <button
        type="button"
        data-device-favorite={device.id}
        aria-label={favorite ? t("removeFavorite", { name: device.name }) : t("addFavorite", { name: device.name })}
        onClick={onToggleFavorite}
        className={`mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-[5px] outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${favorite ? dark ? "text-amber-300" : "text-amber-600" : dark ? "text-slate-500 hover:text-slate-200 hover:bg-white/10" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"}`}
      ><Star size={13} fill={favorite ? "currentColor" : "none"} /></button>
    </div>
  );
});

function BlockedView({
  dark,
  onCapture,
  onReload,
  url,
}: {
  dark: boolean;
  onCapture: () => void;
  onReload: () => void;
  url: string;
}) {
  const { t } = useI18n();
  return (
    <div className={`flex h-full flex-col items-center justify-center gap-3 p-6 text-center transition-colors ${dark ? "bg-[#0f172a] text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      <p className="text-sm font-black">
        {t("iframeBlocked")}
      </p>
      <p className={`max-w-[250px] break-all text-[11px] font-semibold leading-5 ${dark ? "text-slate-400" : "text-slate-500"}`}>
        {url}
      </p>
      <p className={`max-w-[260px] text-xs leading-5 ${dark ? "text-slate-400" : "text-slate-500"}`}>
        {t("iframeBlockedHelp")}
      </p>
      <div className="grid w-full max-w-[240px] gap-2">
        <button
          type="button"
          className={`flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold text-white ${dark ? "bg-[#0f9f8f]" : "bg-slate-900"}`}
          onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
        >
          <ExternalLink size={13} /> {t("openInTab")}
        </button>
        <button
          type="button"
          className={`flex items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-xs font-bold ${dark ? "border-white/10 bg-white/[0.06] text-slate-200" : "border-slate-200 bg-white text-slate-700"}`}
          onClick={onReload}
        >
          <RefreshCw size={13} /> {t("reloadPreview")}
        </button>
        <button
          type="button"
          className={`flex items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-xs font-bold ${dark ? "border-white/10 bg-white/[0.06] text-slate-200" : "border-slate-200 bg-white text-slate-700"}`}
          onClick={onCapture}
        >
          {t("captureCurrentTab")}
        </button>
      </div>
    </div>
  );
}

function CardBtn({
  dark,
  label,
  children,
  onClick,
  disabled = false,
  expanded = false,
}: {
  dark: boolean;
  label: string;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  expanded?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      className={`${expanded ? "flex h-8 w-full items-center gap-2 px-2 text-left text-[11px] font-medium" : "grid h-7 w-7 place-items-center"} shrink-0 rounded-md transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-500 ${
        dark
          ? "text-slate-400 hover:bg-white/10 hover:text-white"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      } ${disabled ? "cursor-not-allowed opacity-35 hover:bg-transparent hover:text-current" : ""}`}
      onClick={(e) => {
        if (disabled) return;
        e.stopPropagation();
        onClick();
      }}
    >
      {children}
      {expanded && <span className="min-w-0 truncate">{label}</span>}
    </button>
  );
}

function shortName(name: string) {
  return name
    .replace(/^Apple\s+/i, "")
    .replace(/^Samsung\s+/i, "")
    .replace(/^Google\s+/i, "")
    .replace(/\s*\((?:20\d{2}|6th Gen|40mm)\)/gi, "");
}
