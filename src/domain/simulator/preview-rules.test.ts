import { describe, expect, it } from "vitest";
import { describeHeaders, identityHeaders, previewHost, previewRule } from "./preview-rules";
describe("temporary preview rules", () => {
  it("rejects non-web URLs and embedded credentials", () => {
    for (const url of ["file:///tmp/a", "chrome://settings", "https://user:secret@example.com", "bad"]) expect(() => previewHost(url)).toThrow();
  });
  it("limits changes to selected hosts and subframes in one tab", () => {
    expect(previewHost("https://example.com/path?token=private")).toBe("example.com");
    const rule = previewRule(1000000, 7, ["example.com", "example.com"]);
    expect(rule.condition).toEqual({ tabIds: [7], requestDomains: ["example.com"], resourceTypes: ["sub_frame"] });
    expect(rule.action.responseHeaders?.some(header => /cookie/i.test(header.header))).toBe(false);
    expect(rule.action.requestHeaders).toBeUndefined();
  });
  it("sends an iPhone as Safari with no client hints at all", () => {
    const headers = identityHeaders({ userAgent: "iPhone Safari" });
    expect(headers[0]).toEqual({ header: "user-agent", operation: "set", value: "iPhone Safari" });
    expect(headers.slice(1).every(header => header.operation === "remove" && header.header.startsWith("sec-ch-ua"))).toBe(true);
    expect(headers.map(header => header.header)).toContain("sec-ch-ua");
    expect(headers.map(header => header.header)).toContain("sec-ch-ua-mobile");
    expect(previewRule(1000000, 7, ["example.com"], headers).action.requestHeaders).toBe(headers);
  });
  it("sends an Android phone as the browser's own Chrome brands on a mobile Android platform", () => {
    const headers = identityHeaders({ userAgent: "Android Chrome", hints: { mobile: true, platform: "Android" } });
    const byName = Object.fromEntries(headers.map(header => [header.header, header]));
    expect(byName["sec-ch-ua"]).toBeUndefined();
    expect(byName["sec-ch-ua-mobile"]).toEqual({ header: "sec-ch-ua-mobile", operation: "set", value: "?1" });
    expect(byName["sec-ch-ua-platform"]).toEqual({ header: "sec-ch-ua-platform", operation: "set", value: "\"Android\"" });
    expect(byName["sec-ch-ua-model"].operation).toBe("remove");
    expect(byName["sec-ch-ua-platform-version"].operation).toBe("remove");
    expect(identityHeaders({ userAgent: "Tablet", hints: { mobile: false, platform: "Android" } }).find(header => header.header === "sec-ch-ua-mobile")?.value).toBe("?0");
  });
  it("describes header changes by content, so rules read back from the browser compare", () => {
    const headers = identityHeaders({ userAgent: "Agent" });
    expect(describeHeaders(headers)).toBe(describeHeaders(JSON.parse(JSON.stringify(headers))));
    expect(describeHeaders(headers)).not.toBe(describeHeaders(identityHeaders({ userAgent: "Other" })));
    expect(describeHeaders(undefined)).toBe("");
  });
});
