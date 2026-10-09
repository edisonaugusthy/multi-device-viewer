import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useDeviceCatalog } from "../../app/DeviceCatalogProvider";
import { useI18n, type TranslationKey } from "../../app/i18n";
import type { DeviceSet, useDeviceSets } from "../../app/useDeviceSets";
import { createCustomDevice } from "../../domain/device/device-service";
import type { DeviceGalleryGroupId } from "../../domain/device/device-gallery";
import { buildPickerSections, pickerTypeOptions, type PickerSectionKey, type PickerTypeFilter } from "../../domain/device/device-picker";
import type { Device, DeviceType } from "../../domain/device/device.types";
import {
  CheckIcon,
  ChevronLeftIcon,
  CloseIcon,
  CustomSizeIcon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
  SetsIcon,
  StarIcon,
  SwitchIcon,
} from "../icons";
import { DeviceGlyph, glyphKindFor } from "./DeviceGlyph";
import { shortName } from "./PreviewCard";
import { cx, Dropdown, focusRing, positionStyle, popoverPanel, SectionLabel, useAnchoredPosition, useDismiss } from "./ui";

export type PickerTarget = { kind: "add" } | { kind: "replace"; slotId: string };

type PickerView = "devices" | "sets" | "custom";

const TYPE_LABELS: Record<DeviceGalleryGroupId, TranslationKey | "iOS" | "Android"> = {
  ios: "iOS", android: "Android", phone: "phones", tablet: "tablets", laptop: "laptops",
  desktop: "desktops", tv: "televisions", custom: "customViewports", watch: "watches",
};

function customDeviceType(width: number): DeviceType {
  if (width < 600) return "phone";
  if (width < 1024) return "tablet";
  return "desktop";
}

interface Slot { id: string; deviceId: string }

