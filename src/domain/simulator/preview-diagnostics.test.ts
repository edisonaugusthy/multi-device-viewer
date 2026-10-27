import { describe, expect, it } from "vitest";
import { addProblem, consoleProblem, emptyDiagnostics, errorProblem, fileName, requestProblem, stackLines } from "./preview-diagnostics";

describe("problems in a preview", () => {
  it("names a thrown error by its message and where it was thrown, with the top of its stack", () => {
    const stack = "TypeError: boom\n    at render (https://shop.test/assets/app.js:42:7)\n    at https://shop.test/assets/vendor.js:9:1\n    at a (b.js:1:1)\n    at c (d.js:2:2)";
    expect(errorProblem("TypeError: boom", "https://shop.test/assets/app.js", 42, stack)).toEqual({
      key: "error|TypeError: boom|app.js:42", kind: "error", title: "TypeError: boom", where: "app.js:42",
      stack: ["at render (assets/app.js:42:7)", "at assets/vendor.js:9:1", "at a (b.js:1:1)"],
    });
    expect(errorProblem("  ").title).toBe("Script error");
    expect(stackLines(undefined)).toEqual([]);
  });

  it("joins console arguments the way the console shows them and finds the caller", () => {
    const stack = "Error\n    at console.error (https://shop.test/inject.js:1:1)\n    at load (https://shop.test/assets/cart.js:17:3)";
    expect(consoleProblem("error", ["Cart failed", { id: 3 }, new RangeError("bad")], stack)).toEqual({
      key: "error|Cart failed {\"id\":3} RangeError: bad|cart.js:17", kind: "error", title: "Cart failed {\"id\":3} RangeError: bad", where: "cart.js:17",
    });
    expect(consoleProblem("warning", []).title).toBe("console.warn");
  });

  it("counts the same problem again instead of listing it twice, and caps the list", () => {
    const diagnostics = emptyDiagnostics();
    const problem = errorProblem("Boom", "https://a.test/app.js", 1);
    addProblem(diagnostics, problem, 1);
    addProblem(diagnostics, problem, 2);
    expect(diagnostics.problems).toHaveLength(1);
    expect(diagnostics.problems[0]).toMatchObject({ count: 2, firstAt: 1 });
    for (let i = 0; i < 150; i++) addProblem(diagnostics, errorProblem(`Boom ${i}`));
    expect(diagnostics.problems).toHaveLength(100);
  });

  it("names requests by path on the page's own host and by host elsewhere, with status or failure and the response", () => {
    expect(requestProblem("GET", "https://shop.test/api/cart?x=1", "https://shop.test/", { status: 404, statusText: "Not Found", response: "{\"error\":1}" })).toEqual({
      key: "request|GET /api/cart?x=1|404 Not Found", kind: "request", title: "GET /api/cart?x=1", where: "404 Not Found", status: 404, response: "{\"error\":1}",
    });
    expect(requestProblem("POST", "https://cdn.test/x.js", "https://shop.test/", { errorText: "Failed to fetch" })).toMatchObject({ title: "POST cdn.test/x.js", where: "Failed to fetch" });
    expect(fileName("https://shop.test/assets/logo%20big.png")).toBe("logo big.png");
  });
});
