import { defineContentScript } from "wxt/utils/define-content-script";

const OVERLAY_ID = "multi-device-viewer-overlay";

export default defineContentScript({
  matches: ["https://*/*", "http://*/*"],
  allFrames: true,
  runAt: "document_idle",
  main() {
    setupPreviewBridge();

    if (window.top === window) {
      chrome.runtime.onMessage.addListener((message) => {
        if (message !== null && typeof message === "object") {
          if (message.type === "OPEN_SIMULATOR") {
            toggleSimulator(
              typeof message.url === "string" ? message.url : undefined,
              typeof message.sourceTabId === "number" ? message.sourceTabId : undefined,
            );
          } else if (message.type === "HIDE_OVERLAY") {
            const el = document.getElementById(OVERLAY_ID);
            if (el) el.style.visibility = "hidden";
          } else if (message.type === "SHOW_OVERLAY") {
            const el = document.getElementById(OVERLAY_ID);
            if (el) el.style.visibility = "visible";
          }
        }
      });
    }
  },
});

function setupPreviewBridge() {
  const bridgeWindow = window as Window & { __MDV_PREVIEW_BRIDGE_READY?: boolean };
  if (bridgeWindow.__MDV_PREVIEW_BRIDGE_READY) return;
  bridgeWindow.__MDV_PREVIEW_BRIDGE_READY = true;

  let slotId: string | undefined;
  let programmaticScroll = false;
  let resetTimer: number | undefined;
  let scrollRafPending = false;
  let lastScrollLeft = 0;
  let lastScrollTop = 0;
  let scrollSyncEnabled = false;
  let applyingRemoteInteraction = false;
  let inspectEnabled = false;
  let inspectRafPending = false;
  let inspectPendingX = -1;
  let inspectPendingY = -1;
  // Track the last element we inspected so we only run getComputedStyle when it changes
  let lastInspectedEl: Element | null = null;
  let currentTheme: "light" | "dark" = "light";

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

  const announceReady = () => {
    if (!slotId) return;
    window.parent.postMessage({
      type: "MDV_PREVIEW_READY",
      slotId,
      url: window.location.href,
      ...scrollRatios()
    }, "*");
  };

  function applyTheme(theme: "light" | "dark") {
    currentTheme = theme;
    const rootEl = document.documentElement;
    rootEl.style.colorScheme = theme;
    rootEl.dataset.mdvTheme = theme;

    let style = document.getElementById("mdv-theme-style") as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = "mdv-theme-style";
      document.head.appendChild(style);
    }
    style.textContent = `
      :root { color-scheme: ${theme}; }
      html[data-mdv-theme="${theme}"] { color-scheme: ${theme}; }
    `;
  }

  function applyPreviewViewportStyle() {
    let style = document.getElementById("mdv-preview-viewport-style") as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = "mdv-preview-viewport-style";
      document.head.appendChild(style);
    }
    style.textContent = `
      html, body {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
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

  function rgbToHex(rgb: string): string {
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return rgb;
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  function buildBreadcrumb(el: Element): string {
    const parts: string[] = [];
    let cur: Element | null = el;
    while (cur && cur !== document.body && parts.length < 5) {
      let label = cur.tagName.toLowerCase();
      if (cur.id) label += `#${cur.id}`;
      else if (cur.classList.length) label += `.${Array.from(cur.classList).slice(0, 2).join(".")}`;
      parts.unshift(label);
      cur = cur.parentElement;
    }
    return parts.join(" > ");
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

  function collectInspectData(el: Element, x: number, y: number) {
    const rect = el.getBoundingClientRect();
    const cs = window.getComputedStyle(el);
    const classes = Array.from(el.classList);
    const isVisibleInViewport =
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth;
    const isClippedByViewport = !isVisibleInViewport;
    const visibilityReason = isVisibleInViewport ? "fully-visible" : "outside-viewport";

    // Flex/Grid context props
    const isFlexItem = cs.display === "flex" || cs.display === "inline-flex";
    const isGridItem = cs.display === "grid" || cs.display === "inline-grid";
    const parentCs = el.parentElement ? window.getComputedStyle(el.parentElement) : null;
    const parentDisplay = parentCs?.display ?? "";
    const isInFlex = parentDisplay === "flex" || parentDisplay === "inline-flex";
    const isInGrid = parentDisplay === "grid" || parentDisplay === "inline-grid";

    // Build a compact "copy as CSS" snippet
    const cssSnippet = [
      `display: ${cs.display};`,
      cs.position !== "static" ? `position: ${cs.position};` : "",
      `width: ${Math.round(rect.width)}px;`,
      `height: ${Math.round(rect.height)}px;`,
      cs.paddingTop !== "0px" || cs.paddingRight !== "0px" || cs.paddingBottom !== "0px" || cs.paddingLeft !== "0px"
        ? `padding: ${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft};` : "",
      cs.marginTop !== "0px" || cs.marginRight !== "0px" || cs.marginBottom !== "0px" || cs.marginLeft !== "0px"
        ? `margin: ${cs.marginTop} ${cs.marginRight} ${cs.marginBottom} ${cs.marginLeft};` : "",
      cs.fontSize ? `font-size: ${cs.fontSize};` : "",
      cs.fontWeight ? `font-weight: ${cs.fontWeight};` : "",
      cs.color ? `color: ${rgbToHex(cs.color)};` : "",
      cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)"
        ? `background-color: ${rgbToHex(cs.backgroundColor)};` : "",
      cs.borderRadius && cs.borderRadius !== "0px" ? `border-radius: ${cs.borderRadius};` : "",
      cs.boxShadow && cs.boxShadow !== "none" ? `box-shadow: ${cs.boxShadow};` : "",
    ].filter(Boolean).join("\n");

    const post = (type: string) => {
      if (!slotId) return;
      window.parent.postMessage({
        type,
        slotId,
        selector: buildSelector(el),
        isVisibleInViewport,
        isClippedByViewport,
        visibilityReason,
        tagName: el.tagName,
        id: el.id,
        classes,
        breadcrumb: buildBreadcrumb(el),
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing,
        textAlign: cs.textAlign,
        color: cs.color,
        colorHex: rgbToHex(cs.color),
        backgroundColor: cs.backgroundColor,
        backgroundColorHex: rgbToHex(cs.backgroundColor),
        paddingTop: cs.paddingTop,
        paddingRight: cs.paddingRight,
        paddingBottom: cs.paddingBottom,
        paddingLeft: cs.paddingLeft,
        marginTop: cs.marginTop,
        marginRight: cs.marginRight,
        marginBottom: cs.marginBottom,
        marginLeft: cs.marginLeft,
        borderWidth: cs.borderWidth,
        borderColor: cs.borderColor,
        borderColorHex: rgbToHex(cs.borderColor),
        width: rect.width,
        height: rect.height,
        display: cs.display,
        position: cs.position,
        overflow: cs.overflow,
        overflowX: cs.overflowX,
        overflowY: cs.overflowY,
        transform: cs.transform !== "none" ? cs.transform : "",
        borderRadius: cs.borderRadius,
        opacity: cs.opacity,
        zIndex: cs.zIndex,
        boxShadow: cs.boxShadow,
        // Flex/Grid
        isFlexContainer: isFlexItem,
        flexDirection: isFlexItem ? cs.flexDirection : "",
        flexWrap: isFlexItem ? cs.flexWrap : "",
        justifyContent: isFlexItem ? cs.justifyContent : "",
        alignItems: isFlexItem ? cs.alignItems : "",
        gap: isFlexItem || isGridItem ? cs.gap : "",
        isGridContainer: isGridItem,
        gridTemplateColumns: isGridItem ? cs.gridTemplateColumns : "",
        gridTemplateRows: isGridItem ? cs.gridTemplateRows : "",
        isInFlex,
        flexGrow: isInFlex ? cs.flexGrow : "",
        flexShrink: isInFlex ? cs.flexShrink : "",
        flexBasis: isInFlex ? cs.flexBasis : "",
        alignSelf: isInFlex || isInGrid ? cs.alignSelf : "",
        isInGrid,
        gridColumn: isInGrid ? cs.gridColumn : "",
        gridRow: isInGrid ? cs.gridRow : "",
        cssSnippet,
        x,
        y,
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      }, "*");
    };
    return post;
  }

  function emitScrollSync() {
    if (!slotId || programmaticScroll) return;
    const payload = scrollRatios();
    lastScrollLeft = payload.scrollLeft;
    lastScrollTop = payload.scrollTop;
    window.parent.postMessage({
      type: "MDV_SCROLL_SYNC_EVENT",
      slotId,
      ...payload
    }, "*");
  }

  function fireInspectMove() {
    inspectRafPending = false;
    if (!inspectEnabled || !slotId) return;
    const x = inspectPendingX;
    const y = inspectPendingY;
    const el = document.elementFromPoint(x, y);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const fullyVisible =
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth;

    // Only show the highlight when the element is fully inside the viewport.
    window.parent.postMessage({
      type: "MDV_INSPECT_MOVE",
      slotId,
      hidden: !fullyVisible,
      rect: fullyVisible
        ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
        : undefined,
    }, "*");

    // Only run getComputedStyle (expensive) when the element has changed
    if (el !== lastInspectedEl) {
      lastInspectedEl = el;
      const post = collectInspectData(el, x, y);
      post("MDV_INSPECT_DATA");
    }
  }

  window.addEventListener("mousemove", (e) => {
    if (!inspectEnabled) return;
    // Always store the latest coords so RAF fires with the freshest position
    inspectPendingX = e.clientX;
    inspectPendingY = e.clientY;
    if (!inspectRafPending) {
      inspectRafPending = true;
      requestAnimationFrame(fireInspectMove);
    }
  }, { passive: true });

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

  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || typeof data !== "object") return;

    if (data.type === "MDV_PREVIEW_REGISTER" && typeof data.slotId === "string") {
      slotId = data.slotId;
      applyPreviewViewportStyle();
      lastScrollLeft = root().scrollLeft;
      lastScrollTop = root().scrollTop;
      announceReady();
      return;
    }

    if (data.type === "MDV_APPLY_SCROLL_SYNC" && typeof data.slotId === "string" && data.slotId === slotId) {
      const el = root();
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
      lastScrollLeft = el.scrollLeft;
      lastScrollTop = el.scrollTop;
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
      window.requestAnimationFrame(() => {
        emitScrollSync();
      });
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

    if (data.type === "MDV_INSPECT_ENABLE" && typeof data.slotId === "string") {
      slotId = data.slotId;
      inspectEnabled = true;
      inspectPendingX = -1;
      inspectPendingY = -1;
      lastInspectedEl = null;
    }

    if (data.type === "MDV_INSPECT_DISABLE" && typeof data.slotId === "string") {
      inspectEnabled = false;
      inspectRafPending = false;
      lastInspectedEl = null;
    }

    if (data.type === "MDV_INSPECT_QUERY" && typeof data.selector === "string") {
      const el = document.querySelector(data.selector);
      if (!el) return;
      const post = collectInspectData(el, el.getBoundingClientRect().left, el.getBoundingClientRect().top);
      post("MDV_INSPECT_DATA");
    }

    if (data.type === "MDV_THEME" && (data.theme === "light" || data.theme === "dark")) {
      applyTheme(data.theme);
    }
  });

  const postScroll = () => {
    if (!slotId || programmaticScroll) return;
    if (scrollRafPending) return;
    scrollRafPending = true;
    requestAnimationFrame(() => {
      scrollRafPending = false;
      if (!slotId || programmaticScroll) return;
      emitScrollSync();
    });
  };

  window.addEventListener("scroll", postScroll, { passive: true });
  document.addEventListener("scroll", postScroll, true);
  window.addEventListener("wheel", postScroll, { passive: true });
  window.addEventListener("touchmove", postScroll, { passive: true });

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

  // Prevent the host page from scrolling while the overlay is open.
  document.documentElement.style.overflow = "hidden";

  // Escape key closes the overlay.
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      overlay.remove();
      document.documentElement.style.removeProperty("overflow");
      document.removeEventListener("keydown", onKey, true);
    }
  };
  document.addEventListener("keydown", onKey, true);
}
