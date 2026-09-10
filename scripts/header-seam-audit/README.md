# Sticky/fixed header raster seam regression

This fixture deliberately scrolls saturated stripes behind a white, composited sticky header and a fixed footer. A solid page background cannot expose the bug reported in the Reddit capture.

1. Run `npm run dev:preview -- --host 127.0.0.1 --port 5174`.
2. Open `http://127.0.0.1:5174/entrypoints/preview/index.html` in a Playwright CLI session with a known display density (DPR 2 for Retina, DPR 1 for standard).
3. Create `output/playwright/sticky-header/regression/` and pass the contents of `check.js` to the CLI `run-code` command. This is a local standalone test using the production viewer and preview bridge. It seeds only that test browser's workspace storage.
4. Save the JSON result as `output/playwright/sticky-header/regression/audit.json` alongside the generated captures.
5. Run `python check-pixels.py ../../output/playwright/sticky-header/regression/audit.json --dpr 2` from this folder, using Python with Pillow installed.

The runner covers all catalogued iPhones and iPads, fit/reduced zoom, and unscrolled/scrolled pages. It should fail if the website content shows through the website-header edge. Check the captured images visually as well. Header input/button interactions, browser chrome collapse, Free view, and View only require complementary interaction checks.

The boundary guard intentionally paints three to four physical pixel rows inside the page edge, and overlaps outward into the browser surface. It is pointer-transparent and does not resize or move the iframe or modify the website DOM. It can cover decoration in those outermost pixel rows; it is used for all framed device previews. The guard must not be replaced with an iframe clip: Chromium can move its sticky-layer raster seam to the new clip boundary.

## Full catalog regression

`check-all.js` covers all catalog devices in every supported orientation, fit/reduced zoom and scroll positions 0/130. Run it in separate Playwright CLI sessions at DPR 1 and DPR 2. Create `output/playwright/all-device-seams/dpr1` and `dpr2` first, then save each returned JSON result as `audit.json` in the corresponding folder.

Run `check-all-pixels.py <audit.json> --dpr <density>` using Python with Pillow. It samples two complete display-pixel rows at the top and bottom of each page. The white sticky header/footer must not show the saturated scrolling fixture through their edges. Landscape hardware edges can contribute neutral antialiasing, so this checker allows neutral artwork tint up to 15 RGB levels; it does not assert that hardware pixels are pure white. The original portrait iOS checker remains available for its stricter white-surface check.
