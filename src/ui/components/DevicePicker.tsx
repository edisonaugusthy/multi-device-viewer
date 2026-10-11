import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useDeviceCatalog } from "../../app/DeviceCatalogProvider";
import { useI18n } from "../../app/i18n";
import type { useDeviceSets } from "../../app/useDeviceSets";
import { createCustomDevice } from "../../domain/device/device-service";
import { availablePickerTabs, buildPickerSections, type PickerSectionKey, type PickerTab } from "../../domain/device/device-picker";
import type { Device, DeviceType } from "../../domain/device/device.types";
import {
  CheckIcon,
  ChevronLeftIcon,
  CloseIcon,
  CustomSizeIcon,
  SearchIcon,
  SetsIcon,
  StarIcon,
} from "../icons";
import { DeviceGlyph, glyphKindFor } from "./DeviceGlyph";
import { shortName } from "./PreviewCard";
import { cx, focusRing, positionStyle, popoverPanel, SectionLabel, useAnchoredPosition, useDismiss } from "./ui";

export type PickerTarget = { kind: "add" } | { kind: "replace"; slotId: string };

type PickerView = "devices" | "sets" | "custom";

function customDeviceType(width: number): DeviceType {
  if (width < 600) return "phone";
  if (width < 1024) return "tablet";
  return "desktop";
}

interface Slot { id: string; deviceId: string }

