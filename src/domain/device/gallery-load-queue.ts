export type GalleryLoadStatus = "queued" | "loading" | "loaded" | "error" | "slow";

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
}

// Load every device, retaining its document. Visibility changes priority only;
// scrolling must never cancel a request or restart a completed preview.
export function createGalleryLoadQueue(ids: string[], options: GalleryLoadOptions) {
  const pending = [...new Set(ids)];
  const queued = new Set(pending);
  const states = new Map<string, GalleryLoadStatus>(pending.map(id => [id, "queued"]));
  const requests = new Map<string, number>();
  const results = new Map<string, "loaded" | "error" | "slow">();
  const running = new Map<string, ReturnType<typeof setTimeout>>();
  const concurrency = Math.max(1, options.concurrency ?? 4);
  const interval = Math.max(1, options.intervalMs ?? 500);
  let priority = new Set<string>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let nextStart = 0;
  let serial = 0;
  let started = false;
  let disposed = false;
  const publish = () => options.onChange({ states: new Map(states), requests: new Map(requests) });

  const settle = (id: string, request: number, status: "loaded" | "error" | "slow") => {
    if (disposed || requests.get(id) !== request) return;
    const timeout = running.get(id);
    if (timeout !== undefined) {
      clearTimeout(timeout);
      running.delete(id);
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
    if (!started || disposed || running.size >= concurrency) return;
    const available = (id: string) => !running.has(id);
    let index = pending.findIndex(id => available(id) && priority.has(id));
    if (index < 0) index = pending.findIndex(available);
    if (index < 0) return;
    const delay = nextStart - Date.now();
    if (delay > 0) {
      timer ??= setTimeout(() => { timer = undefined; pump(); }, delay);
      return;
    }
    const [id] = pending.splice(index, 1);
    queued.delete(id);
    const request = ++serial;
    requests.set(id, request);
    results.delete(id);
    states.set(id, "loading");
    running.set(id, setTimeout(() => settle(id, request, "slow"), options.timeoutMs ?? 20000));
    nextStart = Date.now() + interval;
    publish();
    try { options.onStart(id, request); } catch { settle(id, request, "error"); }
    pump();
  };

  return {
    start: () => { if (!started && !disposed) { started = true; publish(); pump(); } },
    prioritize: (ids: Iterable<string>) => { priority = new Set(ids); pump(); },
    enqueue: (id: string) => {
      if (disposed || !states.has(id) || queued.has(id)) return;
      queued.add(id);
      pending.push(id);
      states.set(id, "queued");
      publish();
      pump();
    },
    cancelPending: (id: string) => {
      if (disposed || !requests.has(id) || !queued.delete(id)) return;
      pending.splice(pending.indexOf(id), 1);
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
