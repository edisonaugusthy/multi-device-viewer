# Mobile View store assets — 0.2.5

Both promo images and all three screenshot stories have been replaced with actual running-extension captures. The fictional Orbit demo is local and contains no customer data or remote assets.

| Asset | Dimensions | Purpose |
|---|---:|---|
| `webstore-upload/promo-small-440x280.jpg` | 440 × 280 | **Mobile. Tablet. Desktop.** |
| `webstore-upload/promo-marquee-1400x560.jpg` | 1400 × 560 | **Find layout issues before you ship.** |
| `webstore-upload/screenshot-01-overview.jpg` | 1280 × 800 | Real phone/tablet/desktop workspace |
| `webstore-upload/screenshot-02-responsive-workspace.jpg` | 1280 × 800 | Real UI with synchronized scrolling enabled |
| `webstore-upload/screenshot-03-design-comparison.jpg` | 1280 × 800 | Real annotation editor with a box, arrow and issue note |
| `../website/public/og.png` | 1200 × 630 | Matching website/social preview |

English screenshots are at the upload root. German, Spanish, French, Brazilian Portuguese, Japanese, Korean and Simplified Chinese are under `webstore-upload/localized/`. There are 24 screenshot files and two global promos. The demo website content remains fictional English copy; the screenshot captions and supported extension controls are localized. The first story uses the same clean canvas capture across languages.

## Capture provenance

The raw captures are in `source/captures/`. An unpacked Chrome 0.2.5 QA build was actually loaded in an isolated Chrome for Testing profile and opened over `source/demo.html` on loopback port 4188. Its content and React UI ran normally. The QA-only build flag opens the shadow root for automation; production builds use a closed shadow root, which was separately checked through browser DOM/input inspection. Raw captures were refreshed after the control-font correction. Subsequent header fitting-margin and error-message fixes were validated in the final production build; the featured demo remains visually representative.

Overview and device crops come from the visible extension workspace. Scroll screenshots show a real wheel interaction and enabled sync. For annotation, the raw overview was loaded through the local design-reference input, opened with **Mark feedback**, and annotated using the extension's actual Box, Arrow and Text tools. This avoids relying on an automation-generated toolbar click to grant Chrome's `activeTab` capture permission. It is a real screenshot in the actual annotation editor, not a recreated product UI. Capture success and error UI are covered by the standalone browser tests. The native toolbar permission grant still needs a manual check in a normal user browser.

The final files add a short caption/brand strip and place those captures inside the promo composition. No generated device screenshots, customer websites, fake ratings or unsupported features are shown. The composition is in `source/store-listing-assets.html`; captions are generated from the listing master. `source/capture-provenance.json` records raw image and QA build hashes.

## Rebuild and publish

1. Build/load the extension in an isolated test profile, serve `source/demo.html` locally, and replace the raw PNGs through actual UI captures when the product UI changes. `?lab=1` exposes dummy session diagnostics; do not use that mode for the marketing images.
2. Edit `listings/locales.json`, then run `npm run sync:store-locales`. It is authoritative for names, summaries, descriptions, language mapping and captions. Publication timestamps remain unset until the public store is updated.
3. Run `npm run render:store-assets` and `npm run validate:store-assets`. Review full-size and reduced previews before upload. The render step uses existing raw screenshots; it does not recapture the extension.
4. Upload each language's `listings/upload/<locale>/description.txt` and metadata through its matching store locale. Use `metadata.json`'s `screenshotLocale` to select images. Packaging `public/_locales` changes extension metadata only; it does not publish these long descriptions.
5. Verify the public result with `node scripts/verify-live-store-locales.mjs jfcnekmenjickfihkniaoaklehjmdhdb` and record actual publication/verification state in the master. Native-language review is recommended before publication.

The small promo and marquee titles describe current capabilities. Live Session Check is deliberately absent from the public artwork and listing until its separate permission and release decision is made.
