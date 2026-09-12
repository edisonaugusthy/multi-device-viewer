import { hasVerificationChallenge } from "../domain/flow/challenge-detection";
import { getKeyboardScrollDelta, shouldKeepKeyboardSessionOnBlur } from "../domain/device/mobile-keyboard";
import { samplePageSurfaces } from "../domain/device/page-surfaces";

export function setupPreviewBridge() {
  if (window.parent === window) return;
  const bridgeWindow = window as Window & { __MDV_PREVIEW_BRIDGE_READY?: boolean };
  if (bridgeWindow.__MDV_PREVIEW_BRIDGE_READY) return;
  bridgeWindow.__MDV_PREVIEW_BRIDGE_READY = true;

  const frameNameMatch = window.name.match(/^mdv-(?:mobile-)?preview-(.+)$/);
  if (!frameNameMatch) return;
  let slotId: string | undefined = frameNameMatch?.[1];
  const documentId = crypto.randomUUID();
  let scrollRaf: number | undefined;
  const pendingScrollTargets = new Set<Element>();
  const scrollPositions = new WeakMap<Element, { left: number; top: number }>();
  const remotePositions = new WeakMap<Element, { left: number; top: number; actualLeft: number; actualTop: number }>();
  let scrollSyncEnabled = false;
  let flowRecordingEnabled = false;
  let applyingRemoteInteraction = false;
  let activeEditable: HTMLElement | null = null;
  let keyboardBlurTimer: number | undefined;
  let keyboardVisibilityTimer: number | undefined;
  let keyboardViewport: { platform: "ios" | "android"; occludedBottom: number } | undefined;
  let surfaceRafPending = false;
  let lastSurfaceSignature = "";
  let sampleRightSurface = false;
  let pagehideContinuation: { runId: string; nextStep: number } | undefined;

  // The iframe name is available as soon as the document starts loading, so
  // mobile scrollbar hiding does not depend on a later registration message.
  if (window.name.startsWith("mdv-mobile-preview-")) {
    applyPreviewViewportStyle(true);
  }

  const root = () => document.scrollingElement ?? document.documentElement;
  const rememberScroll = (el: Element) => {
    scrollPositions.set(el, { left: el.scrollLeft, top: el.scrollTop });
  };
  const scrollPayload = (el = root(), snapshot = false) => {
    const previous = scrollPositions.get(el);
    const maxTop = Math.max(0, el.scrollHeight - el.clientHeight);
    const maxLeft = Math.max(0, el.scrollWidth - el.clientWidth);
    const clampedTop = previous && previous.top > maxTop && Math.abs(el.scrollTop - maxTop) < 1;
    const clampedLeft = previous && Math.abs(previous.left) > maxLeft && Math.abs(Math.abs(el.scrollLeft) - maxLeft) < 1;
    return {
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
      deltaLeft: snapshot || clampedLeft ? 0 : el.scrollLeft - (previous?.left ?? 0),
      // A larger viewport (or shorter page) can clamp the old position. That
      // layout correction isn't a user delta; other movements remain live.
      deltaTop: snapshot || clampedTop ? 0 : el.scrollTop - (previous?.top ?? 0),
      scrollHeight: el.scrollHeight,
      scrollWidth: el.scrollWidth,
      viewportHeight: el === root() ? window.innerHeight : el.clientHeight,
      viewportWidth: el === root() ? window.innerWidth : el.clientWidth,
      scrollTargetSelector: el === root() ? undefined : buildSelector(el),
    };
  };
  // Include containers already scrolled by the site before the bridge starts.
  const rememberAllScroll = () => {
    rememberScroll(root());
    for (const el of document.querySelectorAll("*")) {
      if (el.scrollTop || el.scrollLeft) rememberScroll(el);
    }
  };
  rememberAllScroll();

  function announceSurfaceColors(force = false) {
    if (!slotId) return;
    const surfaces = samplePageSurfaces(sampleRightSurface);
    const signature = JSON.stringify(surfaces);
    if (!force && signature === lastSurfaceSignature) return;
    lastSurfaceSignature = signature;
    window.parent.postMessage({ type: "MDV_PAGE_SURFACE_COLORS", slotId, ...surfaces }, "*");
  }

  function scheduleSurfaceColors() {
    if (surfaceRafPending) return;
    surfaceRafPending = true;
    requestAnimationFrame(() => {
      surfaceRafPending = false;
      announceSurfaceColors();
    });
  }

  let announcedUrl = "";
  const announceReady = () => {
    if (!slotId) return;
    announcedUrl = window.location.href;
    const surfaces = samplePageSurfaces(sampleRightSurface);
    lastSurfaceSignature = JSON.stringify(surfaces);
    window.parent.postMessage({
      type: "MDV_PREVIEW_READY",
      slotId,
      documentId,
      url: window.location.href,
      ...surfaces,
      ...scrollPayload()
    }, "*");
  };

  // History methods belong to the site's JS world. Wrapping them in an
  // isolated content script misses SPA updates, so observe the shared URL.
  const announceNavigation = () => {
    if (window.location.href !== announcedUrl) announceReady();
  };
  let navigationTimer: number | undefined;
  const startNavigationWatch = () => {
    window.clearInterval(navigationTimer);
    navigationTimer = window.setInterval(announceNavigation, 150);
    announceReady();
  };
  startNavigationWatch();
  window.addEventListener("pagehide", () => window.clearInterval(navigationTimer));
  window.addEventListener("pageshow", startNavigationWatch);
  window.addEventListener("popstate", announceNavigation);
  window.addEventListener("hashchange", announceNavigation);
  document.addEventListener("visibilitychange", announceNavigation);
  window.addEventListener("resize", scheduleSurfaceColors, { passive: true });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", scheduleSurfaceColors);
  let lastBrowserScrollTop = 0;
  window.addEventListener("scroll", () => {
    if (!slotId) return;
    const top = root().scrollTop;
    window.parent.postMessage({ type: "MDV_BROWSER_SCROLL", slotId, scrollTop: top, deltaTop: top - lastBrowserScrollTop }, "*");
    lastBrowserScrollTop = top;
    scheduleSurfaceColors();
  }, { passive: true });
  new MutationObserver(scheduleSurfaceColors).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "style", "content", "media"],
    childList: true,
    subtree: true,
  });

  function applyPreviewViewportStyle(hideScrollbars: boolean) {
    let style = document.getElementById("mdv-preview-viewport-style") as HTMLStyleElement | null;
    if (!hideScrollbars) {
      style?.remove();
      return;
    }
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
    for (const attribute of ["data-testid", "data-test", "data-cy", "name", "aria-label"]) {
      const value = el.getAttribute(attribute)?.trim();
      if (!value) continue;
      const selector = `[${attribute}=${JSON.stringify(value)}]`;
      try {
        if (document.querySelectorAll(selector).length === 1) return selector;
      } catch {
        // Fall through to the structural selector for unusual attribute values.
      }
    }
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

  function keyboardFields() {
    return Array.from(document.querySelectorAll<HTMLElement>("input, textarea, [contenteditable]"))
      .filter(candidate => resolveEditable(candidate) && (candidate.tabIndex >= 0 || (candidate.isContentEditable && !candidate.hasAttribute("tabindex"))) && candidate.getClientRects().length > 0 && getComputedStyle(candidate).visibility !== "hidden")
      .sort((a, b) => (a.tabIndex > 0 ? a.tabIndex : Infinity) - (b.tabIndex > 0 ? b.tabIndex : Infinity));
  }

  function postKeyboardFocus(editable: HTMLElement) {
    if (!slotId) return;
    if (editable.inputMode === "none" || (editable instanceof HTMLInputElement && ["date", "datetime-local", "month", "week", "time"].includes(editable.type))) { postKeyboardBlur(); return; }
    const input = editable instanceof HTMLInputElement ? editable : null;
    const fields = keyboardFields();
    const fieldIndex = fields.indexOf(editable);
    window.parent.postMessage({
      type: "MDV_KEYBOARD_FOCUS",
      slotId,
      selector: buildSelector(editable),
      canPrevious: fieldIndex > 0,
      canNext: fieldIndex >= 0 && fieldIndex < fields.length - 1,
      inputType: input?.type ?? (editable instanceof HTMLTextAreaElement ? "textarea" : "text"),
      inputMode: editable.inputMode || "",
      multiline: editable instanceof HTMLTextAreaElement || editable.isContentEditable,
      autoCapitalize: editable.getAttribute("autocapitalize") || "",
      enterKeyHint: editable.enterKeyHint || "",
      language: editable.closest("[lang]")?.getAttribute("lang") || document.documentElement.lang || navigator.language,
    }, "*");
  }

  function postKeyboardBlur() {
    if (!slotId) return;
    window.parent.postMessage({ type: "MDV_KEYBOARD_BLUR", slotId }, "*");
  }

  function scrollParentFor(target: HTMLElement): HTMLElement {
    let current = target.parentElement;
    while (current && current !== document.body && current !== document.documentElement) {
      const style = getComputedStyle(current);
      if (/(auto|scroll|overlay)/.test(style.overflowY) && current.scrollHeight > current.clientHeight) return current;
      current = current.parentElement;
    }
    return root() as HTMLElement;
  }

  function keepFocusedEditableVisible() {
    const target = resolveEditable(document.activeElement) ?? activeEditable;
    if (!target || !keyboardViewport || !document.contains(target)) return;
    const { platform, occludedBottom } = keyboardViewport;
    window.requestAnimationFrame(() => {
      const rect = target.getBoundingClientRect();
      const delta = getKeyboardScrollDelta({
        rect,
        viewportHeight: window.innerHeight,
        occludedBottom,
        platform,
      });
      if (Math.abs(delta) < 1) return;
      const scroller = scrollParentFor(target);
      const behavior: ScrollBehavior = platform === "ios" ? "smooth" : "auto";
      if (scroller === root()) window.scrollBy({ top: delta, behavior });
      else scroller.scrollBy({ top: delta, behavior });
    });
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
    if (document.activeElement !== target) {
      target.focus({ preventScroll: true });
      activeEditable = target;
    }
    if (action === "previous" || action === "next") {
      const fields = keyboardFields();
      const index = fields.indexOf(target);
      if (index >= 0) fields[index + (action === "next" ? 1 : -1)]?.focus();
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
      const enterKeyHint = typeof payload.enterKeyHint === "string" ? payload.enterKeyHint.toLowerCase() : "";
      if (enterKeyHint === "next" || enterKeyHint === "previous") {
        const fields = keyboardFields();
        const index = fields.indexOf(target);
        if (index >= 0) fields[index + (enterKeyHint === "next" ? 1 : -1)]?.focus();
        return;
      }
      if (enterKeyHint === "done") {
        target.blur();
        activeEditable = null;
        postKeyboardBlur();
        return;
      }
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

  function isUsableInteractionTarget(element: Element): boolean {
    const style = window.getComputedStyle(element);
    const bounds = element.getBoundingClientRect();
    if (style.display === "none" || style.visibility === "hidden" || bounds.width < 1 || bounds.height < 1) return false;
    return !(element instanceof HTMLButtonElement || element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement)
      || !element.disabled;
  }

  function normalizedText(element: Element): string {
    return element.textContent?.trim().replace(/\s+/g, " ").slice(0, 120) ?? "";
  }

  function resolveInteractionTarget(payload: Record<string, unknown>): Element | null {
    const selector = typeof payload.selector === "string" ? payload.selector : "";
    if (selector) {
      try {
        const match = document.querySelector(selector);
        if (match && isUsableInteractionTarget(match)) return match;
      } catch {
        // A stale selector can still be recovered from accessible metadata.
      }
    }
    const candidates = Array.from(document.querySelectorAll<HTMLElement>(
      'input, textarea, select, button, a, label, [contenteditable="true"], [role="button"], [role="checkbox"], [role="switch"]',
    )).filter(isUsableInteractionTarget);
    const ariaLabel = typeof payload.ariaLabel === "string" ? payload.ariaLabel : "";
    const name = typeof payload.name === "string" ? payload.name : "";
    const text = typeof payload.text === "string" ? payload.text : "";
    const tagName = typeof payload.tagName === "string" ? payload.tagName.toLowerCase() : "";
    const role = typeof payload.role === "string" ? payload.role : "";
    return candidates.find((candidate) => ariaLabel && candidate.getAttribute("aria-label") === ariaLabel)
      ?? candidates.find((candidate) => name && candidate.getAttribute("name") === name)
      ?? candidates.find((candidate) => text && normalizedText(candidate) === text && (!tagName || candidate.tagName.toLowerCase() === tagName))
      ?? candidates.find((candidate) => text && normalizedText(candidate) === text && (!role || candidate.getAttribute("role") === role))
      ?? candidates.find((candidate) => text && normalizedText(candidate).includes(text))
      ?? null;
  }

  function resolveInteractionSource(target: EventTarget | null): Element | null {
    if (!(target instanceof Element)) return null;
    const interactive = target.closest(
      'input, textarea, select, button, a, label, [contenteditable="true"], [role="button"], [role="checkbox"], [role="switch"]',
    );
    return interactive ?? target;
  }

  function postInteraction(kind: string, payload: Record<string, unknown>) {
    if (!slotId || (!scrollSyncEnabled && !flowRecordingEnabled)) return;
    window.parent.postMessage({
      type: "MDV_INTERACTION_EVENT",
      slotId,
      kind,
      url: window.location.href,
      ...payload,
    }, "*");
  }

  function targetMetadata(target: Element) {
    return {
      tagName: target.tagName.toLowerCase(),
      role: target.getAttribute("role") || undefined,
      ariaLabel: target.getAttribute("aria-label") || undefined,
      name: target.getAttribute("name") || undefined,
      text: target.textContent?.trim().replace(/\s+/g, " ").slice(0, 120) || undefined,
    };
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

  function applyRemoteInteraction(payload: Record<string, unknown>, force = false) {
    if ((!scrollSyncEnabled && !force) || applyingRemoteInteraction) return;
    applyingRemoteInteraction = true;
    try {
      const target = resolveInteractionTarget(payload);
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
        const allowed = target.dispatchEvent(new KeyboardEvent("keydown", init));
        target.dispatchEvent(new KeyboardEvent("keyup", init));
        if (allowed && key === "Enter" && target instanceof HTMLInputElement) {
          target.form?.requestSubmit();
        }
      }
    } finally {
      applyingRemoteInteraction = false;
    }
  }

  async function waitForInteractionTarget(payload: Record<string, unknown>, timeoutMs = 8000): Promise<Element | null> {
    const startedAt = Date.now();
    let target = resolveInteractionTarget(payload);
    while (!target && Date.now() - startedAt < timeoutMs) {
      await new Promise((resolve) => window.setTimeout(resolve, 100));
      target = resolveInteractionTarget(payload);
    }
    return target;
  }

  const challengeSelector = [
    'iframe[src*="challenges.cloudflare.com"]',
    'iframe[title*="challenge" i]',
    '[class*="cf-challenge" i]',
    '[id*="cf-challenge" i]',
    '[role="dialog"] iframe[src*="recaptcha"]',
    '[role="dialog"] iframe[src*="hcaptcha"]',
  ].join(",");

  function verificationChallengeVisible() {
    const challengeElementFound = [...document.querySelectorAll<HTMLElement>(challengeSelector)]
      .some((element) => {
        const style = window.getComputedStyle(element);
        const bounds = element.getBoundingClientRect();
        return style.display !== "none"
          && style.visibility !== "hidden"
          && bounds.width >= 24
          && bounds.height >= 24;
      });
    return hasVerificationChallenge({
      title: document.title,
      bodyText: document.body?.innerText.slice(0, 12_000) ?? "",
      challengeElementFound,
    });
  }

  function pauseFlowForVerification(runId: string, nextStep: number) {
    window.parent.postMessage({
      type: "MDV_FLOW_REPLAY_RESULT",
      slotId,
      runId,
      status: "paused",
      reason: "verification-required",
      nextStep,
      url: window.location.href,
    }, "*");
  }

  window.addEventListener("pagehide", () => {
    if (!slotId || !pagehideContinuation) return;
    window.parent.postMessage({
      type: "MDV_FLOW_REPLAY_CONTINUE",
      slotId,
      runId: pagehideContinuation.runId,
      nextStep: pagehideContinuation.nextStep,
    }, "*");
  });

  async function replayFlow(data: Record<string, unknown>) {
    if (!slotId || typeof data.runId !== "string" || !Array.isArray(data.steps)) return;
    const runId = data.runId;
    const startIndex = Math.max(0, Number(data.startIndex ?? 0));
    for (let index = startIndex; index < data.steps.length; index += 1) {
      if (verificationChallengeVisible()) {
        pauseFlowForVerification(runId, index);
        return;
      }
      const step = data.steps[index];
      if (!step || typeof step !== "object") continue;
      const payload = step as Record<string, unknown>;
      if (payload.kind === "scroll") {
        const targetSelector = typeof payload.scrollTargetSelector === "string" ? payload.scrollTargetSelector : "";
        const target = targetSelector ? await waitForInteractionTarget({ selector: targetSelector }) : root();
        if (!target) {
          if (verificationChallengeVisible()) {
            pauseFlowForVerification(runId, index);
            return;
          }
          window.parent.postMessage({ type: "MDV_FLOW_REPLAY_RESULT", slotId, runId, status: "failed", failedStep: index, error: "Scroll target was not found" }, "*");
          return;
        }
        target.scrollTo({ left: Number(payload.scrollLeft ?? 0), top: Number(payload.scrollTop ?? 0), behavior: "auto" });
      } else {
        const target = await waitForInteractionTarget(payload);
        if (!target) {
          if (verificationChallengeVisible()) {
            pauseFlowForVerification(runId, index);
            return;
          }
          window.parent.postMessage({ type: "MDV_FLOW_REPLAY_RESULT", slotId, runId, status: "failed", failedStep: index, error: "Target was not found" }, "*");
          return;
        }
        if (payload.kind === "click" || (payload.kind === "keydown" && payload.key === "Enter")) {
          pagehideContinuation = { runId, nextStep: index + 1 };
        }
        applyRemoteInteraction({ ...payload, selector: buildSelector(target) }, true);
      }
      await new Promise((resolve) => window.setTimeout(resolve, 300));
      pagehideContinuation = undefined;
      if (verificationChallengeVisible()) {
        pauseFlowForVerification(runId, index + 1);
        return;
      }
    }
    window.parent.postMessage({ type: "MDV_FLOW_REPLAY_RESULT", slotId, runId, status: "passed" }, "*");
  }

  function emitScrollSync(target = root(), snapshot = false, targetSlotId?: string) {
    const payload = scrollPayload(target, snapshot);
    rememberScroll(target);
    // The parent owns the toggle. Reporting movement even while disabled
    // avoids losing the first scroll before its enable message reaches us.
    if (!slotId) return;
    if (!snapshot && payload.deltaLeft === 0 && payload.deltaTop === 0) return;
    const previousIntent = remotePositions.get(target);
    if (previousIntent && !snapshot) {
      // A follower becoming the source must keep its fractional remainder.
      // Dropping it on each takeover accumulates raster rounding
      // differences even though all previews receive the same CSS delta.
      const maxLeft = Math.max(0, target.scrollWidth - target.clientWidth);
      const rtl = getComputedStyle(target).direction === "rtl";
      remotePositions.set(target, {
        left: Math.max(rtl ? -maxLeft : 0, Math.min(rtl ? 0 : maxLeft, previousIntent.left + payload.deltaLeft)),
        top: Math.max(0, Math.min(Math.max(0, target.scrollHeight - target.clientHeight), previousIntent.top + payload.deltaTop)),
        actualLeft: target.scrollLeft,
        actualTop: target.scrollTop,
      });
    } else {
      remotePositions.delete(target);
    }
    window.parent.postMessage({
      type: "MDV_SCROLL_SYNC_EVENT",
      slotId,
      url: window.location.href,
      targetSlotId,
      ...payload,
    }, "*");
  }

  window.addEventListener("click", (e) => {
    if ((!scrollSyncEnabled && !flowRecordingEnabled) || !slotId || !e.isTrusted) return;
    const source = resolveInteractionSource(e.target);
    if (!source) return;
    postInteraction("click", {
      selector: buildSelector(source),
      ...targetMetadata(source),
      button: e.button,
      buttons: e.buttons,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
      shiftKey: e.shiftKey,
      metaKey: e.metaKey,
    });
  }, { capture: true, passive: true });

  window.addEventListener("input", (e) => {
    if ((!scrollSyncEnabled && !flowRecordingEnabled) || !slotId || !e.isTrusted || applyingRemoteInteraction) return;
    const target = resolveInteractionSource(e.target);
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || (target instanceof HTMLElement && target.isContentEditable))) return;
    postInteraction("input", {
      selector: buildSelector(target),
      ...targetMetadata(target),
      value: target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement ? target.value : target.textContent ?? "",
      checked: target instanceof HTMLInputElement ? target.checked : undefined,
      inputType: e instanceof InputEvent ? e.inputType : undefined,
    });
  }, { capture: true, passive: true });

  window.addEventListener("change", (e) => {
    if ((!scrollSyncEnabled && !flowRecordingEnabled) || !slotId || !e.isTrusted || applyingRemoteInteraction) return;
    const target = resolveInteractionSource(e.target);
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return;
    postInteraction("change", {
      selector: buildSelector(target),
      ...targetMetadata(target),
      value: target.value,
      checked: target instanceof HTMLInputElement ? target.checked : undefined,
    });
  }, { capture: true, passive: true });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && e.isTrusted) {
      if (activeEditable) { activeEditable.blur(); activeEditable = null; postKeyboardBlur(); }
      window.parent.postMessage({ type: "MDV_PREVIEW_ESCAPE" }, "*");
    }
    if ((!scrollSyncEnabled && !flowRecordingEnabled) || !slotId || !e.isTrusted || applyingRemoteInteraction) return;
    const target = resolveInteractionSource(e.target);
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || (target instanceof HTMLElement && target.isContentEditable))) return;
    if (e.key.length !== 1 && !["Enter", "Backspace", "Delete", "Tab"].includes(e.key)) return;
    postInteraction("keydown", {
      selector: buildSelector(target),
      ...targetMetadata(target),
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
    keepFocusedEditableVisible();
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
      if (shouldKeepKeyboardSessionOnBlur({
        documentHasFocus: document.hasFocus(),
        activeEditableConnected: Boolean(activeEditable && document.contains(activeEditable)),
      })) return;
      activeEditable = null;
      postKeyboardBlur();
    }, 0);
  }, true);

  window.addEventListener("message", (event) => {
    if (event.source !== window.parent) return;
    const data = event.data;
    if (!data || typeof data !== "object") return;

    if (data.type === "MDV_PREVIEW_REGISTER" && typeof data.slotId === "string") {
      sampleRightSurface = data.sampleRightSurface === true;
      slotId = data.slotId;
      applyPreviewViewportStyle(Boolean(data.hideScrollbars));
      announceReady();
      const focused = resolveEditable(document.activeElement);
      if (focused) {
        activeEditable = focused;
        postKeyboardFocus(focused);
      }
      return;
    }

    if (data.type === "MDV_APPLY_SCROLL_SYNC" && data.slotId === slotId) {
      if (!scrollSyncEnabled || (data.url && data.url !== window.location.href)) return;
      const targetSelector = typeof data.scrollTargetSelector === "string" ? data.scrollTargetSelector : "";
      let el: Element | null = root();
      try { if (targetSelector) el = document.querySelector(targetSelector); } catch { return; }
      if (!el) return;
      const values = [data.deltaLeft, data.deltaTop, data.scrollLeft, data.scrollTop];
      if (values.some(value => value !== undefined && (typeof value !== "number" || !Number.isFinite(value)))) return;
      // Flush local movement first; remote movement must not swallow it.
      if (pendingScrollTargets.delete(el)) emitScrollSync(el);
      const deltaLeft = data.deltaLeft ?? 0, deltaTop = data.deltaTop ?? 0;
      const previous = remotePositions.get(el);
      const unchanged = previous && previous.actualLeft === el.scrollLeft && previous.actualTop === el.scrollTop;
      const movement = deltaLeft !== 0 || deltaTop !== 0;
      let left = movement ? (unchanged ? previous.left : el.scrollLeft) + deltaLeft : data.scrollLeft ?? el.scrollLeft;
      let top = movement ? (unchanged ? previous.top : el.scrollTop) + deltaTop : data.scrollTop ?? el.scrollTop;
      const maxLeft = Math.max(0, el.scrollWidth - el.clientWidth);
      const rtl = getComputedStyle(el).direction === "rtl";
      left = Math.max(rtl ? -maxLeft : 0, Math.min(rtl ? 0 : maxLeft, left));
      top = Math.max(0, Math.min(Math.max(0, el.scrollHeight - el.clientHeight), top));
      el.scrollTo({ left, top, behavior: "instant" });
      // Retain fractional remainders between remote moves so repeated deltas
      // do not accumulate rounding drift at scaled viewport boundaries.
      remotePositions.set(el, { left, top, actualLeft: el.scrollLeft, actualTop: el.scrollTop });
      // Record the actual clamped result, not the requested position. Its scroll
      // event then has zero delta, while an immediate user takeover still emits.
      rememberScroll(el);
      return;
    }

    if (data.type === "MDV_SCROLL_SYNC_ENABLE" && data.slotId === slotId) {
      if (scrollSyncEnabled) return;
      scrollSyncEnabled = true;
      // Disabled scroll events keep baselines current. Sampling again here
      // can swallow the user's first move while this message was in flight.
      return;
    }

    if (data.type === "MDV_SCROLL_SYNC_SNAPSHOT" && data.slotId === slotId) {
      window.requestAnimationFrame(() => {
        if (scrollSyncEnabled) emitScrollSync(root(), true, typeof data.targetSlotId === "string" ? data.targetSlotId : undefined);
      });
      return;
    }

    if (data.type === "MDV_SCROLL_SYNC_DISABLE" && data.slotId === slotId) {
      scrollSyncEnabled = false;
      return;
    }

    if (data.type === "MDV_APPLY_INTERACTION" && typeof data.slotId === "string" && data.slotId === slotId) {
      applyRemoteInteraction(data as Record<string, unknown>);
      return;
    }

    if (data.type === "MDV_FLOW_RECORDING_ENABLE" && typeof data.slotId === "string" && data.slotId === slotId) {
      flowRecordingEnabled = true;
      return;
    }

    if (data.type === "MDV_FLOW_RECORDING_DISABLE" && typeof data.slotId === "string" && data.slotId === slotId) {
      flowRecordingEnabled = false;
      return;
    }

    if (data.type === "MDV_REPLAY_FLOW" && typeof data.slotId === "string" && data.slotId === slotId) {
      void replayFlow(data as Record<string, unknown>);
      return;
    }

    if (data.type === "MDV_KEYBOARD_ACTION" && typeof data.slotId === "string" && data.slotId === slotId) {
      applyKeyboardAction(data as Record<string, unknown>);
      return;
    }

    if (data.type === "MDV_KEYBOARD_VIEWPORT" && typeof data.slotId === "string" && data.slotId === slotId) {
      keyboardViewport = {
        platform: data.platform === "ios" ? "ios" : "android",
        occludedBottom: Math.max(0, Number(data.occludedBottom ?? 0)),
      };
      keepFocusedEditableVisible();
      window.clearTimeout(keyboardVisibilityTimer);
      keyboardVisibilityTimer = window.setTimeout(keepFocusedEditableVisible, 220);
      return;
    }

    if (data.type === "MDV_KEYBOARD_VIEWPORT_RESET" && typeof data.slotId === "string" && data.slotId === slotId) {
      keyboardViewport = undefined;
      window.clearTimeout(keyboardVisibilityTimer);
      return;
    }

  });

  const postScroll = (event: Event) => {
    scheduleSurfaceColors();
    const target = event.target instanceof Element && event.target !== root()
      ? event.target : root();
    pendingScrollTargets.add(target);
    if (scrollRaf !== undefined) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = undefined;
      const targets = [...pendingScrollTargets];
      pendingScrollTargets.clear();
      for (const el of targets) if (el.isConnected) emitScrollSync(el);
    });
  };

  window.addEventListener("scroll", postScroll, { passive: true });
  document.addEventListener("scroll", postScroll, true);

}
