# Shared page-edge rendering fix

7 September 2026

The thin line reported on Android phones/tablets and computers was the same independently rasterized sticky-header edge previously reproduced on iOS. PreviewCard enabled PreviewSurface's physical-pixel edge guard only when the platform was iOS. Pixel 11 Pro, Pixel 11 Pro Fold and MacBook Neo captures reproduced saturated scrolled content showing above the page header. This is sensitive to fractional scaling, including the automatic fit scale.

The guard now applies to every framed device, regardless of OS or hardware type. It seals both page edges and updates with zoom/resize. This change does not alter device dimensions, uniform scaling, browser control locations, website DOM, or scroll position. Free view and frameless previews retain their existing behavior. The existing edge strip is pointer-transparent and may cover decoration in the outermost two to three physical pixel rows; that is the same tradeoff as the prior iOS fix.

## Verified

- Chromium standalone production viewer + preview bridge: all **105 catalog devices**, **188 supported device/orientation combinations**, fit/reduced zoom, unscrolled/scrolled fixture, DPR 1 and 2: **1,504 cases**.
- **18,048 sampled top/bottom edge pixels** show no saturated fixture bleed. The checker allows neutral hardware antialiasing in landscape. This is a seam regression, not certification of every device's physical artwork or native OS browser rendering.
- The same checker fails the saved pre-fix capture (3 failing samples) and passes its post-fix counterpart. Visual inspection confirms the thin colored line disappears above Pixel headers and the MacBook Neo page.
- Header input remains usable, its value survives zoom, and Free/Device switching removes/restores the edge guards.
- TypeScript and all **316 unit tests** pass. Chrome and Firefox packages rebuilt and validated. This pass uses Chromium for visual tests; no claim of physical-device or Firefox visual testing.

Named models covered include Pixel 11 Pro/Pro Fold, Z Flip 3/7/8, Panasonic Toughbook S1, MacBook Neo 13-inch, MacBook Air 13-inch, Dell Latitude 14, modern laptop 15-inch, Studio Display XDR 27-inch and iMac 24-inch. Xiaomi Mi 11i and Galaxy S20 are also covered as unaffected comparison models. `output/playwright/all-device-seams/dpr1/audit.json` and `dpr2/audit.json` contain the exact full model/orientation list.

Evidence: `output/playwright/frame-fit/all-before.png`, `all-after.png`, their `*-audit.json` files, and the full-catalog captures under `output/playwright/all-device-seams/`. Reproduction and checker instructions are in `scripts/header-seam-audit/README.md`.
