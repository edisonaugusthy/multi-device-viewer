/**
 * PresetsManager — save/load/export/import named device presets.
 *
 * A preset is a named array of device IDs (up to 4).
 * Persisted to chrome.storage.local / localStorage via readStore/writeStore.
 */
import { Download, Plus, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { readStore, writeStore } from "../../infrastructure/storage/local-store";
import { useI18n } from "../../app/i18n";

export interface SavedPreset {
  id: string;
  name: string;
  deviceIds: string[];
  createdAt: string;
}

interface PresetsManagerProps {
  dark: boolean;
  currentDeviceIds: string[];
  onApply: (deviceIds: string[]) => void;
}

const STORAGE_KEY = "mdvSavedPresets";

export function PresetsManager({ dark, currentDeviceIds, onApply }: PresetsManagerProps) {
  const { t } = useI18n();
  const [presets, setPresets] = useState<SavedPreset[]>([]);
  const [saveName, setSaveName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void readStore<SavedPreset[]>(STORAGE_KEY, []).then(setPresets);
  }, []);

  const persist = useCallback((next: SavedPreset[]) => {
    setPresets(next);
    void writeStore(STORAGE_KEY, next);
  }, []);

  function savePreset() {
    const name = saveName.trim();
    if (!name) return;
    const preset: SavedPreset = {
      id: `preset-${Date.now()}`,
      name,
      deviceIds: currentDeviceIds,
      createdAt: new Date().toISOString(),
    };
    persist([preset, ...presets]);
    setSaveName("");
  }

  function deletePreset(id: string) {
    persist(presets.filter((p) => p.id !== id));
  }

  function exportPresets() {
    const blob = new Blob([JSON.stringify(presets, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mdv-presets.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importPresets(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string) as SavedPreset[];
        if (!Array.isArray(imported)) return;
        // Merge: imported presets take precedence by id
        const existingIds = new Set(imported.map((p) => p.id));
        const merged = [...imported, ...presets.filter((p) => !existingIds.has(p.id))];
        persist(merged);
      } catch {
        // ignore malformed
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const labelCls = dark ? "text-slate-400" : "text-slate-500";
  const inputCls = dark
    ? "border-white/15 bg-white/[0.06] text-white placeholder:text-slate-500 focus:border-teal-400/60"
    : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-teal-500";

  return (
    <div className="flex flex-col gap-2">
      {/* Save current layout */}
      <div className="flex gap-1.5">
        <input
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") savePreset(); }}
          placeholder={t("nameLayout")}
          className={`min-w-0 flex-1 rounded-md border px-2.5 py-1.5 text-[12px] font-medium outline-none transition ${inputCls}`}
        />
        <button
          type="button"
          onClick={savePreset}
          disabled={!saveName.trim()}
          title={t("savePreset")}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-teal-500 text-white transition hover:bg-teal-400 disabled:opacity-40"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Saved presets list */}
      {presets.length > 0 && (
        <div className="flex flex-col gap-1">
          {presets.map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-1 rounded-md border px-2 py-1 ${dark ? "border-white/10 bg-white/[0.03]" : "border-slate-100 bg-slate-50"}`}
            >
              <button
                type="button"
                onClick={() => onApply(p.deviceIds)}
                className={`min-w-0 flex-1 truncate text-left text-[12px] font-semibold transition ${dark ? "text-slate-200 hover:text-white" : "text-slate-700 hover:text-slate-900"}`}
              >
                {p.name}
                <span className={`ml-1.5 text-[10px] font-normal ${labelCls}`}>{t(p.deviceIds.length === 1 ? "deviceCount" : "devicesCount", { count: p.deviceIds.length })}</span>
              </button>
              <button
                type="button"
                onClick={() => deletePreset(p.id)}
                title={t("deletePreset")}
                className={`grid h-6 w-6 shrink-0 place-items-center rounded transition ${dark ? "text-slate-600 hover:text-red-400" : "text-slate-300 hover:text-red-500"}`}
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Export / Import */}
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={exportPresets}
          disabled={presets.length === 0}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border py-1.5 text-[11px] font-bold transition disabled:opacity-40 ${
            dark ? "border-white/10 text-slate-400 hover:bg-white/[0.06] hover:text-white" : "border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          }`}
        >
          <Download size={11} /> {t("export")}
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border py-1.5 text-[11px] font-bold transition ${
            dark ? "border-white/10 text-slate-400 hover:bg-white/[0.06] hover:text-white" : "border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          }`}
        >
          <Upload size={11} /> {t("import")}
        </button>
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={importPresets} />
      </div>
    </div>
  );
}
