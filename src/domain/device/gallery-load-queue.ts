export type GalleryLoadStatus = "queued" | "loading" | "loaded" | "error" | "incomplete" | "slow";
export type GalleryLoadResult = "loaded" | "error" | "incomplete";
export const FAST_GALLERY_CONCURRENCY = 6;
// Local dev servers answer over HTTP/1.1, where Chrome allows six connections
// per host, and serve each module as its own request. Fewer pages at once
// means the ones in view finish sooner.
export const LOCAL_GALLERY_CONCURRENCY = 3;

export function isLocalDevelopmentUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname;
    return host === "localhost" || host === "[::1]" || host === "0.0.0.0"
      || host.endsWith(".localhost") || host.endsWith(".local")
      || /^(127|10)\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  } catch { return false; }
}

export interface GalleryLoadSnapshot {
  states: ReadonlyMap<string, GalleryLoadStatus>;
  requests: ReadonlyMap<string, number>;
}

interface GalleryLoadOptions {
  onStart: (id: string, request: number) => void;
  onChange: (snapshot: GalleryLoadSnapshot) => void;
  concurrency?: number;
  intervalMs?: number;
  timeoutMs?: number;
  /** Only start prioritized (near-viewport) cards; keep other documents queued. */
  visibleOnly?: boolean;
}

// Keep a small set of pages loading in parallel so their scripts and styles
// can finish. There is no fixed delay between starts in Fast mode.
export function createGalleryLoadQueue(ids: string[], options: GalleryLoadOptions) {
  const pending = [...new Set(ids)];
  const queued = new Set(pending);
  const states = new Map<string, GalleryLoadStatus>(pending.map(id => [id, "queued"]));
  const requests = new Map<string, number>();
  let requestSnapshot: ReadonlyMap<string, number> | undefined;
  const results = new Map<string, GalleryLoadResult | "slow">();
  const running = new Map<string, ReturnType<typeof setTimeout>>();
  const replacements = new Set<string>();
  let concurrency = Math.max(1, options.concurrency ?? FAST_GALLERY_CONCURRENCY);
  let interval = Math.max(0, options.intervalMs ?? 0);
  let paused = false;
  let lastStart: number | undefined;
  let priority = new Set<string>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let nextStart = 0;
  let serial = 0;
  let started = false;
  let disposed = false;
  let pumping = false;
  let changed = false;
  const publish = () => {
    if (pumping) { changed = true; return; }
    // Load completions change progress, not which documents are mounted.
    // Preserve this identity so they do not invalidate every preview consumer.
    requestSnapshot ??= new Map(requests);
    options.onChange({ states: new Map(states), requests: requestSnapshot });
  };

  const settle = (id: string, request: number, status: GalleryLoadResult | "slow") => {
    if (disposed || requests.get(id) !== request) return;
    const timeout = running.get(id);
    if (timeout !== undefined) {
      clearTimeout(timeout);
      // A timeout is not a cancelled network load. Keep its permit until the
      // document finishes or the user explicitly replaces it with a retry.
      if (status !== "slow") running.delete(id);
    }
    const next = queued.has(id) ? "queued" : status;
    results.set(id, status);
    if (states.get(id) !== next) {
      states.set(id, next);
      publish();
    }
    pump();
  };

  const pump = () => {
    if (!started || disposed || pumping || paused) return;
    pumping = true;
    try {
      const eligible = (id: string) => !options.visibleOnly || priority.has(id);
      const replacing = (id: string) => eligible(id) && replacements.has(id) && running.has(id);
      while (!disposed && !paused && (running.size < concurrency || pending.some(replacing))) {
        const available = (id: string) => eligible(id) && !running.has(id);
        let index = pending.findIndex(replacing);
        if (index < 0) index = pending.findIndex(id => available(id) && priority.has(id));
        if (index < 0) index = pending.findIndex(available);
        if (index < 0) break;
        const delay = nextStart - Date.now();
        if (delay > 0) {
          timer ??= setTimeout(() => { timer = undefined; pump(); }, delay);
          break;
        }
        const [id] = pending.splice(index, 1);
        queued.delete(id);
        replacements.delete(id);
        const request = ++serial;
        requests.set(id, request);
        requestSnapshot = undefined;
        results.delete(id);
        states.set(id, "loading");
        clearTimeout(running.get(id));
        running.set(id, setTimeout(() => settle(id, request, "slow"), options.timeoutMs ?? 20000));
        lastStart = Date.now();
        nextStart = lastStart + interval;
        publish();
        try { options.onStart(id, request); } catch { settle(id, request, "error"); }
      }
    } finally {
      pumping = false;
      if (changed && !disposed) { changed = false; publish(); }
    }
  };

  const enqueue = (id: string, replace = false) => {
    if (disposed || !states.has(id)) return;
    if (replace && running.has(id)) replacements.add(id);
    if (!queued.has(id)) { queued.add(id); pending.push(id); }
    states.set(id, "queued");
    publish();
    pump();
  };

  return {
    // Change future starts without remounting or cancelling existing documents.
    configure: (policy: { concurrency?: number; intervalMs?: number; paused?: boolean }) => {
      if (disposed) return;
      concurrency = Math.max(1, policy.concurrency ?? FAST_GALLERY_CONCURRENCY);
      interval = Math.max(0, policy.intervalMs ?? 0);
      paused = policy.paused ?? false;
      nextStart = lastStart === undefined ? 0 : lastStart + interval;
      clearTimeout(timer);
      timer = undefined;
      pump();
    },
    start: () => { if (!started && !disposed) { started = true; changed = true; pump(); } },
    // Visibility changes affect future starts, never an existing document.
    prioritize: (ids: Iterable<string>) => { priority = new Set(ids); pump(); },
    enqueue: (id: string) => enqueue(id),
    retry: (id: string) => enqueue(id, true),
    // Give a started document back to the queue: its card unmounts the page
    // until the card is prioritized again. Nothing of the page's state survives.
    unload: (id: string) => {
      if (disposed || !states.has(id) || !requests.has(id)) return;
      clearTimeout(running.get(id));
      running.delete(id);
      replacements.delete(id);
      requests.delete(id);
      requestSnapshot = undefined;
      results.delete(id);
      if (!queued.has(id)) { queued.add(id); pending.push(id); }
      states.set(id, "queued");
      publish();
      pump();
    },
    // The page is usable once its HTML is ready, so it shows as loaded and the
    // next device starts. Its images, ads and trackers keep loading; a script
    // or stylesheet that fails later still marks it incomplete through settle.
    release: (id: string, request: number) => {
      if (disposed || requests.get(id) !== request || !running.has(id) || replacements.has(id)) return;
      clearTimeout(running.get(id));
      running.delete(id);
      if (!queued.has(id) && states.get(id) === "loading") {
        states.set(id, "loaded");
        publish();
      }
      pump();
    },
    cancelPending: (id: string) => {
      if (disposed || !requests.has(id) || !queued.delete(id)) return;
      pending.splice(pending.indexOf(id), 1);
      replacements.delete(id);
      states.set(id, running.has(id) ? "loading" : results.get(id) ?? "queued");
      publish();
    },
    settle,
    dispose: () => {
      disposed = true;
      clearTimeout(timer);
      running.forEach(clearTimeout);
      running.clear();
    },
  };
}
