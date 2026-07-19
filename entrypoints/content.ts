import { defineContentScript } from "wxt/utils/define-content-script";

const OVERLAY_ID = "multi-device-viewer-overlay";

export default defineContentScript({
  matches: ["https://*/*", "http://*/*"],
  allFrames: true,
  runAt: "document_idle",
  main() {
    setupPreviewBridge();

    if (window.top === window) {
      notifyOverlayState(false);
      chrome.runtime.onMessage.addListener((message) => {
        if (message !== null && typeof message === "object") {
          if (message.type === "OPEN_SIMULATOR") {
            toggleSimulator(
              typeof message.url === "string" ? message.url : undefined,
              typeof message.sourceTabId === "number" ? message.sourceTabId : undefined,
            );
          }
        }
      });
    }
  },
});

function setupPreviewBridge() {
  if (window.parent === window) return;
  const bridgeWindow = window as Window & { __MDV_PREVIEW_BRIDGE_READY?: boolean };
  if (bridgeWindow.__MDV_PREVIEW_BRIDGE_READY) return;
  bridgeWindow.__MDV_PREVIEW_BRIDGE_READY = true;

  let slotId: string | undefined;
  let programmaticScroll = false;
  let resetTimer: number | undefined;
  let scrollRafPending = false;
  let lastScrollLeft = 0;
  let lastScrollTop = 0;
  const nestedScrollPositions = new WeakMap<Element, { left: number; top: number }>();
  let scrollSyncEnabled = false;
  let applyingRemoteInteraction = false;
  let activeEditable: HTMLElement | null = null;
  let keyboardBlurTimer: number | undefined;

  const root = () => document.scrollingElement ?? document.documentElement;
  const scrollRatios = () => {
    const el = root();
    const scrollLeft = el.scrollLeft;
    const scrollTop = el.scrollTop;
    return {
      scrollLeft,
      scrollTop,
      deltaLeft: scrollLeft - lastScrollLeft,
      deltaTop: scrollTop - lastScrollTop,
      scrollHeight: el.scrollHeight,
      scrollWidth: el.scrollWidth,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth
    };
  };

  const scrollPayload = (target?: Element) => {
    const el = target ?? root();
    if (el === root()) return scrollRatios();
    const previous = nestedScrollPositions.get(el);
    const payload = {
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
      deltaLeft: previous ? el.scrollLeft - previous.left : 0,
      deltaTop: previous ? el.scrollTop - previous.top : 0,
      scrollHeight: el.scrollHeight,
      scrollWidth: el.scrollWidth,
      viewportHeight: el.clientHeight,
      viewportWidth: el.clientWidth,
      scrollTargetSelector: buildSelector(el),
    };
    nestedScrollPositions.set(el, { left: el.scrollLeft, top: el.scrollTop });
    return payload;
  };

  const announceReady = () => {
    if (!slotId) return;
    window.parent.postMessage({
      type: "MDV_PREVIEW_READY",
      slotId,
      url: window.location.href,
      ...scrollRatios()
    }, "*");
  };

  const announceNavigation = () => requestAnimationFrame(announceReady);
  for (const method of ["pushState", "replaceState"] as const) {
    const original = history[method].bind(history);
    history[method] = ((data: unknown, unused: string, url?: string | URL | null) => {
      const result = original(data, unused, url);
      announceNavigation();
      return result;
    }) as History[typeof method];
  }
  window.addEventListener("popstate", announceNavigation);
  window.addEventListener("hashchange", announceNavigation);

  function applyPreviewViewportStyle() {
    let style = document.getElementById("mdv-preview-viewport-style") as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = "mdv-preview-viewport-style";
      document.head.appendChild(style);
    }
    style.textContent = `
      html, body, * {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
        scrollbar-gutter: auto !important;
      }
      html::-webkit-scrollbar,
      body::-webkit-scrollbar,
      *::-webkit-scrollbar {
        width: 0 !important;
        height: 0 !important;
        display: none !important;
      }
    `;
  }

  function buildSelector(el: Element): string {
    const id = el.id.trim();
    if (id) return `#${CSS.escape(id)}`;
    const parts: string[] = [];
    let cur: Element | null = el;
    while (cur && cur !== document.documentElement && parts.length < 4) {
      let part = cur.tagName.toLowerCase();
      const classes = Array.from(cur.classList).slice(0, 2).map((value) => `.${CSS.escape(value)}`).join("");
      if (classes) part += classes;
      const parent = cur.parentElement;
      if (parent) {
        const sameTag = Array.from(parent.children).filter((child) => child.tagName === cur!.tagName);
        if (sameTag.length > 1) {
          const index = sameTag.indexOf(cur) + 1;
          part += `:nth-of-type(${index})`;
        }
      }
      parts.unshift(part);
      cur = cur.parentElement;
    }
    return parts.join(" > ");
  }

  function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
    const proto = Object.getPrototypeOf(el);
    const desc =
      Object.getOwnPropertyDescriptor(proto, "value") ??
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
    desc?.set?.call(el, value);
  }

  function resolveEditable(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof Element)) return null;
    const editable = target.closest("input, textarea, [contenteditable]");
    if (!(editable instanceof HTMLElement)) return null;
    if (editable instanceof HTMLInputElement) {
      const nonTextTypes = new Set(["button", "checkbox", "color", "file", "hidden", "image", "radio", "range", "reset", "submit"]);
      if (editable.disabled || editable.readOnly || nonTextTypes.has(editable.type.toLowerCase())) return null;
      return editable;
    }
    if (editable instanceof HTMLTextAreaElement) {
      return editable.disabled || editable.readOnly ? null : editable;
    }
    return editable.isContentEditable ? editable : null;
  }

  function postKeyboardFocus(editable: HTMLElement) {
    if (!slotId) return;
    const input = editable instanceof HTMLInputElement ? editable : null;
    window.parent.postMessage({
      type: "MDV_KEYBOARD_FOCUS",
      slotId,
      selector: buildSelector(editable),
      inputType: input?.type ?? (editable instanceof HTMLTextAreaElement ? "textarea" : "text"),
      inputMode: editable.inputMode || "",
      multiline: editable instanceof HTMLTextAreaElement || editable.isContentEditable,
    }, "*");
  }

  function postKeyboardBlur() {
    if (!slotId) return;
    window.parent.postMessage({ type: "MDV_KEYBOARD_BLUR", slotId }, "*");
  }

  function dispatchKeyboardInput(target: HTMLElement, inputType: string, data: string | null) {
    target.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      cancelable: false,
      composed: true,
      inputType,
      data,
    }));
  }

  function replaceEditableSelection(target: HTMLElement, text: string, inputType = "insertText") {
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      const value = target.value;
      const start = target.selectionStart ?? value.length;
      const end = target.selectionEnd ?? start;
      const nextValue = `${value.slice(0, start)}${text}${value.slice(end)}`;
      setNativeValue(target, nextValue);
      try {
        target.setSelectionRange(start + text.length, start + text.length);
      } catch {
        // Numeric and a few specialized inputs do not expose text selection.
      }
      dispatchKeyboardInput(target, inputType, text || null);
      return;
    }

    const selection = window.getSelection();
    if (!selection) return;
    let range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    if (!range || !target.contains(range.commonAncestorContainer)) {
      range = document.createRange();
      range.selectNodeContents(target);
      range.collapse(false);
    }
    range.deleteContents();
    if (text) {
      const node = document.createTextNode(text);
      range.insertNode(node);
      range.setStartAfter(node);
    }
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    dispatchKeyboardInput(target, inputType, text || null);
  }

  function applyKeyboardAction(payload: Record<string, unknown>) {
    const target = resolveEditable(document.activeElement) ?? activeEditable;
    if (!target || !document.contains(target)) {
      postKeyboardBlur();
      return;
    }

    const action = typeof payload.action === "string" ? payload.action : "";
    if (action === "dismiss") {
      target.blur();
      activeEditable = null;
      postKeyboardBlur();
      return;
    }
    if (action === "text") {
      replaceEditableSelection(target, typeof payload.text === "string" ? payload.text : "");
      return;
    }
    if (action === "backspace") {
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        const value = target.value;
        const end = target.selectionEnd ?? value.length;
        const start = target.selectionStart ?? end;
        if (start === end && start > 0) {
          try {
            target.setSelectionRange(start - 1, end);
          } catch {
            setNativeValue(target, value.slice(0, -1));
            dispatchKeyboardInput(target, "deleteContentBackward", null);
            return;
          }
        }
      } else {
        const selection = window.getSelection();
        const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
        if (range?.collapsed) range.setStart(range.startContainer, Math.max(0, range.startOffset - 1));
      }
      replaceEditableSelection(target, "", "deleteContentBackward");
      return;
    }
    if (action === "enter") {
      if (target instanceof HTMLTextAreaElement || target.isContentEditable) {
        replaceEditableSelection(target, "\n", "insertLineBreak");
        return;
      }
      const init = { bubbles: true, cancelable: true, composed: true, key: "Enter", code: "Enter" };
      const allowed = target.dispatchEvent(new KeyboardEvent("keydown", init));
      target.dispatchEvent(new KeyboardEvent("keyup", init));
      if (allowed && target instanceof HTMLInputElement) target.form?.requestSubmit();
    }
  }

  function resolveInteractionTarget(selector?: string): Element | null {
    if (!selector) return null;
    return document.querySelector(selector);
  }

  function resolveInteractionSource(target: EventTarget | null): Element | null {
    if (!(target instanceof Element)) return null;
    const interactive = target.closest(
      'input, textarea, select, button, a, label, [contenteditable="true"], [role="button"], [role="checkbox"], [role="switch"]',
    );
    return interactive ?? target;
  }

  function postInteraction(kind: string, payload: Record<string, unknown>) {
    if (!slotId || !scrollSyncEnabled) return;
    window.parent.postMessage({
      type: "MDV_INTERACTION_EVENT",
      slotId,
      kind,
      ...payload,
    }, "*");
  }

  function dispatchMouseSequence(target: Element, payload: Record<string, unknown>) {
    const init = {
      bubbles: true,
      cancelable: true,
      composed: true,
      clientX: Number(payload.x ?? 0) * window.innerWidth,
      clientY: Number(payload.y ?? 0) * window.innerHeight,
      button: Number(payload.button ?? 0),
      buttons: Number(payload.buttons ?? 0),
      ctrlKey: Boolean(payload.ctrlKey),
      altKey: Boolean(payload.altKey),
      shiftKey: Boolean(payload.shiftKey),
      metaKey: Boolean(payload.metaKey),
    };
    target.dispatchEvent(new MouseEvent("pointerdown", init as MouseEventInit));
    target.dispatchEvent(new MouseEvent("mousedown", init as MouseEventInit));
    target.dispatchEvent(new MouseEvent("pointerup", init as MouseEventInit));
    target.dispatchEvent(new MouseEvent("mouseup", init as MouseEventInit));
    target.dispatchEvent(new MouseEvent("click", init as MouseEventInit));
  }

  function applyRemoteInteraction(payload: Record<string, unknown>) {
    if (!scrollSyncEnabled || applyingRemoteInteraction) return;
    applyingRemoteInteraction = true;
    try {
      const target = resolveInteractionTarget(typeof payload.selector === "string" ? payload.selector : undefined);
      if (!target) return;

      if (payload.kind === "click") {
        if (target instanceof HTMLElement) {
          target.focus?.();
          target.click();
        } else {
          dispatchMouseSequence(target, payload);
        }
        return;
      }

      if (payload.kind === "input" || payload.kind === "change") {
        const value = typeof payload.value === "string" ? payload.value : "";
        const checked = Boolean(payload.checked);
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
          setNativeValue(target, value);
          if (typeof payload.checked === "boolean" && target instanceof HTMLInputElement) {
            target.checked = checked;
          }
        } else if (target instanceof HTMLSelectElement) {
          target.value = value;
        } else if (target instanceof HTMLElement && target.isContentEditable) {
          target.textContent = value;
        }
        target.dispatchEvent(new InputEvent("input", {
          bubbles: true,
          cancelable: true,
          composed: true,
          inputType: typeof payload.inputType === "string" ? payload.inputType : "insertText",
          data: value,
        }));
        target.dispatchEvent(new Event("change", { bubbles: true, cancelable: true, composed: true }));
        return;
      }

      if (payload.kind === "keydown") {
        const key = typeof payload.key === "string" ? payload.key : "";
        const code = typeof payload.code === "string" ? payload.code : "";
        const init = {
          bubbles: true,
          cancelable: true,
          composed: true,
          key,
          code,
          altKey: Boolean(payload.altKey),
          ctrlKey: Boolean(payload.ctrlKey),
          shiftKey: Boolean(payload.shiftKey),
          metaKey: Boolean(payload.metaKey),
        };
        target.dispatchEvent(new KeyboardEvent("keydown", init));
        target.dispatchEvent(new KeyboardEvent("keyup", init));
      }
    } finally {
      applyingRemoteInteraction = false;
    }
  }

  function emitScrollSync(target?: Element) {
    if (!slotId || programmaticScroll) return;
    const payload = scrollPayload(target);
    if (!target || target === root()) {
      lastScrollLeft = payload.scrollLeft;
      lastScrollTop = payload.scrollTop;
    }
    window.parent.postMessage({
      type: "MDV_SCROLL_SYNC_EVENT",
      slotId,
      ...payload
    }, "*");
  }

  window.addEventListener("click", (e) => {
    if (!scrollSyncEnabled || !slotId || !e.isTrusted) return;
    const source = resolveInteractionSource(e.target);
    if (!source) return;
    postInteraction("click", {
      selector: buildSelector(source),
      button: e.button,
      buttons: e.buttons,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
      shiftKey: e.shiftKey,
      metaKey: e.metaKey,
    });
  }, { capture: true, passive: true });

  window.addEventListener("input", (e) => {
    if (!scrollSyncEnabled || !slotId || !e.isTrusted || applyingRemoteInteraction) return;
    const target = resolveInteractionSource(e.target);
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || (target instanceof HTMLElement && target.isContentEditable))) return;
    postInteraction("input", {
      selector: buildSelector(target),
      value: target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement ? target.value : target.textContent ?? "",
      checked: target instanceof HTMLInputElement ? target.checked : undefined,
      inputType: e instanceof InputEvent ? e.inputType : undefined,
    });
  }, { capture: true, passive: true });

  window.addEventListener("change", (e) => {
    if (!scrollSyncEnabled || !slotId || !e.isTrusted || applyingRemoteInteraction) return;
    const target = resolveInteractionSource(e.target);
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return;
    postInteraction("change", {
      selector: buildSelector(target),
      value: target.value,
      checked: target instanceof HTMLInputElement ? target.checked : undefined,
    });
  }, { capture: true, passive: true });

  window.addEventListener("keydown", (e) => {
    if (!scrollSyncEnabled || !slotId || !e.isTrusted || applyingRemoteInteraction) return;
    const target = resolveInteractionSource(e.target);
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || (target instanceof HTMLElement && target.isContentEditable))) return;
    if (e.key.length !== 1 && !["Enter", "Backspace", "Delete", "Tab"].includes(e.key)) return;
    postInteraction("keydown", {
      selector: buildSelector(target),
      key: e.key,
      code: e.code,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
      shiftKey: e.shiftKey,
      metaKey: e.metaKey,
    });
  }, { capture: true, passive: true });

  window.addEventListener("focusin", (event) => {
    const editable = resolveEditable(event.target);
    if (!editable) return;
    window.clearTimeout(keyboardBlurTimer);
    activeEditable = editable;
    postKeyboardFocus(editable);
  }, true);

  window.addEventListener("focusout", () => {
    window.clearTimeout(keyboardBlurTimer);
    keyboardBlurTimer = window.setTimeout(() => {
      const next = resolveEditable(document.activeElement);
      if (next) {
        activeEditable = next;
        postKeyboardFocus(next);
        return;
      }
      activeEditable = null;
      postKeyboardBlur();
    }, 0);
  }, true);

  window.addEventListener("message", (event) => {
    if (event.source !== window.parent) return;
    const data = event.data;
    if (!data || typeof data !== "object") return;

    if (data.type === "MDV_PREVIEW_REGISTER" && typeof data.slotId === "string") {
      slotId = data.slotId;
      applyPreviewViewportStyle();
      lastScrollLeft = root().scrollLeft;
      lastScrollTop = root().scrollTop;
      announceReady();
      const focused = resolveEditable(document.activeElement);
      if (focused) {
        activeEditable = focused;
        postKeyboardFocus(focused);
      }
      return;
    }

    if (data.type === "MDV_APPLY_SCROLL_SYNC" && typeof data.slotId === "string" && data.slotId === slotId) {
      const targetSelector = typeof data.scrollTargetSelector === "string" ? data.scrollTargetSelector : "";
      const requestedTarget = targetSelector ? document.querySelector(targetSelector) : null;
      if (targetSelector && !requestedTarget) return;
      const el = requestedTarget ?? root();
      programmaticScroll = true;
      const deltaLeft = Number(data.deltaLeft ?? 0);
      const deltaTop = Number(data.deltaTop ?? 0);
      if (deltaLeft !== 0 || deltaTop !== 0) {
        el.scrollBy({
          left: deltaLeft,
          top: deltaTop,
          behavior: "auto"
        });
      } else {
        el.scrollTo({
          left: Number(data.scrollLeft ?? el.scrollLeft),
          top: Number(data.scrollTop ?? el.scrollTop),
          behavior: "auto"
        });
      }
      if (el === root()) {
        lastScrollLeft = el.scrollLeft;
        lastScrollTop = el.scrollTop;
      } else {
        nestedScrollPositions.set(el, { left: el.scrollLeft, top: el.scrollTop });
      }
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        programmaticScroll = false;
      }, 120);
    }

    if (data.type === "MDV_SCROLL_SYNC_ENABLE" && typeof data.slotId === "string") {
      slotId = data.slotId;
      scrollSyncEnabled = true;
      programmaticScroll = false;
      window.clearTimeout(resetTimer);
      lastScrollLeft = root().scrollLeft;
      lastScrollTop = root().scrollTop;
      return;
    }

    if (data.type === "MDV_SCROLL_SYNC_SNAPSHOT" && typeof data.slotId === "string" && data.slotId === slotId) {
      window.requestAnimationFrame(() => emitScrollSync());
      return;
    }

    if (data.type === "MDV_SCROLL_SYNC_DISABLE" && typeof data.slotId === "string" && data.slotId === slotId) {
      scrollSyncEnabled = false;
      programmaticScroll = false;
      window.clearTimeout(resetTimer);
      return;
    }

    if (data.type === "MDV_APPLY_INTERACTION" && typeof data.slotId === "string" && data.slotId === slotId) {
      applyRemoteInteraction(data as Record<string, unknown>);
      return;
    }

    if (data.type === "MDV_KEYBOARD_ACTION" && typeof data.slotId === "string" && data.slotId === slotId) {
      applyKeyboardAction(data as Record<string, unknown>);
      return;
    }

  });

  const postScroll = (event: Event) => {
    if (!slotId || programmaticScroll) return;
    const target = event.target instanceof Element && event.target !== document.documentElement && event.target !== document.body
      ? event.target
      : undefined;
    if (scrollRafPending) return;
    scrollRafPending = true;
    requestAnimationFrame(() => {
      scrollRafPending = false;
      if (!slotId || programmaticScroll) return;
      emitScrollSync(target);
    });
  };

  window.addEventListener("scroll", postScroll, { passive: true });
  document.addEventListener("scroll", postScroll, true);

  window.addEventListener("error", () => {
    if (!slotId) return;
    window.parent.postMessage({
      type: "MDV_PREVIEW_BLOCKED_OR_UNAVAILABLE",
      slotId,
      url: window.location.href
    }, "*");
  });
}

