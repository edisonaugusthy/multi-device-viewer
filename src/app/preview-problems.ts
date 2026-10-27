import { consoleProblem, errorProblem, requestProblem, type PreviewProblem } from "../domain/simulator/preview-diagnostics";
import { untagPreviewRequest } from "../domain/simulator/preview-request";

/**
 * Records what goes wrong inside a preview, from within its page: thrown
 * errors and unhandled rejections, console errors and warnings, and requests
 * that fail, whether fetch, XHR or a file the page loads. Runs in MAIN at
 * document_start, before the site's scripts, and tells the viewer; the page's
 * own behaviour is unchanged.
 */
type Problem = Omit<PreviewProblem, "count" | "firstAt">;
const MAX_MESSAGES = 300;
const RESPONSE_PREVIEW = 300;
const TEXT_RESPONSE = /json|text|xml|javascript/;

export function setupPreviewProblems(slotId: string | undefined) {
  if (!slotId) return;
  const documentId = crypto.randomUUID();
  let sent = 0;
  const post = (message: Record<string, unknown>) => { try { window.parent.postMessage({ slotId, documentId, ...message }, "*"); } catch { /* the viewer is gone */ } };
  const report = (problem: Problem) => { if (sent++ < MAX_MESSAGES) post({ type: "MDV_PAGE_PROBLEM", problem }); };
  // A new page starts its list again.
  post({ type: "MDV_PAGE_PROBLEMS_START" });
  const page = () => location.href;
  const show = (url: string) => untagPreviewRequest(new URL(url, document.baseURI).href);

  window.addEventListener("error", event => {
    if (event instanceof ErrorEvent) {
      report(errorProblem(event.error instanceof Error ? `${event.error.name}: ${event.error.message}` : event.message, event.filename, event.lineno, event.error instanceof Error ? event.error.stack : undefined));
      return;
    }
    // A file the page asked for that did not load: an image, script, stylesheet or media.
    const target = (event as Event).target as (Element & { src?: string; href?: string; currentSrc?: string }) | null;
    const url = target && (target.currentSrc || target.src || target.href);
    if (url && /^https?:/.test(url)) report(requestProblem("GET", show(url), page(), { errorText: "Failed to load" }));
  }, true);
  window.addEventListener("unhandledrejection", event => {
    const reason = event.reason;
    report(errorProblem(reason instanceof Error ? `Uncaught (in promise) ${reason.name}: ${reason.message}` : `Uncaught (in promise) ${String(reason)}`, undefined, undefined, reason instanceof Error ? reason.stack : undefined));
  });

  for (const [method, level] of [["error", "error"], ["warn", "warning"]] as const) {
    const native = console[method];
    console[method] = function(...args: unknown[]) {
      try { report(consoleProblem(level, args, new Error().stack)); } catch { /* never break logging */ }
      return native.apply(this, args);
    };
  }

  const responseText = async (response: Response) => {
    if (!TEXT_RESPONSE.test(response.headers.get("content-type") ?? "")) return undefined;
    try { return (await response.clone().text()).slice(0, RESPONSE_PREVIEW); } catch { return undefined; }
  };
  const nativeFetch = window.fetch;
  window.fetch = function(this: Window, input: RequestInfo | URL, init?: RequestInit) {
    const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    const url = input instanceof Request ? input.url : String(input);
    const result = Reflect.apply(nativeFetch, this, [input, init]) as Promise<Response>;
    result.then(async response => {
      if (response.status >= 400) report(requestProblem(method, show(url), page(), { status: response.status, statusText: response.statusText, response: await responseText(response) }));
    }, (error: unknown) => {
      if (!(error instanceof DOMException && error.name === "AbortError")) report(requestProblem(method, show(url), page(), { errorText: "Failed to fetch" }));
    });
    return result;
  };

  const requests = new WeakMap<XMLHttpRequest, { method: string; url: string }>();
  const nativeOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(this: XMLHttpRequest, ...args: Parameters<XMLHttpRequest["open"]>) {
    requests.set(this, { method: String(args[0]).toUpperCase(), url: String(args[1]) });
    return Reflect.apply(nativeOpen, this, args);
  } as XMLHttpRequest["open"];
  const nativeSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function(this: XMLHttpRequest, ...args: Parameters<XMLHttpRequest["send"]>) {
    let aborted = false;
    this.addEventListener("abort", () => { aborted = true; }, { once: true });
    this.addEventListener("loadend", () => {
      const request = requests.get(this);
      if (!request || aborted) return;
      if (this.status >= 400) {
        const text = (this.responseType === "" || this.responseType === "text") && TEXT_RESPONSE.test(this.getResponseHeader("content-type") ?? "") ? this.responseText.slice(0, RESPONSE_PREVIEW) : undefined;
        report(requestProblem(request.method, show(request.url), page(), { status: this.status, statusText: this.statusText, response: text }));
      } else if (this.status === 0 && this.readyState === XMLHttpRequest.DONE) {
        report(requestProblem(request.method, show(request.url), page(), { errorText: "Failed" }));
      }
    }, { once: true });
    return Reflect.apply(nativeSend, this, args);
  } as XMLHttpRequest["send"];
}
