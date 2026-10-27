import { describe, expect, it } from "vitest";
import { dataUrlToBytes, safeFileName } from "./preview-capture";

describe("capture files", () => {
  it("names files safely on every system", () => {
    expect(safeFileName("Apple iPhone 18 Pro")).toBe("Apple iPhone 18 Pro");
    expect(safeFileName("MacBook Pro 14-inch (M5)")).toBe("MacBook Pro 14-inch M5");
    expect(safeFileName("Galaxy Z Fold7 / cover")).toBe("Galaxy Z Fold7 cover");
    expect(safeFileName("Café")).toBe("Cafe");
    expect(safeFileName("???")).toBe("capture");
    expect(safeFileName("")).toBe("capture");
  });

  it("decodes a data URL's bytes", () => {
    expect([...dataUrlToBytes("data:image/png;base64,iVBORw==")]).toEqual([0x89, 0x50, 0x4e, 0x47]);
  });
});
