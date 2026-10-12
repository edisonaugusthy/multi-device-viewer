import {
  VisualRegressionError,
  type VisualRegressionAction, type VisualRegressionCommand, type VisualRegressionErrorCode, type VisualRegressionResults,
} from "../../domain/visual-regression/visual-regression.types";

interface Reply { ok: boolean; code?: VisualRegressionErrorCode; result?: unknown }
const REQUEST_TIMEOUT_MS = 30_000;

// Development preview only: one long-lived worker, so captures and
// comparisons survive between requests the way they do in the extension.
let worker: Worker | undefined;
let nextId = 0;
const waiting = new Map<number, { resolve: (reply: Reply) => void; reject: (error: unknown) => void; timer: ReturnType<typeof setTimeout> }>();
function viaWorker(command: VisualRegressionCommand): Promise<Reply> {
  if (!worker) {
    worker = new Worker(new URL("./visual-regression-worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<Reply & { id: number }>) => {
      const request = waiting.get(event.data.id);
      if (!request) return;
      clearTimeout(request.timer);
      waiting.delete(event.data.id);
      request.resolve(event.data);
    };
    worker.onerror = () => {
      for (const request of waiting.values()) { clearTimeout(request.timer); request.reject(new VisualRegressionError("engine")); }
      waiting.clear();
      worker?.terminate();
      worker = undefined;
    };
  }
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { waiting.delete(id); reject(new VisualRegressionError("engine")); }, REQUEST_TIMEOUT_MS);
    waiting.set(id, { resolve, reject, timer });
    worker!.postMessage({ id, command });
  });
}

export async function requestVisualRegression<A extends VisualRegressionAction>(
  command: Extract<VisualRegressionCommand, { action: A }>,
): Promise<VisualRegressionResults[A]> {
  const reply: Reply | undefined = typeof chrome !== "undefined" && chrome.runtime?.id
    ? await chrome.runtime.sendMessage({ type: "MDV_VISUAL_REGRESSION", command }).catch(() => undefined)
    : await viaWorker(command);
  if (!reply?.ok) throw new VisualRegressionError(reply?.code ?? "engine");
  return (reply.result ?? null) as VisualRegressionResults[A];
}
