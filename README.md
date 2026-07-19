# Mobile View & Responsive Tester

A free, open-source, privacy-first Chrome and Firefox extension for keeping responsive previews beside your frontend development workflow.

Open the current website or local development server in up to four live device viewports. Save code, reload the previews, switch devices quickly, compare the implementation with a local design, and capture annotated visuals when something needs discussion. There is no account, backend, subscription, telemetry, or automatic upload.

## Everyday workflow

1. Open the extension on the page you are developing.
2. Choose a quick device set, recent device, favorite, custom viewport, or saved set.
3. Keep the workspace open beside your editor and reload one or every preview after changes.
4. Focus a viewport or compare all selected screens in resizable columns.
5. Capture the active viewport or complete workspace, annotate it, and copy or download it for sharing.

## Features

### Live responsive workspace

- Up to four live phone, tablet, laptop, desktop, watch, TV, kiosk, or custom viewports.
- Categorized device chooser with search, latest devices first, favorites, and recents.
- Quick comparison sets and locally saved device sets with JSON import and export.
- Custom viewport creation, reuse, and deletion.
- Per-viewport device switching, orientation, fit/custom zoom, reload, focus, reorder, and removal.
- Resizable viewport columns, collapsible workspace setup, dark interface, and local session restoration.
- Reload-all control with clear loading feedback.

### Linked page review

- Optional synchronized page scrolling across previews.
- The active viewport initializes linked scrolling; refreshing another preview does not reset the group.
- Matching nested scroll containers are synchronized when the responsive layouts share the same structure.
- Supported clicks and form interactions are mirrored while linked scrolling is active.
- Optional navigation sync keeps matching previews on the same page.

### Responsive behavior and handoff

- Synchronize scrolling, supported interactions, and navigation across matching previews.
- Generate a local QR code for physical-device handoff.
- Prepare a structured AI fix prompt with reproduction steps, constraints, device context, and verification requirements.

### Design comparison

- Drop, paste, or choose PNG, JPG, WebP, or SVG design references.
- Assign a separate reference to each viewport.
- Compare beside the live page or use an adjustable overlay.
- Resize, stretch, reposition, change opacity, reset, and lock overlays before interacting with the page underneath.
- Zoom and freely reposition the design inside the reference panel.
- Mark a reference with the built-in annotation tools.
- References and overlay settings are stored locally so the workspace can resume later.

### Capture and communication

- Capture the active viewport or complete multi-device workspace.
- Annotate with pen, rectangle, arrow, text, and crop tools.
- Copy the result to the clipboard or download it locally.
- Record the source tab when a short video explains the behavior better than a still image.
- Generate a structured fix prompt containing the URL, selected devices, dimensions, orientation, expected result, and actual result. The extension only prepares the text; it never sends it to an AI service.

## Privacy

- No accounts, analytics, telemetry, advertising, remote logging, or behavioral tracking.
- URLs, page content, screenshots, recordings, prompts, designs, presets, and settings are not sent to a backend.
- Preferences and resumable workspace state are stored only in browser-local extension storage.
- Screenshots and recordings are created only after an explicit user action.
- Clipboard and download access are used only when the user chooses those actions.

Read the complete [privacy policy](docs/privacy-policy.md).

## Limitations

- Browser-internal pages and some restricted sites cannot be previewed.
- Header rules allow many sites to load in subframes, but applications can still block embedding through runtime logic or authentication behavior.
- Responsive viewport simulation is a development aid, not a replacement for final testing on physical devices and target browsers.
- Linked scrolling works best when responsive layouts retain corresponding page or container structure.

## Development

```bash
npm install
npm run dev
```

Load `.output/chrome-mv3/` as an unpacked extension from `chrome://extensions`.

For Firefox Manifest V3 development:

```bash
npm run dev:firefox
```

Or run `npm run build:firefox`, open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select `.output/firefox-mv3/manifest.json`.

For the standalone simulator UI preview:

```bash
npm run dev:preview
```

Then open [http://localhost:5173/](http://localhost:5173/). Extension-only capture, recording, tab, and overlay behavior is unavailable in this standalone preview.

## Quality checks and build

```bash
npm run compile
npm test
npm run build
npm run build:firefox
npm run zip
npm run zip:firefox
npm run test:e2e
npm run build:site
npm run validate:chrome-zip -- .output/multi-device-viewer-0.2.0-chrome.zip
npm run validate:firefox-zip -- .output/multi-device-viewer-0.2.0-firefox.zip
```

The production Chrome and Firefox extensions and zips are written to `.output/`. Firefox packaging also creates the source archive required for Mozilla review. Firefox source-tab recording uses Firefox's native screen/tab picker instead of Chrome's offscreen recording API.

## Release process

Chrome Web Store and Firefox Add-ons packages are uploaded manually. Before release:

1. Update the version in `package.json` and `wxt.config.ts`.
2. Add accurate user-facing changes to `src/app/release-notes.ts`.
3. Run every quality check and validate the generated zip.
4. Review the store listing and privacy declarations in [docs/chrome-web-store.md](docs/chrome-web-store.md) and [docs/firefox-add-ons.md](docs/firefox-add-ons.md).
5. Upload the validated browser package to its store. For Firefox, upload both the add-on zip and matching source archive.

Fresh installations see the welcome guide. Existing installations see release notes once after an extension update.

## Open source

Licensed under the [MIT License](LICENSE). Issues and contributions are welcome.
