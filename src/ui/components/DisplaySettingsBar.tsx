import { Columns3, EyeOff, MonitorUp, Plus, RectangleHorizontal, ScreenShare } from "lucide-react";
import type { ReactNode } from "react";
import { useSimulator } from "../../app/SimulatorProvider";
import { maxPreviewSlots } from "../../domain/simulator/simulator-service";
import { TooltipButton } from "./TooltipButton";

export function DisplaySettingsBar() {
  const { slots, display, addSlot, updateDisplay } = useSimulator();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <TooltipButton label="Add device preview" variant="solid" disabled={slots.length >= maxPreviewSlots} onClick={() => addSlot()}>
          <Plus size={16} /> Add device
        </TooltipButton>
        <span className="inline-flex items-center gap-2 rounded-[8px] border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] font-bold text-slate-600">
          <Columns3 size={16} /> {slots.length} / {maxPreviewSlots} previews
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Toggle
          active={display.showStatusBar}
          icon={<MonitorUp size={15} />}
          label="Status"
          onClick={() => updateDisplay({ ...display, showStatusBar: !display.showStatusBar })}
        />
        <Toggle
          active={display.showUrlBar}
          icon={<RectangleHorizontal size={15} />}
          label="URL bar"
          onClick={() => updateDisplay({ ...display, showUrlBar: !display.showUrlBar })}
        />
        <Toggle
          active={display.presentationMode}
          icon={<ScreenShare size={15} />}
          label="Present"
          onClick={() => updateDisplay({ ...display, presentationMode: !display.presentationMode })}
        />
        <Toggle
          active={display.hideChrome}
          icon={<EyeOff size={15} />}
          label="Focus"
          onClick={() => updateDisplay({ ...display, hideChrome: !display.hideChrome })}
        />
      </div>
    </div>
  );
}

function Toggle({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      className={`inline-flex h-9 items-center gap-2 rounded-[8px] border px-3 text-[13px] font-bold ${
        active ? "border-teal-600 bg-teal-50 text-teal-800" : "border-slate-200 bg-white text-slate-500"
      }`}
      onClick={onClick}
      type="button"
    >
      {icon} {label}
    </button>
  );
}
