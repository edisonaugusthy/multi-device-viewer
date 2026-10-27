import { getViewerRoot } from "./viewer-context";
import { slotIdFromFrameName } from "./preview-frame";
import { addProblem, emptyDiagnostics, type PreviewDiagnostics, type PreviewProblem } from "../domain/simulator/preview-diagnostics";
import type { LayoutSnapshot } from "../domain/capture/layout-snapshot";
import type { LayoutCause } from "../domain/layout-check/layout-cause";

/**
 * What the viewer learns from inside its previews: each preview's problems,
 * reported by a script in the page (preview-problems.ts), and answers from
 * the preview bridge (layout snapshots, the CSS rule behind a layout problem).
 * Only messages from the viewer's own preview frames are believed.
 */
const REPLY_TIMEOUT_MS = 1500;

/** The viewer's preview frame for a slot. */
export function previewFrame(slotId: string): HTMLIFrameElement | null {
  return getViewerRoot().querySelector<HTMLIFrameElement>(`[data-preview-slot-id="${CSS.escape(slotId)}"] iframe`);
}
const fromPreview = (event: MessageEvent, slotId: unknown): slotId is string =>
  typeof slotId === "string" && event.source !== null && previewFrame(slotId)?.contentWindow === event.source
  && slotIdFromFrameName(previewFrame(slotId)?.name ?? "") === slotId;

type Diagnostics = Record<string, PreviewDiagnostics & { documentId: string }>;
let diagnostics: Diagnostics = {};
const listeners = new Set<() => void>();
const notify = () => { for (const listener of listeners) listener(); };

function onMessage(event: MessageEvent) {
  const data = event.data as { type?: unknown; slotId?: unknown; documentId?: unknown; problem?: unknown } | null;
  if (!data || (data.type !== "MDV_PAGE_PROBLEMS_START" && data.type !== "MDV_PAGE_PROBLEM") || typeof data.documentId !== "string" || !fromPreview(event, data.slotId)) return;
  const slotId = data.slotId;
  const current = diagnostics[slotId];
  // Each new page starts its preview's list again.
  const record = current?.documentId === data.documentId ? { ...current, problems: [...current.problems] } : { ...emptyDiagnostics(), documentId: data.documentId };
  if (data.type === "MDV_PAGE_PROBLEM") {
    const problem = problemFrom(data.problem);
    if (!problem) return;
    record.problems = record.problems.map(item => ({ ...item }));
    addProblem(record, problem);
  }
  diagnostics = { ...diagnostics, [slotId]: record };
  notify();
}

const text = (value: unknown, max: number) => typeof value === "string" ? value.slice(0, max) : undefined;
function problemFrom(value: unknown): Omit<PreviewProblem, "count" | "firstAt"> | undefined {
  if (!value || typeof value !== "object") return undefined;
  const { key, kind, title, where, status, stack, response } = value as Record<string, unknown>;
  if (kind !== "error" && kind !== "warning" && kind !== "request") return undefined;
  const problem: Omit<PreviewProblem, "count" | "firstAt"> = { key: text(key, 1000) ?? "", kind, title: text(title, 1000) ?? "", where: text(where, 300) ?? "" };
  if (!problem.key || !problem.title) return undefined;
  if (typeof status === "number" && Number.isInteger(status) && status >= 100 && status < 600) problem.status = status;
  if (Array.isArray(stack)) problem.stack = stack.filter((line): line is string => typeof line === "string").slice(0, 3).map(line => line.slice(0, 300));
  const preview = text(response, 300);
  if (preview) problem.response = preview;
  return problem;
}

/** Each preview's problems, by slot; for useSyncExternalStore. */
export const diagnosticsStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    if (listeners.size === 1) window.addEventListener("message", onMessage);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) window.removeEventListener("message", onMessage);
    };
  },
  get: () => diagnostics,
};

/** Ask a preview's bridge something and wait for its answer; null when it does not answer. */
export function askPreview<T extends Record<string, unknown>>(slotId: string, type: string, reply: string, extra: Record<string, unknown> = {}): Promise<T | null> {
  const target = previewFrame(slotId)?.contentWindow;
  if (!target) return Promise.resolve(null);
  const requestId = crypto.randomUUID();
  return new Promise(resolve => {
    const done = (value: T | null) => { clearTimeout(timer); window.removeEventListener("message", onReply); resolve(value); };
    const onReply = (event: MessageEvent) => {
      if (event.source === target && event.data?.type === reply && event.data.requestId === requestId) done(event.data as T);
    };
    const timer = setTimeout(() => done(null), REPLY_TIMEOUT_MS);
    window.addEventListener("message", onReply);
    target.postMessage({ type, slotId, requestId, ...extra }, "*");
  });
}

/** The page's layout now, for describing what changed between two loads. */
export async function snapshotPreview(slotId: string): Promise<LayoutSnapshot | null> {
  const result = await askPreview<{ elements: LayoutSnapshot }>(slotId, "MDV_LAYOUT_SNAPSHOT", "MDV_LAYOUT_SNAPSHOT_RESULT");
  return Array.isArray(result?.elements) ? result.elements : null;
}

/** The CSS rule behind a layout problem, read from the page's own stylesheets, or null. */
export async function findLayoutCause(slotId: string, selector: string): Promise<LayoutCause | null> {
  const result = await askPreview<{ cause?: unknown }>(slotId, "MDV_LAYOUT_CAUSE", "MDV_LAYOUT_CAUSE_RESULT", { selector });
  const cause = result?.cause as Partial<LayoutCause> | null | undefined;
  return cause && typeof cause.selector === "string" && typeof cause.declarations === "string" && typeof cause.source === "string"
    ? { selector: cause.selector.slice(0, 500), declarations: cause.declarations.slice(0, 500), source: cause.source.slice(0, 200) } : null;
}
