# iOS header seam validation

## Corrected diagnosis from the Reddit capture

The earlier solid-color audit verified backing colors but missed scrolling content leaking above a composited sticky header. The user's Reddit capture on iPhone 17 Pro, 17e, and 15 Plus demonstrated that the previous fix was incomplete.

A local fixture now reproduces the actual issue: saturated stripes scroll behind a white sticky header with its own compositing layer. Chromium can rasterize the sticky edge separately from the scaled iframe, exposing a thin strip of the content behind it. Changing backing colors does not remove that strip; clipping the iframe can move the seam to the new clip boundary.

`PreviewSurface` paints small, pointer-transparent strips across the top and bottom page boundaries, using the sampled page colors. They overlap outward into the browser surface so their own antialiased edges do not sit on the join. Their size accounts for the measured preview scale and host device-pixel ratio. The implementation does not resize/reload the iframe, alter scrolling, or modify the website DOM. It is enabled only for framed iOS previews.

The strips cover two to three physical pixel rows at the page edge. Decoration in those outermost rows may be covered; this is a presentation guard, not a change to Safari geometry or website CSS. Browser controls and page interactions retain their positions.

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

Reload the updated extension, then close and reopen the viewer. A viewer already mounted on a page can retain the previous content-script code until reopened. The latest Chrome and Firefox 0.2.5 packages contain the shared fix.
