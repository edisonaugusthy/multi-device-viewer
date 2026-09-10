# Mobile View 0.2.5 — implementation and validation

Implemented locally on `codex/mobile-view-quality-growth`, based on `6f2d2cad86f49f56b1034e3a25bd26e9998a9eac`, on 7 September 2026. The extension code, copy, artwork, prototype and release packages are ready for review. Nothing has been published to the stores, deployed, pushed or submitted as a review/support message.

The latest follow-up adds a default Focus layout with Tools hidden, a Device/Free switch that preserves loaded pages, a one-click View-only mode with an auto-hiding return control, and native website dark-mode propagation. Saved appearance is applied before the first preview request. Existing-session tests passed without a second sign-in. [Current interface, session behavior, limits and View-only controls](focused-layout-and-sessions.md).

| Workstream | Delivered | Evidence / remaining limit |
|---|---|---|
| Session compatibility | Viewer mounted on the existing source document in a closed shadow root; direct preview frames; temporary tab/host-scoped header rules; source preservation and cleanup | Installed Chrome fixtures passed same-site cookie/storage and signed-out checks. Cross-origin SSO and site-specific restrictions still require testing. |
| Feedback/review | Serialized background updates, preserved opt-outs, acknowledged review-page opening, retryable failures, manual Help actions and eligibility explanation | Review coordinator tests and installed UI checks passed. Opening the store is recorded as “opened”, never as a submitted review. |
| Device/browser geometry | Five corrected logical screen sizes, modern mini outlines, uniform scaling, iPhone/iPad browser layouts, fixed-action clearance, keyboard reservation, visible-edge tint and contrast | 105 presets / 188 orientation cases passed. [Exact device list and physical Safari procedure](device-validation.md). Physical-device calibration remains outstanding. |
| Localized discovery | 55 original listing records with fuller feature coverage, correct language mapping, generated package metadata, upload files and public verification tool | All local checks pass. Native-language review is recommended; the public listing has not been updated. |
| Visuals | Two new promos, three actual product screenshots in eight languages, original raw captures and refreshed website social image | All dimensions validate; actual extension workspace and annotation editor, using a fictional local site. [Artwork and provenance](../store-assets/README.md). |
| Flagship feature | Separate Live Session Check prototype with stop/error cleanup and downloadable comparison images | Three-width original-document test and Stop test passed. Debugger permission is absent from production packages. [Prototype guide](../prototypes/live-session/README.md). |
| Marketing | Competitor and locale analysis, differentiated feature hypothesis, release and measurement sequence | [Marketing analysis](market-analysis.md). No ranking or conversion guarantee. |
| UI clarity follow-up | Restored toolbar/sidebar separators, selector borders, menu shadows, active-viewport accent and keyboard focus rings; increased sidebar heading contrast | Installed Chrome light/dark checks passed at 1280 px; compact headers have no overflow at 1024 px. [After screenshot](../output/playwright/ui-clarity/after-light.png). |

## UI clarity follow-up

