# Multi Device Viewer

A local-first Chrome MV3 extension for testing websites across multiple device viewports without leaving the current tab.

Click the extension icon on any page and a full-screen overlay simulator opens on top — no new tabs, no navigation away. Close it and the page is exactly as you left it.

## Features

- Full-screen overlay on the current tab — stays on the same page.
- Up to four device previews side by side with resizable panels.
- Collapsible left sidebar with controls; per-card device switcher.
- Device catalog covering phones, tablets, laptops, desktops, watches, and TVs.
- Device search, filters, favorites, recents, and custom viewport creation.
- Per-device orientation, zoom, fit, and reload controls.
- Realistic device frame shells (phone, tablet, laptop, desktop, watch).
- "Capture & Annotate" — captures the full simulator view and opens a built-in annotation editor.
- Annotation tools: pen, rectangle, arrow, text (with font size picker), and crop.
- Crop bakes annotations into a new canvas; copy to clipboard or download locally.
- All screenshots and annotations stay on your machine — nothing leaves the browser.

## Development

```bash
npm install
npm run dev
```

Load the unpacked extension from `.output/chrome-mv3/` in Chrome developer mode (`chrome://extensions`).

## Build

```bash
npm run build
npm run zip
```

The production zip lands in `.output/`.

## Release

Manual Chrome Web Store releases use the `Chrome Web Store Release` GitHub Actions workflow. See [docs/chrome-web-store.md](docs/chrome-web-store.md) for listing copy, required GitHub secrets, OAuth setup, and the release checklist.

## Privacy

The extension is entirely local. It does not collect data, contact a backend, or use analytics. See [docs/privacy-policy.md](docs/privacy-policy.md) for the full policy.
