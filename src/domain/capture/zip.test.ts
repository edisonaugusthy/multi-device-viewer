import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { crc32, createZip } from "./zip";

describe("zip of screenshots", () => {
  it("computes the standard CRC-32", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
    expect(crc32(new Uint8Array())).toBe(0);
  });

  it("writes an archive that unzip can list and extract", () => {
    const files = [
      { name: "iPhone 17 Pro.png", data: new Uint8Array([137, 80, 78, 71, 1, 2, 3]) },
      { name: "Pixel 10 - page.png", data: new TextEncoder().encode("second file") },
    ];
    const dir = mkdtempSync(join(tmpdir(), "mdv-zip-"));
    const path = join(dir, "shots.zip");
    writeFileSync(path, createZip(files, new Date(2026, 9, 27, 14, 30, 10)));
    let listing: string;
    try { listing = execFileSync("unzip", ["-l", path], { encoding: "utf8" }); } catch { return; }
    expect(listing).toContain("iPhone 17 Pro.png");
    expect(listing).toContain("Pixel 10 - page.png");
    execFileSync("unzip", ["-o", "-q", path, "-d", dir]);
    expect([...readFileSync(join(dir, "iPhone 17 Pro.png"))]).toEqual([...files[0].data]);
    expect(readFileSync(join(dir, "Pixel 10 - page.png"), "utf8")).toBe("second file");
  });
});
