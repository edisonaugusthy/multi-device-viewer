# Mobile View & Responsive Tester

A free, open-source, local-first Chrome extension for testing responsive websites across phone, tablet, laptop, desktop, watch, TV, and custom viewports without leaving the current tab.

Open the extension on a public site or local development server, compare up to four live previews, develop against an imported design reference, capture evidence, or generate a detailed prompt for your coding agent. No account, backend, subscription, telemetry, or upload is required.

## Core workflows

### Test responsive layouts

- Open the current page in a full-screen responsive testing workspace.
- Compare up to four resizable device previews side by side.
- Use realistic phones, tablets, laptops, desktops, watches, TVs, or custom CSS viewport sizes.
- Synchronize scrolling and supported interactions across active previews.

### Build against a design while testing live

- Drop, paste, or choose a PNG, JPG, WebP, or SVG exported from Figma or another design tool.
- Assign a separate reference design to each active device viewport.
- Keep the current website running in the real, interactive device previews on the right.
- Compare side by side or place the design over the matching live viewport with adjustable opacity.
- Resize or zoom the reference panel and drag the enlarged preview to pan it. Press and drag to move or independently stretch an overlay's width and height above the device canvas, then lock it to continue interacting with the live page.
- Use **Mark feedback** to annotate a reference when documenting a review or manual test result.
- Imported references remain in memory for the current viewer session and are never uploaded.

### Generate a prompt for an AI coding tool

- Click **Generate AI fix prompt**.
- Describe the issue, expected behavior, actual behavior, and optional CSS selector.
- The extension adds the current URL, device names, viewport dimensions, and orientation.
- Copy the generated instructions into Codex, Copilot, Cursor, Claude, or another coding tool. The extension generates the prompt; it does not send it or produce the code change itself.

### Capture and annotate

- Capture the complete multi-device workspace.
- Add pen, rectangle, arrow, text, and crop annotations.
- Copy the result to the clipboard or download it locally.

## Features

- Full-screen overlay on the current tab — stays on the same page.
- Up to four device previews side by side with resizable panels.
- Collapsible left sidebar with controls; per-card device switcher.
- Device catalog covering phones, tablets, laptops, desktops, watches, and TVs, including newer 2025 iPhone profiles.
- Device search, filters, favorites, recents, and custom viewport creation.
- Built-in layout presets plus saved custom presets with JSON import/export.
- Per-device orientation, zoom, fit, and reload controls.
- Scroll synchronization for comparing long responsive pages.
- Dark mode for low-glare testing.
- Realistic device frame shells (phone, tablet, laptop, desktop, watch).
- Chrome context-menu shortcut to open the current tab directly in Responsive Tester.
- Reference-image and live-device before/after comparison for manual testing.
- Generated AI fix prompts with active URL and device context.
- "Capture & Annotate" — captures the full simulator view and opens a built-in annotation editor.
- Annotation tools: pen, rectangle, arrow, text (with font size picker), and crop.
- Crop bakes annotations into a new canvas; copy to clipboard or download locally.
- All screenshots and annotations stay on your machine — nothing leaves the browser.

## Privacy and limitations

- No accounts, analytics, telemetry, advertising trackers, remote logging, or behavioral event collection.
- URLs, screenshots, prompts, presets, and visual comparisons are not uploaded.
- The toolbar badge shows a green `ON` indicator only while the responsive-testing overlay is active in that tab.
- Some browser-internal pages and sites with additional embedding restrictions cannot be previewed.
- Viewport simulation helps find responsive layout issues, but final release testing on real devices and browsers is still recommended.

## Development

```bash
npm install
npm run dev
```

Load the unpacked extension from `.output/chrome-mv3/` in Chrome developer mode (`chrome://extensions`).

### Standalone Codex preview

To view the simulator UI as a regular website in Codex's in-app browser, run:

```bash
npm run dev:preview
```

Then open [http://localhost:5173/](http://localhost:5173/) in the browser. This preview uses browser storage and download fallbacks; Chrome-extension-only capture, recording, and tab controls remain disabled.

## Build

```bash
npm run build
npm run zip
npm run test
npm run compile
npm run validate:chrome-zip -- .output/multi-device-viewer-0.1.4-chrome.zip
```

The production zip lands in `.output/`.

## Release

Chrome Web Store releases are prepared and uploaded manually. See [docs/chrome-web-store.md](docs/chrome-web-store.md) for listing copy and the manual release checklist.

## Privacy

The extension is entirely local. It does not collect data, contact a backend, use analytics, or track user behavior. See [docs/privacy-policy.md](docs/privacy-policy.md) for the full policy.
