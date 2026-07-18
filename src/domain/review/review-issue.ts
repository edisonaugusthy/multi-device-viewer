export interface ReviewDevice {
  name: string;
  width: number;
  height: number;
  orientation: "portrait" | "landscape";
}

export interface ResponsiveIssue {
  pageUrl: string;
  summary: string;
  expected: string;
  actual: string;
  reproduction?: string;
  selector?: string;
  notes?: string;
  devices: ReviewDevice[];
}

function optionalLine(label: string, value?: string): string[] {
  const trimmed = value?.trim();
  return trimmed ? [`${label}: ${trimmed}`] : [];
}

export function buildAiReviewPrompt(issue: ResponsiveIssue): string {
  const devices = issue.devices
    .map((device) => `- ${device.name}: ${device.width}x${device.height} CSS px (${device.orientation})`)
    .join("\n");

  return [
    "Fix this responsive UI issue in the existing codebase.",
    "",
    `Page: ${issue.pageUrl || "Current page"}`,
    `Issue: ${issue.summary.trim() || "Responsive layout issue"}`,
    ...optionalLine("Selector", issue.selector),
    "",
    "Expected behavior:",
    issue.expected.trim() || "The layout should remain usable and visually consistent at the listed viewports.",
    "",
    "Actual behavior:",
    issue.actual.trim() || "The layout breaks or differs from the expected result.",
    ...optionalSection("Reproduction steps", issue.reproduction),
    "",
    "Affected viewports:",
    devices || "- Reproduce across the active responsive previews.",
    ...optionalSection("Constraints and context", issue.notes),
    "",
    "Implementation requirements:",
    "1. Inspect the existing implementation and styling conventions before editing.",
    "2. Identify and fix the root cause, not only the visible symptom.",
    "3. Make the smallest maintainable change and avoid unrelated refactors.",
    "4. Reuse existing components, tokens, and responsive patterns.",
    "5. Preserve behavior at unaffected viewports and add or update focused tests when practical.",
    "",
    "Verification:",
    "- Reproduce the original failure at every affected viewport listed above.",
    "- Verify the expected behavior at those viewports and at adjacent breakpoints.",
    "- Run the relevant type, unit, and browser checks available in the repository.",
    "",
    "In your final response, summarize the root cause, list the files changed, and report the exact verification performed. If essential information is unavailable after inspecting the codebase, state the blocker instead of guessing.",
  ].join("\n");
}

function optionalSection(label: string, value?: string): string[] {
  const trimmed = value?.trim();
  return trimmed ? ["", `${label}:`, trimmed] : [];
}
