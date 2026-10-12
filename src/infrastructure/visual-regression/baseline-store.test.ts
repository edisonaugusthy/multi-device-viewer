import { IDBFactory } from "fake-indexeddb";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { clearBaselines, listBaselines, readBaselineImage, readBaselineMeta, readUsage, writeBaseline, type BaselineRecord } from "./baseline-store";
import { baselineKey, MAX_BASELINE_BYTES, type BaselineIdentity } from "../../domain/visual-regression/visual-regression.types";

const identity: BaselineIdentity = { deviceId: "iphone", url: "https://example.com/page?state=1#route", orientation: "portrait", viewportWidth: 390, viewportHeight: 844 };
const record = (id = identity, png = "png", savedAt = 123): BaselineRecord => ({
  meta: { identity: id, deviceName: "iPhone", savedAt, width: 200, height: 400, crop: { x: 0.5, y: 0, width: 200.5, height: 401 } },
  images: { png: new Blob([png], { type: "image/png" }), preview: new Blob(["jpg"], { type: "image/jpeg" }) },
});
const text = async (blob?: Blob) => blob && new TextDecoder().decode(await blob.arrayBuffer());
beforeEach(() => vi.stubGlobal("indexedDB", new IDBFactory()));
afterEach(() => vi.unstubAllGlobals());
describe("local visual baseline persistence", () => {
  it("persists across connections and replaces only the matching baseline", async () => {
    const other = { ...identity, deviceId: "pixel" };
    await Promise.all([writeBaseline(identity, record()), writeBaseline(other, record(other))]);
    await writeBaseline(identity, record(identity, "new capture"));
    expect(await text(await readBaselineImage(identity, "png"))).toBe("new capture");
    expect(await text(await readBaselineImage(other, "png"))).toBe("png");
    await writeBaseline(identity);
    expect(await readBaselineMeta(identity)).toBeUndefined();
    expect(await readBaselineImage(identity, "png")).toBeUndefined();
    expect((await readBaselineMeta(other))?.deviceName).toBe("iPhone");
  });
  it("keeps metadata apart from images and counts real Blob bytes", async () => {
    const meta = await writeBaseline(identity, record(identity, "12345"));
    expect(meta?.bytes).toBe(5 + 3);
    expect(await readBaselineMeta(identity)).toEqual(meta);
    expect(Object.keys(meta!)).not.toContain("image");
    expect(await readUsage()).toEqual({ count: 1, bytes: 8 });
    await writeBaseline(identity, record(identity, "1"));
    expect(await readUsage()).toEqual({ count: 1, bytes: 4 });
    expect(await text(await readBaselineImage(identity, "preview"))).toBe("jpg");
  });
  it("keeps devices, pages, query strings, routes, orientation and viewport sizes separate", async () => {
    await writeBaseline(identity, record());
    for (const id of [
      { ...identity, deviceId: "pixel" }, { ...identity, url: "https://example.com/other" },
      { ...identity, url: "https://example.com/page?state=2#route" },
      { ...identity, url: "https://example.com/page?state=1#other" },
      { ...identity, orientation: "landscape" as const }, { ...identity, viewportHeight: 800 },
    ]) expect(await readBaselineMeta(id)).toBeUndefined();
    expect(() => baselineKey({ ...identity, url: "file:///secret" })).toThrow("unsupported");
    expect(() => baselineKey({ ...identity, url: "not a url" })).toThrow("unsupported");
  });
  it("lists newest first and clears everything", async () => {
    await writeBaseline(identity, record(identity, "a", 1));
    await writeBaseline({ ...identity, deviceId: "pixel" }, record({ ...identity, deviceId: "pixel" }, "b", 2));
    expect((await listBaselines()).map(meta => meta.identity.deviceId)).toEqual(["pixel", "iphone"]);
    await clearBaselines();
    expect(await listBaselines()).toEqual([]);
    expect(await readUsage()).toEqual({ count: 0, bytes: 0 });
  });
  it("rejects excess captures atomically while allowing replacement and deletion", async () => {
    for (let i = 0; i < 100; i++) {
      const id = { ...identity, deviceId: `device-${i}` };
      await writeBaseline(id, record(id));
    }
    await expect(writeBaseline(identity, record())).rejects.toThrow("storage");
    expect(await readBaselineMeta(identity)).toBeUndefined();
    const first = { ...identity, deviceId: "device-0" };
    await writeBaseline(first, record(first, "replacement"));
    await writeBaseline(first);
    await writeBaseline(identity, record());
    expect(await readBaselineMeta(identity)).toMatchObject({ deviceName: "iPhone" });
  });
  it("rejects a capture that would exceed the byte limit", async () => {
    const huge: BaselineRecord = { ...record(), images: { png: new Blob([new Uint8Array(MAX_BASELINE_BYTES)]), preview: new Blob(["x"]) } };
    await expect(writeBaseline(identity, huge)).rejects.toThrow("storage");
    expect(await readUsage()).toEqual({ count: 0, bytes: 0 });
  });
});
