# Zoom containment regression

Start the preview server on port 5174 and open `/entrypoints/preview/index.html` in an isolated Playwright CLI browser session. Pass `check.js` to `run-code` and save its returned JSON under `output/playwright/zoom-columns/`.

The audit uses the real device catalog and preview components with the local header fixture. It seeds only the isolated browser's workspace storage. All 105 presets are tested at actual size in Device and Free views (210 cases). Canvas bounds must stay inside the column and window; hit tests must belong to that column, including near the boundaries.

The 8 September 2026 fix clips only the canvas and gives it explicit zero flex minimums. Toolbars, menus and column resize handles remain outside the clip. The device wrapper cannot flex-shrink; zoom changes its visual scale without distorting its logical viewport. Oversized device edges are cropped at the canvas boundary.

Evidence: `before.png`/`after.png` reproduce the enlarged iPad between an iPhone and MacBook; `catalog.json` records all presets; `interactions.txt` covers zoom buttons, menus, resizing, Device/Free, View only and document continuity. The existing 38 Chromium/Firefox E2E checks and TypeScript compilation also passed.
