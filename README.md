# Mobile View: Responsive Device Emulator

A free, open-source, privacy-first mobile simulator and responsive tester for Chrome.

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
- One-click **All devices** view with vertically scrollable sections: iOS phones, Android phones, tablets, laptops, desktops, TVs, custom viewports, then watches. Each section is ordered by CSS viewport width and height. A compact single-row toolbar includes loading progress and refresh-all, which restores every preview's starting page, fit zoom, and initial browser appearance. Category tabs switch to a selector in smaller windows. Responsive rows show up to four taller cards, with device names, CSS dimensions, zoom controls, refresh, and expand in one compact header. The large popup preserves the live page and grid position. Safari appearance, browser chrome on scroll, keyboard behavior, device/free view, and scroll/navigation sync use the same preview features as the workspace.
- Every all-device preview loads in the background through a paced queue, with nearby cards first. Scrolling keeps pages mounted, preserving in-progress loads and page state; only visible previews participate in synchronized scrolling. Navigation sync also updates offscreen previews through the queue. Returning to the selected-device workspace preserves its live previews.
- Each device card includes **Open in tab** for sites that require sign-in or verification. Site security checks can still appear; the extension does not bypass them.
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

### Responsive behavior

- Synchronize scrolling, supported interactions, and navigation across matching previews.
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

### Reviews and feedback

- **Help and feedback** provides direct links to the Chrome Web Store and GitHub issues.
- Regular multi-device testing qualifies for a review request after seven days and five sessions with at least one minute of visible use. No capture or saved layout is required. Requests wait for a quiet pause and stay out of other dialogs and ongoing captures or recordings.
- At most two requests appear. A reminder requires 14 days and three more qualified sessions; **Don't ask again** permanently stops requests.
- Request, postponement, and Store-opening counts are visible in Help and stay on the device. Opening the Store starts a cooldown and does not confirm a submitted review.

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
npm run zip
npm run test:e2e
npm run build:site
npm run validate:chrome-zip -- .output/multi-device-viewer-0.2.11-chrome.zip
```

The production Chrome extension and zip are written to `.output/`.

## Release process

Chrome Web Store packages are uploaded manually. Before release:

1. Update the version in `package.json` and `wxt.config.ts`.
2. Replace the current entries in `src/app/release-notes.ts` and their translations with accurate user-facing changes. Only the latest release ships in the extension; past notes remain in Git history. Update the first-run tour when adding a feature.
3. Run every quality check and validate the generated zip.
4. Review the store listing and privacy declarations in [docs/chrome-web-store.md](docs/chrome-web-store.md).
5. Upload the validated package to the Chrome Web Store.

Fresh installations see the welcome guide. Existing installations see release notes once after an extension update.

## Open source

Licensed under the [MIT License](LICENSE). Issues and contributions are welcome.
