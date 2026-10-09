import { useCallback, useRef, type ReactNode, type RefObject } from "react";
import { SUPPORTED_LOCALES, useI18n, type AppLocale } from "../../app/i18n";
import { CloseIcon, HelpIcon, LockIcon, MoonIcon, SunIcon, TourIcon, WhatsNewIcon } from "../icons";
import { cx, focusRing, positionStyle, popoverPanel, Segmented, useAnchoredPosition, useDismiss } from "./ui";

export type BrowserBarPosition = "bottom" | "top";

export function SettingsPopover({
  open, anchorRef, dark, browserBar, onClose, onThemeChange, onBrowserBarChange, onHelp, onTour, onWhatsNew, onPermissions,
}: {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  dark: boolean;
  browserBar: BrowserBarPosition;
  onClose: () => void;
  onThemeChange: (dark: boolean) => void;
  onBrowserBarChange: (position: BrowserBarPosition) => void;
  onHelp: () => void;
  onTour: () => void;
  onWhatsNew: () => void;
  onPermissions: () => void;
}) {
  const { locale, setLocale, t } = useI18n();
  const panelRef = useRef<HTMLDivElement>(null);
  const position = useAnchoredPosition(anchorRef, open, 340, "end");
  const dismiss = useCallback(() => onClose(), [onClose]);
  useDismiss(open, [panelRef, anchorRef], dismiss);
  if (!open) return null;

  const run = (action: () => void) => () => { onClose(); action(); };

  return (
    <div ref={panelRef} role="dialog" aria-label={t("settings")} className={cx(popoverPanel, "fixed")} style={positionStyle(position)}>
      <div className="flex shrink-0 items-center py-2.5 pe-2 ps-3.5">
        <span className="flex-1 text-sm font-semibold">{t("settings")}</span>
        <button type="button" onClick={onClose} aria-label={t("close")} className={cx("grid size-[30px] place-items-center rounded-[7px] text-ink-2 hover:bg-sunken", focusRing)}>
          <CloseIcon size={15} strokeWidth={2.2} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3.5 pb-2.5">
        <SettingRow label={t("theme")}>
          <Segmented
            label={t("theme")}
            value={dark ? "dark" : "light"}
            onChange={value => onThemeChange(value === "dark")}
            options={[
              { value: "light", label: t("light"), icon: <SunIcon size={14} /> },
              { value: "dark", label: t("dark"), icon: <MoonIcon size={14} /> },
            ]}
          />
        </SettingRow>
        <SettingRow label={t("browserBar")}>
          <Segmented
            label={t("browserBar")}
            value={browserBar}
            onChange={onBrowserBarChange}
            options={[
              { value: "bottom", label: t("bottomBrowser") },
              { value: "top", label: t("topBrowser") },
            ]}
          />
        </SettingRow>
        <SettingRow label={<label htmlFor="mdv-language">{t("language")}</label>} last>
          <select
            id="mdv-language"
            value={locale}
            onChange={event => setLocale(event.target.value as AppLocale)}
            className={cx("h-8 cursor-pointer rounded-lg border border-line bg-surface px-2 text-[12.5px] font-semibold text-ink", focusRing)}
          >
            {SUPPORTED_LOCALES.map(option => <option key={option.code} value={option.code}>{option.name}</option>)}
          </select>
        </SettingRow>
      </div>
      <div className="grid shrink-0 grid-cols-2 gap-0.5 border-t border-line bg-surface-2 p-1.5">
        <FooterAction icon={<HelpIcon size={15} />} label={t("helpAndFeedback")} onClick={run(onHelp)} />
        <FooterAction icon={<TourIcon size={15} />} label={t("featureTour")} onClick={run(onTour)} />
        <FooterAction icon={<WhatsNewIcon size={15} />} label={t("whatsNew")} onClick={run(onWhatsNew)} />
        <FooterAction icon={<LockIcon size={15} strokeWidth={2} />} label={t("permissions")} onClick={run(onPermissions)} />
      </div>
    </div>
  );
}

function SettingRow({ label, children, last = false }: { label: ReactNode; children: ReactNode; last?: boolean }) {
  return (
    <div className={cx("flex h-11 items-center justify-between gap-3", !last && "border-b border-line-soft")}>
      <span className="text-[13px] font-medium">{label}</span>
      {children}
    </div>
  );
}

function FooterAction({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cx("flex h-[34px] items-center gap-2 rounded-[7px] px-2 text-start text-[12.5px] font-medium text-ink hover:bg-sunken [&>svg]:text-muted", focusRing)}>
      {icon}{label}
    </button>
  );
}
