import { describe, expect, it } from "vitest";
import {
  SUPPORTED_LOCALES,
  UI_TRANSLATION_KEYS,
  translationCatalog,
} from "./i18n";

const placeholders = (message: string) =>
  [...message.matchAll(/\{(\w+)\}/g)]
    .map((match) => match[1].toLowerCase())
    .sort();

describe("UI localization catalogs", () => {
  it("contains every UI message in every supported locale", () => {
    const english = translationCatalog("en");

    for (const { code } of SUPPORTED_LOCALES) {
      const catalog = translationCatalog(code);
      expect(Object.keys(catalog).sort()).toEqual([...UI_TRANSLATION_KEYS].sort());

      for (const key of UI_TRANSLATION_KEYS) {
        expect(catalog[key].trim(), `${code}.${key}`).not.toBe("");
        expect(placeholders(catalog[key]), `${code}.${key}`).toEqual(
          placeholders(english[key]),
        );
      }
    }
  });
});
