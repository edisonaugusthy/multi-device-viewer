export interface PreviewResourceErrors { scripts: number; styles: number }

export function createPreviewResourceHealth() {
  const failed = new Map<string, "script" | "style">();
  return {
    fail: (url: string, kind: "script" | "style") => { if (failed.size < 1000) failed.set(url, kind); },
    recover: (url: string) => { failed.delete(url); },
    snapshot: (): PreviewResourceErrors => ({
      scripts: [...failed.values()].filter(kind => kind === "script").length,
      styles: [...failed.values()].filter(kind => kind === "style").length,
    }),
  };
}

/** A report belongs only to the current document's load handshake. */
export function readPreviewHealthReport(data: unknown, requestId: string | null): PreviewResourceErrors | undefined {
  if (!requestId || !data || typeof data !== "object") return;
  const report = data as Record<string, unknown>;
  if (report.type !== "MDV_PREVIEW_HEALTH" || report.requestId !== requestId || report.completed !== true) return;
  const counts = report.errors as Record<string, unknown> | undefined;
  if (!counts || ![counts.scripts, counts.styles].every(value => typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 1000)) return;
  return { scripts: counts.scripts as number, styles: counts.styles as number };
}
