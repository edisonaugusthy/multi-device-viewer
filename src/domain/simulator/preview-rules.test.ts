import { describe, expect, it } from "vitest";
import { describeHeaders, identityHeaders, previewHost, previewRule, previewHeaderRule } from "./preview-rules";
import type { BrowserBrands } from "./preview-emulation";

const brands: BrowserBrands = { brands: [{ brand: "Chromium", version: "141" }], fullVersionList: [{ brand: "Chromium", version: "141.0.0.0" }], uaFullVersion: "141.0.0.0" };
describe("temporary preview rules", () => {
  it("rejects non-web URLs and embedded credentials", () => {
    for (const url of ["file:///tmp/a", "chrome://settings", "https://user:secret@example.com", "bad"]) expect(() => previewHost(url)).toThrow();
  });
  it("limits embedding changes to selected hosts and iframe responses in one tab", () => {
    expect(previewHost("https://example.com/path?token=private")).toBe("example.com");
    const rule = previewRule(1000000, 7, ["example.com", "example.com"]);
    expect(rule.condition).toEqual({ tabIds: [7], requestDomains: ["example.com"], resourceTypes: ["sub_frame"] });
    expect(rule.action.responseHeaders?.some(header => /cookie/i.test(header.header))).toBe(false);
    expect(rule.action.requestHeaders).toBeUndefined();
  });
  it("scopes a device header to its exact marker, tab and supported request types", () => {
    const rule = previewHeaderRule(1000001, 7, "mdv-preview-a", { userAgent: "iPhone Safari", platform: "iOS", mobile: true, hints: false }, brands);
    expect(rule.condition).toEqual({ tabIds: [7], urlFilter: "#*:~:mdv-device=mdv-preview-a&", isUrlFilterCaseSensitive: true, resourceTypes: ["sub_frame", "xmlhttprequest"] });
    expect(rule.action.responseHeaders).toBeUndefined();
  });
  it("sends an iPhone as Safari with no client hints at all", () => {
    const headers = identityHeaders({ userAgent: "iPhone Safari", platform: "iOS", mobile: true, hints: false }, brands);
    expect(headers[0]).toEqual({ header: "user-agent", operation: "set", value: "iPhone Safari" });
    expect(headers.slice(1).every(header => header.operation === "remove" && header.header.startsWith("sec-ch-ua"))).toBe(true);
    expect(headers.map(header => header.header)).toContain("sec-ch-ua");
    expect(headers.map(header => header.header)).toContain("sec-ch-ua-mobile");
  });
  it("sends an Android phone as the browser's own Chrome brands, with every client hint it has", () => {
    const byName = (headers: ReturnType<typeof identityHeaders>) => Object.fromEntries(headers.map(header => [header.header, header]));
    const plain = byName(identityHeaders({ userAgent: "Android Chrome", platform: "Android", mobile: true, hints: true }, brands));
    expect(plain["sec-ch-ua"]).toEqual({ header: "sec-ch-ua", operation: "set", value: "\"Chromium\";v=\"141\"" });
    expect(plain["sec-ch-ua-mobile"]).toEqual({ header: "sec-ch-ua-mobile", operation: "set", value: "?1" });
    expect(plain["sec-ch-ua-platform"]).toEqual({ header: "sec-ch-ua-platform", operation: "set", value: "\"Android\"" });
    expect(plain["sec-ch-ua-model"].operation).toBe("remove");
    const pixel = byName(identityHeaders({ userAgent: "Android Chrome", platform: "Android", mobile: true, hints: true, language: "de-DE",
      details: { model: "Pixel 8", platformVersion: "16.0.0", formFactor: "Mobile", architecture: "", bitness: "" } }, brands));
    expect(pixel["sec-ch-ua-model"]).toEqual({ header: "sec-ch-ua-model", operation: "set", value: "\"Pixel 8\"" });
    expect(pixel["sec-ch-ua-form-factors"].value).toBe("\"Mobile\"");
    expect(pixel["accept-language"]).toEqual({ header: "accept-language", operation: "set", value: "de-DE,de;q=0.9" });
    expect(identityHeaders({ userAgent: "Tablet", platform: "Android", mobile: false, hints: true }, brands).find(header => header.header === "sec-ch-ua-mobile")?.value).toBe("?0");
  });
  it("describes header changes by content, so rules read back from the browser compare", () => {
    const safari = { platform: "macOS" as const, mobile: false, hints: false };
    const headers = identityHeaders({ userAgent: "Agent", ...safari }, brands);
    expect(describeHeaders(headers)).toBe(describeHeaders(JSON.parse(JSON.stringify(headers))));
    expect(describeHeaders(headers)).not.toBe(describeHeaders(identityHeaders({ userAgent: "Other", ...safari }, brands)));
    expect(describeHeaders(undefined)).toBe("");
  });
});
