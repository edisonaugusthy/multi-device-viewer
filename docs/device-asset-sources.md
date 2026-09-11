# Device asset sources

Device frames must come from a manufacturer-owned product or press source. Do not use a generic frame for a named device and do not use generated artwork.

The derived PNGs below only crop the official front render, isolate it from any companion rear render, scale it for the simulator, and remove the studio background. The product body, bezel, hinge, buttons, cameras, and display proportions are not redrawn.

## Samsung 2026 devices

Geometry reference: [Samsung Galaxy Z Fold8 Ultra, Fold8 and Flip8 specifications](https://news.samsung.com/global/samsung-galaxy-z-fold8-ultra-fold8-and-flip8foldables-perfected-for-every-way-of-living)

| Simulator asset | Official collection | Official source file | SHA-256 |
| --- | --- | --- | --- |
| `samsung-galaxy-z-fold8-folded.png` | [Galaxy Z Fold8](https://www.samsungmobilepress.com/media-assets/galaxy-z-fold8) | `016-galaxy-zfold8-graphite-front.jpg` | `a04cf8fb437cd63d8b5d7f68bb7c72f4c6a4893e7b102746ba79ba04256d1956` |
| `samsung-galaxy-z-fold8-unfolded.png` | [Galaxy Z Fold8](https://www.samsungmobilepress.com/media-assets/galaxy-z-fold8) | `018-galaxy-zfold8-graphite-open-front.jpg` | `3b3b9219a6fac97018ccf2c1f705d7797d7648f07f793187bae491cd738e98e6` |
| `samsung-galaxy-z-fold8-ultra-folded.png` | [Galaxy Z Fold8 Ultra](https://www.samsungmobilepress.com/media-assets/galaxy-z-fold8-ultra) | `003-product-galaxy-zfold8-ultra-violetshadow-front.jpg` | `4bee092c6b11d64a6929b52a746cb937a97e41401f0affd9f6b1790aab3658b5` |
| `samsung-galaxy-z-fold8-ultra-unfolded.png` | [Galaxy Z Fold8 Ultra](https://www.samsungmobilepress.com/media-assets/galaxy-z-fold8-ultra) | `006-product-galaxy-zfold8-ultra-violetshadow-open-front.jpg` | `c843df7c862ab8a116523cc1571673666e2ff596f75389e3e260fd6bb0af1176` |
| `samsung-galaxy-z-flip8-folded.png` | [Galaxy Z Flip8](https://www.samsungmobilepress.com/media-assets/galaxy-z-flip8) | `013-galaxy-zflip8-graphite-closed-front.jpg` | `c0b773f5d1b25d2d818b2aa4022c97a5615dafe415128bf61edaa8bc716a18c2` |
| `samsung-galaxy-z-flip8-unfolded.png` | [Galaxy Z Flip8](https://www.samsungmobilepress.com/media-assets/galaxy-z-flip8) | `018-galaxy-zflip8-graphite-open-front.jpg` | `dd479e03daff7f801e98295265b5894de4f29820032a637ef56831bca5261869` |
| `samsung-galaxy-a27-5g.png` | [Galaxy A27 5G](https://www.samsungmobilepress.com/media-assets/galaxy-a27-5g) | `002-product-galaxy-a27-5g-black-front2.jpg` | `a33dd394c517b01cfc77a6031b0d8570e3bd88aae4b3788295f09023601f8c96` |

The Fold8 and Fold8 Ultra main-display camera holes are deliberately offset to the right, matching the official open-front renders. Their cover-display camera holes remain centered. The Flip8 folded preset also masks the two camera lenses and flash from the usable cover viewport.

## iPad mini outline (September 2026)

`public/mockups/ipad-mini-modern.svg` is an original, code-drawn outline shared by iPad mini 6 and iPad mini (A17 Pro). It replaces the incorrectly reused Home-button shell. Its display opening uses the 744 × 1133 logical screen reference from [Apple's iPad mini 6 specifications](https://support.apple.com/en-us/111886). It is an illustrated frame, not an Apple product photograph; physical bezel, camera and corner-radius calibration remains on the [device checklist](device-validation.md). This is an explicit exception to the photograph-only guidance above.

## Apple September 2026

Added iPhone 18 Pro, iPhone 18 Pro Max, and iPhone Duo in folded and unfolded postures. Sources checked 10 September 2026: [Pro specifications](https://www.apple.com/iphone-18-pro/specs/) and [Duo specifications](https://www.apple.com/iphone-duo/specs/).

| Preset | Body W × H × D (mm) | Panel W × H (pixels) | Simulator logical screen |
| --- | --- | --- | --- |
| iPhone 18 Pro | 71.9 × 150.0 × 8.75 | 1206 × 2622 | 402 × 874 |
| iPhone 18 Pro Max | 78.0 × 163.4 × 8.75 | 1320 × 2868 | 440 × 956 |
| iPhone Duo folded | 84.1 × 117.8 × 11.3 | 1398 × 2034 | 466 × 678 |
| iPhone Duo unfolded | 164.6 × 117.8 × 5.2 | 2670 × 1878 | 890 × 626 |

Apple publishes the body dimensions and panel resolutions. Logical screens are provisional panel ÷ 3 estimates, not Apple-published CSS viewport measurements. Duo's inner panel is recorded in its wide orientation; portrait and landscape previews use the corresponding rotated opening. DPR, Safari controls, safe areas and Display Zoom still require native-device validation. The Pro models reuse the Liquid Glass presentation. Duo has the separate adaptive presentation described below; neither emulates the native Safari engine.

The Pro and Pro Max use Apple’s Burgundy finish. Their unmodified source JPEGs are retained as `public/mockups/apple-iphone-18-pro-burgundy-original.jpg` and `public/mockups/apple-iphone-18-pro-max-burgundy-original.jpg`.

The SVG files embed the unmodified official JPEG bytes. Vector masks isolate each straight-on front, hide the marketing screen for live content, and preserve visible camera pixels. No generated or replacement hardware artwork is used. Mask boundaries and corners are calibrated from these renders, not physical measurements. Apple artwork proportions and logical screen proportions remain independent; the shared fitter uses uniform scaling.

| Asset | Original Apple image | Original SHA-256 | Source crop x, y, w, h | Screen opening within crop x, y, w, h |
| --- | --- | --- | --- | --- |
| `apple-iphone-18-pro-2026.svg` | [Apple image](https://www.apple.com/v/iphone/compare/am/images/overview/compare_iphone_18_pro_burgundy__mdv9ns7r6oa6_large_2x.jpg) | `7942326e4e0281f647fe085a56ed5b50ffa34a18cc9d1a8f40c8eabc794dbbd6` | 259, 108, 316, 650 | 15, 11, 289, 628 |
| `apple-iphone-18-pro-max-2026.svg` | [Apple image](https://www.apple.com/v/iphone/compare/am/images/overview/compare_iphone_18_pro_max_burgundy__dcz67l4005oy_large_2x.jpg) | `ca3ad819a0362f1be76f5654ffb80624bc1038d20b92c0a53c0d0543a9f0624d` | 251, 48, 345, 712 | 14, 11, 319, 688 |
| `apple-iphone-duo-folded-2026.svg` | [Apple image](https://www.apple.com/v/iphone-duo/a/images/overview/product-viewer/closed__3le61imm1w2e_large_2x.jpg) | `d54634540d1ae2845aaa26c3f63eaeef2d395bc4a23f78772a80e5ea5820cc0f` | 1530, 203, 793, 1107 | 40, 20, 724, 1060 |
| `apple-iphone-duo-unfolded-2026.svg` | [Apple image](https://www.apple.com/v/iphone-duo/a/images/overview/product-viewer/landscape__f7x2oe1oxemy_large_2x.jpg) | `0f2d12c2e5db693192a00eed800bed8d61cb910188f1601c388ef06a34d4c707` | 1200, 242, 1447, 1037 | 29, 32, 1390, 974 |

Initial frame validation: TypeScript and Chrome production build passed; all 324 unit tests passed. The eight new source-component orientation cases loaded their local artwork, showed less than 0.00001% unequal scaling, zero fixed-footer overlap, and less than 0.01 CSS px header overlap (subpixel rounding). Screenshots and measurements are in `output/playwright/apple-*`; these are desktop fixture results, not physical Safari certification.

### Duo Safari presentation

[Apple’s launch description](https://www.apple.com/uk/newsroom/2026/09/apple-unveils-iphone-duo/) describes side navigation and a circular corner status system. Its [landscape Safari and Siri Split View image](https://www.apple.com/newsroom/images/2026/09/apple-unveils-iphone-duo/article/Apple-iPhone-Duo-multitasking-Safari-and-Siri-app-260909_big.jpg.large_2x.jpg) shows Safari back, information, share, and search controls on the left. The [portrait Safari product image](https://www.apple.com/v/iphone-duo/a/images/overview/product-stories/versatility/media__ccpeh3rqgupe_large_2x.jpg) shows a top row and corner status, with a Siri confirmation obscuring the central toolbar.

The simulator combines the user-supplied references with Apple's [Raise the bar with iPhone Duo](https://developer.apple.com/videos/play/tech-talks/111462/) guidance. The folded display uses right-side status and navigation in both orientations; unfolded landscape also uses the right side. Unfolded portrait retains the requested bottom navigation and upper-right status. Apple's portrait Safari photo shows a top navigation row, partly obscured by Siri, so the selected bottom arrangement is a preview preference rather than a verified exact native Safari configuration.

The right rail is centered on the folded artwork camera: icons remain approximately 47.6 logical pixels from the right upright and 53.1 pixels rotated, while content clearance is only 72 and 78 pixels respectively. Unfolded landscape uses a 56-pixel rail, with no camera hole. The folded upright and unfolded landscape address bars span the screen with a tab switcher at the right and a new-tab icon above it. Folded landscape leaves the bottom-right camera clear. Apple's [outer-display landscape image](https://www.apple.com/v/iphone-duo/a/images/overview/product-viewer/tent__68ysumotbs2m_large.jpg) confirms that camera position, although it depicts StandBy, not Safari.

Browser dimensions remain preview approximations: the expanded address row is 48 logical pixels and the horizontal navigation row, where present, is 40 pixels. Downward scrolling minimizes these to a 24-pixel domain pill; upward scrolling restores them. A horizontal home indicator occupies a 12-pixel bottom region. Side navigation and status retain their camera alignment throughout. Keyboard space replaces the lower browser area as needed. Controls remain outside the page viewport, including for viewport-fit=cover, to protect fixed page actions. Native Safari may overlay controls or expose different safe-area metrics. Other iPhones retain their existing browser choices.

The open frame stays free of a visible camera hole. The Camera app, Live Activities, Split View, and native iOS behavior are not simulated. Control artwork is a code-rendered approximation; the hardware frame remains the original Apple raster.

Duo Safari validation: TypeScript, Chrome production build, and all 327 unit tests passed. Sixteen browser fixture cases covered both postures and orientations with expanded controls, scrolled controls, keyboard, and hidden browser UI. All had zero fixed-footer/control overlap; top-surface contact remained below 0.01 logical pixels from rounding, and unequal scaling below 0.000014%. Captures are `output/playwright/duo-safari-{open,closed}-{portrait,landscape}.png`; the measurement log is `output/playwright/duo-safari-measurements.txt`. These are desktop fixture checks, not native Safari certification.

### Apple header alignment and scroll regression checks

The new Apple presets retain neutral iframe backings. The 18 Pro models also retain neutral light/dark browser surfaces. Duo now uses translucent glass with page-aware light/dark foregrounds, as described below. Page surfaces clip at the viewport edge without the colored guard strips that previously painted several display pixels into the live webpage. This prevents a sampled blue post/background from adding a synthetic header stripe; the website itself is unchanged.

The 18 Pro status row now has separate clock and indicator columns around a 120-pixel camera clearance. Landscape cover pages retain sensor clearance because the embedded Chromium page does not receive the corresponding native Safari safe-area values. Duo side navigation and status share the right rail, with non-shrinking icons. The outer camera's raster mask ends around 72 logical pixels below the screen top, so folded status starts at 80 pixels. Side controls keep their gutter width when scrolling to avoid reflowing the site's header. The inner display still has no camera hole.

TypeScript, the Chrome build, and 334 unit tests passed. Forty-eight full-app browser checks covered all four devices, both orientations, light/dark chrome, initial/scroll/keyboard states, and deliberately delayed blue page-color messages. Checks found no page/control, control/control, or camera/content intersections, no overlaid colored strips, no sideways viewport shift on scroll, and no footer escaping the page viewport. Audit source, results and captures are in `output/playwright/apple-alignment-audit.js`, `apple-alignment-results.txt`, and `apple-layout-{portrait,landscape}-{top,scrolled}.png`.

Reddit rejected the development iframe. The regular browser could load Reddit, but its installed viewer had the older 33-device iOS catalog; it did not validate this rebuilt source. The full-app checks therefore used a local scrolling fixture with sticky header and fixed footer, not a claimed live-Reddit or native-Safari certification.

11 September Duo alignment validation: TypeScript and 342 unit tests passed. Chromium fixture measurements for both postures and orientations reported zero fixed-footer/control overlap. Current captures are in output/playwright/device-audit/duo-{folded,unfolded}-{portrait,landscape}.png. The harness accepts device and orientation query parameters for repeatable individual checks.

Web verification, 11 September: Apple’s Raise the bar with iPhone Duo talk (https://developer.apple.com/videos/play/tech-talks/111462/, 0:28 and 11:40) describes side bars on the outer display including landscape, and on the inner display in landscape. The folded landscape preview now follows that rule and centers controls on the rotated camera axis. Apple’s tent reference (https://www.apple.com/v/iphone-duo/a/images/overview/product-viewer/tent__68ysumotbs2m_large.jpg) confirms a bottom-right outer camera in that rotation; it is a StandBy reference, not a Safari screenshot. The portrait Safari product photo shows top controls partly obscured by Siri, so the user-requested bottom layout remains a presentation preference, not a verified exact Safari configuration.

11 September glass correction: Duo chrome extends adjacent page pixels into its reserved edges using SVG offset/blur backdrop filters, clipped so they cannot blur or cover the live page viewport. This simulates a background extension rather than Apple's native refractive material. There is one iframe per preview, with no duplicate page load or automatic screenshot capture. Neutral translucent fills and page luminance determine contrast; the 18 Pro surfaces remain unchanged. CSS box reflections were rejected because they did not include cross-origin iframe content in Chrome.

Chrome visual checks confirmed the background extension on cross-origin light/dark fixtures, including inside a shadow root like the extension's overlay. Eight posture/orientation/theme checks found no fixed-footer/control overlap, no control movement during scrolling, and exactly one iframe each. TypeScript, all 342 unit tests, all 19 Chromium end-to-end tests, and the production build passed. The local fixture is available with `?device=apple-iphone-duo-folded-2026&orientation=portrait&glass=dark&cross-origin&shadow` (use `glass=light` for the light variant). These are fixture checks, not a live Netflix or native Safari certification. This change has not been uploaded or submitted.

Scroll behavior refinement after checkpoint `0e516ea`: Apple's [Duo toolbar video, around 10:55](https://developer.apple.com/videos/play/tech-talks/111462/?time=655) distinguishes floating vertical controls from the continuous background used with Reduce Transparency. The preview now leaves the right-side background extension untinted and uses glass only on its individual button groups. The compact lower bar also has no full-width tinted surface. The background extension remains a softened copy of adjacent page pixels so webpage actions keep their reserved clearance. This is an approximation; it does not claim that all native Duo Safari icons disappear when scrolling.

The compact state uses the existing directional scroll bridge and returns to the expanded state on upward scrolling. It adds 24 logical pixels of page height in side-control layouts and 64 in unfolded portrait, without changing page width, side icon positions, or keyboard clearance. The audit fixture now responds to real scroll events and provides downward/upward scroll controls. Cross-origin Chrome checks of both postures, both orientations, and light/dark pages verified minimization, restoration, stable side controls, and zero fixed-footer overlap. The regression test in `tests/e2e/simulator.spec.ts` exercises the actual app's frame-message path across all four Duo layouts.