function toggleSimulator(targetUrl?: string, sourceTabId?: number) {
  // If overlay is already open, close it (toggle behaviour).
  const existing = document.getElementById(OVERLAY_ID);
  if (existing) {
    existing.remove();
    document.documentElement.style.removeProperty("overflow");
    notifyOverlayState(false);
    return;
  }

  // Build the simulator page URL with the current page URL pre-loaded.
  const simulatorBase = chrome.runtime.getURL("/simulator.html");
  const simulatorUrl = new URL(simulatorBase);
  const pageUrl = targetUrl ?? window.location.href;
  if (/^https?:\/\//i.test(pageUrl)) {
    simulatorUrl.searchParams.set("url", pageUrl);
  }
  if (typeof sourceTabId === "number") {
    simulatorUrl.searchParams.set("sourceTabId", String(sourceTabId));
  }

  // Outer container — full-screen fixed overlay.
  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "2147483647",
    display: "flex",
    flexDirection: "row",
    background: "transparent",
  });

  // The iframe fills the entire overlay — close button lives inside the React app sidebar.
  const iframe = document.createElement("iframe");
  iframe.src = simulatorUrl.toString();
  iframe.allow = "downloads; clipboard-write";
  Object.assign(iframe.style, {
    flex: "1",
    height: "100%",
    border: "none",
    display: "block",
    background: "#f5f5f3",
  });

  // Listen for postMessages posted from inside the iframe.
  const onMessage = async (e: MessageEvent) => {
    if (e.data?.type === "CLOSE_SIMULATOR") {
      overlay.remove();
      document.documentElement.style.removeProperty("overflow");
      window.removeEventListener("message", onMessage);
      notifyOverlayState(false);
      return;
    }

    // COPY_IMAGE: the iframe cannot access clipboard directly (permissions policy).
    // The content script runs in the page context and CAN write to the clipboard.
    if (e.data?.type === "COPY_IMAGE" && typeof e.data.dataUrl === "string") {
      try {
        const res = await fetch(e.data.dataUrl);
        const blob = await res.blob();
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        iframe.contentWindow?.postMessage({ type: "COPY_IMAGE_RESULT", ok: true }, "*");
      } catch (err) {
        iframe.contentWindow?.postMessage({ type: "COPY_IMAGE_RESULT", ok: false, error: String(err) }, "*");
      }
    }
  };
  window.addEventListener("message", onMessage);

  overlay.appendChild(iframe);
  document.documentElement.appendChild(overlay);
  notifyOverlayState(true);

  // Prevent the host page from scrolling while the overlay is open.
  document.documentElement.style.overflow = "hidden";

  // Escape key closes the overlay.
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      overlay.remove();
      document.documentElement.style.removeProperty("overflow");
      document.removeEventListener("keydown", onKey, true);
      notifyOverlayState(false);
    }
  };
  document.addEventListener("keydown", onKey, true);
}

function notifyOverlayState(active: boolean) {
  chrome.runtime.sendMessage({ type: "MDV_OVERLAY_STATE", active }, () => {
    void chrome.runtime.lastError;
  });
}
