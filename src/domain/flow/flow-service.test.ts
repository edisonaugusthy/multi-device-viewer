import { describe, expect, it, vi } from "vitest";
import { appendRecordedStep } from "./flow-service";

describe("appendRecordedStep", () => {
  it("keeps only the latest value for consecutive edits to one field", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "step" });
    const first = appendRecordedStep([], { kind: "input", selector: "#email", value: "a" });
    const second = appendRecordedStep(first, { kind: "input", selector: "#email", value: "abc" });
    expect(second).toHaveLength(1);
    expect(second[0]?.value).toBe("abc");
    vi.unstubAllGlobals();
  });

  it("drops printable key events because the input event stores the final value", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "step" });
    expect(appendRecordedStep([], { kind: "keydown", selector: "#email", key: "a" })).toEqual([]);
    vi.unstubAllGlobals();
  });
});
