# Full device and extension verification — 7 September 2026

Reviewed the current 0.2.5 working tree, removed obsolete private rendering code. All final catalog, unit, E2E and package checks passed. One initial installed-Chrome immediate-scroll-takeover assertion failed; the full rerun and three diagnostic repetitions passed without another source change. That intermittent result remains a follow-up item rather than a proven fix.

## Changes made in this review

- Simplified `DeviceFrame.tsx`: removed unused camera/home-indicator components, stale browser-height calculations and unreachable private Safari variants. The custom viewport browser bar now has a smaller implementation with its existing controls. Net reduction: 95 lines compared with the file at the start of this review. Public compatibility helpers remain.
- Removed unused imports and arguments in the simulator, frame-profile resolver and capture test. Enabled TypeScript `noUnusedLocals` and `noUnusedParameters` to prevent this unused code from returning.

The existing button positions, Device/Free switch, View only, keyboard controls and device catalog were preserved.

## Verification results

| Area | Coverage | Result |
| --- | --- | --- |
| TypeScript | Source, extension entrypoints and prototypes; strict unused-code checks | Passed |
| Unit tests | 316 tests in 19 files | Passed |
| E2E | Chromium regression tests | Passed |
| Device geometry | 105 presets, 188 supported device/orientation combinations in Chromium | Passed |
| Header/footer seams | 752 Chromium cases; fit/reduced zoom and scroll positions 0/130 | Passed |
| Pixel checks | Sampled top/bottom edges in Chromium | No colored-content bleed failures |
| Keyboards | 112 cases: four phone/tablet models, two orientations, two themes, seven input modes; actual key actions | Passed |
| Feedback prompt | 375 × 667 viewport; failure message, focus trap, Escape, focus restoration | Passed |
| Navigation/scroll sync | Four production-bridge audits in standalone Chromium and installed Chrome | Final runs passed; see intermittent finding below |
| Local session | Dummy cookie, local storage and session storage in three installed-extension previews | Preserved |
| Locales | 55 extension locales and 55 store locales | Passed |
| Store assets | Three screenshots in eight languages, small/marquee promo and icon validation | Passed |
| Website | 11 sitemap pages checked and production site built | Passed |
| Release ZIPs | Chrome 0.2.5 builds and package validation | Passed |

Geometry checks cover aspect-ratio distortion, iframe/screen containment and footer obstruction by browser controls. This includes the reported iPhones, iPad Pro, Pixel/Fold/Flip, Panasonic tablet, MacBook, Dell, modern laptop, Studio Display and iMac presets, as well as the rest of the catalog. [The device matrix](device-test-matrix.json) identifies the presets available for manual retesting.

The E2E suite also exercises device selection, dark color scheme, screenshot success/failure, frame/camera models, View only without a reload, recording, AI prompt generation and flow replay.

The sync audits exercise SPA/full/hash/back/forward navigation, return to the initial URL, real link navigation exactly once, root/nested/horizontal/RTL scroll, rapid source switching, unequal page ends, toggles, reloads, Device/Free/View only, added/removed viewports, cross-origin bridge reconnection and malformed messages.

## Evidence

Current final results, separate from failed intermediate candidates:

- [Chromium geometry](../output/playwright/review-final/geometry-chrome.json).
- [Chromium seam results](../output/playwright/review-final/verified-chrome/pixel-check.json). Their folders contain the audit manifests and batch screenshots.
- [Unit log](../output/playwright/review-final/unit-tests.txt) and [E2E log](../output/playwright/review-final/e2e-tests.txt).
- [Installed Chrome sync](../output/playwright/sync-audit/review-installed-chrome.json) and [Chromium sync](../output/playwright/sync-audit/review-chromium-fixed.json).
- [Feedback/keyboard check record](../output/playwright/review-final/feedback-keyboard-check.json), [feedback screenshot](../output/playwright/review-final/feedback-small-error.png), and [installed session check](../output/playwright/review-final/installed-session-check.txt).
- [Package hashes and boundaries](../output/release-boundaries.json).

## Remaining verification limits

The first installed-Chrome sync run failed the immediate follower takeover assertion: peers reached x=50/y=320 while the source returned to x=80/y=250. A full rerun and three instrumented repetitions passed. This suggests a timing-sensitive issue, but the cause was not established, so it is not counted as fixed. Keep this case in the manual release check; automated evidence does not justify calling synchronization bulletproof.

These are desktop Chromium rendering and interaction checks, not tests on 105 physical devices or native iOS Safari. Keyboard and browser-chrome representations remain simulations. The edge guard intentionally covers three to four physical pixel rows of decoration at the very edge of framed pages; it is pointer-transparent and disabled in Free view.

Session persistence was verified with a local same-origin fixture. Third-party authentication, redirects, cookie policies, challenges and state held only in a site's JavaScript memory cannot be universally reproduced by loading an iframe. No external feedback or review was submitted during testing.

The installed Chrome audit used an isolated QA copy with an open shadow root. The rebuilt production package was inspected separately: it retains a closed shadow root, adds no debugger permission, and contains no global static header-rule resources. No package was published.
