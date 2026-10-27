/**
 * The CSS rule that makes an element wider than the screen, picked from the
 * styles Chrome's debugger matched to it: the most specific author rule that
 * sets a property able to force a width, with its file and line.
 */
export interface LayoutCause {
  /** The rule's selector, or "style attribute" for inline styles. */
  selector: string;
  /** The declarations that can force the width, as written: "width: 454px". */
  declarations: string;
  /** File and line, "home.css:88", or "" when Chrome does not know where it came from. */
  source: string;
}

interface CssProperty { name: string; value: string; disabled?: boolean; parsedOk?: boolean; implicit?: boolean }
interface CssStyle { cssProperties?: CssProperty[]; range?: { startLine: number } }
interface CssRule { selectorList?: { text?: string }; style?: CssStyle; styleSheetId?: string; origin?: string }
export interface MatchedStyles { inlineStyle?: CssStyle; matchedCSSRules?: Array<{ rule: CssRule }> }
export interface StyleSheetInfo { sourceURL?: string; startLine?: number; isInline?: boolean }

/** Properties that can make an element wider than its container, most telling first. */
const WIDTH_PROPERTIES = [
  "width", "min-width", "inline-size", "min-inline-size", "grid-template-columns", "flex-basis", "flex",
  "margin-left", "margin-right", "margin-inline", "margin", "left", "right", "transform", "white-space", "padding-left", "padding-right", "padding",
];
const LOOSE = /^(auto|0|0px|none|initial|inherit|unset|normal|100%|fit-content|max-content|min-content|stretch)$/i;

/** Declarations in a style that can force a width: fixed lengths, not "auto" or a share of the parent. */
function widthDeclarations(style: CssStyle | undefined): CssProperty[] {
  // Chrome lists an authored declaration and its parsed copy; keep one of each.
  const seen = new Set<string>();
  return (style?.cssProperties ?? []).filter(property =>
    !property.disabled && property.parsedOk !== false && !property.implicit && property.value
    && WIDTH_PROPERTIES.includes(property.name.toLowerCase())
    && !LOOSE.test(property.value.trim())
    && (property.name !== "white-space" || /nowrap|pre/.test(property.value))
    && (!/^margin|^left|^right/.test(property.name) || /-/.test(property.value) || /\d{3,}px/.test(property.value)))
    .filter(property => {
      const key = `${property.name}:${property.value}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/** The file's name, or the host for a page's own address. */
const fileOf = (url: string) => {
  try { const parsed = new URL(url); return parsed.pathname.split("/").filter(Boolean).pop() ?? parsed.host; } catch { return url.split("/").pop() || url; }
};

export function pickLayoutCause(matched: MatchedStyles, sheets: (styleSheetId: string) => StyleSheetInfo | undefined): LayoutCause | null {
  const describe = (properties: CssProperty[]) => properties
    .sort((a, b) => WIDTH_PROPERTIES.indexOf(a.name) - WIDTH_PROPERTIES.indexOf(b.name))
    .map(property => `${property.name}: ${property.value.trim()}`).join("; ");
  const inline = widthDeclarations(matched.inlineStyle);
  if (inline.length) return { selector: "style attribute", declarations: describe(inline), source: "" };
  // Chrome lists matched rules from least to most specific; the last one that sets a width wins.
  for (const { rule } of [...matched.matchedCSSRules ?? []].reverse()) {
    if (rule.origin && rule.origin !== "regular" && rule.origin !== "inspector") continue;
    const properties = widthDeclarations(rule.style);
    if (!properties.length) continue;
    const sheet = rule.styleSheetId ? sheets(rule.styleSheetId) : undefined;
    const line = rule.style?.range ? rule.style.range.startLine + (sheet?.startLine ?? 0) + 1 : undefined;
    const file = sheet?.sourceURL ? fileOf(sheet.sourceURL) : "";
    const source = file ? `${file}${line ? `:${line}` : ""}${sheet?.isInline ? " (inline <style>)" : ""}` : "";
    return { selector: rule.selectorList?.text?.trim() || "", declarations: describe(properties), source };
  }
  return null;
}

/** The rule as one line, the way it would read in the stylesheet. */
export const formatCause = (cause: LayoutCause) => `${cause.selector} { ${cause.declarations}; }`;
