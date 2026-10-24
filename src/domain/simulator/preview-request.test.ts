import { describe, expect, it } from "vitest";
import { previewRequestName, tagPreviewRequest, untagPreviewRequest } from "./preview-request";
const name = "mdv-mobile-preview-phone";
describe("device request markers", () => {
  it("preserves query credentials, hash routes and existing text directives without sending them to the server", () => {
    const url = tagPreviewRequest("/path?signature=a%2Bb#/route?token=x%26y:~:text=hello", name, "https://example.com");
    expect(url).toBe("https://example.com/path?signature=a%2Bb#/route?token=x%26y:~:mdv-device=mdv-mobile-preview-phone&text=hello");
    expect(previewRequestName(url)).toBe(name);
    expect(new URL(url).pathname + new URL(url).search).toBe("/path?signature=a%2Bb");
  });
  it("replaces an old marker instead of combining device identities", () => {
    const url = tagPreviewRequest("https://example.com/#anchor", name);
    expect(tagPreviewRequest(url, name)).toBe(url);
    const changed = tagPreviewRequest(url, "mdv-preview-mac");
    expect(previewRequestName(changed)).toBe("mdv-preview-mac");
    expect(changed).not.toContain(name);
  });
  it("removes only its own marker from public URLs", () => {
    for (const url of ["https://example.com/", "https://example.com/#/route?token=a%26b", "https://example.com/#anchor:~:text=hello&text=world"]) {
      expect(untagPreviewRequest(tagPreviewRequest(url, name))).toBe(url);
    }
    expect(untagPreviewRequest("https://example.com/#:~:mdv-device=unrelated&text=hello")).toBe("https://example.com/#:~:mdv-device=unrelated&text=hello");
  });
  it("leaves non-web URLs and invalid frame names alone", () => {
    for (const url of ["data:text/plain,x", "blob:https://example.com/id", "javascript:void(0)", "bad"]) expect(tagPreviewRequest(url, name)).toBe(url);
    expect(tagPreviewRequest("https://example.com", "mdv-preview-*")).toBe("https://example.com");
    expect(previewRequestName("https://example.com/#:~:mdv-device=mdv-preview-*&")).toBeUndefined();
  });
});
