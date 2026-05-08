import { Heart, Laptop, Monitor, Smartphone, Tablet, Tv, Watch } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { useDeviceCatalog } from "../../app/DeviceCatalogProvider";
import { useSimulator } from "../../app/SimulatorProvider";
import type { Device } from "../../domain/device/device.types";

export function DeviceLibrary() {
  const { devices, setSelectedDeviceId, toggleFavorite, isFavorite } = useDeviceCatalog();
  const { activeSlotId, slots, setSlotDevice } = useSimulator();

  function pickDevice(deviceId: string) {
    setSelectedDeviceId(deviceId);
    setSlotDevice(activeSlotId, deviceId);
  }

  const activeDeviceId = slots.find((slot) => slot.id === activeSlotId)?.deviceId;

  return (
    <aside className="flex h-full min-h-0 w-full shrink-0 flex-col bg-white/82 sm:w-[620px]">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="mb-3">
          <h2 className="text-sm font-black text-slate-950">Devices</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">Select a tile to replace the active preview.</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-slate-400">{devices.length} devices</p>
        <DeviceSections
          activeDeviceId={activeDeviceId}
          devices={devices}
          isFavorite={isFavorite}
          onFavorite={toggleFavorite}
          onPick={pickDevice}
        />
      </div>
    </aside>
  );
}

function DeviceSections({
  activeDeviceId,
  devices,
  isFavorite,
  onFavorite,
  onPick
}: {
  activeDeviceId?: string;
  devices: Device[];
  isFavorite: (id: string) => boolean;
  onFavorite: (id: string) => void;
  onPick: (id: string) => void;
}) {
  const sections = useMemo(() => {
    const rows: Array<{ key: string; label: string; devices: Device[]; icon: ReactNode }> = [
      { key: "android", label: "Android Phones", devices: devices.filter((device) => device.type === "phone" && /android/i.test(device.os)), icon: <Smartphone size={17} /> },
      { key: "apple", label: "Apple Phones", devices: devices.filter((device) => device.type === "phone" && /ios/i.test(device.os)), icon: <Smartphone size={17} /> },
      { key: "tablet", label: "Tablets", devices: devices.filter((device) => device.type === "tablet"), icon: <Tablet size={17} /> },
      { key: "desktop", label: "Desktop & Laptop", devices: devices.filter((device) => device.type === "desktop" || device.type === "laptop"), icon: <Laptop size={17} /> },
      { key: "special", label: "Specials", devices: devices.filter((device) => device.type === "watch" || device.type === "tv" || device.type === "custom"), icon: <Watch size={17} /> }
    ];

    return rows.filter((row) => row.devices.length > 0);
  }, [devices]);

  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <section key={section.key}>
          <h3 className="mb-2 flex items-center gap-2 text-[14px] font-black text-slate-700">
            {section.icon}
            {section.label}
          </h3>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {section.devices.map((device) => (
              <DeviceTile
                key={device.id}
                active={activeDeviceId === device.id}
                device={device}
                favorite={isFavorite(device.id)}
                onFavorite={onFavorite}
                onPick={onPick}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function DeviceTile({
  active,
  device,
  favorite,
  onFavorite,
  onPick
}: {
  active: boolean;
  device: Device;
  favorite: boolean;
  onFavorite: (id: string) => void;
  onPick: (id: string) => void;
}) {
  const dimensions = `${device.cssViewport.width} x ${device.cssViewport.height}`;

  return (
    <div
      className={`relative h-[88px] rounded-lg border bg-white transition ${
        active ? "border-blue-500 shadow-[0_0_0_2px_rgb(59_130_246/0.18)]" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
      }`}
      title={`${device.name} · ${dimensions}`}
    >
      <button
        type="button"
        aria-label={`Select ${device.name}`}
        className="flex h-full w-full flex-col items-center justify-center px-1.5 text-center"
        onClick={() => onPick(device.id)}
      >
        <DeviceGlyph device={device} />
        <span className="mt-1.5 line-clamp-2 text-[10.5px] font-bold leading-[12px] text-slate-700">{shortDeviceName(device.name)}</span>
        <span className={`mt-1 text-[9.5px] font-black leading-none ${active ? "text-blue-600" : "text-slate-400"}`}>{dimensions}</span>
      </button>
      <button
        type="button"
        aria-label={favorite ? `Remove ${device.name} from favorites` : `Add ${device.name} to favorites`}
        className={`absolute right-1 top-1 rounded-full p-1 transition hover:bg-slate-100 ${favorite ? "text-red-500" : "text-slate-300 hover:text-slate-500"}`}
        onClick={(event) => {
          event.stopPropagation();
          onFavorite(device.id);
        }}
      >
        <Heart size={11} fill={favorite ? "currentColor" : "none"} />
      </button>
    </div>
  );
}

function DeviceGlyph({ device }: { device: Device }) {
  const mockup = device.mockupAssets.find((asset) => asset.localPath);
  if (mockup?.localPath) {
    return <img src={mockup.localPath} alt="" className="h-8 w-9 object-contain" loading="lazy" />;
  }
  if (device.type === "desktop" || device.type === "laptop") return <Laptop className="text-slate-800" size={29} />;
  if (device.type === "tablet") return <Tablet className="text-slate-800" size={31} />;
  if (device.type === "watch") return <Watch className="text-slate-800" size={27} />;
  if (device.type === "tv") return <Tv className="text-slate-800" size={31} />;
  if (device.type === "custom") return <Monitor className="text-slate-800" size={29} />;
  return <Smartphone className="text-slate-800" size={28} />;
}

function shortDeviceName(name: string) {
  return name
    .replace(/^Apple\s+/i, "")
    .replace(/^Samsung\s+/i, "")
    .replace(/^Google\s+/i, "")
    .replace(/\s*\((?:20\d{2}|6th Gen|40mm)\)/gi, "");
}
