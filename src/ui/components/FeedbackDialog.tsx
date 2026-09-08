import { MessageSquare, X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { useI18n } from "../../app/i18n";

/** Shared presentation and keyboard behavior for feedback dialogs. */
export function FeedbackDialog({ dark, title, description, busy = false, dismissOnBackdrop = false, onClose, children, footer }: {
  dark: boolean;
  title: string;
  description: string;
  busy?: boolean;
  dismissOnBackdrop?: boolean;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  const { t } = useI18n();
  const id = useId();
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const root = dialog?.getRootNode() as Document | ShadowRoot;
    const previousFocus = root.activeElement;
    dialog?.focus();
    return () => {
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  useEffect(() => {
    if (busy) dialogRef.current?.focus();
  }, [busy]);

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={event => {
        if (dismissOnBackdrop && !busy && !dialogRef.current?.contains(event.target as Node)) onClose();
      }}>
      <div className="mx-auto flex min-h-full w-full max-w-[440px] items-center">
        <section
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${id}-title`}
          aria-describedby={`${id}-description`}
          tabIndex={-1}
          onKeyDown={event => {
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              if (!busy) onClose();
            }
            if (event.key !== "Tab") return;
            const dialog = dialogRef.current;
            const controls = [...(dialog?.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], summary, [tabindex='0']") ?? [])];
            const active = (dialog?.getRootNode() as Document | ShadowRoot).activeElement;
            const first = controls[0];
            const last = controls.at(-1);
            if (!first) { event.preventDefault(); dialog?.focus(); }
            else if (event.shiftKey && (active === first || active === dialog)) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && active === last) { event.preventDefault(); first.focus(); }
          }}
          className={`w-full min-w-0 overflow-hidden rounded-xl border text-start shadow-[0_20px_64px_rgba(15,23,42,0.25)] outline-none ${dark ? "border-slate-700 bg-[#171a21] text-slate-100" : "border-slate-300 bg-white text-slate-900"}`}
        >
          <header className={`flex items-start gap-3 border-b px-4 py-4 sm:px-5 ${dark ? "border-slate-700/70" : "border-slate-200"}`}>
            <span className={`grid size-9 shrink-0 place-items-center rounded-lg border ${dark ? "border-teal-700/60 bg-teal-950/50 text-teal-300" : "border-teal-200 bg-teal-50 text-teal-700"}`}>
              <MessageSquare size={18} aria-hidden="true" />
            </span>
            <h2 id={`${id}-title`} className="min-w-0 flex-1 self-center text-base font-semibold leading-6 tracking-tight">{title}</h2>
            <button type="button" onClick={onClose} disabled={busy} aria-label={t("close")} title={t("close")}
              className={`grid size-8 shrink-0 place-items-center rounded-lg border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:opacity-50 ${dark ? "border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white" : "border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
              <X size={16} aria-hidden="true" />
            </button>
          </header>
          <div className="space-y-4 p-4 sm:p-5">
            <p id={`${id}-description`} className={`text-[13px] leading-[1.65] ${dark ? "text-slate-300" : "text-slate-600"}`}>{description}</p>
            {children}
          </div>
          <footer className={`border-t px-4 py-3 sm:px-5 ${dark ? "border-slate-700/70 bg-slate-950/20" : "border-slate-200 bg-slate-50"}`}>{footer}</footer>
        </section>
      </div>
    </div>
  );
}

export function FeedbackError({ dark, children }: { dark: boolean; children: ReactNode }) {
  return <p role="alert" className={`rounded-lg border px-3 py-2 text-xs leading-5 ${dark ? "border-red-900 bg-red-950/30 text-red-300" : "border-red-200 bg-red-50 text-red-700"}`}>{children}</p>;
}
