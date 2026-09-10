# iPad and MacBook header/frame alignment

Validated locally on 7 September 2026.

The iPad Pro 13-inch (M4) Safari backdrop-filter painted a thin step outside the left screen edge at fractional preview scales. Its screen now has an explicit compositor clip in addition to rounded overflow clipping. Its 26px artwork corner radius is retained in both orientations. The shared image-screen clipping also contains filtered browser layers on other image-backed devices; existing notch paths are preserved.

The MacBook Pro 14-inch (M5) inherited a 1728 × 1085 screen rectangle from the shared 16-inch artwork. Uniformly fitting its 1512 × 982 logical display left 28.7 artwork pixels of white backing on each side. It now has its own 1728 × 1122.286 screen rectangle within the artwork's black panel, below the camera, with a rounded clip. The browser and page fill that rectangle with uniform scaling. The decorative artwork remains shared; this is not a new manufacturer-specific hardware asset.

The CSS display sizes remain 1032 × 1376 (iPad portrait), 1376 × 1032 (landscape), and 1512 × 982 (MacBook). Browser controls continue to reserve their height within those display sizes. No page stretching, navigation, login, or toolbar placement changes were made.

## Validation

- Chromium standalone viewer using the production preview bridge and sticky-header fixture: 36 device cases across DPR 1/2, light/dark UI, fit/reduced/enlarged zoom, and both iPad orientations.
- Every case checks that the logical display fills the screen and that browser-header and iframe widths/left edges match.
- 72 screenshot edge samples pass at fit/reduced zoom in light UI. Dark chrome lacks sufficient contrast for this pixel check; enlarged previews can extend beyond the workspace, so their geometry is checked without claiming full edge visibility.
- The prior sticky-header raster regression passes all 156 cases across 39 iPhones/iPads at DPR 2.
- TypeScript and all 316 unit tests pass. Chrome archives rebuilt and package validators run. Physical Apple devices were not tested in this pass.

Re-run `scripts/frame-fit-audit/check.js` through the Playwright CLI against `npm run dev:preview -- --host 127.0.0.1 --port 5174`. Save its result as JSON beside the screenshots under `output/playwright/frame-fit`. Run `scripts/frame-fit-audit/check-pixels.py` with those JSON paths using Python with Pillow.

Evidence: `output/playwright/frame-fit/before.png`, `after.png`, `ipad-corner-before.png`, `ipad-corner-after.png`, `audit-dpr1.json`, `audit-dpr2.json`, and `ios-regression/audit.json`.

Manual retest: iPad Pro 13-inch (M4), portrait and landscape; MacBook Pro 14-inch (M5), fit and custom zoom. Inspect the outer header edges and scroll a page with a sticky header.
