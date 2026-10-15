# Mobile View: Responsive Device Emulator

A free, open-source, privacy-first mobile simulator and responsive tester for Chrome.

Open the current website or local development server in up to four live device viewports. Save code, reload the previews, switch devices quickly, compare the implementation with a local design, and capture annotated visuals when something needs discussion. There is no account, backend, subscription, telemetry, or automatic upload.

## Everyday workflow

1. Open the extension on the page you are developing.
2. Choose a device preset, recent device, favorite, custom viewport, or saved preset.
3. Keep the workspace open beside your editor and reload one or every preview after changes.
4. Focus a viewport or compare all selected screens in resizable columns.
5. Capture the active viewport or complete workspace, annotate it, and copy or download it for sharing.

## Devices

112 built-in devices, each with its CSS viewport, pixel ratio and an original device frame:

| Category | Presets | Examples |
|---|---:|---|
| iOS phones | 37 | iPhone 5 to iPhone 18 Pro Max, iPhone Air, iPhone Duo (folded and unfolded) |
| Android phones | 49 | Galaxy S, A, Z Flip and Z Fold series, Pixel 5 to Pixel 11 Pro Fold, Motorola, Xiaomi, OnePlus, Zebra |
| Tablets | 10 | iPad mini, iPad Air, iPad Pro, Galaxy Tab, Surface Duo, Toughbook |
| Laptops | 7 | MacBook Air, MacBook Pro, MacBook Neo, Surface Laptop, Dell Latitude |
| Desktops | 2 | iMac 24, Studio Display |
| TVs | 1 | 55-inch 4K smart TV |
| Custom | 3 | Self-service kiosk, wall panel, Apple HomeView smart display |
| Watches | 3 | Apple Watch Series 12 (46mm and 42mm), Apple Watch Ultra 4 |

Phones and tablets rotate where the real device does, and you can add custom viewport sizes. Device names identify the screen sizes being simulated and belong to their owners. The frames are stylised illustrations, not product photos.

## Features

### Live responsive workspace

