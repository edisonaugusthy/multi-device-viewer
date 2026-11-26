/** Checks the previewed site again and again while that is wanted, one check at a time. */
export interface AutoReloadLoop {
  watch: { check: (pages: string[]) => Promise<boolean>; readonly pending: boolean; readonly down: boolean };
  /** The pages the previews show now. */
  pages: () => string[];
  /** A capture or recording a reload would spoil is running. */
  paused: () => boolean;
  /** Nobody can see the previews: nothing is asked until `wake`. */
  asleep: () => boolean;
  onChange: () => void;
}

export const CHECK_EVERY_MS = 1000;
/** After a change, look again sooner to see whether the build has finished. */
export const SETTLE_MS = 400;
/** A server that is not running is asked less often. */
export const DOWN_EVERY_MS = 3000;

export function startAutoReloadLoop({ watch, pages, paused, asleep, onChange }: AutoReloadLoop) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false, running = false, owed = false;
  const run = async () => {
    clearTimeout(timer);
    if (stopped || running || asleep()) return;
    if (!paused()) {
      running = true;
      owed = await watch.check(pages()).catch(() => false) || owed;
      running = false;
      if (stopped) return;
      // A change found while paused is shown as soon as the pause ends.
      if (owed && !paused()) { owed = false; onChange(); }
    }
    timer = setTimeout(run, watch.down ? DOWN_EVERY_MS : watch.pending ? SETTLE_MS : CHECK_EVERY_MS);
  };
  void run();
  return {
    wake: () => { void run(); },
    stop: () => { stopped = true; clearTimeout(timer); },
  };
}