The missing boundaries were a rendering defect: the installed viewer computed border widths as `0px`, even on controls with border classes. Tailwind's `@property` defaults were unavailable inside the viewer's adopted shadow stylesheet. Its non-inheriting property defaults now receive local declarations in the existing low-priority CSS layer; typed zero lengths become `0px` so focus-ring calculations remain valid. This restores the intended borders, shadows, transforms and keyboard outlines without adding styles or property registrations to the source document. This behavior matches [Chrome's documented shadow-root property limitation](https://developer.chrome.com/docs/css-ui/css-names).

The layout, control sizes and spacing are retained. Small sidebar headings and device counts now use stronger text contrast in both themes. Actual extension checks confirmed 1px boundaries, visible menu shadows and an inset 2px keyboard focus ring; the source page's font size, colors and header border remained unchanged. TypeScript and the Chromium browser checks passed. Before/after images and computed-style evidence are in `output/playwright/ui-clarity/`.

## What caused the feedback problem

There was no written product-feedback submission form behind the automatic request. The automatic dialog is a Chrome Web Store review request; “Mark feedback” is local screenshot annotation. The implementation now makes those routes explicit through **Help and feedback**, with separate review and GitHub issue actions.

The automatic request intentionally needs seven days since initialization, five qualified sessions and three successful actions. A session qualifies after 60 seconds with at least two viewports. A successful action must occur before an eligible prompt can appear. The standalone browser preview disables automatic review prompting. The new status panel explains these conditions and shows progress; manual Help actions remain available.

Two defects are fixed: opening failure previously ended future requests, and concurrent viewers could overwrite each other's state or opt-out. Commands now execute serially in the background against current storage. State revisions protect observers from stale results. Failed opening/storage changes remain retryable, opt-outs survive concurrent updates, and ordinary captures/review actions are not treated as proof of a submitted rating. A real review or support issue was not submitted during testing.

## Session behavior and blocking

The normal preview path no longer nests the website inside an extension-origin iframe. The original page remains alive below the viewer. Same-site frames use the existing browser storage context; credentials are not extracted or copied. Ordinary website script errors and a six-second bridge timeout no longer destroy otherwise usable previews. The “Open in tab” action is visible when preview tools cannot connect, and also remains available in viewport options and the blocked-page view. Reloading a blocked preview re-registers its bridge.

Frame-header rules are now session rules limited to the viewer tab, `sub_frame` requests, and hosts selected during that session (up to 32). Selected hosts remain allowed for that viewer session; rules are removed on close, source navigation and tab removal, with stale-tab cleanup after worker startup. Other tabs and top-level response headers are unaffected. DNR removes the complete selected response CSP because it cannot surgically remove only `frame-ancestors`; scope is therefore deliberate and narrow. Cookie flags, authentication tokens and server responses are not rewritten. See the [privacy policy](privacy-policy.md) and [Chrome DNR documentation](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest).

Each preview is a new document. Same-site cookies/storage are reusable, while live JavaScript state and unsaved form fields are not cloned. Closing the viewer preserves those values on the original page. Cross-site cookies, SSO redirects, browser restrictions, service-worker behavior and anti-automation challenges can still differ. The source-page iframe-policy fixture loaded successfully in the tested extension context; this does not establish that every site can be embedded. [Chrome's storage/cookie model](https://developer.chrome.com/docs/extensions/develop/concepts/storage-and-cookies) explains why site context matters.

The production shadow root is closed. A separate build-time QA flag exposes it only in isolated automation builds used for raw asset capture. Package inspection confirmed both production ZIPs compile the closed mode. A closed shadow root reduces accidental page access; it is not a complete isolation boundary against a hostile source page's capture listeners or browser extensions.

Scroll sync also received a regression fix: repeated registration no longer clears a follower's programmatic-scroll guard, instantaneous follower updates do not inherit smooth scrolling, and zero-movement events are not rebroadcast as absolute positions. In the installed fixture the phone stayed at 340px while the short desktop page stopped at its own 83px limit, without pulling the phone backward. Existing reload and interaction synchronization behavior remains covered by the browser suite.

## Verification record

| Check | Result |
|---|---|
| TypeScript | `npm run compile` passed |
| Unit tests | 301 passed across 18 files |
| Existing browser suite | Chromium checks passed |
| Full catalog source rendering | 188/188 supported orientation cases; 105 exact IDs retained |
| Geometry | 0 cases with >0.1% unequal scale; 0 fixed-footer overlaps; 0 header paint overlaps |
| Installed Chrome session fixtures | All three previews retained HttpOnly SameSite=Strict signed-in state without exposing the cookie to page JS; signed-out state matched; original document token and unsaved draft survived closing |
| Header rule boundaries | Ordinary iframe in another tab remained blocked by XFO/CSP; top-level XFO/CSP stayed present; viewer tab rule disappeared on close |
| Slow/error pages | Three eight-second previews remained mounted and subsequently loaded; intentional ordinary script errors did not mark them blocked |
| Colors | Hex, alpha RGB, OKLCH, sRGB and Display-P3 parsing; grouped opacity; scrolled-away header; fixed-footer color; light/dark theme fallback passed real browser checks |
| Production UI | Closed shadow root, all three previews, Help opening/closing and viewer close passed through browser DOM/input inspection |
| Live Session Check | 393 / 768 / 1280 × 900 captures; signed-in state, source token, draft, scroll and normal 1200 × 737 viewport restored; Stop restores state |
| Localization and artwork | 55 listing records validated; 3 screenshots × 8 languages, 440 × 280 small promo and 1400 × 560 marquee validated |
| Website | Build and SEO validation passed for all 11 sitemap pages |
| Production packages | Chrome ZIP validators passed; no debugger permission, global static header rules, QA open shadow root or old MAIN-world spoofer entrypoints |

Raw local evidence is under `output/playwright/`: `device-audit/results.json`, `mdv-compatibility-check.json`, `mdv-surfaces-check.json`, `production-check.json`, `live-session-native-viewport.json`, `live-session-stop.json`, `manual-review-open.json` and associated PNGs. `output/release-boundaries.json` records final ZIP hashes and permission checks. The source ZIP excludes generated QA builds and browser output.

The live store verifier was exercised without publishing: 22 responses were readable and still had the old summaries/bodies; 33 requests returned HTTP 503. That is a partial public verification, not 55 confirmed successful checks. Run it again after publication and retain the timestamped results. The earlier complete competitor audit remains the discovery baseline described in the marketing report.

## Release files and remaining gates

- `.output/multi-device-viewer-0.2.5-chrome.zip`
- `.output/multi-device-viewer-0.2.5-sources.zip`
- `store-assets/listings/upload/` — 55 per-language descriptions and metadata; English title preserved.
- `store-assets/webstore-upload/` — global promos, English screenshots and seven additional localized screenshot folders.
- `output/live-session-prototype/` — isolated, unpacked Chrome lab extension. This is not part of the production package.

Before a public rollout, complete the priority physical Safari cases, review localized copy with native speakers where available, and upload each description to its matching store locale. Package metadata alone does not publish long descriptions. The Live Session Check debugger permission remains a separate distribution decision, as specified in the approved plan. Chrome main packages do not request it.

Keep a copy of the currently published text/images and record upload timestamps. Publish the compatibility/feedback release, verify the served copy, then evaluate the artwork and summary changes using the marketing plan's comparable observation windows. Existing signed-in SSO sites should be tested with normal browser login flows; no universal “never blocked” claim is supported.
