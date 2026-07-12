import { X } from "lucide-react";
import { useState } from "react";
import { useDeviceCatalog } from "../../app/DeviceCatalogProvider";
import { createCustomDevice } from "../../domain/device/device-service";
import type { CustomDeviceInput, DeviceType } from "../../domain/device/device.types";

interface CustomDeviceModalProps {
  dark: boolean;
  onClose: () => void;
  onCreated: (deviceId: string, orientation: "portrait" | "landscape") => void;
}

const DEVICE_TYPES: DeviceType[] = ["phone", "tablet", "laptop", "desktop", "watch", "tv", "custom"];

export function CustomDeviceModal({ dark, onClose, onCreated }: CustomDeviceModalProps) {
  const { addCustomDevice } = useDeviceCatalog();

  const [name, setName] = useState("");
  const [width, setWidth] = useState("390");
  const [height, setHeight] = useState("844");
  const [pixelRatio, setPixelRatio] = useState("2");
  const [type, setType] = useState<DeviceType>("phone");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input: CustomDeviceInput = {
      name: name.trim(),
      width: parseInt(width, 10),
      height: parseInt(height, 10),
      pixelRatio: parseFloat(pixelRatio),
      type,
    };
    const err = addCustomDevice(input);
    if (err) {
      setError(err);
      return;
    }
    onCreated(createCustomDevice(input).id, input.width > input.height ? "landscape" : "portrait");
    onClose();
  }

  const bg = dark ? "bg-[#1a1f2e] border-white/15" : "bg-white border-slate-200";
  const inputCls = dark
    ? "border-white/15 bg-white/[0.06] text-white placeholder:text-slate-500 focus:border-teal-400/60"
    : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-teal-500";
  const labelCls = dark ? "text-slate-400" : "text-slate-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className={`w-full max-w-sm rounded-2xl border shadow-2xl ${bg}`}>
        {/* Header */}
        <div className={`flex items-center justify-between border-b px-4 py-3 ${dark ? "border-white/10" : "border-slate-100"}`}>
          <p className={`text-[14px] font-black ${dark ? "text-white" : "text-slate-900"}`}>Custom viewport</p>
          <button
            type="button"
            onClick={onClose}
            className={`grid h-7 w-7 place-items-center rounded-md transition ${dark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}`}
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3 p-4">
          {/* Name */}
          <label className="flex flex-col gap-1">
            <span className={`text-[11px] font-black uppercase tracking-widest ${labelCls}`}>Name</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Device"
              className={`rounded-lg border px-3 py-2 text-[13px] font-medium outline-none transition ${inputCls}`}
            />
          </label>

          {/* Width + Height */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className={`text-[11px] font-black uppercase tracking-widest ${labelCls}`}>Width (px)</span>
              <input
                required
                type="number"
                min={60}
                max={3840}
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className={`rounded-lg border px-3 py-2 text-[13px] font-medium outline-none transition ${inputCls}`}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={`text-[11px] font-black uppercase tracking-widest ${labelCls}`}>Height (px)</span>
              <input
                required
                type="number"
                min={60}
                max={3840}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className={`rounded-lg border px-3 py-2 text-[13px] font-medium outline-none transition ${inputCls}`}
              />
            </label>
          </div>

          {/* DPR */}
          <label className="flex flex-col gap-1">
            <span className={`text-[11px] font-black uppercase tracking-widest ${labelCls}`}>Pixel ratio (DPR)</span>
            <input
              required
              type="number"
              min={0.5}
              max={6}
              step={0.5}
              value={pixelRatio}
              onChange={(e) => setPixelRatio(e.target.value)}
              className={`rounded-lg border px-3 py-2 text-[13px] font-medium outline-none transition ${inputCls}`}
            />
          </label>

          {/* Type */}
          <label className="flex flex-col gap-1">
            <span className={`text-[11px] font-black uppercase tracking-widest ${labelCls}`}>Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as DeviceType)}
              className={`rounded-lg border px-3 py-2 text-[13px] font-medium outline-none transition ${inputCls}`}
            >
              {DEVICE_TYPES.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </label>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-[12px] font-semibold text-red-400">{error}</p>
          )}

          <button
            type="submit"
            className="mt-1 h-10 w-full rounded-xl bg-teal-500 text-[13px] font-black text-white transition hover:bg-teal-400 active:scale-[0.98]"
          >
            Save and add viewport
          </button>
        </form>
      </div>
    </div>
  );
}
