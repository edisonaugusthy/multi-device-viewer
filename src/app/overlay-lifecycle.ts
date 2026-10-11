/** Serialize preparation while keeping close immediate and remembering clicks during loading. */
export function createOverlayLifecycle<T>(options: {
  prepare: (launch: T) => Promise<void>;
  mount: (launch: T) => () => void;
  release: () => Promise<void>;
  onState: (active: boolean) => void;
}) {
  let wanted: T | undefined;
  let dispose: (() => void) | undefined;
  let invalidated = false;
  let queue = Promise.resolve();

  function unmount() {
    const cleanup = dispose;
    dispose = undefined;
    try { cleanup?.(); }
    finally { options.onState(false); }
  }

  function reconcile() {
    const work = queue.then(async () => {
      if (!wanted) { await options.release(); return; }
      if (dispose) return;
      try {
        while (wanted && !dispose) {
          const launch: T = wanted;
          await options.prepare(launch);
          if (!wanted) { await options.release(); return; }
          if (wanted !== launch) continue;
          dispose = options.mount(launch);
          options.onState(true);
        }
      } catch (error) {
        wanted = undefined;
        unmount();
        await options.release();
        throw error;
      }
    });
    queue = work.catch(() => undefined);
    return work;
  }

  function close() {
    wanted = undefined;
    try { unmount(); }
    catch (error) { return reconcile().then(() => { throw error; }); }
    return reconcile();
  }

  return {
    get active() { return Boolean(dispose); },
    toggle(launch: T) {
      if (invalidated) return queue;
      if (wanted) return close();
      wanted = launch;
      return reconcile();
    },
    close,
    invalidate() { invalidated = true; return close(); },
  };
}
