# Multi Device Viewer

A local-first Chrome MV3 extension for testing websites across multiple device viewports. It is designed as a free alternative workflow for responsive testing: no backend, no login, no subscription, no telemetry, and no server pricing.

## Features

- Dedicated simulator tab launched from the extension popup.
- Single preview and compare mode with up to four devices.
- Device catalog for phones, tablets, laptops, desktops, watches, and TVs.
- Device search, filters, favorites, recents, and custom viewport creation.
- Per-device orientation, zoom, fit, reload, and screenshot controls.
- Right-side device panel with Features, Report, Free transparent PNG, and Info sections.
- Local screenshot export and annotation board.
- Packaged mockup asset support for transparent PNG device frames.

## Development

```bash
npm install
npm run generate:icons
npm run dev
```

Load the development extension from `.output/chrome-mv3` in Chrome developer mode.

## Build

```bash
npm run compile
npm run build
npm run zip
```

## Chrome Web Store Release

Manual Chrome Web Store releases are handled by the `Chrome Web Store Release` GitHub Actions workflow. See [docs/chrome-web-store.md](docs/chrome-web-store.md) for the listing copy, required GitHub secrets, OAuth setup, and release checklist.

## Local-Only Policy

The extension ships all catalog data and supported mockups as packaged assets. It does not require a backend. Network activity is limited to the website URL the user chooses to preview.
