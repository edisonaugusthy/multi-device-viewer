import { useEffect, useId, useRef, type ReactNode } from "react";
import { useI18n } from "../../app/i18n";
import { CloseIcon } from "../icons";
import { cx, IconButton } from "./ui";

// The one modal shell used across the viewer: a titled card over a dimmed
// backdrop. It traps focus, closes on Escape (and on the backdrop when asked),
// and returns focus to whatever opened it.
export function Dialog({ title, titleAddon, icon, description, size = "md", busy = false, dismissOnBackdrop = true, closeLabel, onClose, children, footer }: {
  title: string;
  titleAddon?: ReactNode;
  icon?: ReactNode;
  description?: ReactNode;
  size?: "md" | "lg";
  busy?: boolean;
  dismissOnBackdrop?: boolean;
  closeLabel?: string;
  onClose: () => void;
  children?: ReactNode;
  footer?: ReactNode;
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
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/40 p-3 backdrop-blur-[2px] sm:p-6"
      onMouseDown={event => {
        if (dismissOnBackdrop && !busy && !dialogRef.current?.contains(event.target as Node)) onClose();
      }}
    >
      <div className={cx("mx-auto flex min-h-full w-full items-center", size === "lg" ? "max-w-[560px]" : "max-w-[440px]")}>
        <section
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${id}-title`}
          aria-describedby={description ? `${id}-description` : undefined}
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
          className="flex max-h-[calc(100dvh-24px)] w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface text-start text-ink shadow-popover outline-none sm:max-h-[calc(100dvh-48px)]"
        >
          <header className="flex shrink-0 items-start gap-3 px-5 pb-3 pt-4">
            {icon && <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-accent-soft text-accent-strong">{icon}</span>}
            <div className="min-w-0 flex-1 self-center">
              <div className="flex flex-wrap items-baseline gap-2">
                <h2 id={`${id}-title`} className="text-[15px] font-semibold leading-6 tracking-tight">{title}</h2>
                {titleAddon}
              </div>
              {description && <p id={`${id}-description`} className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{description}</p>}
            </div>
            <IconButton label={closeLabel ?? t("close")} size="sm" disabled={busy} onClick={onClose} className="-me-1.5 -mt-0.5">
              <CloseIcon size={16} />
            </IconButton>
          </header>
          {children && <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">{children}</div>}
          {footer && <footer className="flex shrink-0 items-center gap-2 border-t border-line-soft bg-surface-2 px-5 py-3">{footer}</footer>}
        </section>
      </div>
    </div>
  );
}

export function DialogError({ children }: { children: ReactNode }) {
  return <p role="alert" className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs leading-5 text-danger">{children}</p>;
}

// A small busy indicator for buttons that open something outside the viewer.
export function Spinner({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cx("inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none", className)} />;
}
