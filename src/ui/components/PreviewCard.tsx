import { Camera, ChevronDown, Minus, Plus, RotateCw, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { captureNodeToPng, downloadDataUrl, screenshotFilename } from "../../domain/capture/capture-service";
import { supportsOrientation, toLandscapeAwareSize } from "../../domain/device/device-service";
import { devices as allDevices } from "../../domain/device/device-catalog";
import type { Device, Size } from "../../domain/device/device.types";
import type { DisplaySettings, PreviewSlot } from "../../domain/simulator/simulator.types";
import { useSimulator } from "../../app/SimulatorProvider";
import { DeviceFrame, estimateDeviceFrameSize } from "./DeviceFrame";

const CARD_PAD = 32;

interface PreviewCardProps {
  slot: PreviewSlot;
  device: Device;
  display: DisplaySettings;
  removable: boolean;
  onAnnotate: () => void;
}

export function PreviewCard({ slot, device, display, removable, onAnnotate: _onAnnotate }: PreviewCardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const captureRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState<Size>({ width: 0, height: 0 });
  const [blocked, setBlocked] = useState(false);
  const { setActiveSlot, removeSlot, rotateSlot, zoomSlot, setSlotDevice } = useSimulator();

  const canRotate = supportsOrientation(device);
  const viewportSize = canRotate
    ? toLandscapeAwareSize(device.cssViewport, slot.orientation)
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
  const fitScale = Math.min(1, availW / frameSize.width, availH / frameSize.height);
  const scale =
    slot.zoomMode === "actual" ? 1
    : slot.zoomMode === "fit" ? fitScale
    : fitScale * (slot.zoom / 0.58);

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
  }, [device.id, slot.reloadToken, slot.url]);

  async function capture() {
    if (!captureRef.current) return;
    const dataUrl = await captureNodeToPng(captureRef.current);
    await downloadDataUrl(dataUrl, screenshotFilename(device.name));
  }

  return (
    <section
      className="flex h-full flex-col overflow-hidden"
      style={{ minWidth: 0 }}
      onClick={() => setActiveSlot(slot.id)}
      onFocus={() => setActiveSlot(slot.id)}
    >
      {/* ── Per-card header ── */}
      <div className="flex h-10 shrink-0 items-center gap-1.5 border-b border-black/[0.06] bg-white px-2">
        {/* Device switcher */}
        <DeviceSwitcher
          currentDevice={device}
          onSwitch={(id) => setSlotDevice(slot.id, id)}
        />

        <span className="mx-1 h-4 w-px shrink-0 bg-slate-200" />

        {/* Viewport dims */}
        <span className="shrink-0 text-[12px] font-medium tabular-nums text-slate-500">
          {viewportSize.width}×{viewportSize.height}
        </span>

        <div className="flex-1" />

        {canRotate && (
          <CardBtn label="Rotate" onClick={() => rotateSlot(slot.id)}>
            <RotateCw size={14} />
          </CardBtn>
        )}
        <CardBtn label="Zoom out" onClick={() => zoomSlot(slot.id, "out")}>
          <Minus size={14} />
        </CardBtn>
        <CardBtn label="Zoom in" onClick={() => zoomSlot(slot.id, "in")}>
          <Plus size={14} />
        </CardBtn>
        <CardBtn label="Screenshot" onClick={() => void capture()}>
          <Camera size={14} />
        </CardBtn>
        {removable && (
          <CardBtn label="Remove" onClick={() => removeSlot(slot.id)}>
            <X size={14} />
          </CardBtn>
        )}
      </div>

      {/* ── Canvas ── */}
      <div
        ref={containerRef}
        className="flex flex-1 items-center justify-center overflow-hidden bg-[#f5f5f3]"
      >
        {containerSize.width > 0 && (
          <div
            ref={captureRef}
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
              url={slot.url}
              viewportSize={viewportSize}
              orientation={slot.orientation}
            >
              <div style={{ width: viewportSize.width, height: viewportSize.height }}>
                {blocked ? (
                  <BlockedView url={slot.url} />
                ) : (
                  <iframe
                    key={`${slot.id}-${slot.reloadToken}`}
                    title={`${device.name} preview`}
                    src={slot.url}
                    className="h-full w-full border-0 bg-white"
                    sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
                    onError={() => setBlocked(true)}
                  />
                )}
              </div>
            </DeviceFrame>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Device switcher ──────────────────────────────────────────────────────────

const TYPE_ORDER = ["phone", "tablet", "laptop", "desktop", "tv", "watch"] as const;
const TYPE_LABEL: Record<string, string> = {
  phone: "Phones", tablet: "Tablets", laptop: "Laptops",
  desktop: "Desktops", tv: "TV", watch: "Watch",
};

function DeviceSwitcher({ currentDevice, onSwitch }: { currentDevice: Device; onSwitch: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
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
    if (!q) return allDevices;
    return allDevices.filter((d) =>
      [d.name, d.brand, d.family, d.type].join(" ").toLowerCase().includes(q)
    );
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, Device[]>();
    for (const t of TYPE_ORDER) map.set(t, []);
    for (const d of filtered) map.get(d.type)?.push(d);
    return Array.from(map.entries()).filter(([, list]) => list.length > 0);
  }, [filtered]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex h-7 items-center gap-1 rounded-md pl-2 pr-1.5 text-[13px] font-semibold text-slate-800 transition hover:bg-slate-100"
      >
        <span className="max-w-[150px] truncate">{shortName(currentDevice.name)}</span>
        <ChevronDown size={13} className="shrink-0 text-slate-500" />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 flex w-56 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.14)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search */}
          <div className="border-b border-slate-100 px-2.5 py-2">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full bg-transparent text-[12px] font-medium text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>

          {/* List */}
          <div ref={listRef} className="max-h-72 overflow-y-auto py-1">
            {grouped.map(([type, list]) => (
              <div key={type}>
                <p className="px-3 pb-0.5 pt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {TYPE_LABEL[type]}
                </p>
                {list.map((d) => (
                  <button
                    key={d.id}
                    ref={d.id === currentDevice.id ? activeItemRef : undefined}
                    type="button"
                    className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left transition hover:bg-slate-50 ${
                      d.id === currentDevice.id ? "bg-slate-900 text-white hover:bg-slate-800" : "text-slate-700"
                    }`}
                    onClick={() => { onSwitch(d.id); setOpen(false); }}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-semibold leading-tight">
                        {shortName(d.name)}
                      </span>
                      <span className={`text-[10px] ${d.id === currentDevice.id ? "text-white/50" : "text-slate-400"}`}>
                        {d.cssViewport.width}×{d.cssViewport.height}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ))}
            {grouped.length === 0 && (
              <p className="px-3 py-4 text-center text-[11px] text-slate-400">No results</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function BlockedView({ url }: { url: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-slate-50 p-6 text-center">
      <p className="text-sm font-bold text-slate-800">Can't preview this site</p>
      <p className="max-w-[220px] text-xs leading-5 text-slate-500">
        This site blocks embedding. Open it in a real tab then use screenshots here.
      </p>
      <button
        className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-bold text-white"
        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      >
        Open in tab
      </button>
    </div>
  );
}

function CardBtn({ label, children, onClick }: { label: string; children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="grid h-7 w-7 shrink-0 place-items-center rounded text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
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
