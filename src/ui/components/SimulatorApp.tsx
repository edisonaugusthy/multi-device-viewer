import { Camera, HelpCircle, Info, Layers, Library, PanelsTopLeft, RefreshCw, Settings, Share2, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useDeviceCatalog } from "../../app/DeviceCatalogProvider";
import { useSimulator } from "../../app/SimulatorProvider";
import { captureNodeToPng, downloadDataUrl, screenshotFilename } from "../../domain/capture/capture-service";
import type { Device } from "../../domain/device/device.types";
import type { DisplaySettings } from "../../domain/simulator/simulator.types";
import { getActiveTabUrl } from "../../app/extension-routes";
import { DeviceInfoPanel } from "./DeviceInfoPanel";
import { DeviceLibrary } from "./DeviceLibrary";
import { PreviewCard } from "./PreviewCard";
import { AnnotationOverlay } from "./AnnotationOverlay";

export function SimulatorApp() {
  const { findDevice, visibleDevices, setSelectedDeviceId, addRecent } = useDeviceCatalog();
  const { slots, display, activeSlotId, setSlotDevice, setSlotUrl, addSlot, duplicateActiveSlot, updateDisplay } = useSimulator();
  const [urlDraft, setUrlDraft] = useState(slots.find((slot) => slot.id === activeSlotId)?.url ?? "");
  const [annotationOpen, setAnnotationOpen] = useState(false);
  const [annotationImage, setAnnotationImage] = useState<string | undefined>();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const gridClass =
    slots.length === 1
      ? "grid-cols-1"
      : slots.length === 2
        ? "grid-cols-1 xl:grid-cols-2"
        : slots.length === 3
          ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
          : "grid-cols-1 md:grid-cols-2 xl:grid-cols-4";
  const panelOpen = settingsOpen || libraryOpen || infoOpen;
  const activeSlot = slots.find((slot) => slot.id === activeSlotId) ?? slots[0];
  const activeDevice = findDevice(activeSlot.deviceId);
  const selectableDevices = useMemo(() => {
    if (visibleDevices.some((device) => device.id === activeDevice.id)) return visibleDevices;
    return [activeDevice, ...visibleDevices];
  }, [activeDevice, visibleDevices]);

  useEffect(() => {
    setUrlDraft(activeSlot.url);
  }, [activeSlot.id, activeSlot.url]);

  async function useCurrentTab() {
    const tabUrl = await getActiveTabUrl();
    if (tabUrl) {
      setUrlDraft(tabUrl);
      setSlotUrl(activeSlotId, tabUrl);
    }
  }

  async function captureComparison(download = true) {
    const board = document.querySelector("[data-capture-board]") as HTMLElement | null;
    if (!board) return undefined;
    try {
      const dataUrl = await captureNodeToPng(board);
      if (download) await downloadDataUrl(dataUrl, screenshotFilename("comparison-board"));
      return dataUrl;
    } catch {
      return undefined;
    }
  }

  async function openAnnotation() {
    const dataUrl = await captureComparison(false);
    setAnnotationImage(dataUrl);
    setAnnotationOpen(true);
  }

  function openLibraryPanel() {
    setLibraryOpen(true);
    setInfoOpen(false);
    setSettingsOpen(false);
  }

  function openInfoPanel() {
    setInfoOpen(true);
    setLibraryOpen(false);
    setSettingsOpen(false);
  }

  function openSettingsPanel() {
    setSettingsOpen(true);
    setLibraryOpen(false);
    setInfoOpen(false);
  }

  function addComparisonSlot() {
    if (slots.length === 1) {
      addSlot(activeSlot.deviceId);
    } else {
      duplicateActiveSlot(activeSlot.deviceId);
    }
    openLibraryPanel();
  }

  return (
    <div className="h-screen overflow-hidden bg-[#fbfbfa] text-slate-950">
      <main className="h-screen overflow-auto bg-[#fbfbfa]">
        <div
          data-capture-board
          className={`grid min-h-screen auto-rows-[minmax(360px,calc(100vh-128px))] items-center justify-items-stretch gap-x-6 gap-y-8 px-4 py-16 pr-20 sm:px-8 lg:px-12 ${panelOpen ? "sm:pr-[460px]" : "lg:pr-24"} ${gridClass}`}
        >
            {slots.map((slot) => (
              <PreviewCard
                key={slot.id}
                slot={slot}
                device={findDevice(slot.deviceId)}
                display={display}
                removable={slots.length > 1}
                onAnnotate={() => void openAnnotation()}
              />
            ))}
        </div>
      </main>

      <aside className="fixed right-4 top-4 z-50 flex h-[calc(100vh-32px)] w-12 flex-col items-center justify-between rounded-full border border-white/60 bg-white/45 py-3 shadow-[0_16px_48px_rgb(15_23_42/0.14)] ring-1 ring-slate-900/5 backdrop-blur-2xl">
        <div className="flex flex-col items-center gap-2">
          <RailButton label="Close panels" onClick={() => { setLibraryOpen(false); setInfoOpen(false); setSettingsOpen(false); }}>
            <X size={22} />
          </RailButton>
          <RailDivider />
          <RailButton label="Devices" onClick={openLibraryPanel}>
            <Library size={22} />
          </RailButton>
          <RailButton label="Controls" onClick={openSettingsPanel}>
            <Info size={22} />
          </RailButton>
          <RailButton label="Screenshot" onClick={() => void captureComparison(true)}>
            <Camera size={22} />
          </RailButton>
          <RailButton label="Annotate and share" onClick={() => void openAnnotation()}>
            <Share2 size={22} />
          </RailButton>
        </div>
        <div className="flex flex-col items-center gap-2">
          <RailButton label="Add comparison device" onClick={addComparisonSlot}>
            <PanelsTopLeft size={22} />
          </RailButton>
          <RailButton label="Help" onClick={openInfoPanel}>
            <HelpCircle size={22} />
          </RailButton>
          <RailButton label="Settings" onClick={openSettingsPanel}>
            <Settings size={22} />
          </RailButton>
        </div>
      </aside>

      {libraryOpen && (
        <Drawer side="right" onClose={() => setLibraryOpen(false)}>
          <DeviceLibrary />
        </Drawer>
      )}
      {infoOpen && (
        <Drawer side="right" onClose={() => setInfoOpen(false)}>
          <DeviceInfoPanel />
        </Drawer>
      )}
      {settingsOpen && (
        <ControlsPanel
          activeDeviceId={activeSlot.deviceId}
          devices={selectableDevices}
          display={display}
          urlDraft={urlDraft}
          onClose={() => setSettingsOpen(false)}
          onCurrentTab={useCurrentTab}
          onDeviceChange={(deviceId) => {
            setSelectedDeviceId(deviceId);
            addRecent(deviceId);
            setSlotDevice(activeSlotId, deviceId);
          }}
          onDisplayChange={updateDisplay}
          onUrlDraftChange={setUrlDraft}
          onUrlLoad={() => setSlotUrl(activeSlotId, urlDraft)}
        />
      )}

      {annotationOpen && <AnnotationOverlay imageUrl={annotationImage} onClose={() => setAnnotationOpen(false)} />}
    </div>
  );
}

