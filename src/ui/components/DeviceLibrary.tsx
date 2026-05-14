import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useDeviceCatalog } from "../../app/DeviceCatalogProvider";
import { useSimulator } from "../../app/SimulatorProvider";
import type { Device } from "../../domain/device/device.types";

const TYPE_ORDER = ["phone", "tablet", "laptop", "desktop", "tv", "watch"];
const TYPE_LABEL: Record<string, string> = {
  phone: "Phones",
  tablet: "Tablets",
  laptop: "Laptops",
  desktop: "Desktops",
  tv: "TV",
  watch: "Watch",
};

export function DeviceLibrary({ onPick }: { onPick?: () => void }) {
  const { devices } = useDeviceCatalog();
  const { activeSlotId, slots, setSlotDevice } = useSimulator();
  const [query, setQuery] = useState("");

  const activeDeviceId = slots.find((s) => s.id === activeSlotId)?.deviceId;

  function pickDevice(deviceId: string) {
    setSlotDevice(activeSlotId, deviceId);
    onPick?.();
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return devices;
    return devices.filter((d) =>
      [d.name, d.brand, d.family, d.os, d.type, `${d.cssViewport.width}x${d.cssViewport.height}`]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [devices, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, Device[]>();
    for (const type of TYPE_ORDER) map.set(type, []);
    for (const d of filtered) {
      const bucket = map.get(d.type) ?? map.get("phone")!;
      bucket.push(d);
    }
    return Array.from(map.entries()).filter(([, list]) => list.length > 0);
  }, [filtered]);

  return (
    <div className="flex flex-col gap-0">
      {/* Search */}
      <div className="sticky top-0 z-10 bg-white px-3 pb-2 pt-2">
        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 focus-within:border-blue-400 focus-within:bg-white">
          <Search size={12} className="shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search devices…"
            className="min-w-0 flex-1 bg-transparent text-[12px] font-medium text-slate-800 outline-none placeholder:text-slate-400"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-600">
              <span className="text-[11px]">✕</span>
            </button>
          )}
        </div>
      </div>

      {/* Device list */}
      <div className="px-2 pb-4">
        {grouped.map(([type, list]) => (
          <div key={type} className="mb-3">
            <p className="px-1 pb-1 pt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
              {TYPE_LABEL[type] ?? type}
            </p>
            <div className="flex flex-col gap-0.5">
              {list.map((device) => (
                <DeviceRow
                  key={device.id}
                  device={device}
                  active={activeDeviceId === device.id}
                  onPick={pickDevice}
                />
              ))}
            </div>
          </div>
        ))}
        {grouped.length === 0 && (
          <p className="px-2 py-6 text-center text-[12px] text-slate-400">No devices match.</p>
        )}
      </div>
    </div>
  );
}

function DeviceRow({ device, active, onPick }: { device: Device; active: boolean; onPick: (id: string) => void }) {
  const dims = `${device.cssViewport.width}×${device.cssViewport.height}`;
  return (
    <button
      type="button"
      onClick={() => onPick(device.id)}
      className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition ${
        active
          ? "bg-slate-900 text-white"
          : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      <DeviceGlyph type={device.type} active={active} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] font-semibold leading-tight">
          {shortName(device.name)}
        </span>
        <span className={`text-[10.5px] font-medium ${active ? "text-white/60" : "text-slate-400"}`}>
          {dims}
        </span>
      </span>
    </button>
  );
}

function DeviceGlyph({ type, active }: { type: string; active: boolean }) {
  const cls = `shrink-0 ${active ? "text-white/70" : "text-slate-400"}`;
  if (type === "tablet")
    return <svg className={cls} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>;
  if (type === "laptop" || type === "desktop")
    return <svg className={cls} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>;
  if (type === "watch")
    return <svg className={cls} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="7"/></svg>;
  if (type === "tv")
    return <svg className={cls} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M8 20h8M12 18v2"/></svg>;
  return <svg className={cls} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>;
}

function shortName(name: string) {
  return name
    .replace(/^Apple\s+/i, "")
    .replace(/^Samsung\s+/i, "")
    .replace(/^Google\s+/i, "")
    .replace(/\s*\((?:20\d{2}|6th Gen|40mm)\)/gi, "");
}
