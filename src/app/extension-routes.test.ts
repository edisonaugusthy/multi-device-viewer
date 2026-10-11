import { describe, expect, it } from "vitest";
import { isPreviewableUrl } from "./extension-routes";

describe("isPreviewableUrl", () => {
  it.each([
    "https://example.com",
    "http://localhost:5173",
    "https://127.0.0.1:3000/path",
  ])("accepts website URL %s", (url) => {
    expect(isPreviewableUrl(url)).toBe(true);
  });

  it.each([
    undefined,
    "",
    "about:blank",
    "chrome://newtab",
    "chrome-extension://extension-id/page.html",
    "file:///tmp/page.html",
    "not a url",
  ])("rejects unsupported URL %s", (url) => {
    expect(isPreviewableUrl(url)).toBe(false);
  });
});
