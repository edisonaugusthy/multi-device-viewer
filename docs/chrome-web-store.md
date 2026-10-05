# Chrome Web Store Release Guide

- Extension ID: `jfcnekmenjickfihkniaoaklehjmdhdb`
- Publisher ID: `45e2a939-d058-4406-91fc-34ee27bef98a`
- Dev Console: https://chrome.google.com/webstore/devconsole/45e2a939-d058-4406-91fc-34ee27bef98a/jfcnekmenjickfihkniaoaklehjmdhdb/edit

---

## Store Listing Copy

### Extension name

Mobile View: Device Emulator & Responsive Tester

### Short description (132 chars max)

Mobile simulator and responsive design tester. Compare phone, tablet and desktop views, sync scrolling and capture screenshots.

### Detailed description

Mobile View is a free, open-source mobile simulator and device emulator for responsive website testing in Chrome. Compare up to four phone, tablet, laptop and desktop views side by side without repeatedly resizing your browser.

Use a mobile preview to check menus, text, spacing and page layouts at different breakpoints. This responsive design tester combines responsive testing, screenshots and design feedback in a multi-device viewer so you can review mobile device layouts alongside larger screens.

- Preview iPhone 18 Pro, folded and unfolded iPhone Duo, Android phones, tablets, MacBook and Apple Watch. Browse the selected device category with previous and next arrows.
- Compare device presets or custom viewport sizes. Switch between portrait and landscape on supported devices, adjust zoom and focus on a single view. Changing devices restores each device’s default orientation.
- Synchronize scrolling and supported interactions and navigation across matching previews. Review the same part of a page at different screen sizes.
- Save device sets and favorites for repeat checks during frontend development and design review.
- Capture a viewport or the full workspace. Add arrows, boxes, text and other annotations to explain layout issues.
- Compare the live website with a local design reference, side by side or as an overlay.
- Copy a responsive-fix prompt with the page URL, selected devices, viewport sizes and your issue notes to your coding tool.

Open a website, select Mobile View from the Chrome toolbar and choose your device views. Compare, inspect and capture the layout in one workspace.

No Mobile View account or subscription is required. The extension processes your testing data locally, without an analytics service or application backend. It does not upload your screenshots, design references or annotations. Websites you open still make their normal network requests.

These are responsive viewport previews using Chrome, not physical devices or the Safari engine. Website sign-in and embedding rules still apply. The original page stays intact; new previews do not copy unsaved edits.

### Screenshot order and captions

Use current UI captures at 1280×800 or 640×400. Keep text overlays short and readable.

1. **New devices. One responsive workspace.** — `screenshot-01-overview.jpg`.
2. **Scroll once. Compare every view.** — `screenshot-02-responsive-workspace.jpg`.
3. **Show the issue. Share a clear fix.** — `screenshot-03-design-comparison.jpg`.
4. **Every device. One click.** — `screenshot-04-all-devices.jpg`, showing the grouped All devices gallery.

Do not reuse screenshots from the previous sidebar or URL-bar design; outdated images can reduce listing clarity and conversion.

### Promotional images

- **Small promo tile (440×280 JPEG)** — `promo-small-440x280.jpg`.
- **Marquee promo tile (1400×560 JPEG)** — `promo-marquee-1400x560.jpg`.

The approved artwork uses the current plain icon and a MacBook behind the
foreground devices. The small tile shows iPhone 18 Pro, folded iPhone Duo and
Apple Watch; the marquee also includes unfolded iPhone Duo.

### Current copy review — 4 October 2026

