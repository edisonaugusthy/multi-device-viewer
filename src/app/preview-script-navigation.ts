import { previewRequestName, untagPreviewRequest } from "../domain/simulator/preview-request";

// Navigation's newer event types are not in this project's TypeScript DOM lib.
interface PreviewNavigateEvent extends Event {
  destination: { url: string; sameDocument: boolean };
  navigationType: string;
  hashChange: boolean;
  formData: FormData | null;
  downloadRequest: string | null;
  sourceElement?: Element | null;
}
interface PreviewNavigation extends EventTarget {
  navigate(url: string, options?: unknown): unknown;
  onnavigate: ((event: Event) => unknown) | null;
}

/** Location is unforgeable. Observe its native navigation event instead, before
 * any request starts. Never replay a response, POST, reload or history traversal.
 */
export function setupPreviewScriptNavigation(name: string, tag: (url: string) => string): () => boolean {
  const api = (window as unknown as { navigation?: PreviewNavigation }).navigation;
  const globals = window as unknown as { NavigateEvent?: { prototype: { intercept: (...args: unknown[]) => unknown } }; NavigationDestination?: { prototype: object } };
  if (!api || !globals.NavigateEvent || !globals.NavigationDestination) return () => false;
  const destinationDescriptor = Object.getOwnPropertyDescriptor(globals.NavigationDestination.prototype, "url");
  if (!destinationDescriptor?.get || !destinationDescriptor.configurable) return () => false;
  const destinationUrl = destinationDescriptor.get;
  Object.defineProperty(globals.NavigationDestination.prototype, "url", {
    ...destinationDescriptor,
    get() { return untagPreviewRequest(destinationUrl.call(this)); },
  });

  const intercepted = new WeakSet<object>();
  const prototype = globals.NavigateEvent.prototype;
  const nativeIntercept = prototype.intercept;
  const intercept = function(this: object, ...args: unknown[]) {
    const result = Reflect.apply(nativeIntercept, this, args);
    intercepted.add(this);
    return result;
  };
  prototype.intercept = intercept;
  const nativeAdd = api.addEventListener;
  const nativeRemove = api.removeEventListener;
  const nativeNavigate = api.navigate;
  const assign = location.assign.bind(location);
  const replace = location.replace.bind(location);
  let apiNavigation = 0;
  let generation = 0;
  const onNavigate = (event: Event) => {
    const current = ++generation;
    const e = event as PreviewNavigateEvent;
    // If the page replaces these hooks, leave navigation native rather than
    // risk getting ahead of a router we can no longer reliably observe.
    if (!active() || apiNavigation || !e.cancelable || e.defaultPrevented || intercepted.has(e) || e.destination.sameDocument || e.hashChange
      || e.formData !== null || e.sourceElement || e.downloadRequest !== null || !["push", "replace"].includes(e.navigationType)) return;
    const url = destinationUrl.call(e.destination) as string;
    if (previewRequestName(url) === name) return;
    const tagged = tag(url);
    if (tagged === url) return;
    // A directive on a navigation to the current URL would turn a full reload
    // into a fragment-only navigation. Keep that uncommon case native.
    if (url.split("#")[0] === location.href.split("#")[0]) return;
    e.preventDefault();
    queueMicrotask(() => {
      // Only the last script navigation in a task should win.
      if (current !== generation) return;
      (e.navigationType === "replace" ? replace : assign)(tagged);
    });
  };
  const listenLast = () => { nativeRemove.call(api, "navigate", onNavigate); nativeAdd.call(api, "navigate", onNavigate); };
  // Let the site's routers cancel/intercept first, including listeners added
  // after document_start. Interception is recorded separately from cancellation.
  const addListener = function(this: EventTarget, ...args: Parameters<EventTarget["addEventListener"]>) {
    const result = Reflect.apply(nativeAdd, this, args);
    if (this === api && args[0] === "navigate") listenLast();
    return result;
  };
  api.addEventListener = addListener;
  const onDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(api), "onnavigate");
  if (onDescriptor?.get && onDescriptor.set) {
    Object.defineProperty(api, "onnavigate", {
      configurable: true,
      get() { return onDescriptor.get!.call(this); },
      set(value) { onDescriptor.set!.call(this, value); listenLast(); },
    });
  }
  // Tag Navigation API calls up front, so their native promises, state, info and
  // history behavior survive. They must not enter the Location cancellation path.
  const navigate = function(this: PreviewNavigation, url: string, options?: unknown) {
    const value = String(url);
    const tagged = tag(value);
    let samePath = false;
    try { samePath = new URL(tagged, document.baseURI).href.split("#")[0] === location.href.split("#")[0]; }
    catch { return nativeNavigate.call(this, value, options); }
    apiNavigation++;
    try { return nativeNavigate.call(this, samePath ? value : tagged, options); }
    finally { apiNavigation--; }
  };
  api.navigate = navigate;
  const active = () => api.navigate === navigate && api.addEventListener === addListener && prototype.intercept === intercept;
  listenLast();
  return active;
}
