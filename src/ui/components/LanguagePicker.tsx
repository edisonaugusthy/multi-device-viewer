import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../../app/i18n";
import { CheckIcon, ChevronRightIcon, CloseIcon, GlobeIcon, SearchIcon } from "../icons";
import { cx, focusRing, Switch } from "./ui";

/** Languages people most often test, by the tag browsers send, with each one's own name. */
export const LANGUAGES: Array<[string, string]> = [
  ["en-US", "English (US)"], ["en-GB", "English (UK)"], ["de-DE", "Deutsch"], ["fr-FR", "Français"], ["es-ES", "Español"],
  ["es-MX", "Español (México)"], ["it-IT", "Italiano"], ["pt-BR", "Português (Brasil)"], ["pt-PT", "Português (Portugal)"],
  ["nl-NL", "Nederlands"], ["sv-SE", "Svenska"], ["pl-PL", "Polski"], ["tr-TR", "Türkçe"], ["ru-RU", "Русский"], ["uk-UA", "Українська"],
  ["ar-EG", "العربية"], ["he-IL", "עברית"], ["fa-IR", "فارسی"], ["hi-IN", "हिन्दी"], ["bn-BD", "বাংলা"], ["th-TH", "ไทย"],
  ["vi-VN", "Tiếng Việt"], ["id-ID", "Bahasa Indonesia"], ["ja-JP", "日本語"], ["ko-KR", "한국어"], ["zh-CN", "简体中文"], ["zh-TW", "繁體中文"],
];
export const languageName = (tag: string) => LANGUAGES.find(([code]) => code === tag)?.[1] ?? tag;

/** Picking a language applies it at once; the device's page reloads in that language. */
export function LanguagePicker({ deviceName, language, sendDensity, density, onLanguage, onDensity, onCompare, onClose }: {
  deviceName: string;
  language?: string;
  sendDensity: boolean;
  density?: number;
  onLanguage: (language: string | null) => void;
  onDensity: (on: boolean) => void;
  onCompare: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => { searchRef.current?.focus({ preventScroll: true }); }, []);
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? LANGUAGES.filter(([code, name]) => code.toLowerCase().includes(needle) || name.toLowerCase().includes(needle)) : LANGUAGES;
  }, [query]);
  const option = (code: string | null, name: string) => {
    const on = (language ?? null) === code;
    return (
      <button key={code ?? "default"} type="button" role="radio" aria-checked={on} onClick={() => onLanguage(code)}
        className={cx("flex h-8 w-full items-center gap-2.5 rounded-[7px] px-2 text-start text-[13px] font-medium", on ? "bg-sunken" : "hover:bg-sunken", focusRing)}>
        <span aria-hidden="true" className={cx("grid size-3.5 shrink-0 place-items-center rounded-full border-2", on ? "border-accent bg-accent text-on-accent" : "border-line")}>{on && <CheckIcon size={8} strokeWidth={4} />}</span>
        <span lang={code ?? undefined} className="min-w-0 flex-1 truncate">{name}</span>
        {code && <span dir="ltr" className="font-mono text-[11.5px] text-faint">{code}</span>}
      </button>
    );
  };
  return (
    <div role="dialog" aria-label={t("languageFor", { name: deviceName })} data-language-picker
      onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); onClose(); } }}
      className="absolute start-1/2 top-full z-[60] mt-3 flex w-[320px] -translate-x-1/2 flex-col whitespace-normal rounded-2xl bg-surface text-ink shadow-popover rtl:translate-x-1/2">
      <div className="flex items-center py-2 pe-2 ps-3.5">
        <span className="flex-1 truncate text-sm font-semibold">{t("language")}</span>
        <button type="button" onClick={onClose} aria-label={t("close")} className={cx("grid size-[30px] place-items-center rounded-[7px] text-ink-2 hover:bg-sunken", focusRing)}><CloseIcon size={15} strokeWidth={2.2} /></button>
      </div>
      {/* The device only asks for the language; a site that ignores the header looks the same. */}
      <div data-language-hint className="mx-3 mb-2.5 flex gap-2 rounded-[9px] border border-accent-line bg-accent-soft/45 px-2.5 py-2 text-accent-strong">
        <GlobeIcon size={14} className="mt-px shrink-0" />
        <p className="text-xs leading-[1.45]">
          <span className="block font-semibold">{t("languageHintLead")}</span>
          <span className="text-ink-2">{t("languageHint")}</span>
        </p>
      </div>
      <label className="mx-3 mb-2 flex h-[34px] items-center gap-2 rounded-[9px] border border-line px-2.5 text-muted">
        <SearchIcon size={14} />
        <input ref={searchRef} value={query} onChange={event => setQuery(event.target.value)} placeholder={t("languageSearch")} aria-label={t("languageSearch")}
          className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none" />
      </label>
      <div role="radiogroup" aria-label={t("language")} className="grid max-h-[240px] gap-px overflow-y-auto px-2 pb-2">
        {!query && option(null, t("languageBrowserDefault"))}
        {shown.map(([code, name]) => option(code, name))}
      </div>
      <div className="grid gap-2 rounded-b-xl border-t border-line-soft bg-surface-2 px-3.5 py-2.5">
        <label className="flex items-center justify-between gap-3 text-xs font-semibold">
          {density ? t("languageSendDensity", { density: String(density) }) : t("languageSendDensityPlain")}
          <Switch size="sm" checked={sendDensity} onChange={onDensity} label={t("languageSendDensityPlain")} />
        </label>
        <button type="button" data-compare-identities onClick={onCompare}
          className={cx("inline-flex h-7 items-center gap-1 justify-self-start rounded text-xs font-semibold text-accent-strong hover:underline", focusRing)}>
          {t("languageCompareDevices")}<ChevronRightIcon size={12} strokeWidth={2.6} className="rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
}