- Up to four live phone, tablet, laptop, desktop, watch, TV, kiosk, or custom viewports.
- One-click **All devices** view with separate category pages: iOS phones, Android phones, tablets, laptops, desktops, TVs, custom viewports, then watches. Only the selected category mounts and loads previews; switching categories releases the previous page and its pending requests. Returning to a category loads fresh previews. Each page lists the latest devices first. A compact single-row header includes category tabs with counts, loading progress with pause, Retry for incomplete previews, Fast or Gentle loading, and refresh-all, which restores every preview's starting page, fit zoom, and initial browser appearance. Category tabs switch to a selector in smaller windows. Rows show four or five large devices with their name, CSS size, and load status underneath; hovering a device shows its zoom, rotate, reload, enlarge, and options toolbar, and load errors appear above the device. The enlarged popup preserves the live page and grid position and can add the device to the workspace. Safari appearance, browser chrome on scroll, keyboard behavior, device/free view, and scroll/navigation sync use the same preview features as the workspace.
- Fast mode loads up to six device previews in parallel (three for local development servers, which answer over HTTP/1.1 with six connections per host) and starts the next one as soon as a page's HTML is ready, while that page's images and other resources keep loading. Previews share simultaneous website preparation. This avoids exhausting browser resources with hundreds of simultaneous script and stylesheet requests. Website and browser resources determine completion time. Load progress does not rerender unrelated previews, and preview geometry is measured in batches. Offscreen previews suspend browser-chrome color observation until they come into view. Pages near the viewport stay mounted, preserving in-progress loads and page state; pages that have been well outside it for a second are released and reload when scrolled back to, so a category never runs every page at once. Only visible previews participate in synchronized scrolling. Navigation sync also updates offscreen previews within the current category; switching categories carries the current URL when navigation sync is enabled. Returning to the selected-device workspace preserves its live previews. The All devices header offers a remembered Gentle loading mode (two loading slots, at least one second between starts) and pause/resume for pending loads. These controls apply to initial loading, refreshes, and synchronized navigation without remounting existing pages. Already-started requests continue when paused. A page whose HTML is not ready yet keeps its loading slot until it is, or until an explicit retry; retries replace the old document rather than adding more concurrent loads. The installed extension observes script and stylesheet resource errors from document start. A load event alone is not counted as success: resource errors and unverified loads stay marked incomplete, with per-preview reload and Retry incomplete previews controls. These checks cannot prove that every application feature has hydrated correctly. For CAPTCHA or sign-in, open the site in a normal tab, complete verification yourself, then retry an individual preview; some sites still reject embedded previews.
- If the page reloads while the in-page viewer is open (a development server's full reload, or F5), the viewer comes back by itself on the same site, with the All devices view on the same category and scroll position. Closing the viewer stops it returning.
- Each device card includes **Open in tab** for sites that require sign-in or verification. Site security checks can still appear; the extension does not bypass them.
- A compact **Add device** picker with search, a device type filter, starred and recent devices, NEW tags, and one-click set buttons. It stays open in one place while devices are added or switched.
- Built-in and saved device presets with save, delete (built-in presets can be restored), and JSON import and export.
- Custom size creation, reuse, and deletion from the same picker.
- Devices sit on a shared baseline with their name and size underneath. Hovering a device fades in its toolbar: change device, rotate, zoom, reload, focus, fix prompt, options (open in tab, screenshot, browser appearance, reorder), and remove. Drag a device by its frame or the toolbar grip to move it; resetting zoom recentres it.
- **Expand** shows one device with previous/next stepping between your devices; **Focus mode** hides every control, with an All/One switch, device stepping, and zoom in a bar that appears near the bottom edge.
- Each device's toolbar steps to the previous or next device of the same type (for example, iPhone to iPhone) without opening the picker.
- Resizable device columns (double-click a handle to even them out), light and dark themes, and local session restoration.
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
- Compare mode shows one device at a time, chosen from tabs that show which devices have a design.
- **Side by side** places the design next to the live page at the same size, optionally scrolling with the page.
- **Overlay** lays the design over the device screen at its own proportions, matching the screen width from the top, with opacity and a Difference blend to highlight mismatches. **Adjust design** starts on when the overlay opens: handles move it, resize it from a corner or stretch it from an edge, and a panel offers Fit width, Fit screen and Stretch presets plus the exact position and size in CSS pixels. Done or Escape turns it off so the page underneath is usable again.
- Mark a reference with the built-in annotation tools.
- References and overlay settings are stored locally so the workspace can resume later.

### Layout check: find what makes the page scroll sideways

- **Check layout** in the header measures every device in the workspace at once; a device's **Viewport options** menu checks that device alone. Nothing leaves the page: the preview bridge already running inside each frame measures the DOM and answers the viewer.
- It finds the outermost elements that cross the viewport's edge and make the page scroll sideways, including unbroken text that runs past its box. Subtrees that an ancestor clips sideways are not counted, and neither are fixed elements or pages that clip the viewport themselves. Each page lists at most 20 culprits.
- Each culprit is outlined and numbered on the device itself, in page pixels, so the marks scroll and reflow with the page, with a "+N px" pill at the edge it crosses and a hatched strip down that edge. The device caption shows "3 problems" or "Fits", and the device toolbar gains a shortcut to the panel.
- The docked panel lists each element once with every device it fails on and the overrun per device, widest first. Click a row to select it: the mark gets a ring and a label, and every affected device scrolls to it. N and P step through problems. **Fix prompt** opens the fix prompt filled in with what is wrong, the expected behaviour, the selector, the affected devices and a "Layout check findings" section; **Copy selector** copies it.
- With **Check again after each reload** on, a device that reloads is measured again, so the marks follow your edits. The switch is remembered. A preview that cannot answer (blocked, or still loading) is listed as not checked.
- Measurements describe the page as loaded in each preview. Scroll position, animations and content that loads later can change the result.

### Compare before & after

- Open a device's **Viewport options** and choose **Save the "before" picture**. Edit your page, then choose **See what changed** from the menu, or from the compare button that appears in the device toolbar. The enlarged All devices popup offers the same controls.
- Each change is outlined, numbered and listed with a before → after crop of that spot. Click one to zoom in, or step through them with N and P. Switch between Changes, Slider, Before and After, choose how closely to look (Every pixel, Normal, Big changes), or use the "after" picture as the new "before".
- Pictures are stored locally in extension IndexedDB, separately for each URL (including query and fragment), device, orientation and viewport size. **All saved pictures** lists them by page with storage use, and deletes one or all. Storage is limited to 100 pictures and 64 MB; captures are limited to four million pixels.
- Comparisons capture the currently visible webpage viewport. Keep the whole preview visible and use the same scroll position; animations and live content can also show up as changes. If the window size or zoom changed, captures of the same shape are compared at the smaller size, where text edges can differ slightly; a different viewport shape needs a new "before" picture.
- The extension background worker captures and crops the tab, so the website's main thread does no image work. A bundled WebAssembly module (SIMD) compares pixels with a perceptual colour difference (YIQ, as pixelmatch does), ignores anti-aliasing differences at Normal and Big changes, groups changes into areas with exact pixel bounds and packs the overlay mask. Pictures stay on the device.

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

Read the complete [privacy policy](https://edisonaugusthy.github.io/multi-device-viewer/privacy/).

## Limitations

- Browser-internal pages and some restricted sites cannot be previewed.
- Header rules allow many sites to load in subframes, but applications can still block embedding through runtime logic or authentication behavior.
- Responsive viewport simulation is a development aid, not a replacement for final testing on physical devices and target browsers.
- Linked scrolling works best when responsive layouts retain corresponding page or container structure.

## Development

The device frame images are private and are not in this repository. To build or preview with real frames, place them in Git-ignored `internal/artwork/mockups/`. Without them, run `npm run stand-in:mockups` once: it writes plain stand-in frames with the same screen geometry, which is what CI uses.

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

The extension injects a small loader (`entrypoints/content.ts`, about 5 KB) only when the user opens it, using the existing scripting permission. The loader imports the viewer (`viewer.js`, built from `src/app/viewer-mount.ts`) from the extension package; it shares React and the app code with the simulator page instead of bundling a second copy. Ordinary browsing tabs receive only the lightweight preview bridge (`entrypoints/preview-bridge.content.ts`), which does no preview work outside named device frames. Keep React, viewer styles, device catalogs, and translations out of the iframe bridge so each preview does not load the entire application. Browser-chrome color sampling shares style reads within each sample and is limited to ten scheduled samples per second. It stops for hidden tabs, the workspace behind the gallery, and devices without mobile chrome. These limits apply to extension work; live previews still run the website’s own scripts.

## Quality checks and build

```bash
npm run compile
npm test
npm run build
npm run zip
npm run test:e2e
npm run test:extension
npm run validate:chrome-zip -- .output/multi-device-viewer-0.3.0-chrome.zip
```

The production Chrome extension and zip are written to `.output/`.

Development, build, zip, and unit-test commands compile `src/domain/visual-regression/pixel-diff.wat` into `public/wasm/pixel-diff.wasm` using the development-only `wabt` dependency. Run `npm run build:wasm` to regenerate it separately. The extension CSP permits local WASM compilation with `wasm-unsafe-eval`; JavaScript evaluation and remote code remain disallowed.

## Website

The product site in `website/` is rendered by `scripts/site/build.mjs` into `dist-site/`. It shows the real device frames, so it is built on the owner's machine and published to the `gh-pages` branch, which GitHub Pages serves.

```bash
npm run dev:site           # build, then serve at http://localhost:4321/multi-device-viewer/
npm run deploy:site        # refresh store data, build, validate and publish to gh-pages
```

- Pages use clean URLs (`/privacy/`, `/guides/<slug>/`); old `.html` addresses redirect.
- The homepage is translated into every store language from `website/i18n/<locale>.json`; guides and legal pages are English.
- Guide and changelog text lives in `website/content/`.
- The hero demo uses the extension's own frame art and screen geometry from `src/domain/device/device-art-frames.ts`, with `website/public/demo/` loaded live inside each device.
- Publishing refreshes `website/public/data/store.json` from the Chrome Web Store; the page also re-reads it in the browser. If the store cannot be reached, the last saved data is kept.
- To move to a custom domain, set `SITE_ORIGIN` and `SITE_BASE` (for example `https://example.com` and `/`) for the build and add a `CNAME` file to `website/public/`.

## Release process

Chrome Web Store packages are uploaded manually. Before release:

1. Update the version in `package.json` and `wxt.config.ts`.
2. Replace the current entries in `src/app/release-notes.ts` and their translations with accurate user-facing changes. Only the latest release ships in the extension; past notes remain in Git history. Update the first-run tour when adding a feature.
3. Run every quality check and validate the generated zip.
4. Review the store listing copy and the privacy policy.
5. Upload the validated package to the Chrome Web Store.

Fresh installations see the welcome guide. Existing installations see release notes once after an extension update.

## Open source

The source code is licensed under the [MIT License](LICENSE). Issues and contributions are welcome.

Device frame images, brand icons and store and website imagery are covered by the separate [Artwork License](ARTWORK-LICENSE.txt). Reuse requires prior written permission, except for normal use of Mobile View and sharing captures of your own work as described in that license. Third-party rights and earlier permissions are unaffected. The device frame images, their drawings and the tools that produce them are not published; the repository contains only the MIT-licensed screen geometry the extension needs.