function RailButton({ label, children, onClick }: { label: string; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-white/70 hover:text-slate-950"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function RailDivider() {
  return <span className="my-1 h-px w-8 bg-slate-200" />;
}

function Drawer({ side, children, onClose }: { side: "left" | "right"; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 bg-slate-950/5 backdrop-blur-[1px]" onClick={onClose}>
      <div
        className={`absolute top-4 h-[calc(100%-32px)] overflow-hidden rounded-[18px] border border-white/70 bg-white/78 shadow-[0_24px_80px_rgb(15_23_42/0.18)] backdrop-blur-2xl ${
          side === "left" ? "left-4 right-20 sm:right-auto" : "left-4 right-20 sm:left-auto"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ControlsPanel({
  activeDeviceId,
  devices,
  display,
  urlDraft,
  onClose,
  onCurrentTab,
  onDeviceChange,
  onDisplayChange,
  onUrlDraftChange,
  onUrlLoad
}: {
  activeDeviceId: string;
  devices: Device[];
  display: DisplaySettings;
  urlDraft: string;
  onClose: () => void;
  onCurrentTab: () => void;
  onDeviceChange: (deviceId: string) => void;
  onDisplayChange: (display: DisplaySettings) => void;
  onUrlDraftChange: (value: string) => void;
  onUrlLoad: () => void;
}) {
  return (
    <aside className="fixed left-4 right-20 top-6 z-50 max-h-[calc(100vh-48px)] overflow-y-auto rounded-[18px] border border-white/70 bg-white/72 p-4 shadow-[0_20px_70px_rgb(15_23_42/0.18)] ring-1 ring-slate-900/5 backdrop-blur-2xl sm:left-auto sm:w-[360px]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-950">Simulator</h2>
          <p className="mt-1 text-xs font-semibold text-slate-400">Device, address, and display.</p>
        </div>
        <button className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <label className="text-xs font-black uppercase tracking-[0.1em] text-slate-400">Device</label>
      <select
        value={activeDeviceId}
        className="mt-2 h-11 w-full rounded-[10px] border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
        onChange={(event) => onDeviceChange(event.target.value)}
      >
        {devices.map((device) => (
          <option key={device.id} value={device.id}>
            {device.name}
          </option>
        ))}
      </select>

      <label className="mt-4 block text-xs font-black uppercase tracking-[0.1em] text-slate-400">URL</label>
      <form
        className="mt-2 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onUrlLoad();
        }}
      >
        <input
          value={urlDraft}
          onChange={(event) => onUrlDraftChange(event.target.value)}
          className="h-11 min-w-0 flex-1 rounded-[10px] border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white"
          placeholder="https://example.com"
        />
        <button className="grid h-11 w-11 place-items-center rounded-[10px] bg-blue-500 text-white" title="Load">
          <RefreshCw size={17} />
        </button>
      </form>
      <button className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-slate-200 bg-white text-sm font-bold text-slate-600" onClick={onCurrentTab}>
        <Layers size={16} /> Use current tab
      </button>

      <div className="mt-4 rounded-[12px] border border-slate-200 p-1">
        <SettingToggle label="Status bar" active={display.showStatusBar} onClick={() => onDisplayChange({ ...display, showStatusBar: !display.showStatusBar })} />
        <SettingToggle label="Browser controls" active={display.showUrlBar} onClick={() => onDisplayChange({ ...display, showUrlBar: !display.showUrlBar })} />
        <SettingToggle label="Battery icons" active={display.showBattery} onClick={() => onDisplayChange({ ...display, showBattery: !display.showBattery })} />
      </div>
    </aside>
  );
}

function SettingToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button className="flex w-full items-center justify-between border-t border-slate-100 py-3 text-sm font-bold text-slate-700" onClick={onClick}>
      {label}
      <span className={`h-6 w-10 rounded-full p-0.5 transition ${active ? "bg-blue-500" : "bg-slate-200"}`}>
        <span className={`block h-5 w-5 rounded-full bg-white transition ${active ? "translate-x-4" : ""}`} />
      </span>
    </button>
  );
}
