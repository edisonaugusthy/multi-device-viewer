import { handleVisualRegression } from "../../domain/visual-regression/visual-regression-service";
import { VisualRegressionError, type VisualRegressionCommand } from "../../domain/visual-regression/visual-regression.types";

// Development preview: production uses the extension background worker so
// baselines belong to the extension, even when its UI is over another site.
// Tab screenshots need the extension, so captures are unavailable here.
const host = { captureTab: () => Promise.reject(new VisualRegressionError("capture")) };
const worker = globalThis as unknown as { onmessage: (event: MessageEvent<{ id: number; command: VisualRegressionCommand }>) => void; postMessage: (data: unknown) => void };
worker.onmessage = ({ data: { id, command } }) => {
  void handleVisualRegression(command, host).then(result => worker.postMessage({ id, ok: true, result }))
    .catch(error => worker.postMessage({ id, ok: false, code: error instanceof VisualRegressionError ? error.code : "engine" }));
};
