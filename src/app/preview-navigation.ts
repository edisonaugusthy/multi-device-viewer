import { slotIdFromFrameName } from "./preview-frame";

/**
 * Inside a wrapped phone preview, a navigation the page starts itself (a
 * link, a form, a script) would start from the website's origin and get the
 * desktop identity. Links and GET forms are therefore handed to the wrapper,
 * which navigates the frame from the extension's origin instead; a page that
 * still arrived that way is fetched once more as a phone.
 */
export interface LinkLike { href: string; target: string; download: boolean }
export interface FormLike { action: string; method: string; target: string; entries: Array<[string, string]> }

const web = (value: string, base?: string) => {
  try {
    const url = new URL(value, base);
    return /^https?:$/.test(url.protocol) ? url : undefined;
  } catch { return undefined; }
};
const ownWindow = (target: string) => !target || target === "_self";

/** Where a plain click on the link goes, unless the browser would open it elsewhere or stay in the document. */
export function linkNavigation(link: LinkLike, current: string, modifier: boolean): string | undefined {
  if (modifier || link.download || !ownWindow(link.target)) return undefined;
  const url = web(link.href, current);
  if (!url) return undefined;
  const here = web(current);
  if (url.hash && here && url.href.split("#")[0] === here.href.split("#")[0]) return undefined;
  return url.href;
}

/** Where a GET form submits, with its fields in the query; other methods stay with the page. */
export function formNavigation(form: FormLike, current: string): string | undefined {
  if (form.method.toLowerCase() !== "get" || !ownWindow(form.target)) return undefined;
  const url = web(form.action, current);
  if (!url) return undefined;
  url.search = new URLSearchParams(form.entries).toString();
  url.hash = "";
  return url.href;
}

/**
 * A wrapped page whose navigation named a referrer was navigated by the page
 * before it (the wrapper's own navigations carry none), unless it was a reload
 * or history travel, which keep the identity they loaded with.
 */
export function arrivedByItself(referrer: string, navigationType: string | undefined): boolean {
  return referrer !== "" && (navigationType === undefined || navigationType === "navigate");
}

export function setupWrappedNavigation(): void {
  const slotId = slotIdFromFrameName(window.name);
  if (!slotId || window.parent === window || window.parent === window.top) return;
  const navigate = (url: string, replace: boolean) => window.parent.postMessage({ type: "MDV_PREVIEW_NAVIGATE", slotId, url, replace }, "*");
  const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (arrivedByItself(document.referrer, entry?.type)) {
    navigate(location.href, true);
    return;
  }
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    const anchor = (event.target as Element | null)?.closest?.("a[href]");
    if (!(anchor instanceof HTMLAnchorElement)) return;
    const url = linkNavigation(
      { href: anchor.getAttribute("href") ?? "", target: anchor.target, download: anchor.hasAttribute("download") },
      location.href, event.metaKey || event.ctrlKey || event.shiftKey || event.altKey,
    );
    if (!url) return;
    event.preventDefault();
    navigate(url, false);
  });
  document.addEventListener("submit", (event) => {
    if (event.defaultPrevented || !(event.target instanceof HTMLFormElement)) return;
    const form = event.target;
    const submitter = event.submitter;
    const entries: Array<[string, string]> = [];
    for (const [key, value] of new FormData(form, submitter)) entries.push([key, typeof value === "string" ? value : value.name]);
    const url = formNavigation({
      action: submitter?.getAttribute("formaction") ?? form.getAttribute("action") ?? "",
      method: submitter?.getAttribute("formmethod") ?? form.getAttribute("method") ?? "get",
      target: submitter?.getAttribute("formtarget") ?? form.getAttribute("target") ?? "",
      entries,
    }, location.href);
    if (!url) return;
    event.preventDefault();
    navigate(url, false);
  });
}
