import { describe, expect, it } from "vitest";
import { createPreviewResourceHealth, readPreviewHealthReport } from "./preview-health";

describe("preview resource health", () => {
  it("keeps missing CSS and scripts distinct and resolves successful retries", () => {
    const health = createPreviewResourceHealth();
    health.fail("/styles.css", "style");
    health.fail("/app.js", "script");
    health.fail("/styles.css", "style");
    expect(health.snapshot()).toEqual({ scripts: 1, styles: 1 });
    health.recover("/styles.css");
    expect(health.snapshot()).toEqual({ scripts: 1, styles: 0 });
    expect(createPreviewResourceHealth().snapshot()).toEqual({ scripts: 0, styles: 0 });
  });

  it("rejects loading documents, stale document reports and malformed counts", () => {
    const report = { type: "MDV_PREVIEW_HEALTH", requestId: "new", completed: true, errors: { scripts: 0, styles: 1 } };
    expect(readPreviewHealthReport(report, "new")).toEqual(report.errors);
    expect(readPreviewHealthReport(report, "old")).toBeUndefined();
    expect(readPreviewHealthReport(report, null)).toBeUndefined();
    expect(readPreviewHealthReport({ ...report, completed: false }, "new")).toBeUndefined();
    for (const value of [-1, 1.5, Infinity, NaN, "0", undefined, 1001]) {
      expect(readPreviewHealthReport({ ...report, errors: { ...report.errors, styles: value } }, "new")).toBeUndefined();
    }
  });
});
