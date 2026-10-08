import { createPreviewResourceHealth } from "../domain/device/preview-health";

/** Install before parsing page resources; document_idle misses early failures. */
export function setupPreviewLoadHealth() {
  const slotId = window.name.match(/^mdv-(?:mobile-)?preview-(.+)$/)?.[1];
  if (window.parent === window || !slotId) return () => {};
  const health = createPreviewResourceHealth();
  let requestId: string | undefined;
  const report = () => {
    if (!requestId) return;
    window.parent.postMessage({ type: "MDV_PREVIEW_HEALTH", slotId, requestId,
      completed: document.readyState === "complete", errors: health.snapshot() }, "*");
  };
  const resource = (target: EventTarget | null) => {
    if (target instanceof HTMLScriptElement && target.src) return { url: target.src, kind: "script" as const };
    if (target instanceof HTMLLinkElement && target.relList.contains("stylesheet") && !target.disabled) return { url: target.href, kind: "style" as const };
  };
  const onError = (event: Event) => {
    const item = resource(event.target);
    if (item) health.fail(item.url, item.kind);
    else return;
    report();
  };
  const onLoad = (event: Event) => {
    const item = resource(event.target);
    if (item) health.recover(item.url);
    if (item || event.target === document) report();
  };
  const onMessage = (event: MessageEvent) => {
    if (event.source !== window.parent || event.data?.type !== "MDV_PREVIEW_HEALTH_REQUEST"
      || event.data.slotId !== slotId || typeof event.data.requestId !== "string") return;
    requestId = event.data.requestId;
    report();
  };
  window.addEventListener("error", onError, true);
  window.addEventListener("load", onLoad, true);
  window.addEventListener("message", onMessage);
  return () => {
    window.removeEventListener("error", onError, true);
    window.removeEventListener("load", onLoad, true);
    window.removeEventListener("message", onMessage);
  };
}
