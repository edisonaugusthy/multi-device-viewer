import { PREVIEW_FRAME_NAME, previewRequestIdentity, previewRequestName, tagPreviewRequest } from "../domain/simulator/preview-request";
import { identityFromToken } from "../domain/simulator/preview-identity";
import { installPreviewIdentity, scriptIdentity, type Brand } from "../domain/simulator/preview-emulation";
import { setupPreviewProblems } from "./preview-problems";
import { setupPreviewRequestConstructor } from "./preview-request-constructor";
import { setupPreviewScriptNavigation } from "./preview-script-navigation";
import { slotIdFromFrameName } from "./preview-frame";

/** Runs in MAIN at document_start, before the site's scripts capture fetch/XHR.
 * The device's identity for the page's scripts arrives in the document URL's
 * hidden marker, so even the first script sees it. No cookie copying, request
 * proxying, or request replay.
 */
export function setupPreviewHeaders(): void {
  if (window === window.top || !("fragmentDirective" in document)) return;
  const navigation = () => performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  const name = previewRequestName(navigation()?.name ?? "") ?? window.name;
  if (!PREVIEW_FRAME_NAME.test(name)) return;
  const slotId = slotIdFromFrameName(name);
  const token = previewRequestIdentity(navigation()?.name ?? "");
  const identity = token ? identityFromToken(token) : undefined;
  if (identity) installPreviewIdentity({ [name]: scriptIdentity(identity, browserBrands()) });
  setupPreviewProblems(slotId);
  // API requests need only the device's headers; documents also carry its identity for their scripts.
  const tag = (url: string) => tagPreviewRequest(url, name, document.baseURI);
  let documentToken = identity ? token : undefined;
  const tagDocument = (url: string) => tagPreviewRequest(url, name, document.baseURI, documentToken);
  // A document that lost the marker (a redirect replaced its URL's hash) asks the
  // viewer for the device again, so the pages it opens next carry it.
  if (!documentToken && slotId) {
    window.addEventListener("message", event => {
      const data = event.data;
      if (event.source === window.parent && data?.type === "MDV_IDENTITY_TOKEN" && data.slotId === slotId && typeof data.token === "string" && identityFromToken(data.token)) documentToken = data.token;
    });
    window.parent.postMessage({ type: "MDV_IDENTITY_TOKEN_REQUEST", slotId }, "*");
  }
  const nativeFetch = window.fetch;
  const nativeOpen = XMLHttpRequest.prototype.open;
  const nativeSubmit = HTMLFormElement.prototype.submit;
  let requestBodyPassthrough = false;
  const requestConstructor = setupPreviewRequestConstructor(name, tag);
  const scriptNavigation = setupPreviewScriptNavigation(name, tagDocument);

  const fetchWithHeaders: typeof fetch = function(this: Window, input, init) {
    try {
      let url: string | undefined;
      if (typeof input === "object") {
        url = requestConstructor.rawUrl(input);
      }
      if (url !== undefined) {
        if (previewRequestName(url) === name) return nativeFetch.call(this, input, init);
        const request = input as Request;
        // Retargeting a foreign Request body turns its buffered body into a streaming
        // upload in Chrome (which can fail on HTTP/1). Preserve native behavior
        // rather than buffering arbitrary uploads or retrying a mutation.
        if (requestConstructor.hasBody(request)) {
          if (!requestBodyPassthrough) { requestBodyPassthrough = true; report(); }
          return nativeFetch.call(this, input, init);
        }
        return nativeFetch.call(this, new Request(tag(url), request), init);
      }
      // String/URL + init preserves POST bodies, credentials, signals and streams.
      return nativeFetch.call(this, tag(String(input)), init);
    } catch (error) { return Promise.reject(error); }
  };
  const openWithHeaders = function(this: XMLHttpRequest, ...args: Parameters<XMLHttpRequest["open"]>) {
    args[1] = tag(String(args[1]));
    return Reflect.apply(nativeOpen, this, args);
  } as XMLHttpRequest["open"];
  window.fetch = fetchWithHeaders;
  XMLHttpRequest.prototype.open = openWithHeaders;

  const ownTarget = (target: string) => !target || target === "_self" || target === name;
  const tagForm = (form: HTMLFormElement, submitter?: HTMLElement | null) => {
    const target = submitter?.getAttribute("formtarget") ?? form.getAttribute("target") ?? document.querySelector("base[target]")?.getAttribute("target") ?? "";
    const method = submitter?.getAttribute("formmethod") ?? form.getAttribute("method") ?? "get";
    if (!ownTarget(target) || method.toLowerCase() === "dialog") return;
    if (submitter?.hasAttribute("formaction")) submitter.setAttribute("formaction", tagDocument(submitter.getAttribute("formaction") || location.href));
    else form.setAttribute("action", tagDocument(form.getAttribute("action") || location.href));
  };
  // Leave native form submission in charge of encoding, validation, submitter
  // fields, POST bodies, and history. In particular, never repeat a POST as GET.
  HTMLFormElement.prototype.submit = function() { tagForm(this); return nativeSubmit.call(this); };
  window.addEventListener("submit", event => {
    if (!event.defaultPrevented && event.target instanceof HTMLFormElement) tagForm(event.target, event.submitter);
  });
  window.addEventListener("click", event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.composedPath().find(node => node instanceof HTMLAnchorElement) as HTMLAnchorElement | undefined;
    if (!anchor?.hasAttribute("href") || anchor.hasAttribute("download") || !ownTarget(anchor.target || document.querySelector("base[target]")?.getAttribute("target") || "")) return;
    const url = new URL(anchor.href, document.baseURI);
    // Same-document links and SPA routers retain their native behavior. Adding
    // a fragment to a link to this very URL could turn a reload into a no-op.
    if (url.href.split("#")[0] === location.href.split("#")[0]) return;
    anchor.href = tagDocument(anchor.href);
  });

  const report = () => {
    const entry = navigation();
    window.parent.postMessage({ type: "MDV_HEADER_COVERAGE", slotId,
      document: !entry?.redirectCount && previewRequestName(entry?.name ?? "") === name,
      api: window.fetch === fetchWithHeaders && XMLHttpRequest.prototype.open === openWithHeaders && requestConstructor.active(),
      scriptNavigation: scriptNavigation(),
      requestBodyPassthrough,
    }, "*");
  };
  // Chrome also hides directives on History API writes. Keep the transport
  // marker for future native reloads without changing the SPA's visible route.
  for (const method of ["pushState", "replaceState"] as const) {
    const original = history[method];
    history[method] = function(...args: Parameters<History[typeof method]>) {
      if (args[2] != null) {
        const url = String(args[2]);
        args[2] = url === "" ? url : tagDocument(url);
      }
      return Reflect.apply(original, this, args);
    };
  }
  window.addEventListener("message", event => {
    if (event.source === window.parent && event.data?.type === "MDV_GET_HEADER_COVERAGE" && event.data.slotId === slotId) report();
  });
  window.addEventListener("pageshow", report);
  document.addEventListener("DOMContentLoaded", report, { once: true });
}

/** This Chrome's own brands, read before the device's identity replaces them. */
function browserBrands() {
  const data = (navigator as Navigator & { userAgentData?: { brands: Brand[] } }).userAgentData;
  const brands = (data?.brands ?? []).map(({ brand, version }) => ({ brand, version }));
  const full = /Chrome\/([\d.]+)/.exec(navigator.userAgent)?.[1] ?? "";
  return { brands, uaFullVersion: full, fullVersionList: brands.map(({ brand, version }) => ({ brand, version: /^\d+$/.test(version) && full.startsWith(`${version}.`) ? full : version })) };
}
