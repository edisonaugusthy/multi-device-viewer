import { describe, expect, it } from "vitest";
import {
  addDownload, addProblem, consoleProblem, downloadType, emptyDiagnostics, exceptionProblem, fileName, requestProblem, requestTitle, stackLine,
} from "./preview-diagnostics";

describe("preview problems", () => {
  it("names a thrown error by its message and where it was thrown, with the top of its stack", () => {
    const problem = exceptionProblem({
      text: "Uncaught",
      exception: { description: "TypeError: Cannot read properties of undefined (reading 'map')\n    at ProjectList (http://localhost:5173/src/components/ProjectList.jsx:48:22)" },
      stackTrace: { callFrames: [
        { functionName: "ProjectList", url: "http://localhost:5173/src/components/ProjectList.jsx", lineNumber: 47, columnNumber: 21 },
        { functionName: "renderWithHooks", url: "http://localhost:5173/node_modules/react-dom.js", lineNumber: 15485, columnNumber: 17 },
        { functionName: "a", url: "http://localhost:5173/a.js", lineNumber: 0, columnNumber: 0 },
        { functionName: "b", url: "http://localhost:5173/b.js", lineNumber: 0, columnNumber: 0 },
      ] },
    });
    expect(problem).toMatchObject({ kind: "error", title: "TypeError: Cannot read properties of undefined (reading 'map')", where: "ProjectList.jsx:48" });
    expect(problem.stack).toEqual(["at ProjectList (src/components/ProjectList.jsx:48:22)", "at renderWithHooks (node_modules/react-dom.js:15486:18)", "at a (a.js:1:1)"]);
    expect(exceptionProblem({ text: "Uncaught", exception: { value: "plain string thrown" } }).title).toBe("plain string thrown");
    expect(stackLine({ url: "https://example.com/app.js", lineNumber: 1, columnNumber: 2 })).toBe("at app.js:2:3");
  });

  it("counts the same problem again instead of listing it twice, and caps the list", () => {
    const diagnostics = emptyDiagnostics();
    const problem = requestProblem("GET", "http://localhost:5173/api/projects?layout=compact", "http://localhost:5173/projects", { status: 500, statusText: "Internal Server Error" });
    addProblem(diagnostics, problem, 1);
    addProblem(diagnostics, problem, 2);
    expect(diagnostics.problems).toHaveLength(1);
    expect(diagnostics.problems[0]).toMatchObject({ title: "GET /api/projects?layout=compact", where: "500 Internal Server Error", status: 500, count: 2, firstAt: 1 });
    for (let n = 0; n < 200; n++) addProblem(diagnostics, consoleProblem("warning", [{ value: `warning ${n}` }]));
    expect(diagnostics.problems).toHaveLength(100);
  });

  it("names requests by path on the page's own host and by host elsewhere, and network failures by Chrome's reason", () => {
    expect(requestTitle("POST", "https://api.example.com/v1/items", "https://example.com/")).toBe("POST api.example.com/v1/items");
    expect(requestProblem("GET", "https://cdn.example.com/font.woff2", "https://example.com/", { errorText: "mixed-content" })).toMatchObject({ where: "mixed-content", status: undefined });
    expect(consoleProblem("error", [{ value: "Failed:" }, { type: "object", description: "Error: boom" }], { url: "https://example.com/js/app.js", lineNumber: 9 }))
      .toMatchObject({ kind: "error", title: "Failed: Error: boom", where: "app.js:10" });
  });
});

describe("download size", () => {
  it("adds up bytes by kind of file and keeps the largest files by name", () => {
    const diagnostics = emptyDiagnostics();
    addDownload(diagnostics, "https://example.com/img/hero.avif", "Image", 420_000);
    addDownload(diagnostics, "https://example.com/js/vendor.js?v=3", "Script", 390_000);
    addDownload(diagnostics, "https://example.com/css/app.css", "Stylesheet", 20_000);
    addDownload(diagnostics, "https://example.com/fonts/inter.woff2", "Font", 118_000);
    addDownload(diagnostics, "https://example.com/api", "Fetch", 2_000);
    addDownload(diagnostics, "https://example.com/cached.png", "Image", 0);
    expect(diagnostics.download).toMatchObject({ bytes: 950_000, requests: 6, byType: { image: 420_000, script: 390_000, style: 20_000, font: 118_000, other: 2_000 } });
    expect(diagnostics.download.largest.map(file => file.url)).toEqual(["hero.avif", "vendor.js", "inter.woff2", "app.css", "api"]);
    expect(downloadType("Media")).toBe("image");
    expect(fileName("https://example.com/")).toBe("example.com");
  });
});
