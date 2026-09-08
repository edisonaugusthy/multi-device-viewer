import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { AppProviders } from "../src/app/AppProviders";
import { SimulatorApp } from "../src/ui/components/SimulatorApp";
import { setViewerContext } from "../src/app/viewer-context";
import viewerCss from "../src/ui/styles/global.css?inline";
import { defineContentScript } from "wxt/utils/define-content-script";

import { setupPreviewBridge } from "../src/app/preview-bridge";

const OVERLAY_ID = "multi-device-viewer-overlay";

export default defineContentScript({
  matches: ["https://*/*", "http://*/*"],
  allFrames: true,
  runAt: "document_idle",
  main(ctx) {
    ctx.onInvalidated(() => closeOverlay?.());
    setupPreviewBridge();

    if (window.top === window) {
      notifyOverlayState(false);
      chrome.runtime.onMessage.addListener((message) => {
        if (message !== null && typeof message === "object") {
          if (message.type === "OPEN_SIMULATOR") {
            void toggleSimulator(
              typeof message.url === "string" ? message.url : undefined,
              typeof message.sourceTabId === "number" ? message.sourceTabId : undefined,
            ).catch(console.error);
          }
        }
      });
    }
  },
});


let closeOverlay: (() => void) | undefined;
let mounting = false;
async function toggleSimulator(targetUrl?: string, sourceTabId?: number) {
  if (closeOverlay) { closeOverlay(); return; }
  if (mounting) return;
  mounting = true;
  const pageUrl = targetUrl ?? window.location.href;
  try {
    const prepared = await chrome.runtime.sendMessage({ type: "MDV_PREVIEW_HOST", url: pageUrl });
    if (!prepared?.ok) throw new Error(prepared?.error ?? "Could not prepare preview.");
    const overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.style.cssText = "all:initial!important;position:fixed!important;inset:0!important;width:100%!important;height:100%!important;z-index:2147483647!important;display:block!important;isolation:isolate!important;";
    const shadow = overlay.attachShadow({ mode: __MDV_OPEN_SHADOW_QA__ ? "open" : "closed" });
    // Keep ordinary site listeners outside viewer form interactions.
    for (const type of ["keydown", "keyup", "keypress", "input", "change", "paste", "drop"]) shadow.addEventListener(type, event => event.stopPropagation());
    const sheet = new CSSStyleSheet();
    // rem normally follows the host website's root font size, even across a shadow root.
    const isolatedCss = viewerCss.replace(/([\d.]+)rem\b/g, (_, amount: string) => `${Number(amount) * 16}px`);
    // Browsers ignore @property registrations inside shadow stylesheets. Restore
    // Tailwind's non-inheriting defaults locally so borders, shadows and transforms
    // work without registering properties on the website's document.
    // https://developer.chrome.com/docs/css-ui/css-names#property
    const propertyDefaults = Array.from(isolatedCss.matchAll(/@property\s+(--tw-[\w-]+)\s*\{([^}]*)\}/g))
      .filter(([, , body]) => /\binherits\s*:\s*false\b/.test(body))
      .map(([, name, body]) => {
        const initialValue = body.match(/\binitial-value\s*:\s*([^;}]+)/)?.[1].trim() ?? "initial";
        // Registered lengths compute zero to 0px; an untyped zero would break
        // focus rings that use calc(2px + var(--tw-ring-offset-width)).
        const value = initialValue === "0" && /\bsyntax\s*:\s*["']<length(?:-percentage)?>["']/.test(body)
          ? "0px" : initialValue;
        return `${name}:${value};`;
      })
      .join("");
    sheet.replaceSync(isolatedCss
      + `\n@layer properties{*,::before,::after,::backdrop{${propertyDefaults}}}`
      + "\n#root{width:100%;height:100%;isolation:isolate;color-scheme:light;font:16px/1.5 Inter,system-ui,sans-serif} ");
    shadow.adoptedStyleSheets = [sheet];
    const container = document.createElement("div");
    container.id = "root";
    shadow.append(container);
    const overflow = document.documentElement.style.getPropertyValue("overflow");
    const overflowPriority = document.documentElement.style.getPropertyPriority("overflow");
    const root = createRoot(container);
    const removalObserver = new MutationObserver(() => { if (!overlay.isConnected) close(); });
    const close = () => {
      closeOverlay = undefined;
      removalObserver.disconnect();
      root.unmount();
      overlay.remove();
      setViewerContext(undefined);
      if (document.documentElement.style.getPropertyValue("overflow") === "hidden") {
        if (overflow) document.documentElement.style.setProperty("overflow", overflow, overflowPriority);
        else document.documentElement.style.removeProperty("overflow");
      }
      window.removeEventListener("pagehide", close);
      void chrome.runtime.sendMessage({ type: "MDV_PREVIEW_CLOSE" }).catch(() => undefined);
      notifyOverlayState(false);
    };
    closeOverlay = close;
    setViewerContext({ root: container, url: pageUrl, sourceTabId, close });
    (document.body ?? document.documentElement).appendChild(overlay);
    removalObserver.observe(document.body ?? document.documentElement, { childList: true });
    document.documentElement.style.setProperty("overflow", "hidden", "important");
    root.render(createElement(AppProviders, null, createElement(SimulatorApp)));
    window.addEventListener("pagehide", close, { once: true });
    notifyOverlayState(true);
  } finally { mounting = false; }
}

function notifyOverlayState(active: boolean) {
  void chrome.runtime.sendMessage({ type: "MDV_OVERLAY_STATE", active }).catch(() => undefined);
}
