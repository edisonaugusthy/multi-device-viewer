import { describe, expect, it } from "vitest";
import { normalizeUrl } from "./simulator-service";

describe("normalizeUrl", () => {
  it("keeps an empty URL empty", () => {
    expect(normalizeUrl("   ")).toBe("");
  });
});
