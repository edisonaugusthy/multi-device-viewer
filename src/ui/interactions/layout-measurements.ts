type Measurement = { read: () => (() => void) | undefined; cancelled: boolean };
const pending = new Set<Measurement>();
let frame: number | undefined;

/** Read all preview geometry before any style writes can invalidate layout. */
export function scheduleLayoutMeasurement(read: Measurement["read"]) {
  const measurement: Measurement = { read, cancelled: false };
  pending.add(measurement);
  frame ??= requestAnimationFrame(() => {
    frame = undefined;
    const batch = [...pending];
    pending.clear();
    const writes = batch.map(item => item.cancelled ? undefined : item.read());
    writes.forEach((write, index) => { if (!batch[index].cancelled) write?.(); });
  });
  return () => {
    measurement.cancelled = true;
    pending.delete(measurement);
    if (!pending.size && frame !== undefined) {
      cancelAnimationFrame(frame);
      frame = undefined;
    }
  };
}
