/**
 * What went wrong in a preview, as a script inside it sees it: script errors,
 * console errors and warnings, and failed requests. One record per preview,
 * started again whenever that preview loads a new page.
 */
export type ProblemKind = "error" | "warning" | "request";

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

export interface PreviewDiagnostics {
  problems: PreviewProblem[];
}

const MAX_PROBLEMS = 100;
const MAX_TEXT = 300;
const MAX_STACK = 3;

export function emptyDiagnostics(): PreviewDiagnostics {
  return { problems: [] };
}

const clip = (text: string, max = MAX_TEXT) => text.length > max ? `${text.slice(0, max - 1)}…` : text;

export function addProblem(diagnostics: PreviewDiagnostics, problem: Omit<PreviewProblem, "count" | "firstAt">, now = Date.now()) {
  const seen = diagnostics.problems.find(item => item.key === problem.key);
  if (seen) { seen.count++; return; }
  if (diagnostics.problems.length >= MAX_PROBLEMS) return;
  diagnostics.problems.push({ ...problem, title: clip(problem.title), response: problem.response && clip(problem.response), count: 1, firstAt: now });
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

const path = (url: string) => {
  try { const parsed = new URL(url); return parsed.pathname.replace(/^\//, "") || parsed.host; } catch { return url; }
};

/** The top lines of a script's stack, with each file's address shortened to its path. */
export function stackLines(stack: string | undefined): string[] {
  return (stack ?? "").split("\n").map(line => line.trim()).filter(line => line.startsWith("at "))
    .slice(0, MAX_STACK).map(line => line.replace(/\(?(https?:\/\/[^\s)]+?)(:\d+:\d+)\)?$/, (match, url: string, position: string) => match.startsWith("(") ? `(${path(url)}${position})` : `${path(url)}${position}`));
}

/** A thrown error as a problem: its message, where it was thrown, and the top of its stack. */
export function errorProblem(message: string, file?: string, line?: number, stack?: string): Omit<PreviewProblem, "count" | "firstAt"> {
  const title = message.trim() || "Script error";
  const where = file ? `${fileName(file)}${line ? `:${line}` : ""}` : "";
  return { key: `error|${title}|${where}`, kind: "error", title, where, stack: stackLines(stack) };
}

/** A console argument the way the console shows it. */
export function consoleText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  try { return typeof value === "object" && value !== null ? JSON.stringify(value) ?? String(value) : String(value); } catch { return String(value); }
}

/** console.error and console.warn, with their arguments joined and the caller's file and line. */
export function consoleProblem(level: "error" | "warning", args: unknown[], stack?: string): Omit<PreviewProblem, "count" | "firstAt"> {
  const title = args.map(consoleText).join(" ").trim() || (level === "error" ? "console.error" : "console.warn");
  const caller = /\(?(https?:\/\/[^\s)]+?):(\d+):\d+\)?$/m.exec((stack ?? "").split("\n").slice(2).join("\n"));
  const where = caller ? `${fileName(caller[1])}:${caller[2]}` : "";
  return { key: `${level}|${title}|${where}`, kind: level, title, where };
}

/** A request that failed, by its status or by the network error Chrome gave it. */
export function requestProblem(method: string, url: string, pageUrl: string | undefined, failure: { status?: number; statusText?: string; errorText?: string; response?: string }): Omit<PreviewProblem, "count" | "firstAt"> {
  const title = requestTitle(method, url, pageUrl);
  const where = failure.status ? `${failure.status}${failure.statusText ? ` ${failure.statusText}` : ""}` : failure.errorText ?? "Failed";
  return { key: `request|${title}|${where}`, kind: "request", title, where, status: failure.status, ...(failure.response ? { response: failure.response } : {}) };
}
