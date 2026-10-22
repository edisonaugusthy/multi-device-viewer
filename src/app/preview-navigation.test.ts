import { describe, expect, it } from "vitest";
import { arrivedByItself, formNavigation, linkNavigation } from "./preview-navigation";

const page = "https://example.com/list?page=2#top";
const link = (href: string, extra: Partial<{ target: string; download: boolean }> = {}) => ({ href, target: "", download: false, ...extra });

describe("navigation inside a wrapped phone preview", () => {
  it("hands plain links to the wrapper, resolved against the page", () => {
    expect(linkNavigation(link("/item/7"), page, false)).toBe("https://example.com/item/7");
    expect(linkNavigation(link("https://other.example/"), page, false)).toBe("https://other.example/");
    expect(linkNavigation(link("?page=3"), page, false)).toBe("https://example.com/list?page=3");
  });

  it("leaves links the browser opens elsewhere, downloads, scripts and same-document jumps alone", () => {
    expect(linkNavigation(link("/item/7"), page, true)).toBeUndefined();
    expect(linkNavigation(link("/item/7", { target: "_blank" }), page, false)).toBeUndefined();
    expect(linkNavigation(link("/item/7", { download: true }), page, false)).toBeUndefined();
    expect(linkNavigation(link("mailto:a@example.com"), page, false)).toBeUndefined();
    expect(linkNavigation(link("javascript:void(0)"), page, false)).toBeUndefined();
    expect(linkNavigation(link("#bottom"), page, false)).toBeUndefined();
    expect(linkNavigation(link("/list?page=2#bottom"), page, false)).toBeUndefined();
    expect(linkNavigation(link("/item/7", { target: "_self" }), page, false)).toBe("https://example.com/item/7");
  });

  it("hands GET forms to the wrapper with their fields, and leaves other forms with the page", () => {
    const form = { action: "/search", method: "GET", target: "", entries: [["q", "2 zimmer"], ["sort", "new"]] as Array<[string, string]> };
    expect(formNavigation(form, page)).toBe("https://example.com/search?q=2+zimmer&sort=new");
    expect(formNavigation({ ...form, action: "" }, page)).toBe("https://example.com/list?q=2+zimmer&sort=new");
    expect(formNavigation({ ...form, method: "post" }, page)).toBeUndefined();
    expect(formNavigation({ ...form, target: "_top" }, page)).toBeUndefined();
  });

  it("fetches again only a page the page before it navigated to", () => {
    expect(arrivedByItself("https://example.com/list", "navigate")).toBe(true);
    expect(arrivedByItself("https://example.com/list", undefined)).toBe(true);
    expect(arrivedByItself("", "navigate")).toBe(false);
    expect(arrivedByItself("https://example.com/list", "reload")).toBe(false);
    expect(arrivedByItself("https://example.com/list", "back_forward")).toBe(false);
  });
});
