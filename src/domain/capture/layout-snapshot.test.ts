import { describe, expect, it } from "vitest";
import { describeChanges, type LayoutElement } from "./layout-snapshot";

const el = (key: string, label: string, box: Partial<LayoutElement> = {}): LayoutElement => ({
  key, label, x: 10, y: 0, width: 300, height: 40, fontSize: "16px", fontWeight: "400", color: "rgb(23, 37, 30)", background: "rgba(0, 0, 0, 0)", radius: "0px", ...box,
});

describe("layout changes in CSS terms", () => {
  it("names style, size and text changes, and says what pushed an element that moved", () => {
    const before = [
      el("html>body:1>h1:1", "h1.hero-title", { y: 60, fontSize: "44px", height: 92 }),
      el("html>body:1>a:1", "a.cta", { y: 160, radius: "10px", background: "rgb(31, 77, 58)" }),
      el("html>body:1>div:1", ".hero-art", { y: 210, height: 230 }),
      el("html>body:1>section:1", "section.recent", { y: 460, height: 300 }),
      el("html>body:1>section:1>div:1", "div.card", { y: 480 }),
      el("html>body:1>footer:1>p:1", "p.legal", { y: 900, text: "© 2025 orbit" }),
    ];
    const after = [
      el("html>body:1>h1:1", "h1.hero-title", { y: 60, fontSize: "36px", height: 92 }),
      el("html>body:1>a:1", "a.cta", { y: 160, radius: "999px", background: "rgb(47, 107, 82)" }),
      el("html>body:1>div:1", ".hero-art", { y: 210, height: 190 }),
      el("html>body:1>section:1", "section.recent", { y: 420, height: 300 }),
      el("html>body:1>section:1>div:1", "div.card", { y: 440 }),
      el("html>body:1>footer:1>p:1", "p.legal", { y: 860, text: "© 2026 orbit" }),
    ];
    expect(describeChanges(before, after)).toEqual([
      { label: "h1.hero-title", what: "Font size 44 → 36 px", y: 60 },
      { label: "a.cta", what: "Corners 10 → 999 px · Background #1F4D3A → #2F6B52", y: 160 },
      { label: ".hero-art", what: "Height 230 → 190 px", y: 210 },
      { label: "section.recent", what: "Moved up 40 px · by .hero-art", y: 420 },
      { label: "p.legal", what: "“© 2025 orbit” → “© 2026 orbit”", y: 860 },
    ]);
  });

  it("finds nothing when the page did not change, and ignores elements that came or went", () => {
    const page = [el("html>body:1>h1:1", "h1"), el("html>body:1>p:1", "p", { y: 50 })];
    expect(describeChanges(page, page)).toEqual([]);
    expect(describeChanges(page, [...page, el("html>body:1>p:2", "p", { y: 100 })])).toEqual([]);
    expect(describeChanges(page, [el("html>body:1>h1:1", "h2")])).toEqual([]);
  });
});
