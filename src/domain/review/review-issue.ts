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
    "Fix this responsive UI issue.",
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
    "",
    "Affected viewports:",
    devices || "- Reproduce across the active responsive previews.",
    ...optionalLine("Additional context", issue.notes),
    "",
    "Please identify the root cause, make the smallest maintainable fix, preserve behavior at unaffected breakpoints, and describe how you verified the result.",
  ].join("\n");
}
