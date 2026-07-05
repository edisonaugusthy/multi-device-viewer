import {
  Camera,
  ChevronDown,
  ExternalLink,
  Minus,
  Plus,
  RefreshCw,
  RotateCw,
  X,
} from "lucide-react";
import { forwardRef, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  supportsOrientation,
  toLandscapeAwareSize,
} from "../../domain/device/device-service";
import type { Device, Size } from "../../domain/device/device.types";
import type {
  DisplaySettings,
  PreviewSlot,
} from "../../domain/simulator/simulator.types";
import { useSimulator } from "../../app/SimulatorProvider";
import { useDeviceCatalog } from "../../app/DeviceCatalogProvider";
import {
  DEVICE_GROUP_LABEL,
  DEVICE_GROUP_ORDER,
  deviceGroupFor,
} from "../../domain/device/device-groups";
import { captureLivePreview } from "../../domain/capture/capture-service";
import { DeviceFrame, estimateDeviceFrameSize } from "./DeviceFrame";
import { ElementInspectOverlay, type InspectData } from "./ElementInspectOverlay";

const CARD_PAD = 32;
interface ScrollSyncPayload {
  slotId: string;
  scrollLeft: number;
  scrollTop: number;
  deltaLeft: number;
  deltaTop: number;
  scrollHeight?: number;
  scrollWidth?: number;
  viewportHeight?: number;
  viewportWidth?: number;
}

interface InteractionSyncPayload {
  slotId: string;
  kind: string;
  selector?: string;
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
  sourceTabId: number | null;
  removable: boolean;
  onCapture: () => void;
  onSwitchToLivePreview: () => void;
  compareTargetSlotId?: string;
  compareSelector?: string;
  onInspectData?: (slotId: string, data: InspectData) => void;
  inspectResetToken: number;
}

type BridgeStatus = "checking" | "ready" | "unavailable" | "blocked";

