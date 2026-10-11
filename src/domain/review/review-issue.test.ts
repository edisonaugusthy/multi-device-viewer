import { describe, expect, it } from "vitest";
import { buildAiReviewPrompt } from "./review-issue";

describe("buildAiReviewPrompt", () => {
  it("includes actionable issue and viewport context", () => {
    const prompt = buildAiReviewPrompt({
      pageUrl: "http://localhost:3000/dashboard",
      summary: "Navigation overlaps the heading",
      expected: "Navigation collapses below the tablet breakpoint.",
      actual: "Navigation links wrap over the heading.",
      reproduction: "Open the dashboard at 390px and scroll to the hero.",
      selector: "header nav",
      notes: "Keep the desktop layout unchanged.",
      devices: [
        { name: "iPhone 17 Pro", width: 402, height: 874, orientation: "portrait" },
        { name: "iPad Air", width: 1180, height: 820, orientation: "landscape" },
      ],
    });

    expect(prompt).toContain("Fix this responsive UI issue in the existing codebase.");
    expect(prompt).toContain("Page: http://localhost:3000/dashboard");
    expect(prompt).toContain("Selector: header nav");
    expect(prompt).toContain("iPhone 17 Pro: 402x874 CSS px (portrait)");
    expect(prompt).toContain("iPad Air: 1180x820 CSS px (landscape)");
    expect(prompt).toContain("smallest maintainable change");
    expect(prompt).toContain("Reproduction steps:");
    expect(prompt).toContain("Verify the expected behavior");
    expect(prompt).toContain("state the blocker instead of guessing");
  });

  it("uses useful fallbacks without inventing private page data", () => {
    const prompt = buildAiReviewPrompt({
      pageUrl: "",
      summary: "",
      expected: "",
      actual: "",
      devices: [],
    });

    expect(prompt).toContain("Page: Current page");
    expect(prompt).toContain("Issue: Responsive layout issue");
    expect(prompt).toContain("Reproduce across the active responsive previews.");
    expect(prompt).not.toContain("Selector:");
  });
});
