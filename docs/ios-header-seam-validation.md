# iOS header seam validation

## Translucent header correction, September 12, 2026

The remaining line on iPhone 18 Pro, Pro Max, and Duo was a sticky-layer raster seam, separate from the frame artwork. Extensiq uses a 95% opaque, blurred header. The iOS 27 guard required exactly 100% background opacity, while the 17 Pro already sealed the same edge using its sampled page color. `translucent.html` reproduces the exposed scrolling stripes on both 18 models before the fix.

Full-width pinned headers and footers with background alpha of at least 0.9 now receive the existing seam guard, composited against the page background. Transparent overlays and surfaces that scroll away remain unguarded. This only paints the existing narrow boundary strips; it does not change the website header, iframe size, or scroll position.

Validation: 64 device/orientation/zoom/scroll cases at DPR 1 and 2 passed the boundary pixel check (768 samples). The browser regression covers all four new devices, header input, 50% transparent overlays, and guard removal after the header stops being pinned. All 342 unit tests, three targeted browser tests, TypeScript, and the extension build passed. Evidence: `output/playwright/translucent-header/`.

## Corrected diagnosis from the Reddit capture

The earlier solid-color audit verified backing colors but missed scrolling content leaking above a composited sticky header. The user's Reddit capture on iPhone 17 Pro, 17e, and 15 Plus demonstrated that the previous fix was incomplete.

A local fixture now reproduces the actual issue: saturated stripes scroll behind a white sticky header with its own compositing layer. Chromium can rasterize the sticky edge separately from the scaled iframe, exposing a thin strip of the content behind it. Changing backing colors does not remove that strip; clipping the iframe can move the seam to the new clip boundary.

`PreviewSurface` paints small, pointer-transparent strips across the top and bottom page boundaries, using the sampled page colors. They overlap outward into the browser surface so their own antialiased edges do not sit on the join. Their size accounts for the measured preview scale and host device-pixel ratio. The implementation does not resize/reload the iframe, alter scrolling, or modify the website DOM. It is enabled only for framed iOS previews.

The strips cover two to three physical pixel rows at the page edge. Decoration in those outermost rows may be covered; this is a presentation guard, not a change to Safari geometry or website CSS. Browser controls and page interactions retain their positions.

## iPhone 18 follow-up, September 10, 2026

The neutral-chrome change initially bypassed `PreviewSurface` for iPhone 18 Pro, Pro Max, and both Duo postures. That removed the blue browser tint but also removed the existing sticky-header seam protection. The scrolling-stripe fixture reproduced 17 colored boundary samples in 32 standard-density cases before this correction.

These devices now seal only opaque, full-width sticky/fixed page headers and footers. The bridge identifies the pinned surface separately from ordinary scrolling content, and `PreviewSurface` refreshes its pixel alignment when those colors arrive. Safari/status surfaces retain their neutral colors; a blue post scrolling to the edge does not create a blue guard strip. Free view remains unguarded.

Validation: 96 device/orientation/zoom/scroll cases passed the boundary pixel check: 32 standard-density light, 32 Retina light, and 32 Retina dark. Header input and button interactions, guard recovery after a header becomes sticky again, and an unpinned blue-content case also passed. These use the local production UI and preview bridge, not physical Safari.

Device screenshots now use the dedicated device capture bounds, round both edges at the captured pixel density, and omit the annotation export's extra metadata banner. Eight PNG exports (four devices at two densities) retained the canvas pixels and exact crop dimensions. Browser screenshots supplied the pixels for this transport-level test; it does not establish native `activeTab` capture permission behavior. iPhone 18 Pro is the mobile preset for fresh startup, adding a device, and the quick device sets.

Evidence: `output/playwright/iphone18-finish/`. TypeScript and 343 unit tests passed.

## Verified September 7, 2026

- Retina Chromium: all 33 iPhone and six iPad presets, fit/reduced zoom and scroll positions 0/130: **156 sticky-header cases passed**, with no colored content in the sampled header boundary.
- Standard-density Chromium: iPhone 17 Pro, 17e, 15 Plus, 14, and 13 Pro Max: **20 cases passed**.
- Header clicks and typing work; zoom retains the live document; Free view has no boundary strips; View only retains the iframe.
- TypeScript and all **316 unit tests** passed.

Reproducer and pixel checker: `scripts/header-seam-audit/`. Evidence: `output/playwright/sticky-header/regression/`, `standard/`, and matching `before.png` / `after.png`. The earlier `ios-header-audit` evidence is historical and cannot establish sticky-header correctness. These checks use the actual extension UI and preview bridge in a local standalone viewer, not physical Safari devices.

## Retest list

| iPhone preset | Scrolling and zoom cases |
| --- | --- |
| Apple iPhone 11 | 4 passed |
| Apple iPhone 11 Pro | 4 passed |
| Apple iPhone 11 Pro Max | 4 passed |
| Apple iPhone 12 | 4 passed |
| Apple iPhone 12 Mini | 4 passed |
| Apple iPhone 12 Pro | 4 passed |
| Apple iPhone 12 Pro Max | 4 passed |
| Apple iPhone 13 | 4 passed |
| Apple iPhone 13 Mini | 4 passed |
| Apple iPhone 13 Pro | 4 passed |
| Apple iPhone 13 Pro Max | 4 passed |
| Apple iPhone 14 | 4 passed |
| Apple iPhone 14 Plus | 4 passed |
| Apple iPhone 14 Pro | 4 passed |
| Apple iPhone 14 Pro Max | 4 passed |
| Apple iPhone 15 | 4 passed |
| Apple iPhone 15 Plus | 4 passed |
| Apple iPhone 15 Pro | 4 passed |
| Apple iPhone 15 Pro Max | 4 passed |
| Apple iPhone 16 | 4 passed |
| Apple iPhone 16 Plus | 4 passed |
| Apple iPhone 16 Pro | 4 passed |
| Apple iPhone 16 Pro Max (2024) | 4 passed |
| Apple iPhone 16e | 4 passed |
| Apple iPhone 17 | 4 passed |
| Apple iPhone 17 Pro | 4 passed |
| Apple iPhone 17 Pro Max (2025) | 4 passed |
| Apple iPhone 17e | 4 passed |
| Apple iPhone 5 | 4 passed |
| Apple iPhone Air (2025) | 4 passed |
| Apple iPhone SE (1st generation) | 4 passed |
| Apple iPhone X | 4 passed |
| Apple iPhone XR | 4 passed |

## Loading the fix

Reload the updated extension, then close and reopen the viewer. A viewer already mounted on a page can retain the previous content-script code until reopened. The latest Chrome 0.2.5 packages contain the shared fix.
