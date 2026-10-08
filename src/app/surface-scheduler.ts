/** Coalesce animation mutations and scroll events into at most ten samples/sec. */
export function createSurfaceScheduler(sample: () => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let frame: number | undefined;
  let lastSample = -Infinity;
  return {
    request() {
      if (timer !== undefined || frame !== undefined) return;
      timer = setTimeout(() => {
        timer = undefined;
        frame = requestAnimationFrame(() => {
          frame = undefined;
          lastSample = performance.now();
          sample();
        });
      }, Math.max(0, 100 - (performance.now() - lastSample)));
    },
    cancel() {
      clearTimeout(timer);
      if (frame !== undefined) cancelAnimationFrame(frame);
      timer = frame = undefined;
      lastSample = -Infinity;
    },
  };
}
