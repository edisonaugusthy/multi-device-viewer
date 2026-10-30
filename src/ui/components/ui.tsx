import {
  cloneElement,
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";
import { getViewerEventTarget } from "../../app/viewer-context";
import { CheckIcon, ChevronDownIcon } from "../icons";

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const focusRing = "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-surface";

export type TooltipAlign = "start" | "center" | "end";
export type TooltipSide = "top" | "bottom";

// A short explanation under (or, for controls near the bottom edge, above) a
// control. It appears after a pause on hover or at once on keyboard focus,
// never takes pointer events, hides when the control is pressed, and stays
// hidden while the control's own popover is open, or while `quiet` (another
// menu is open nearby and a tooltip would land on it).
export function Tooltip({ title, description, align = "center", side = "bottom", quiet = false, children }: {
  title: string;
  description?: string;
  align?: TooltipAlign;
  side?: TooltipSide;
  quiet?: boolean;
  children: ReactElement<{ "aria-describedby"?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const pressed = useRef(false);
  const descriptionId = useId();
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => { if (quiet) { window.clearTimeout(timer.current); setOpen(false); } }, [quiet]);

  const blocked = () => quiet || pressed.current || Boolean(wrapperRef.current?.querySelector('[aria-expanded="true"], :disabled'));
  const show = (delay: number) => {
    window.clearTimeout(timer.current);
    if (blocked()) return;
    // Checked again when the pause ends: a menu may have opened meanwhile.
    timer.current = window.setTimeout(() => { if (!blocked()) setOpen(true); }, delay);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    setOpen(false);
  };

  return (
    <span
      ref={wrapperRef}
      className="relative inline-flex shrink-0"
      onPointerEnter={event => { if (event.pointerType === "mouse") show(450); }}
      onPointerLeave={() => { pressed.current = false; hide(); }}
      onPointerDown={() => { pressed.current = true; hide(); }}
      onFocus={event => { if (event.target.matches(":focus-visible")) show(0); }}
      onBlur={hide}
      onKeyDown={event => { if (event.key === "Escape" || event.key === "Enter" || event.key === " ") hide(); }}
    >
      {cloneElement(children, { "aria-describedby": description ? descriptionId : undefined })}
      <span
        role="tooltip"
        className={cx(
          "pointer-events-none absolute z-[70] w-max max-w-64 rounded-lg bg-primary px-2.5 py-1.5 text-start text-on-primary shadow-popover transition-opacity duration-150",
          side === "top" ? "bottom-full mb-2" : "top-full mt-2",
          align === "start" ? "start-0" : align === "end" ? "end-0" : "left-1/2 -translate-x-1/2",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        <span className="block text-xs font-semibold">{title}</span>
        {description && <span id={descriptionId} className="mt-0.5 block whitespace-normal text-xs leading-snug opacity-80">{description}</span>}
      </span>
    </span>
  );
}

type IconButtonTone = "ghost" | "outline" | "danger" | "primary";

export const IconButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  size?: "sm" | "md";
  tone?: IconButtonTone;
  pressed?: boolean;
  /** Explains the control in a tooltip instead of the browser's plain title. */
  tooltip?: string;
  tooltipAlign?: TooltipAlign;
  tooltipSide?: TooltipSide;
}>(function IconButton({ label, size = "md", tone = "ghost", pressed, tooltip, tooltipAlign, tooltipSide, className, children, ...props }, ref) {
  const button = (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={tooltip === undefined ? label : undefined}
      aria-pressed={pressed}
      className={cx(
        "grid shrink-0 place-items-center rounded-[8px] border transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        size === "sm" ? "size-7" : "size-[34px] rounded-[9px]",
        tone === "primary" && "border-transparent bg-primary text-on-primary hover:opacity-90",
        tone === "danger" && "border-transparent text-danger hover:bg-danger/10",
        tone === "outline" && "border-line bg-surface text-ink hover:bg-sunken",
        tone === "ghost" && (pressed ? "border-ink bg-sunken text-ink" : "border-transparent text-ink hover:bg-sunken"),
        focusRing,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
  return tooltip === undefined ? button : <Tooltip title={label} description={tooltip} align={tooltipAlign} side={tooltipSide}>{button}</Tooltip>;
});

export function Segmented<T extends string>({ label, value, options, onChange, size = "md", className }: {
  label: string;
  value: T;
  options: Array<{ value: T; label: ReactNode; title?: string; icon?: ReactNode; tooltip?: string }>;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cx("flex shrink-0 rounded-[9px] bg-sunken p-[3px]", className)}>
      {options.map(option => {
        const active = option.value === value;
        const button = (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            title={option.tooltip === undefined ? option.title : undefined}
            onClick={() => onChange(option.value)}
            className={cx(
              "flex items-center gap-1.5 whitespace-nowrap rounded-[7px] font-semibold text-ink transition-colors",
              size === "sm" ? "h-6 px-2 text-xs" : "h-7 px-2.5 text-[12.5px]",
              active ? "bg-surface shadow-lift dark:bg-white/15" : "text-ink-2 hover:text-ink",
              focusRing,
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
        return option.tooltip === undefined ? button
          : <Tooltip key={option.value} title={option.title ?? String(option.label)} description={option.tooltip}>{button}</Tooltip>;
      })}
    </div>
  );
}

// A compact single-choice menu styled like the rest of the viewer. Escape
// closes only the list, so it can live inside another popover.
export function Dropdown<T extends string>({ label, value, options, onChange, className }: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const selectedIndex = Math.max(0, options.findIndex(option => option.value === value));

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus({ preventScroll: true });
    const target = getViewerEventTarget();
    const onPointerDown = (event: Event) => {
      if (rootRef.current && !event.composedPath().includes(rootRef.current)) setOpen(false);
    };
    target.addEventListener("pointerdown", onPointerDown);
    return () => target.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const show = (index = selectedIndex) => { setActive(index); setOpen(true); };
  const close = () => { setOpen(false); buttonRef.current?.focus({ preventScroll: true }); };
  const choose = (index: number) => { onChange(options[index].value); close(); };

  function onListKeyDown(event: ReactKeyboardEvent) {
    const last = options.length - 1;
    const keys: Record<string, () => void> = {
      ArrowDown: () => setActive(index => Math.min(last, index + 1)),
      ArrowUp: () => setActive(index => Math.max(0, index - 1)),
      Home: () => setActive(0),
      End: () => setActive(last),
      Enter: () => choose(active),
      " ": () => choose(active),
      Escape: close,
    };
    const action = keys[event.key];
    if (action) {
      event.preventDefault();
      event.stopPropagation();
      action();
      return;
    }
    if (event.key === "Tab") { setOpen(false); return; }
    if (event.key.length === 1) {
      // Jump to the next option starting with the typed letter.
      const letter = event.key.toLowerCase();
      const order = [...options.keys()].map(offset => (active + 1 + offset) % options.length);
      const match = order.find(index => options[index].label.toLowerCase().startsWith(letter));
      if (match !== undefined) setActive(match);
    }
  }

  return (
    <div ref={rootRef} className={cx("relative shrink-0", className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${label}: ${options[selectedIndex]?.label ?? ""}`}
        onClick={() => open ? setOpen(false) : show()}
        onKeyDown={event => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); show(); }
        }}
        className={cx(
          "flex h-[34px] items-center gap-1.5 whitespace-nowrap rounded-lg border ps-2.5 pe-2 text-[12.5px] font-semibold text-ink transition-colors",
          open ? "border-ink bg-sunken" : "border-line bg-surface hover:bg-sunken",
          focusRing,
        )}
      >
        {options[selectedIndex]?.label}
        <ChevronDownIcon size={14} className={cx("text-ink-2 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          aria-activedescendant={`${listId}-${active}`}
          onKeyDown={onListKeyDown}
          className="absolute end-0 top-full z-20 mt-1 max-h-72 w-max min-w-full overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-popover outline-none"
        >
          {options.map((option, index) => {
            const selected = option.value === value;
            return (
              <li
                key={option.value}
                id={`${listId}-${index}`}
                data-index={index}
                role="option"
                aria-selected={selected}
                onPointerMove={() => setActive(index)}
                onClick={() => choose(index)}
                className={cx(
                  "flex h-8 cursor-pointer items-center gap-2 rounded-[7px] pe-3 ps-2 text-[13px]",
                  index === active ? "bg-sunken" : "",
                  selected ? "font-semibold text-ink" : "font-medium text-ink-2",
                )}
              >
                <span className="grid w-4 shrink-0 place-items-center">{selected && <CheckIcon size={14} className="text-accent" />}</span>
                {option.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function Switch({ checked, onChange, label, size = "md" }: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative shrink-0 rounded-full transition-colors",
        size === "sm" ? "h-4 w-7" : "h-[22px] w-9",
        checked ? "bg-accent" : "bg-faint/50",
        focusRing,
      )}
    >
      <span className={cx(
        "absolute top-0.5 rounded-full bg-white shadow-lift transition-[left]",
        size === "sm" ? "size-3" : "size-[18px]",
        checked ? (size === "sm" ? "left-[14px]" : "left-[16px]") : "left-0.5",
      )} />
    </button>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded bg-white/20 px-1.5 py-0.5 font-mono text-[11px] font-medium">{children}</kbd>;
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("text-[11px] font-bold uppercase tracking-[0.06em] text-faint", className)}>{children}</div>;
}

export const popoverPanel = "z-[60] flex flex-col overflow-hidden rounded-xl border border-line bg-surface text-ink shadow-popover";

// Closes a popover on Escape or on a pointer press outside every given element.
export function useDismiss(open: boolean, refs: Array<RefObject<HTMLElement | null>>, onDismiss: () => void) {
  useEffect(() => {
    if (!open) return;
    const target = getViewerEventTarget();
    const onPointerDown = (event: Event) => {
      const path = event.composedPath();
      if (refs.some(ref => ref.current && path.includes(ref.current))) return;
      onDismiss();
    };
    const onKeyDown = (event: Event) => {
      const keyboard = event as KeyboardEvent;
      if (keyboard.key !== "Escape" || keyboard.isComposing || keyboard.defaultPrevented) return;
      keyboard.preventDefault();
      onDismiss();
    };
    target.addEventListener("pointerdown", onPointerDown);
    target.addEventListener("keydown", onKeyDown);
    return () => {
      target.removeEventListener("pointerdown", onPointerDown);
      target.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onDismiss, ...refs]);
}

// Reports the pointer entering and leaving a popover rendered elsewhere in the
// tree (a dock menu), and any press or key inside it, without adding a box.
export function HoverZone({ onEnter, onLeave, onUse, children }: {
  onEnter: () => void;
  onLeave: () => void;
  onUse: () => void;
  children: ReactNode;
}) {
  return (
    <div className="contents" onPointerEnter={onEnter} onPointerLeave={onLeave} onPointerDownCapture={onUse} onKeyDownCapture={onUse}>
      {children}
    </div>
  );
}

export interface AnchoredPosition {
  top: number;
  /** Set instead of `top` when the popover opens upward from an anchor near the bottom edge. */
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
}

// Places a fixed popover next to its anchor and keeps it inside the window:
// under it, or above it when the anchor sits in the lower half (the dock).
export function useAnchoredPosition(anchorRef: RefObject<HTMLElement | null>, open: boolean, preferredWidth: number, align: "start" | "end" | "center" = "start", maxHeightLimit = 680) {
  const [position, setPosition] = useState<AnchoredPosition>({ top: 56, left: 8, width: preferredWidth, maxHeight: maxHeightLimit });
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const anchor = anchorRef.current?.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const width = Math.min(preferredWidth, viewportWidth - 16);
      const desiredLeft = !anchor ? 8
        : align === "end" ? anchor.right - width
        : align === "center" ? anchor.left + anchor.width / 2 - width / 2
        : anchor.left;
      const clamp = (value: number) => Math.max(8, Math.min(viewportWidth - width - 8, value));
      const left = clamp(desiredLeft);
      // Opening upward from the dock, the menu is centred over its item.
      if (anchor && anchor.top + anchor.height / 2 > viewportHeight / 2) {
        const bottom = viewportHeight - anchor.top + 8;
        setPosition({ top: 0, bottom, width, left: clamp(anchor.left + anchor.width / 2 - width / 2), maxHeight: Math.max(160, Math.min(maxHeightLimit, anchor.top - 16)) });
        return;
      }
      const top = (anchor?.bottom ?? 48) + 6;
      setPosition({ top, width, left, maxHeight: Math.max(160, Math.min(maxHeightLimit, viewportHeight - top - 8)) });
    };
    update();
    window.addEventListener("resize", update);
    // The anchor moves when its row reflows (a font arriving, a label
    // appearing), so watch the row as well as the anchor.
    const anchor = anchorRef.current;
    const observer = anchor ? new ResizeObserver(update) : undefined;
    if (anchor) observer?.observe(anchor);
    const row = anchor?.closest("nav, header, [role=toolbar]");
    if (row) observer?.observe(row);
    let live = true;
    void document.fonts?.ready.then(() => { if (live) update(); });
    return () => { live = false; window.removeEventListener("resize", update); observer?.disconnect(); };
  }, [anchorRef, open, preferredWidth, align, maxHeightLimit]);
  return position;
}

export function positionStyle(position: AnchoredPosition) {
  const vertical = position.bottom === undefined ? { top: position.top } : { bottom: position.bottom };
  return { ...vertical, left: position.left, width: position.width, maxHeight: position.maxHeight };
}
