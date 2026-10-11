import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { uiLocaleAssets } from "../../scripts/ui-locale-assets";
import {
  SUPPORTED_LOCALES,
  UI_TRANSLATION_KEYS,
  englishCatalog,
  loadTranslationCatalog,
  normalizeLocale,
  type AppLocale,
  type TranslationCatalog,
} from "./i18n";

const placeholders = (message: string) =>
  [...message.matchAll(/\{(\w+)\}/g)]
    .map((match) => match[1].toLowerCase())
    .sort();

const translationCatalog = (code: AppLocale): TranslationCatalog => code === "en"
  ? englishCatalog
  : JSON.parse(readFileSync(new URL(`./i18n-catalogs/${code}.json`, import.meta.url), "utf8"));

describe("UI localization catalogs", () => {
  afterEach(() => vi.unstubAllGlobals());

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

  it("picks the interface language from the browser language", () => {
    expect(normalizeLocale("id-ID")).toBe("id");
    expect(normalizeLocale("in")).toBe("id");
    expect(normalizeLocale("ms-MY")).toBe("ms");
    expect(normalizeLocale("bn-BD")).toBe("bn");
    expect(normalizeLocale("fa-IR")).toBe("fa");
    expect(normalizeLocale("ur-PK")).toBe("ur");
    expect(normalizeLocale("uk")).toBe("uk");
    expect(normalizeLocale("km-KH")).toBe("km");
    expect(normalizeLocale("si-LK")).toBe("si");
    expect(normalizeLocale("pt-PT")).toBe("pt_BR");
    expect(normalizeLocale("ta-IN")).toBe("en");
    for (const code of ["ar", "fa", "ur"]) expect(SUPPORTED_LOCALES.find(locale => locale.code === code)?.dir).toBe("rtl");
  });

  it("ships one minified catalog file for every non-English locale", () => {
    const assets = uiLocaleAssets();
    expect(assets.map(asset => asset.relativeDest).sort()).toEqual(
      SUPPORTED_LOCALES.filter(({ code }) => code !== "en").map(({ code }) => `ui-locales/${code}.json`).sort(),
    );
    for (const asset of assets) expect(asset.contents).not.toContain("\n");
  });

  it("fetches a language once and never fetches English", async () => {
    const fetchCatalog = vi.fn(async () => new Response(JSON.stringify({ allDevices: "Alle Geräte" })));
    vi.stubGlobal("fetch", fetchCatalog);

    await expect(loadTranslationCatalog("en")).resolves.toBe(englishCatalog);
    const [first, second] = await Promise.all([loadTranslationCatalog("de"), loadTranslationCatalog("de")]);

    expect(first).toEqual({ allDevices: "Alle Geräte" });
    expect(second).toBe(first);
    expect(fetchCatalog).toHaveBeenCalledTimes(1);
    expect(fetchCatalog).toHaveBeenCalledWith("/ui-locales/de.json");
  });

  it("retries a language whose catalog failed to load", async () => {
    const fetchCatalog = vi.fn()
      .mockResolvedValueOnce(new Response("", { status: 404 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ allDevices: "Tous les appareils" })));
    vi.stubGlobal("fetch", fetchCatalog);

    await expect(loadTranslationCatalog("fr")).rejects.toThrow("Missing UI catalog: fr");
    await expect(loadTranslationCatalog("fr")).resolves.toEqual({ allDevices: "Tous les appareils" });
    expect(fetchCatalog).toHaveBeenCalledTimes(2);
  });
});