export function PreviewCard({
  slot,
  device,
  display,
  sourceTabId,
  removable,
  onCapture,
  onSwitchToLivePreview,
  compareTargetSlotId,
  compareSelector,
  onInspectData,
  inspectResetToken,
}: PreviewCardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const bridgeStatusTimer = useRef<number | undefined>(undefined);
  const browserChromeTimer = useRef<number | undefined>(undefined);
  const bridgeStatusRef = useRef<BridgeStatus>("checking");
  const [containerSize, setContainerSize] = useState<Size>({
    width: 0,
    height: 0,
  });
  const [blocked, setBlocked] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>("checking");
  const [inspectData, setInspectData] = useState<InspectData | null>(null);
  const [inspectSuppressed, setInspectSuppressed] = useState(false);
  const [browserChromeHidden, setBrowserChromeHidden] = useState(false);
  const [livePreviewUrl, setLivePreviewUrl] = useState<string | null>(null);
  const [livePreviewBusy, setLivePreviewBusy] = useState(false);
  const [livePreviewError, setLivePreviewError] = useState<string | null>(null);
  // Direct DOM ref for the highlight box — updated imperatively on every MDV_INSPECT_MOVE
  // to avoid React re-renders on every mousemove frame.
  const highlightRef = useRef<HTMLDivElement | null>(null);
  const {
    setActiveSlot,
    removeSlot,
    rotateSlot,
    zoomSlot,
    setSlotDevice,
    reloadSlot,
  } = useSimulator();

  const canRotate = supportsOrientation(device);
  const effectiveOrientation = canRotate ? slot.orientation : "portrait";
  const viewportSize = canRotate
    ? toLandscapeAwareSize(device.cssViewport, effectiveOrientation)
    : device.cssViewport;

  const frameSize = estimateDeviceFrameSize({
    device,
    showFrame: slot.showFrame,
    showStatusBar: display.showStatusBar,
    showUrlBar: display.showUrlBar,
    viewportSize,
  });

  const availW = Math.max(80, containerSize.width - CARD_PAD);
  const availH = Math.max(80, containerSize.height - CARD_PAD);
  const fitScale = Math.min(
    1,
    availW / frameSize.width,
    availH / frameSize.height,
  );
  const scale =
    slot.zoomMode === "actual"
      ? 1
      : slot.zoomMode === "fit"
        ? fitScale
        : fitScale * (slot.zoom / 0.58);
  const liveMode = display.previewMode === "live";
  const chromeScrollProgress = browserChromeHidden ? 1 : 0;

  const syncInspectBridge = (iframe: HTMLIFrameElement | null) => {
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
      {
        type: display.inspectMode && !inspectSuppressed ? "MDV_INSPECT_ENABLE" : "MDV_INSPECT_DISABLE",
        slotId: slot.id,
      },
      "*",
    );
  };

  const syncScrollBridge = (iframe: HTMLIFrameElement | null) => {
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
      {
        type: display.scrollSync ? "MDV_SCROLL_SYNC_ENABLE" : "MDV_SCROLL_SYNC_DISABLE",
        slotId: slot.id,
      },
      "*",
    );
  };

  const syncInteractionBridge = (iframe: HTMLIFrameElement | null) => {
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
      {
        type: display.scrollSync ? "MDV_SCROLL_SYNC_ENABLE" : "MDV_SCROLL_SYNC_DISABLE",
        slotId: slot.id,
      },
      "*",
    );
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
    setInspectData(null);
    setInspectSuppressed(false);
    setLivePreviewError(null);
    if (highlightRef.current) highlightRef.current.style.display = "none";
  }, [device.id, slot.reloadToken, slot.url]);

  useEffect(() => {
    if (!liveMode) return;
    if (!sourceTabId) {
      setLivePreviewUrl(null);
      setLivePreviewBusy(false);
      setLivePreviewError("Open the viewer from a browser tab to use live previews.");
      return;
    }

    let cancelled = false;
    const mobile =
      device.type === "phone" ||
      device.type === "tablet" ||
      device.type === "watch" ||
      device.type === "custom";
    const refresh = async () => {
      setLivePreviewBusy(true);
      const result = await captureLivePreview({
        tabId: sourceTabId,
        width: viewportSize.width,
        height: viewportSize.height,
        contentHeight: viewportSize.height,
        deviceScaleFactor: Math.max(1, Math.min(3, Math.round(device.pixelRatio || 2))),
        mobile,
      });

      if (cancelled) return;

      setLivePreviewBusy(false);
      if (result.dataUrl) {
        setLivePreviewUrl(result.dataUrl);
        setLivePreviewError(null);
        setBlocked(false);
        setBridgeStatus("ready");
        return;
      }

      setLivePreviewUrl(null);
      setLivePreviewError(result.error ?? "Live preview unavailable.");
      setBridgeStatus("unavailable");
    };

    void refresh();
    const timer = window.setInterval(refresh, display.liveReloadMs);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [
    liveMode,
    sourceTabId,
    viewportSize.width,
    viewportSize.height,
    device.pixelRatio,
    device.type,
    slot.reloadToken,
    display.liveReloadMs,
  ]);

  useEffect(() => {
    if (!compareSelector || compareTargetSlotId !== slot.id) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: "MDV_INSPECT_QUERY", slotId: slot.id, selector: compareSelector },
      "*",
    );
  }, [compareSelector, compareTargetSlotId, slot.id]);

  useEffect(() => {
    bridgeStatusRef.current = bridgeStatus;
  }, [bridgeStatus]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const register = () => {
      setBridgeStatus("checking");
      const postRegister = () => {
        iframe.contentWindow?.postMessage(
          { type: "MDV_PREVIEW_REGISTER", slotId: slot.id },
          "*",
        );
        syncInspectBridge(iframe);
        syncScrollBridge(iframe);
        syncInteractionBridge(iframe);
      };

      const injectAndRegister = () => {
        void ensurePreviewBridgeInjected().finally(postRegister);
      };

      injectAndRegister();
      [250, 750, 1500].forEach((delay) => {
        window.setTimeout(injectAndRegister, delay);
      });

      window.clearTimeout(bridgeStatusTimer.current);
      bridgeStatusTimer.current = window.setTimeout(() => {
        if (bridgeStatusRef.current === "checking") {
          setBlocked(true);
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
  }, [containerSize.width, slot.id, slot.reloadToken, slot.url]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data;
      if (!data || typeof data !== "object" || data.slotId !== slot.id) return;

      if (data.type === "MDV_PREVIEW_READY") {
        setBridgeStatus("ready");
        setBlocked(false);
        return;
      }

      if (data.type === "MDV_PREVIEW_BLOCKED_OR_UNAVAILABLE") {
        setBridgeStatus("blocked");
        setBlocked(true);
        return;
      }

      if (data.type === "MDV_SCROLL_SYNC_EVENT") {
        setBridgeStatus("ready");
        setBrowserChromeHidden(true);
        window.clearTimeout(browserChromeTimer.current);
        browserChromeTimer.current = window.setTimeout(() => {
          setBrowserChromeHidden(false);
        }, 650);
        if (!display.scrollSync) return;
        broadcastScrollSync(data as ScrollSyncPayload);
        return;
      }

      if (data.type === "MDV_INTERACTION_EVENT") {
        if (!display.scrollSync) return;
        broadcastInteractionSync(data as InteractionSyncPayload);
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [display.scrollSync, slot.id]);

  useEffect(() => () => window.clearTimeout(browserChromeTimer.current), []);

  useEffect(() => {
    if (!display.scrollSync || blocked) return;

    const onSync = (event: Event) => {
      const detail = (event as CustomEvent<ScrollSyncPayload>).detail;
      if (!detail || detail.slotId === slot.id) return;
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: "MDV_APPLY_SCROLL_SYNC",
          slotId: slot.id,
          scrollLeft: detail.scrollLeft,
          scrollTop: detail.scrollTop,
          deltaLeft: detail.deltaLeft,
          deltaTop: detail.deltaTop,
        },
        "*",
      );
    };

    window.addEventListener("MDV_SCROLL_SYNC_EVENT", onSync);
    return () => window.removeEventListener("MDV_SCROLL_SYNC_EVENT", onSync);
  }, [blocked, display.scrollSync, slot.id]);

  useEffect(() => {
    if (!display.scrollSync || blocked) return;

    const onSync = (event: Event) => {
      const detail = (event as CustomEvent<InteractionSyncPayload>).detail;
      if (!detail || detail.slotId === slot.id) return;
      const { slotId: _sourceSlotId, ...payload } = detail;
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: "MDV_APPLY_INTERACTION",
          slotId: slot.id,
          ...payload,
        },
        "*",
      );
    };

    window.addEventListener("MDV_INTERACTION_EVENT", onSync);
    return () => window.removeEventListener("MDV_INTERACTION_EVENT", onSync);
  }, [blocked, display.scrollSync, slot.id]);

  useEffect(() => {
    syncScrollBridge(iframeRef.current);
  }, [display.scrollSync, slot.id]);

  // ── Inspect mode bridge ───────────────────────────────────────────────────
  useEffect(() => {
    if (!iframeRef.current) return;
    if (!display.inspectMode) {
      setInspectSuppressed(false);
    }
    syncInspectBridge(iframeRef.current);
    if (!display.inspectMode) {
      setInspectData(null);
      if (highlightRef.current) highlightRef.current.style.display = "none";
    }
  }, [display.inspectMode, inspectSuppressed, slot.id]);

  useEffect(() => {
    if (display.inspectMode) {
      setInspectData(null);
      setInspectSuppressed(true);
      if (highlightRef.current) highlightRef.current.style.display = "none";
    }
  }, [device.id]);

  useEffect(() => {
    setInspectData(null);
    if (highlightRef.current) highlightRef.current.style.display = "none";
  }, [inspectResetToken]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const msg = event.data;
      if (!msg || typeof msg !== "object" || msg.slotId !== slot.id) return;

      // ── Hot path: just move the highlight box via direct DOM, zero React re-render ──
      if (msg.type === "MDV_INSPECT_MOVE") {
        const h = highlightRef.current;
        const container = containerRef.current;
        const iframe = iframeRef.current;
        if (!h || !container || !iframe) return;
        if (msg.hidden) {
          h.style.display = "none";
          return;
        }
        const cr = container.getBoundingClientRect();
        const ir = iframe.getBoundingClientRect();
        const ox = ir.left - cr.left;
        const oy = ir.top - cr.top;
        const r = msg.rect as { top: number; left: number; width: number; height: number };
        // scale is captured from the closure — it's stable between renders
        h.style.left   = `${ox + r.left   * scale}px`;
        h.style.top    = `${oy + r.top    * scale}px`;
        h.style.width  = `${Math.max(1, r.width  * scale)}px`;
        h.style.height = `${Math.max(1, r.height * scale)}px`;
        h.style.display = "block";
        return;
      }

      // ── Element changed: update tooltip panel via React state ──
      if (msg.type === "MDV_INSPECT_DATA") {
        const data = msg as unknown as InspectData;
        onInspectData?.(slot.id, data);
        setInspectData(data);
        return;
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [slot.id, scale]); // scale needed for coord math in the closure

  return (
    <section
      className="flex h-full flex-col overflow-hidden"
      style={{ minWidth: 0 }}
      onClick={() => setActiveSlot(slot.id)}
      onFocus={() => setActiveSlot(slot.id)}
    >
      {/* ── Per-card header ── */}
      <div
        className={`flex min-h-11 shrink-0 flex-nowrap items-center gap-1 border-b px-1 py-1 transition-colors ${
          display.darkMode
            ? "border-white/10 bg-[#151922]"
            : "border-black/[0.06] bg-white"
        }`}
      >
        {/* Device switcher */}
        <DeviceSwitcher
          currentDevice={device}
          dark={display.darkMode}
          onSwitch={(id) => setSlotDevice(slot.id, id)}
        />

        <span
          className={`mx-0.5 h-4 w-px shrink-0 ${display.darkMode ? "bg-white/10" : "bg-slate-200"}`}
        />

        {/* Viewport dims */}
        <span
          className={`shrink-0 whitespace-nowrap text-[10px] font-medium tabular-nums tracking-tight ${display.darkMode ? "text-slate-400" : "text-slate-500"}`}
        >
          {viewportSize.width}×{viewportSize.height}
        </span>
        {liveMode && (
          <span
            className={`ml-1 shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] ${
              display.darkMode
                ? "bg-teal-400/15 text-teal-100"
                : "bg-teal-50 text-teal-700"
            }`}
          >
            {livePreviewBusy ? "Refreshing" : "Live tab"}
          </span>
        )}

        <div className="min-w-0 flex-1" />

        <CardBtn
          dark={display.darkMode}
          label={liveMode ? "Refresh live preview" : "Reload preview"}
          onClick={() => reloadSlot(slot.id)}
        >
          <RefreshCw size={14} />
        </CardBtn>
        {canRotate && (
          <CardBtn
            dark={display.darkMode}
            label="Rotate"
            onClick={() => rotateSlot(slot.id)}
          >
            <RotateCw size={14} />
          </CardBtn>
        )}
        <CardBtn
          dark={display.darkMode}
          label="Zoom out"
          onClick={() => zoomSlot(slot.id, "out")}
        >
          <Minus size={14} />
        </CardBtn>
        <CardBtn
          dark={display.darkMode}
          label="Zoom in"
          onClick={() => zoomSlot(slot.id, "in")}
        >
          <Plus size={14} />
        </CardBtn>
        {removable && (
          <CardBtn
            dark={display.darkMode}
            label="Remove"
            onClick={() => removeSlot(slot.id)}
          >
            <X size={14} />
          </CardBtn>
        )}
      </div>

      {/* ── Canvas ── */}
      <div
        ref={containerRef}
        className={`relative flex flex-1 items-center justify-center overflow-hidden transition-colors ${display.darkMode ? "bg-[#101217]" : "bg-[#f5f5f3]"}`}
      >
        {containerSize.width > 0 && (
          <div
            className="origin-center"
            style={{
              width: frameSize.width,
              height: frameSize.height,
              transform: `scale(${scale})`,
              marginTop: `${(frameSize.height * scale - frameSize.height) / 2}px`,
              marginBottom: `${(frameSize.height * scale - frameSize.height) / 2}px`,
              marginLeft: `${(frameSize.width * scale - frameSize.width) / 2}px`,
              marginRight: `${(frameSize.width * scale - frameSize.width) / 2}px`,
            }}
          >
            <DeviceFrame
              device={device}
              showFrame={slot.showFrame}
              showStatusBar={display.showStatusBar}
              showBattery={display.showBattery}
              showUrlBar={display.showUrlBar}
              darkMode={display.darkMode}
              url={slot.url}
              viewportSize={viewportSize}
              orientation={effectiveOrientation}
              scrollProgress={chromeScrollProgress}
            >
              <div
                style={{
                  width: viewportSize.width,
                  height: "100%",
                  overflow: "hidden",
                }}
              >
                {liveMode ? (
                  livePreviewUrl ? (
                    <img
                      src={livePreviewUrl}
                      alt={`${device.name} live preview`}
                      className="h-full w-full select-none object-cover object-top"
                      draggable={false}
                    />
                  ) : (
                    <LivePreviewFallback
                      message={livePreviewError}
                      onReload={() => reloadSlot(slot.id)}
                    />
                  )
                ) : blocked ? (
                  <BlockedView
                    url={slot.url}
                    onCapture={onCapture}
                    onReload={() => reloadSlot(slot.id)}
                    canUseLivePreview={Boolean(sourceTabId)}
                    onUseLivePreview={onSwitchToLivePreview}
                  />
                ) : (
                  <iframe
                    ref={iframeRef}
                    key={`${slot.id}-${slot.reloadToken}`}
                    title={`${device.name} preview`}
                    src={slot.url}
                    className={`h-full w-full border-0 ${display.darkMode ? "bg-[#0f172a]" : "bg-white"}`}
                    style={{
                      width: `calc(100% + 17px)`,
                      backgroundColor: display.darkMode ? "#0f172a" : "#ffffff",
                      colorScheme: display.darkMode ? "dark" : "light",
                      filter: display.darkMode
                        ? "invert(1) hue-rotate(180deg)"
                        : undefined,
                    }}
                    sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
                    onError={() => setBlocked(true)}
                  />
                )}
              </div>
            </DeviceFrame>
          </div>
        )}

        {/* Inspect highlight box — driven imperatively via highlightRef, no React re-render on move */}
        {display.inspectMode && (
          <div
            ref={highlightRef}
            className="pointer-events-none absolute rounded-[2px] border-2 border-blue-500"
            style={{
              display: "none",
              background: "rgba(59,130,246,0.07)",
              boxShadow: "0 0 0 1px rgba(59,130,246,0.3)",
              zIndex: 40,
            }}
          />
        )}

        {/* Inspect tooltip panel — only re-renders when element changes */}
        {display.inspectMode && (
          <ElementInspectOverlay
            data={inspectData}
            scale={scale}
            dark={display.darkMode}
            containerRef={containerRef}
            iframeRef={iframeRef}
          />
        )}
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

function ensurePreviewBridgeInjected(): Promise<void> {
  if (
    typeof chrome === "undefined" ||
    !chrome.tabs?.getCurrent ||
    !chrome.webNavigation?.getAllFrames ||
    !chrome.scripting?.executeScript
  ) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    chrome.tabs.getCurrent((tab) => {
      if (chrome.runtime.lastError || !tab?.id) {
        resolve();
        return;
      }
      const tabId = tab.id;
      let attempts = 0;

      const injectWhenFramesReady = () => chrome.webNavigation.getAllFrames({ tabId }, (frames) => {
        if (chrome.runtime.lastError || !frames?.length) {
          attempts += 1;
          if (attempts < 8) {
            window.setTimeout(injectWhenFramesReady, 100);
            return;
          }
          resolve();
          return;
        }

        const frameIds = frames
          .filter((frame) => /^https?:\/\//i.test(frame.url))
          .map((frame) => frame.frameId);

        if (frameIds.length === 0) {
          attempts += 1;
          if (attempts < 8) {
            window.setTimeout(injectWhenFramesReady, 100);
            return;
          }
          resolve();
          return;
        }

        let remaining = frameIds.length;
        const done = () => {
          remaining -= 1;
          if (remaining <= 0) resolve();
        };

        for (const frameId of frameIds) {
          chrome.scripting.executeScript(
            {
              target: { tabId, frameIds: [frameId] },
              files: ["content-scripts/content.js"],
            },
            () => {
              void chrome.runtime.lastError;
              done();
            },
          );
        }
      });

      injectWhenFramesReady();
    });
  });
}

// ─── Device switcher ──────────────────────────────────────────────────────────

const POPULAR_DEVICE_IDS = [
  "apple-iphone-14-pro-max-2022",
  "apple-iphone-16-pro-max-2024",
  "samsung-galaxy-s24",
  "samsung-galaxy-s24-ultra",
  "apple-ipad-air-4",
  "macbook-air",
];

function DeviceSwitcher({
  currentDevice,
  dark,
  onSwitch,
}: {
  currentDevice: Device;
  dark: boolean;
  onSwitch: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);
  const { devices, favorites, recents, addRecent } = useDeviceCatalog();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Focus search and scroll active item into view when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => {
        inputRef.current?.focus();
        // Scroll the active device into view inside the list container
        if (activeItemRef.current && listRef.current) {
          const list = listRef.current;
          const item = activeItemRef.current;
          const listTop = list.scrollTop;
          const listBottom = listTop + list.clientHeight;
          const itemTop = item.offsetTop;
          const itemBottom = itemTop + item.offsetHeight;
          if (itemTop < listTop) {
            list.scrollTop = itemTop - 8;
          } else if (itemBottom > listBottom) {
            list.scrollTop = itemBottom - list.clientHeight + 8;
          }
        }
      }, 0);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return devices;
    return devices.filter((d) =>
      [d.name, d.brand, d.family, d.type].join(" ").toLowerCase().includes(q),
    );
  }, [devices, query]);

  const grouped = useMemo(() => {
    const used = new Set<string>();
    const sections: Array<[string, Device[]]> = [];
    const q = query.trim();

    const addSection = (label: string, ids: string[]) => {
      const list = ids
        .map((id) => filtered.find((device) => device.id === id))
        .filter((device): device is Device => !!device && !used.has(device.id));
      if (list.length === 0) return;
      list.forEach((device) => used.add(device.id));
      sections.push([label, list]);
    };

    if (!q) {
      addSection("Popular", POPULAR_DEVICE_IDS);
      addSection("Recent", recents);
      addSection("Favorites", favorites);
    }

    for (const group of DEVICE_GROUP_ORDER) {
      const list = filtered.filter(
        (device) => deviceGroupFor(device) === group && !used.has(device.id),
      );
      if (list.length > 0) sections.push([DEVICE_GROUP_LABEL[group], list]);
    }

    return sections;
  }, [favorites, filtered, query, recents]);

  return (
    <div ref={ref} className="relative min-w-0 flex-[1.45]">
      <button
        type="button"
        data-testid="device-switcher-button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={`flex h-8 w-full min-w-0 items-center gap-1 whitespace-nowrap rounded-[8px] border px-1.5 text-[12px] font-semibold transition ${
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
          className={`shrink-0 ${dark ? "text-slate-400" : "text-slate-500"}`}
        />
      </button>

      {open && (
        <div
          data-testid="device-switcher-panel"
          className={`absolute left-0 top-full z-50 mt-1 flex w-[min(300px,calc(100vw-16px))] flex-col overflow-hidden rounded-[10px] border shadow-[0_12px_40px_rgba(0,0,0,0.18)] ${
            dark ? "border-white/10 bg-[#171b24]" : "border-slate-200 bg-white"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search */}
          <div
            className={`border-b px-2 py-1.5 ${dark ? "border-white/10" : "border-slate-100"}`}
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className={`w-full bg-transparent text-[13px] font-medium outline-none placeholder:text-slate-400 ${dark ? "text-white" : "text-slate-800"}`}
            />
          </div>

          {/* List */}
          <div ref={listRef} className="max-h-[420px] overflow-y-auto py-1">
            {grouped.map(([type, list]) => (
              <div key={type}>
                <p
                  className={`px-2 pb-1 pt-1.5 text-[9px] font-black uppercase tracking-widest ${dark ? "text-slate-500" : "text-slate-400"}`}
                >
                  {type}
                </p>
                <div className="grid grid-cols-1 gap-1 px-1 min-[420px]:grid-cols-2">
                  {list.map((d) => (
                    <DeviceSwitcherItem
                      key={d.id}
                      ref={d.id === currentDevice.id ? activeItemRef : undefined}
                      device={d}
                      active={d.id === currentDevice.id}
                      dark={dark}
                      onPick={() => {
                        addRecent(d.id);
                        onSwitch(d.id);
                        setOpen(false);
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
            {grouped.length === 0 && (
              <p className="px-3 py-4 text-center text-[11px] text-slate-400">
                No results
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
  onPick: () => void;
}>(function DeviceSwitcherItem({ device, active, dark, onPick }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={`flex min-h-10 w-full min-w-0 items-center gap-1.5 rounded-[8px] px-1.5 py-1.25 text-left transition ${
        active
          ? "bg-slate-900 text-white hover:bg-slate-800"
          : dark
            ? "text-slate-200 hover:bg-white/[0.07]"
            : "text-slate-700 hover:bg-slate-50"
      }`}
      onClick={onPick}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11px] font-semibold leading-tight">
          {shortName(device.name)}
        </span>
        <span
          className={`mt-0.5 block truncate text-[8px] ${active ? "text-white/60" : dark ? "text-slate-500" : "text-slate-400"}`}
        >
          {device.cssViewport.width}×{device.cssViewport.height} · {device.brand}
        </span>
      </span>
    </button>
  );
});

function BlockedView({
  onCapture,
  onReload,
  onUseLivePreview,
  canUseLivePreview,
  url,
}: {
  onCapture: () => void;
  onReload: () => void;
  onUseLivePreview: () => void;
  canUseLivePreview: boolean;
  url: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-slate-50 p-6 text-center">
      <p className="text-sm font-black text-slate-900">
        This site blocks iframe preview.
      </p>
      <p className="max-w-[250px] break-all text-[11px] font-semibold leading-5 text-slate-500">
        {url}
      </p>
      <p className="max-w-[260px] text-xs leading-5 text-slate-500">
        The page likely keeps frame protection, uses a restricted browser URL,
        or prevented the preview bridge from loading.
      </p>
      <div className="grid w-full max-w-[240px] gap-2">
        <button
          className="flex items-center justify-center gap-2 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-bold text-white"
          onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
        >
          <ExternalLink size={13} /> Open in tab
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
          onClick={onReload}
        >
          <RefreshCw size={13} /> Reload preview
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
          onClick={onCapture}
        >
          <Camera size={13} /> Capture current tab instead
        </button>
        {canUseLivePreview && (
          <button
            className="flex items-center justify-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800"
            onClick={onUseLivePreview}
          >
            <ExternalLink size={13} /> Switch to live tab
          </button>
        )}
      </div>
    </div>
  );
}

function LivePreviewFallback({
  message,
  onReload,
}: {
  message: string | null;
  onReload: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-slate-50 p-6 text-center">
      <p className="text-sm font-black text-slate-900">Live preview unavailable.</p>
      <p className="max-w-[260px] text-xs leading-5 text-slate-500">
        {message ?? "The source tab could not be captured right now."}
      </p>
      <button
        className="flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
        onClick={onReload}
      >
        <RefreshCw size={13} /> Refresh live preview
      </button>
    </div>
  );
}

function CardBtn({
  dark,
  label,
  children,
  onClick,
  disabled = false,
}: {
  dark: boolean;
  label: string;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-md transition ${
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