export function DevicePicker({
  open, anchorRef, target, slots, maxSlots, sets,
  onClose, onAdd, onRemove, onReplace, onAddInstead, onApplySet, onDeleteCustom,
}: {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  target: PickerTarget;
  slots: Slot[];
  maxSlots: number;
  sets: ReturnType<typeof useDeviceSets>;
  onClose: () => void;
  onAdd: (deviceId: string) => void;
  onRemove: (slotId: string) => void;
  onReplace: (slotId: string, deviceId: string) => void;
  onAddInstead: () => void;
  onApplySet: (deviceIds: string[]) => void;
  onDeleteCustom: (deviceId: string) => void;
}) {
  const { t } = useI18n();
  const { devices, customDevices, favorites, recents, toggleFavorite, addRecent, addCustomDevice, findDevice } = useDeviceCatalog();
  const [view, setView] = useState<PickerView>("devices");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<PickerTypeFilter>("all");
  const [setName, setSetName] = useState("");
  const [customWidth, setCustomWidth] = useState("390");
  const [customHeight, setCustomHeight] = useState("700");
  const [customError, setCustomError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const position = useAnchoredPosition(anchorRef, open, 360, "start", 480);
  const dismiss = useCallback(() => onClose(), [onClose]);
  useDismiss(open, [panelRef, anchorRef], dismiss);

  const replaceSlot = target.kind === "replace" ? slots.find(slot => slot.id === target.slotId) : undefined;
  const replacing = replaceSlot ? findDevice(replaceSlot.deviceId) : undefined;
  // Unchecking the only device on screen keeps it until another is picked,
  // which then takes its place, so the workspace is never empty.
  const [swapSlotId, setSwapSlotId] = useState<string | null>(null);
  const swapSlot = !replaceSlot ? slots.find(slot => slot.id === swapSlotId) : undefined;
  const swapping = swapSlot ? findDevice(swapSlot.deviceId) : undefined;
  const usedIds = useMemo(() => new Set(slots.filter(slot => slot.id !== swapSlotId).map(slot => slot.deviceId)), [slots, swapSlotId]);
  const full = slots.length >= maxSlots;

  useEffect(() => {
    if (!open) return;
    setView("devices");
    setQuery("");
    setSwapSlotId(null);
    setCustomError(null);
    const frame = requestAnimationFrame(() => searchRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [open, target]);

  const sectionTitle = (key: PickerSectionKey) => {
    if (key === "starred") return t("starred");
    if (key === "recent") return t("recent");
    const label = TYPE_LABELS[key];
    return label === "iOS" || label === "Android" ? label : t(label);
  };
  const sections = useMemo(
    () => buildPickerSections({ devices, favorites, recents, query, typeFilter }),
    [devices, favorites, query, recents, typeFilter],
  );
  const typeOptions = useMemo(() => pickerTypeOptions(devices), [devices]);

  const currentIds = slots.map(slot => slot.deviceId);
  const currentIsSaved = sets.allSets.some(set => set.deviceIds.join() === currentIds.join());

  function pick(device: Device) {
    if (swapSlot?.deviceId === device.id) {
      setSwapSlotId(null);
      return;
    }
    // In the add picker a device on screen toggles off, freeing its slot.
    const slot = !replaceSlot && !swapSlot ? slots.findLast(candidate => candidate.deviceId === device.id) : undefined;
    if (slot) {
      if (slots.length > 1) onRemove(slot.id);
      else setSwapSlotId(slot.id);
      return;
    }
    addRecent(device.id);
    const into = replaceSlot ?? swapSlot;
    if (into) onReplace(into.id, device.id);
    else onAdd(device.id);
    setSwapSlotId(null);
  }

  function rowState(device: Device) {
    const added = usedIds.has(device.id);
    if (replaceSlot) {
      // Switching may reuse a device shown in another column, e.g. to compare orientations.
      const current = replaceSlot.deviceId === device.id;
      return {
        added, current,
        disabled: false,
        hint: current ? t("showingNow") : added ? t("alreadyInWorkspace") : t("switchToDevice"),
      };
    }
    if (added) return { added, current: false, disabled: false, hint: t("removeFromWorkspace") };
    return {
      added, current: false,
      disabled: full,
      hint: full ? t("slotsFull", { count: maxSlots }) : t("addToWorkspace"),
    };
  }

  function createCustomSize() {
    const width = Number.parseInt(customWidth, 10);
    const height = Number.parseInt(customHeight, 10);
    const input = { name: `${width} × ${height}`, width, height, pixelRatio: 2, type: customDeviceType(width) };
    const error = addCustomDevice(input);
    if (error) {
      setCustomError(error.startsWith("Width") ? t("widthRangeError") : error.startsWith("Height") ? t("heightRangeError") : error);
      return;
    }
    setCustomError(null);
    const device = createCustomDevice(input);
    const into = replaceSlot ?? swapSlot;
    if (into) onReplace(into.id, device.id);
    else if (!full) onAdd(device.id);
    setSwapSlotId(null);
  }

  function saveCurrentAsPreset() {
    sets.saveSet(t("defaultSetName", { count: sets.userSets.length + 1 }), currentIds);
  }

  function saveCurrentSet() {
    sets.saveSet(setName.trim() || t("defaultSetName", { count: sets.userSets.length + 1 }), slots.map(slot => slot.deviceId));
    setSetName("");
  }

  if (!open) return null;

  const title = replacing ? t("replaceNamed", { name: replacing.name }) : t("addADevice");

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={title}
      data-testid="device-switcher-panel"
      className={cx(popoverPanel, "fixed")}
      style={positionStyle(position)}
    >
      {view === "devices" && <>
        <div className="flex shrink-0 items-center gap-1.5 p-2">
          <label className="flex h-[34px] min-w-0 flex-1 items-center gap-1.5 rounded-lg bg-field px-2 focus-within:ring-2 focus-within:ring-accent">
            <SearchIcon size={15} className="shrink-0 text-muted" />
            <span className="sr-only">{t("searchDevice")}</span>
            <input
              ref={searchRef}
              value={query}
              aria-label={t("searchDevice")}
              placeholder={replacing ? t("searchReplacement") : t("searchDevicesHint")}
              onChange={event => setQuery(event.target.value)}
              onKeyDown={event => {
                if (event.nativeEvent.isComposing) return;
                const first = listRef.current?.querySelector<HTMLButtonElement>("[data-device-pick]:not(:disabled)");
                if (event.key === "ArrowDown") { event.preventDefault(); first?.focus(); }
                // Enter adds the best match; it never removes a device already on screen.
                if (event.key === "Enter") { event.preventDefault(); listRef.current?.querySelector<HTMLButtonElement>("[data-device-pick]:not(:disabled):not([data-added])")?.click(); }
              }}
              className="h-[30px] min-w-0 flex-1 bg-transparent text-[13.5px] font-medium text-ink outline-none placeholder:text-faint"
            />
          </label>
          <Dropdown<PickerTypeFilter>
            label={t("deviceType")}
            value={typeFilter}
            onChange={setTypeFilter}
            options={[{ value: "all", label: t("allTypes") }, ...typeOptions.map(id => ({ value: id, label: sectionTitle(id) }))]}
          />
        </div>

        {replacing && (
          <div className="mx-2 mb-1 flex shrink-0 items-center gap-1.5 rounded-lg bg-accent-soft py-1.5 pe-1.5 ps-2.5 text-[12.5px] text-accent-strong">
            <span className="min-w-0 flex-1 truncate">{t("replacingNamed", { name: replacing.name })}</span>
            <button type="button" onClick={onAddInstead} className={cx("h-6 shrink-0 rounded-md bg-surface px-2 text-xs font-semibold text-accent-strong", focusRing)}>{t("addInstead")}</button>
          </div>
        )}
        {swapping && (
          <p role="status" className="mx-2 mb-1 shrink-0 truncate rounded-lg bg-accent-soft px-2.5 py-1.5 text-[12.5px] text-accent-strong">
            {t("replacingNamed", { name: swapping.name })}
          </p>
        )}
        {!replacing && full && (
          <p role="status" className="mx-2 mb-1 shrink-0 rounded-lg border border-warn-line bg-warn-soft px-2.5 py-1.5 text-[12.5px] font-medium text-warn">
            {t("maxDevicesReached", { count: maxSlots })}
          </p>
        )}

        <div
          ref={listRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-1.5"
          onKeyDown={event => {
            if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
            const rows = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>("[data-device-pick]:not(:disabled)") ?? []);
            const index = rows.indexOf(event.target as HTMLButtonElement);
            if (index < 0) return;
            event.preventDefault();
            if (event.key === "ArrowUp" && index === 0) searchRef.current?.focus();
            else rows[Math.max(0, Math.min(rows.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)))]?.focus();
          }}
        >
          {sections.map(section => (
            <section key={section.key} aria-label={sectionTitle(section.key)}>
              <SectionLabel className="px-2.5 pb-1 pt-2">{sectionTitle(section.key)}</SectionLabel>
              {section.devices.map(device => {
                const state = rowState(device);
                const favorite = favorites.includes(device.id);
                return (
                  <div key={`${section.key}-${device.id}`} className="flex items-center">
                    <button
                      type="button"
                      data-device-pick={device.id}
                      data-added={state.added || undefined}
                      title={device.name}
                      aria-label={`${device.name} · ${state.hint}`}
                      aria-current={state.current || undefined}
                      disabled={state.disabled}
                      onClick={() => pick(device)}
                      className={cx(
                        "group/row flex h-9 min-w-0 flex-1 items-center gap-2.5 rounded-[7px] px-2 text-start text-[13px] font-medium transition-colors",
                        state.current ? "bg-accent-soft text-ink" : "hover:bg-sunken",
                        state.disabled && !state.added && !state.current ? "cursor-default text-faint hover:bg-transparent" : "text-ink",
                        state.disabled && "cursor-default",
                        focusRing,
                      )}
                    >
                      <span className="flex w-[18px] shrink-0 justify-center opacity-80"><DeviceGlyph kind={glyphKindFor(device)} /></span>
                      <span className="min-w-0 truncate">{shortName(device.name)}</span>
                      {device.tags.includes("new") && <span className="shrink-0 rounded-full bg-design-tint px-1.5 py-px text-[10px] font-bold tracking-wide text-design-ink">{t("newLabel")}</span>}
                      <span className="flex-1" />
                      <span className="shrink-0 font-mono text-[11.5px] text-faint">{device.cssViewport.width}×{device.cssViewport.height}</span>
                      <span className="grid w-[18px] shrink-0 place-items-center" aria-hidden="true">
                        {state.added && replaceSlot && state.current ? <CheckIcon size={15} className="text-accent" />
                          : state.added && !replaceSlot ? <>
                            <CheckIcon size={15} className={cx("text-accent", !state.disabled && "group-hover/row:hidden group-focus-visible/row:hidden")} />
                            {!state.disabled && <MinusIcon size={15} className="hidden text-danger group-hover/row:block group-focus-visible/row:block" />}
                          </>
                          : !state.disabled ? (replaceSlot ? <SwitchIcon size={15} className="text-ink-2" /> : <PlusIcon size={15} className="text-ink-2" />) : null}
                      </span>
                    </button>
                    <button
                      type="button"
                      data-device-favorite={device.id}
                      aria-pressed={favorite}
                      aria-label={favorite ? t("removeFavorite", { name: device.name }) : t("addFavorite", { name: device.name })}
                      title={favorite ? t("removeFavorite", { name: device.name }) : t("addFavorite", { name: device.name })}
                      onClick={() => toggleFavorite(device.id)}
                      className={cx("grid size-7 shrink-0 place-items-center rounded-md", favorite ? "text-star" : "text-faint/60 hover:text-faint", focusRing)}
                    >
                      <StarIcon size={14} filled={favorite} />
                    </button>
                  </div>
                );
              })}
            </section>
          ))}
          {sections.length === 0 && <p className="px-4 py-6 text-center text-[12.5px] text-muted">{t("noDevicesMatch", { query })}</p>}
        </div>

        <div role="group" aria-label={t("sets")} className="flex shrink-0 flex-wrap items-center gap-1 border-t border-line-soft px-2.5 py-2">
          {sets.allSets.map(set => (
            <SetChip key={set.id} set={set} current={currentIds} onApply={onApplySet}
              devices={set.deviceIds.map(id => findDevice(id))} />
          ))}
          {!currentIsSaved && (
            <button type="button" onClick={saveCurrentAsPreset} title={t("saveCurrentSetHint")}
              className={cx("flex h-[26px] items-center gap-1 whitespace-nowrap rounded-full border border-dashed border-line px-2.5 text-xs font-semibold text-ink-2 hover:bg-sunken hover:text-ink", focusRing)}>
              <PlusIcon size={12} strokeWidth={2.6} />{t("saveCurrentSet")}
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5 border-t border-line-soft p-1">
          <FooterLink icon={<SetsIcon size={15} />} label={t("sets")} onClick={() => setView("sets")} />
          <FooterLink icon={<CustomSizeIcon size={15} />} label={t("customSize")} onClick={() => setView("custom")} />
          <span className="flex-1" />
          <span className="pe-2 font-mono text-[11.5px] text-faint">{slots.length}/{maxSlots}</span>
        </div>
      </>}

      {view === "sets" && <>
        <SubviewHeader title={t("deviceSets")} onBack={() => setView("devices")} backLabel={t("backToDevices")}>
          {sets.canRestoreBuiltIn && <TextButton accent onClick={sets.restoreBuiltIn}>{t("restoreBuiltIn")}</TextButton>}
          <TextButton onClick={() => importRef.current?.click()}>{t("import")}</TextButton>
          <TextButton onClick={sets.exportSets} disabled={!sets.hasSavedSets}>{t("export")}</TextButton>
          <input ref={importRef} type="file" accept=".json,application/json" className="sr-only" tabIndex={-1}
            onChange={event => { const file = event.target.files?.[0]; if (file) sets.importSets(file); event.target.value = ""; }} />
        </SubviewHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-1.5">
          {[{ key: "yours", title: t("yourSets"), items: sets.userSets }, { key: "builtIn", title: t("builtInSets"), items: sets.builtInSets }]
            .filter(group => group.items.length > 0)
            .map(group => (
              <section key={group.key} aria-label={group.title}>
                <SectionLabel className="px-2.5 pb-1 pt-2">{group.title}</SectionLabel>
                {group.items.map(set => {
                  const same = set.deviceIds.join() === slots.map(slot => slot.deviceId).join();
                  return (
                    <div key={set.id} className="flex items-center">
                      <button
                        type="button"
                        title={set.deviceIds.map(id => findDevice(id).name).join(" · ")}
                        onClick={() => onApplySet(set.deviceIds)}
                        className={cx("flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-[7px] px-2 text-start text-[13px] font-medium text-ink", same ? "bg-accent-soft" : "hover:bg-sunken", focusRing)}
                      >
                        <span className="flex h-4 shrink-0 items-end gap-0.5 text-ink-2">
                          {set.deviceIds.map((id, index) => <DeviceGlyph key={`${id}-${index}`} kind={glyphKindFor(findDevice(id))} small />)}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{set.name}</span>
                        <span className="shrink-0 text-xs text-faint">{same ? t("inUse") : t(set.deviceIds.length === 1 ? "deviceCount" : "devicesCount", { count: set.deviceIds.length })}</span>
                      </button>
                      <button
                        type="button"
                        aria-label={t("deleteNamed", { name: set.name })}
                        title={t("deleteNamed", { name: set.name })}
                        onClick={() => sets.deleteSet(set)}
                        className={cx("grid size-7 shrink-0 place-items-center rounded-md text-faint hover:bg-sunken hover:text-ink", focusRing)}
                      >
                        <CloseIcon size={13} strokeWidth={2.4} />
                      </button>
                    </div>
                  );
                })}
              </section>
            ))}
          {sets.allSets.length === 0 && <p className="px-4 py-6 text-center text-[12.5px] text-muted">{t("noSavedSets")}</p>}
        </div>
        <form
          className="flex shrink-0 items-center gap-1.5 border-t border-line-soft p-2"
          onSubmit={event => { event.preventDefault(); saveCurrentSet(); }}
        >
          <label className="sr-only" htmlFor="mdv-set-name">{t("setName")}</label>
          <input
            id="mdv-set-name"
            value={setName}
            onChange={event => setSetName(event.target.value)}
            placeholder={t("saveSetAs", { count: slots.length })}
            className="h-8 min-w-0 flex-1 rounded-lg border border-line bg-surface px-2.5 text-[13px] text-ink outline-none placeholder:text-faint focus:border-accent"
          />
          <button type="submit" className={cx("h-8 shrink-0 rounded-lg bg-primary px-3 text-[12.5px] font-semibold text-on-primary", focusRing)}>{t("save")}</button>
        </form>
      </>}

      {view === "custom" && <>
        <SubviewHeader title={t("customSize")} onBack={() => setView("devices")} backLabel={t("backToDevices")} />
        <form className="flex shrink-0 items-center gap-1.5 px-2 pb-2" onSubmit={event => { event.preventDefault(); createCustomSize(); }}>
          <label className="sr-only" htmlFor="mdv-custom-width">{t("customWidth")}</label>
          <input id="mdv-custom-width" inputMode="numeric" value={customWidth} onChange={event => setCustomWidth(event.target.value)}
            className="h-8 w-[70px] rounded-lg border border-line bg-surface px-2 text-center font-mono text-[13px] text-ink outline-none focus:border-accent" />
          <span className="text-faint">×</span>
          <label className="sr-only" htmlFor="mdv-custom-height">{t("customHeight")}</label>
          <input id="mdv-custom-height" inputMode="numeric" value={customHeight} onChange={event => setCustomHeight(event.target.value)}
            className="h-8 w-[70px] rounded-lg border border-line bg-surface px-2 text-center font-mono text-[13px] text-ink outline-none focus:border-accent" />
          <span className="flex-1" />
          <button type="submit" disabled={!replaceSlot && full} className={cx("h-8 rounded-lg bg-primary px-3 text-[12.5px] font-semibold text-on-primary disabled:opacity-40", focusRing)}>{t("add")}</button>
        </form>
        {customError && <p role="alert" className="mx-2 mb-2 rounded-lg bg-danger/10 px-2.5 py-1.5 text-xs font-medium text-danger">{customError}</p>}
        <div className="min-h-0 flex-1 overflow-y-auto border-t border-line-soft px-1 pb-1.5">
          <SectionLabel className="px-2.5 pb-1 pt-2">{t("savedSizes")}</SectionLabel>
          {customDevices.map(device => {
            const state = rowState(device);
            return (
              <div key={device.id} className="flex items-center">
                <button
                  type="button"
                  data-device-pick={device.id}
                  title={device.name}
                  disabled={state.disabled}
                  onClick={() => pick(device)}
                  className={cx("flex h-9 min-w-0 flex-1 items-center gap-2.5 rounded-[7px] px-2 text-start text-[13px] font-medium", state.disabled ? "cursor-default text-faint" : "text-ink hover:bg-sunken", focusRing)}
                >
                  <span className="flex-1 truncate">{device.cssViewport.width} × {device.cssViewport.height}</span>
                  <span className={cx("text-xs", state.added ? "text-accent" : "text-muted")}>
                    {state.added ? (replaceSlot ? t("added") : t("remove")) : state.disabled ? t("full") : replaceSlot ? t("switchAction") : t("add")}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={t("deleteNamed", { name: device.name })}
                  title={t("deleteNamed", { name: device.name })}
                  onClick={() => onDeleteCustom(device.id)}
                  className={cx("grid size-7 shrink-0 place-items-center rounded-md text-faint hover:bg-sunken hover:text-ink", focusRing)}
                >
                  <CloseIcon size={13} strokeWidth={2.4} />
                </button>
              </div>
            );
          })}
          {customDevices.length === 0 && <p className="px-2.5 pb-2 text-xs text-muted">{t("noCustomSizes")}</p>}
        </div>
      </>}
    </div>
  );
}

function SetChip({ set, current, devices, onApply }: { set: DeviceSet; current: string[]; devices: Device[]; onApply: (ids: string[]) => void }) {
  const same = set.deviceIds.join() === current.join();
  return (
    <button
      type="button"
      title={devices.map(device => device.name).join(" · ")}
      aria-pressed={same}
      onClick={() => onApply(set.deviceIds)}
      className={cx(
        "flex h-[26px] items-center gap-1.5 whitespace-nowrap rounded-full border pe-2.5 ps-2 text-xs font-semibold",
        same ? "border-accent bg-accent-soft text-accent-strong" : "border-line bg-surface text-ink hover:bg-sunken",
        focusRing,
      )}
    >
      <span aria-hidden="true" className="flex h-3.5 items-end gap-0.5 opacity-75">
        {devices.map((device, index) => <DeviceGlyph key={`${device.id}-${index}`} kind={glyphKindFor(device)} small />)}
      </span>
      {set.name}
    </button>
  );
}

function FooterLink({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cx("flex h-8 items-center gap-1.5 rounded-[7px] px-2.5 text-[12.5px] font-semibold text-ink hover:bg-sunken", focusRing)}>
      {icon}{label}
    </button>
  );
}

function SubviewHeader({ title, backLabel, onBack, children }: { title: string; backLabel: string; onBack: () => void; children?: React.ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-1 p-1.5">
      <button type="button" aria-label={backLabel} title={backLabel} onClick={onBack} className={cx("grid size-[30px] place-items-center rounded-[7px] text-ink hover:bg-sunken", focusRing)}>
        <ChevronLeftIcon size={16} />
      </button>
      <span className="text-[13px] font-semibold">{title}</span>
      <span className="flex-1" />
      {children}
    </div>
  );
}

function TextButton({ accent = false, disabled = false, onClick, children }: { accent?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      className={cx("h-7 rounded-[7px] px-2 text-xs font-semibold hover:bg-sunken disabled:opacity-40", accent ? "text-accent" : "text-ink-2", focusRing)}>
      {children}
    </button>
  );
}