export function DevicePicker({
  open, anchorRef, target, slots, maxSlots, sets,
  onClose, onAdd, onRemove, onReplace, onApplySet, onDeleteCustom,
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
  onApplySet: (deviceIds: string[]) => void;
  onDeleteCustom: (deviceId: string) => void;
}) {
  const { t } = useI18n();
  const { devices, customDevices, favorites, recents, toggleFavorite, addRecent, addCustomDevice, findDevice } = useDeviceCatalog();
  const [view, setView] = useState<PickerView>("devices");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<PickerTab>("all");
  const [setName, setSetName] = useState("");
  const [customWidth, setCustomWidth] = useState("390");
  const [customHeight, setCustomHeight] = useState("700");
  const [customError, setCustomError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const position = useAnchoredPosition(anchorRef, open, 420, "start", 540);
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
    setTab("all");
    setQuery("");
    setSwapSlotId(null);
    setCustomError(null);
    const frame = requestAnimationFrame(() => searchRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [open, target]);

  const tabs = useMemo(() => availablePickerTabs(devices), [devices]);
  const tabLabel = (id: PickerTab) => ({
    all: t("allShort"), ios: "iOS", android: "Android", tablet: t("tablets"), computer: t("computers"), other: t("otherDevices"),
  })[id];
  const chooseTab = (id: PickerTab) => {
    setTab(id);
    listRef.current?.scrollTo({ top: 0 });
  };
  const onScreen = useMemo(() => slots.map(slot => findDevice(slot.deviceId)), [findDevice, slots]);
  const sections = useMemo(
    () => buildPickerSections({ devices, favorites, recents, onScreen, query, tab }),
    [devices, favorites, onScreen, query, recents, tab],
  );
  const sectionTitle = (key: PickerSectionKey) =>
    key === "onScreen" ? t("onScreen") : key === "starred" ? t("starred") : key === "recent" ? t("recent") : key === "all" ? t("allDevices") : null;

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
    // Changing one device is a single click: the picker closes with the new device on screen.
    if (replaceSlot) onClose();
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
        </div>

        <div
          role="tablist"
          aria-label={t("deviceType")}
          className="flex shrink-0 gap-0.5 overflow-x-auto border-b border-line-soft px-2 [scrollbar-width:none]"
          onKeyDown={event => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
            event.preventDefault();
            const index = tabs.indexOf(tab);
            const forward = (event.key === "ArrowRight") !== (getComputedStyle(event.currentTarget).direction === "rtl");
            const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1
              : (index + (forward ? 1 : -1) + tabs.length) % tabs.length;
            chooseTab(tabs[next]);
            event.currentTarget.querySelectorAll<HTMLButtonElement>("[role=tab]")[next]?.focus();
          }}
        >
          {tabs.map(id => {
            const selected = id === tab;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                data-picker-type={id}
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => chooseTab(id)}
                className={cx(
                  "-mb-px h-9 shrink-0 whitespace-nowrap border-b-2 px-2 text-[13px] transition-colors",
                  selected ? "border-ink font-semibold text-ink" : "border-transparent font-medium text-muted hover:text-ink",
                  focusRing,
                )}
              >
                {tabLabel(id)}
              </button>
            );
          })}
        </div>

        {(swapping || (!replacing && full)) && (
          <p role="status" className={cx("mx-2 mt-1.5 shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium", swapping ? "bg-accent-soft text-accent-strong" : "bg-warn-soft text-warn")}>
            {swapping ? t("replacingNamed", { name: swapping.name }) : t("maxDevicesReached", { count: maxSlots })}
          </p>
        )}

        <div
          ref={listRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-1.5 pt-1"
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
          {sections.map(section => {
            const title = sectionTitle(section.key);
            return (
              <section key={section.key} aria-label={title ?? tabLabel(tab)}>
                {title && (
                  <div className="flex items-baseline gap-1.5 px-2.5 pb-1 pt-2.5">
                    <SectionLabel>{title}</SectionLabel>
                    {section.key === "onScreen" && <span dir="ltr" className="font-mono text-[11px] text-faint">{slots.length}/{maxSlots}</span>}
                  </div>
                )}
                {section.devices.map(device => (
                  <DeviceRow
                    key={device.id}
                    device={device}
                    state={rowState(device)}
                    replacing={Boolean(replaceSlot)}
                    favorite={favorites.includes(device.id)}
                    onPick={() => pick(device)}
                    onToggleFavorite={() => toggleFavorite(device.id)}
                  />
                ))}
              </section>
            );
          })}
          {sections.length === 0 && <p className="px-4 py-6 text-center text-[12.5px] text-muted">{t("noDevicesMatch", { query })}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-0.5 border-t border-line-soft p-1">
          <FooterLink icon={<SetsIcon size={15} />} label={t("sets")} onClick={() => setView("sets")} />
          <span className="flex-1" />
          <FooterLink icon={<CustomSizeIcon size={15} />} label={t("customSize")} onClick={() => setView("custom")} />
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
                        <span aria-hidden="true" className="shrink-0 text-xs text-faint">{same ? t("inUse") : t(set.deviceIds.length === 1 ? "deviceCount" : "devicesCount", { count: set.deviceIds.length })}</span>
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
              <div key={device.id} className={rowFrame(state, Boolean(replaceSlot))}>
                <button
                  type="button"
                  data-device-pick={device.id}
                  data-added={state.added || undefined}
                  title={device.name}
                  aria-label={`${device.cssViewport.width} × ${device.cssViewport.height} · ${state.hint}`}
                  aria-current={state.current || undefined}
                  aria-pressed={replaceSlot ? undefined : state.added}
                  disabled={state.disabled}
                  onClick={() => pick(device)}
                  className={rowButton(state, Boolean(replaceSlot))}
                >
                  <span dir="ltr" className="flex-1 truncate text-start font-mono">{device.cssViewport.width} × {device.cssViewport.height}</span>
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

// A device on screen is ticked; while changing one device, only that device is.
// Saved custom sizes keep a bordered row with the same states.
type RowState = { added: boolean; current: boolean; disabled: boolean };
const isSelected = (state: RowState, replacing: boolean) => replacing ? state.current : state.added;

function rowFrame(state: RowState, replacing: boolean) {
  const selected = isSelected(state, replacing);
  return cx(
    "my-px flex items-center rounded-lg border transition-colors",
    selected ? "border-accent-line bg-accent-soft/45 hover:border-accent"
      : replacing && state.added ? "border-line"
      : "border-transparent",
  );
}

function rowButton(state: RowState, replacing: boolean) {
  return cx(
    "flex min-h-[34px] min-w-0 flex-1 items-center gap-2.5 rounded-[7px] px-2 text-start text-[13px] font-medium",
    isSelected(state, replacing) ? "text-ink"
      : state.disabled ? "cursor-default text-faint"
      : "text-ink hover:bg-sunken",
    focusRing,
  );
}

// One line per device: a checkbox (a radio while changing one device), the
// name and the CSS size. The star shows on hover unless the device is starred.
function DeviceRow({ device, state, replacing, favorite, onPick, onToggleFavorite }: {
  device: Device;
  state: RowState & { hint: string };
  replacing: boolean;
  favorite: boolean;
  onPick: () => void;
  onToggleFavorite: () => void;
}) {
  const { t } = useI18n();
  const ticked = isSelected(state, replacing);
  const favoriteLabel = favorite ? t("removeFavorite", { name: device.name }) : t("addFavorite", { name: device.name });
  return (
    <div className={cx("group flex items-center rounded-[7px]", state.current ? "bg-accent-soft" : !state.disabled && "hover:bg-sunken")}>
      <button
        type="button"
        data-device-pick={device.id}
        data-added={state.added || undefined}
        title={device.name}
        aria-label={`${device.name} · ${state.hint}`}
        aria-current={state.current || undefined}
        aria-pressed={replacing ? undefined : state.added}
        disabled={state.disabled}
        onClick={onPick}
        className={cx(
          "flex min-h-[34px] min-w-0 flex-1 items-center gap-2.5 rounded-[7px] px-2 text-start text-[13px] font-medium",
          state.disabled && !ticked ? "cursor-default text-faint" : "text-ink",
          focusRing,
        )}
      >
        <span aria-hidden="true" className={cx(
          "grid size-4 shrink-0 place-items-center border-[1.5px]",
          replacing ? "rounded-full" : "rounded-[4px]",
          ticked ? "border-accent bg-accent text-on-accent" : state.disabled ? "border-line" : "border-faint bg-surface",
        )}>
          {ticked && <CheckIcon size={10} strokeWidth={3.6} />}
        </span>
        {/* Full names wrap instead of being cut off. */}
        <span className="min-w-0 break-words py-0.5 leading-tight">{shortName(device.name)}</span>
        {device.tags.includes("new") && <span className="shrink-0 rounded-full bg-design-tint px-1.5 py-px text-[10px] font-bold tracking-wide text-design-ink">{t("newLabel")}</span>}
        <span className="flex-1" />
        <span dir="ltr" className="shrink-0 font-mono text-[11.5px] text-faint">{device.cssViewport.width}×{device.cssViewport.height}</span>
      </button>
      <button
        type="button"
        data-device-favorite={device.id}
        aria-pressed={favorite}
        aria-label={favoriteLabel}
        title={favoriteLabel}
        onClick={onToggleFavorite}
        className={cx(
          "grid size-7 shrink-0 place-items-center rounded-md focus-visible:opacity-100",
          favorite ? "text-star" : "text-faint opacity-0 hover:text-ink-2 group-hover:opacity-100",
          focusRing,
        )}
      >
        <StarIcon size={13} filled={favorite} />
      </button>
    </div>
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
