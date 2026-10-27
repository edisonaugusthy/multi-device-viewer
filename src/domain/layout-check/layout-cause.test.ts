import { describe, expect, it } from "vitest";
import { formatCause, pickLayoutCause, type MatchedStyles } from "./layout-cause";

const rule = (selector: string, properties: Array<[string, string]>, startLine = 0, styleSheetId = "s1", origin = "regular") => ({
  rule: { selectorList: { text: selector }, origin, styleSheetId, style: { range: { startLine }, cssProperties: properties.map(([name, value]) => ({ name, value })) } },
});
const sheets = (id: string) => ({ s1: { sourceURL: "http://localhost:5173/src/styles/home.css" }, s2: { sourceURL: "http://localhost:5173/", startLine: 40, isInline: true } } as Record<string, { sourceURL: string; startLine?: number; isInline?: boolean }>)[id];

describe("the rule behind a layout problem", () => {
  it("picks the most specific author rule that forces a width, with its file and line", () => {
    const matched: MatchedStyles = { matchedCSSRules: [
      rule("img", [["max-width", "100%"], ["display", "block"]], 3),
      rule(".hero-art", [["width", "454px"], ["height", "210px"]], 87),
    ] };
    const cause = pickLayoutCause(matched, sheets);
    expect(cause).toEqual({ selector: ".hero-art", declarations: "width: 454px", source: "home.css:88" });
    expect(formatCause(cause!)).toBe(".hero-art { width: 454px; }");
    // Chrome sends an authored declaration together with its parsed copy.
    expect(pickLayoutCause({ matchedCSSRules: [rule(".wide", [["width", "900px"], ["width", "900px"]])] }, sheets)?.declarations).toBe("width: 900px");
  });

  it("skips rules that only size to the container, browser defaults and disabled declarations", () => {
    const matched: MatchedStyles = { matchedCSSRules: [
      rule(".stats-grid", [["grid-template-columns", "repeat(3, 180px)"]], 130),
      rule("div", [["width", "auto"]], 0, "ua", "user-agent"),
      { rule: { selectorList: { text: ".stats-grid.wide" }, origin: "regular", styleSheetId: "s1", style: { range: { startLine: 140 }, cssProperties: [{ name: "width", value: "900px", disabled: true }, { name: "width", value: "100%" }] } } },
    ] };
    expect(pickLayoutCause(matched, sheets)).toEqual({ selector: ".stats-grid", declarations: "grid-template-columns: repeat(3, 180px)", source: "home.css:131" });
  });

  it("names inline styles and inline <style> blocks, and finds nothing when no rule forces a width", () => {
    expect(pickLayoutCause({ inlineStyle: { cssProperties: [{ name: "min-width", value: "520px" }] } }, sheets)).toEqual({ selector: "style attribute", declarations: "min-width: 520px", source: "" });
    expect(pickLayoutCause({ matchedCSSRules: [rule("h1", [["white-space", "nowrap"]], 2, "s2")] }, sheets)).toEqual({ selector: "h1", declarations: "white-space: nowrap", source: "localhost:5173:43 (inline <style>)" });
    expect(pickLayoutCause({ matchedCSSRules: [rule("p", [["color", "red"], ["margin", "0 auto"]])] }, sheets)).toBeNull();
  });
});
