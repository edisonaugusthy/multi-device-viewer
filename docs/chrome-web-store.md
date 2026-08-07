# Chrome Web Store Release Guide

- Extension ID: `jfcnekmenjickfihkniaoaklehjmdhdb`
- Publisher ID: `45e2a939-d058-4406-91fc-34ee27bef98a`
- Dev Console: https://chrome.google.com/webstore/devconsole/45e2a939-d058-4406-91fc-34ee27bef98a/jfcnekmenjickfihkniaoaklehjmdhdb/edit

---

## Store Listing Copy

### Extension name

Mobile View: Device Emulator & Responsive Tester

### Short description (132 chars max)

Responsive testing across phone, tablet, laptop and desktop views—side by side in a free mobile simulator and device emulator.

### Detailed description

Mobile View is a free, open-source responsive website testing tool, device emulator, and mobile simulator for Chrome. Compare a website in phone, tablet, laptop, and desktop views side by side—without repeatedly resizing a window or switching Chrome DevTools presets.

Use this mobile simulator and responsive tester to catch breakpoint, overflow, navigation, and content issues while you build. Everything runs locally in your browser: no account, subscription, analytics, telemetry, or remote application backend.

Click the extension icon or use the Chrome context menu to open the current website inside realistic device frames. The multi-device preview appears over the current tab, so you can check mobile view and desktop breakpoints in one workspace and return to the page when you close it.

**Responsive website and mobile view testing**
- Compare up to four device previews side by side in resizable panels.
- Test phone, tablet, laptop, and desktop layouts at realistic viewport sizes.
- Switch device, orientation, zoom level, and reload state independently.
- Synchronize page and matching nested-container scrolling across previews when checking long pages.
- Create custom viewport sizes for project-specific breakpoints.

**Realistic device previews**
- Preview iPhone, Android, iPad, tablet, MacBook, laptop, and desktop layouts.
- Use device frames with platform-appropriate status and browser chrome.
- See viewport dimensions and resize comparison panels directly.

**One-click comparison sets**
- Open Phone + Tablet, iOS + Android, or Mobile + Tablet + Laptop comparisons from the toolbar.
- Save named device sets for repeated responsive QA.
- Reuse custom device configurations from local Chrome storage.
- Favorite frequently used devices, reopen recent devices, reorder viewports, or focus one viewport without rebuilding the workspace.

**Screenshots and annotations**
- Capture the active viewport or complete multi-device comparison.
- Annotate with pen, rectangle, arrow, text, and crop tools.
- Copy the result to the clipboard or download it locally.

**Responsive behavior and physical-device handoff**
- Synchronize scrolling, supported interactions, and navigation across matching previews.
- Save reusable device sets for repeatable checks.
- Open the current URL on a physical phone using a locally generated QR code.

**Generate a responsive fix prompt**
- Describe the expected and actual behavior once.
- Automatically include the optional selector, device names, viewport sizes, orientation, and page URL.
- Copy a structured fix prompt to Codex, Copilot, Cursor, Claude, or another coding tool.
- Nothing is uploaded; the handoff uses your local clipboard.

**Compare a reference with the live website**
- Place a previous screenshot or approved design on the left.
- Keep the current website interactive in the device previews on the right.
- Import local design references for each viewport, compare them beside or over the live page, manually align overlays, and mark feedback locally.
- Reference images and overlay settings stay in local Chrome storage so the workspace can resume; nothing is uploaded.

**Privacy-first by design**
- Free to use.
- Open source under the MIT license.
- No account required.
- No backend service.
- No analytics, telemetry, or remote logging.
- Screenshots, recordings, URLs, annotations, designs, and settings are never sent to a backend.
- Preferences, presets, recents, custom devices, design references, and UI state are saved locally in Chrome storage.

### Screenshot order and captions

Use current UI captures at 1280×800 or 640×400. Keep text overlays short and readable.

1. **Test mobile, tablet, and desktop side by side** — `screenshot-01-overview.jpg`.
2. **Use 70+ responsive device profiles in one workspace** — `screenshot-02-responsive-workspace.jpg`.
3. **Compare a live page with an approved design** — `screenshot-03-design-comparison.jpg`.

Do not reuse screenshots from the previous sidebar or URL-bar design; outdated images can reduce listing clarity and conversion.

### Promotional images

- **Small promo tile (440×280 JPEG)** — `promo-small-440x280.jpg`.
- **Marquee promo tile (1400×560 JPEG)** — `promo-marquee-1400x560.jpg`.

Both promotional images lead with the responsive-testing use case and present
**Free** and **Open source** as separate, high-contrast proof marks. Keep browser
and platform names out of this artwork so the value remains immediately clear.

### Day 1 responsive-testing experiment

This is the first controlled Store-copy experiment after the August 1 baseline.
Publish the English summary above and the following opening paragraph together;
do not change the title or screenshots in the same release:

> Mobile View is a responsive website testing tool, responsive design tester,
> mobile simulator, and device emulator for Chrome. Preview websites across
> multiple phone, tablet, laptop, and desktop viewports at once.

Measure direct in-store ranks for 7 and 14 days. The primary success condition
is entry into the top 10 for at least 10 locales across the responsive-testing
queries while the protected `multi device viewer` median does not worsen by
more than two positions. This experiment changes one copy package only; it
does not prove causality until the Store listing is actually published.

### Search-positioning terms

Use these phrases naturally in the name, summary, and first paragraphs; do not
append a keyword list to the public description:

- Primary: `mobile view`, `device emulator`, `responsive tester`,
  `mobile simulator`.
- Secondary: `mobile emulator`, `device simulator`, `responsive viewer`,
  `mobile preview`, `multi-device preview`, `website mobile view`,
  `phone and tablet simulator`, `responsive website testing`.
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

English default, plus German, Spanish, French, Simplified Chinese, Traditional
Chinese, Filipino, Dutch, Vietnamese, Brazilian Portuguese, Italian, Japanese,
Korean, Hindi, Russian, and Arabic. Use
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
| `contextMenus` | Add the "Open this tab in Device Simulator" shortcut to Chrome's page and extension-action context menus. |
| `scripting` | Execute the content script that creates and manages the full-screen overlay iframe. |
| `tabs` | Read the active tab URL and title to load the page in the simulator; capture visible tab screenshots. |
| `declarativeNetRequest` | Remove `X-Frame-Options` and `Content-Security-Policy` response headers on sub-frame requests so that pages can load inside the simulator iframe. Rules execute entirely within Chrome; no data is transmitted. |
| `storage` | Persist local preferences: selected devices, saved presets, favorites, recents, custom viewport sizes, review-prompt state, use counters, and UI state. |
| `downloads` | Save exported screenshots to the user's chosen download location. |
| `offscreen` | Process user-initiated tab recording in Chrome's required offscreen document. |
| `tabCapture` | Capture the selected source tab only after the user starts recording. |

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
