/**
 * What went wrong in a preview, and what it downloaded, as Chrome's debugger
 * reports it: script errors, console errors and warnings, failed requests, and
 * the bytes each kind of file took. One record per preview frame, started
 * again whenever that preview loads a new page.
 */
export type ProblemKind = "error" | "warning" | "request";
export type DownloadType = "image" | "script" | "style" | "font" | "other";

export interface PreviewProblem {
  /** The same problem seen again only counts up. */
  key: string;
  kind: ProblemKind;
  title: string;
  /** File and line for a script error, the status for a request. */
  where: string;
  status?: number;
  stack?: string[];
  /** The start of a failed request's response, when it was text. */
  response?: string;
  count: number;
  firstAt: number;
}

export interface DownloadSize {
  bytes: number;
  requests: number;
  byType: Record<DownloadType, number>;
  largest: Array<{ url: string; bytes: number }>;
}

export interface PreviewDiagnostics {
  problems: PreviewProblem[];
  download: DownloadSize;
}

const MAX_PROBLEMS = 100;
const MAX_LARGEST = 5;
const MAX_TEXT = 300;
const MAX_STACK = 3;

export function emptyDiagnostics(): PreviewDiagnostics {
  return { problems: [], download: { bytes: 0, requests: 0, byType: { image: 0, script: 0, style: 0, font: 0, other: 0 }, largest: [] } };
}

const clip = (text: string, max = MAX_TEXT) => text.length > max ? `${text.slice(0, max - 1)}…` : text;

export function addProblem(diagnostics: PreviewDiagnostics, problem: Omit<PreviewProblem, "count" | "firstAt">, now = Date.now()) {
  const seen = diagnostics.problems.find(item => item.key === problem.key);
  if (seen) { seen.count++; return; }
  if (diagnostics.problems.length >= MAX_PROBLEMS) return;
  diagnostics.problems.push({ ...problem, title: clip(problem.title), response: problem.response && clip(problem.response), count: 1, firstAt: now });
}

/** Chrome's resource types, folded into the kinds the panel shows. */
export function downloadType(resourceType: string | undefined): DownloadType {
  switch (resourceType) {
    case "Image": case "Media": return "image";
    case "Script": return "script";
    case "Stylesheet": return "style";
    case "Font": return "font";
    default: return "other";
  }
}

export function addDownload(diagnostics: PreviewDiagnostics, url: string, resourceType: string | undefined, bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return;
  const download = diagnostics.download;
  download.bytes += bytes;
  download.requests++;
  download.byType[downloadType(resourceType)] += bytes;
  if (bytes === 0) return;
  download.largest.push({ url: fileName(url), bytes });
  download.largest.sort((a, b) => b.bytes - a.bytes);
  download.largest.length = Math.min(download.largest.length, MAX_LARGEST);
}

/** The last part of a URL's path, which is how people know their files. */
export function fileName(url: string): string {
  try {
    const parsed = new URL(url);
    const name = parsed.pathname.split("/").filter(Boolean).pop();
    return name ? decodeURIComponent(name) : parsed.host;
  } catch { return url.slice(0, 80); }
}

/** A request as the panel names it: the path on the page's own host, the whole URL elsewhere. */
export function requestTitle(method: string, url: string, pageUrl?: string): string {
  try {
    const parsed = new URL(url);
    const page = pageUrl ? new URL(pageUrl) : undefined;
    const shown = page && page.origin === parsed.origin ? `${parsed.pathname}${parsed.search}` : `${parsed.host}${parsed.pathname}${parsed.search}`;
    return `${method} ${shown}`;
  } catch { return `${method} ${url}`; }
}

interface CallFrame { functionName?: string; url?: string; lineNumber?: number; columnNumber?: number }
const path = (url: string | undefined) => {
  if (!url) return "";
  try { const parsed = new URL(url); return parsed.pathname.replace(/^\//, "") || parsed.host; } catch { return url; }
};

/** One stack line, in the shape browsers print it. */
export function stackLine(frame: CallFrame): string {
  const where = `${path(frame.url)}:${(frame.lineNumber ?? 0) + 1}:${(frame.columnNumber ?? 0) + 1}`;
  return frame.functionName ? `at ${frame.functionName} (${where})` : `at ${where}`;
}

export interface ExceptionDetails {
  text?: string;
  url?: string;
  lineNumber?: number;
  exception?: { description?: string; value?: unknown };
  stackTrace?: { callFrames?: CallFrame[] };
}

/** A thrown error as a problem: its message, where it was thrown, and the top of its stack. */
export function exceptionProblem(details: ExceptionDetails): Omit<PreviewProblem, "count" | "firstAt"> {
  const frames = details.stackTrace?.callFrames ?? [];
  const described = details.exception?.description?.split("\n")[0];
  const value = typeof details.exception?.value === "string" ? details.exception.value : undefined;
  const title = described || value || details.text || "Script error";
  const top = frames[0] ?? { url: details.url, lineNumber: details.lineNumber };
  const where = top.url ? `${fileName(top.url)}:${(top.lineNumber ?? 0) + 1}` : "";
  return { key: `error|${title}|${where}`, kind: "error", title, where, stack: frames.slice(0, MAX_STACK).map(stackLine) };
}

interface RemoteObject { type?: string; value?: unknown; description?: string }
/** console.error and console.warn, with their arguments joined the way the console shows them. */
export function consoleProblem(level: "error" | "warning", args: RemoteObject[], frame?: CallFrame): Omit<PreviewProblem, "count" | "firstAt"> {
  const title = args.map(arg => typeof arg.value === "string" ? arg.value : arg.description ?? String(arg.value ?? "")).join(" ").trim() || (level === "error" ? "console.error" : "console.warn");
  const where = frame?.url ? `${fileName(frame.url)}:${(frame.lineNumber ?? 0) + 1}` : "";
  return { key: `${level}|${title}|${where}`, kind: level, title, where };
}

/** A request that failed, by its status or by the network error Chrome gave it. */
export function requestProblem(method: string, url: string, pageUrl: string | undefined, failure: { status?: number; statusText?: string; errorText?: string }): Omit<PreviewProblem, "count" | "firstAt"> {
  const title = requestTitle(method, url, pageUrl);
  const where = failure.status ? `${failure.status}${failure.statusText ? ` ${failure.statusText}` : ""}` : failure.errorText ?? "Failed";
  return { key: `request|${title}|${where}`, kind: "request", title, where, status: failure.status };
}