The current copy replaces the August experiment package. All 55 summaries and
detailed descriptions are generated from `store-assets/listings/locales.json`.
See [the Extensiq keyword review](./chrome-web-store-localizations.md#extensiq-copy-review--4-october-2026)
for observed positions, missing wording, placement changes and evidence IDs.
The title is retained; the short description now includes `responsive design
tester`, and the detailed opening explicitly describes `responsive website
testing`. The revised copy and approved artwork are ready for local review and
upload; packaging alone does not publish Store descriptions.

Compare like-for-like search captures after the listing is published. No
ranking improvement or causal effect is established by changing these files.

### Search-positioning terms

Use these phrases naturally in the name, summary, and first paragraphs; do not
append a keyword list to the public description:

- Established tracked terms: `mobile view`, `device emulator`, `mobile preview`,
  `responsive tester`, `mobile simulator`, `responsive design tester`.
- Tracked testing gaps: `responsive testing`, `responsive website testing`.
- Relevant wording addition: `mobile device`; competitor use is observed,
  but search demand and a rank for this phrase are not established here.
- Feature-led: `multiple devices side by side`, `synced scrolling`,
  `custom viewport sizes`, `responsive screenshot`, `design comparison`.

Avoid claiming full hardware, network, sensor, or browser-engine emulation. The
extension emulates responsive viewports and device presentation for everyday
frontend testing; critical flows should still be checked on physical devices.

### Search baseline (25 July 2026)

Checked in the live Chrome Web Store with locale `en-GB`. Positions can vary by
country, account, installation state, listing history, ratings, and Store
experiments, so use this as a baseline rather than a guaranteed universal rank.

| Query | Current position |
|---|---:|
| `multi device viewer` | 3 |
| `mobile preview` | 6 |
| `mobile view` | 8 |
| `responsive viewer` | 8 |
| `responsive website testing` | 8 |
| `responsive tester` | 9 |
| `device emulator` | Outside first 10 |
| `device simulator` | Outside first 10 |
| `mobile simulator` | Outside first 10 |
| `mobile emulator` | Outside first 10 |
| `responsive emulator` | Outside first 10 |
| `responsive design tester` | Outside first 10 |
| `website responsive tester` | Outside first 10 |
| `multiple device preview` | Outside first 10 |

The leading results consistently place the searched phrase in the extension
name, repeat it in the short description, and immediately explain the supported
devices or testing workflow. The recommended name therefore covers three
high-intent phrases exactly, while the short and detailed descriptions cover
the related terms naturally. Do not repeat terms unnaturally: Store authority,
ratings, active users, conversion, retention, localization, and listing quality
also influence discovery.

### Category

Developer Tools

### Language

English default, plus all 54 additional supported Chrome locales. Use
[`docs/chrome-web-store-localizations.md`](./chrome-web-store-localizations.md)
for the locale overview and
[`docs/chrome-web-store-listing-copy.md`](./chrome-web-store-listing-copy.md)
for complete copy-and-paste descriptions and screenshot captions.

---

## Privacy Tab Answers

**Single purpose**
Responsive website preview, device comparison, linked scrolling, local design reference, and visual capture across multiple viewport profiles in an overlay on the current tab.

**Data usage certification**
The extension does not sell, transfer, or use user data for any purpose outside its single stated purpose.

| Data type | Collected? | Notes |
|---|---|---|
| Personally identifiable information | No | |
| Health information | No | |
| Financial / payment information | No | |
| Authentication information | No | |
| Personal communications | No | |
| Location | No | |
| Web history | No | |
| User activity | No — processed locally | The active tab URL is used only to load the page inside the simulator. It is not transmitted. |
| Website content | No — processed locally | Pages are rendered locally inside the simulator iframe. Content is not transmitted to a backend. |

---

## Permission Justifications

| Permission | Justification |
|---|---|
| `activeTab` | Temporarily capture the visible workspace only after the user clicks Screenshot and annotate. It does not grant persistent browsing access. |
| `contextMenus` | Add the "Open this tab in Device Simulator" shortcut to Chrome's page and extension-action context menus. |
| `scripting` | Execute the content script that creates and manages the full-screen overlay iframe. |
| `declarativeNetRequest` | Remove `X-Frame-Options` and `Content-Security-Policy` response headers on sub-frame requests so that pages can load inside the simulator iframe. Rules execute entirely within Chrome; no data is transmitted. |
| `storage` | Persist local preferences: selected devices, saved presets, favorites, recents, custom viewport sizes, review-prompt state, use counters, and UI state. |
| `downloads` | Save exported screenshots to the user's chosen download location. |
| `offscreen` | Process user-initiated tab recording in Chrome's required offscreen document. |
| `tabCapture` | Capture the selected source tab only after the user starts recording. |

---

## Review prompt safeguards

- The first prompt is eligible only after 7 days, 5 qualified sessions, and 3
  successful actions. A qualified session means at least 60 seconds with two
  or more viewports open.
- The full-screen prompt appears only after a successful capture, all-viewport
  flow check, saved device set, or design-feedback capture. It never appears at
  startup or over another modal.
- **Not now** permits one reminder only after another 30 days and 10 additional
  qualified sessions. The prompt is shown at most twice for the lifetime of the
  browser profile.
- Choosing review or **Don't ask again** stops all future prompts.
  Dismissing the second prompt also stops future prompts.
- Eligibility and choices stay in browser-local storage. There is no review
  reward, five-star request, telemetry, or remote tracking.

---

## Release Checklist

1. Bump `manifest.version` in `wxt.config.ts`.
2. Keep the version in `package.json` identical to `manifest.version`.
3. Run `npm run validate:store-assets`, `npm run build`, `npm run zip`, and
   `npm run validate:chrome-zip -- .output/multi-device-viewer-<version>-chrome.zip`.
4. Open the Chrome Web Store Developer Dashboard and select the extension item.
5. Verify the Store listing, Privacy tab, and support fields are complete.
6. Upload the generated `.output/multi-device-viewer-<version>-chrome.zip` package manually.
7. Review the package warnings and submit it for review from the dashboard.
8. After the update is public and stable, complete the
   [Featured badge readiness checklist](./chrome-web-store-featured-readiness.md)
   and nominate it through Chrome Web Store One Stop Support.
