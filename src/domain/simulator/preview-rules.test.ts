import { describe, expect, it } from "vitest";
import { previewHost, previewRule } from "./preview-rules";
describe("temporary preview rules", () => {
  it("rejects non-web URLs and embedded credentials", () => {
    for (const url of ["file:///tmp/a", "chrome://settings", "https://user:secret@example.com", "bad"]) expect(() => previewHost(url)).toThrow();
  });
  it("limits changes to selected hosts and subframes in one tab", () => {
    expect(previewHost("https://example.com/path?token=private")).toBe("example.com");
    const rule = previewRule(1000000, 7, ["example.com", "example.com"]);
    expect(rule.condition).toEqual({ tabIds: [7], requestDomains: ["example.com"], resourceTypes: ["sub_frame"] });
    expect(rule.action.responseHeaders?.some(header => /cookie/i.test(header.header))).toBe(false);
  });
});
