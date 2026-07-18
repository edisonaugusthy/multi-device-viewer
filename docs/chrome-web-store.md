# Chrome Web Store Release Guide

- Extension ID: `jfcnekmenjickfihkniaoaklehjmdhdb`
- Publisher ID: `45e2a939-d058-4406-91fc-34ee27bef98a`
- Dev Console: https://chrome.google.com/webstore/devconsole/45e2a939-d058-4406-91fc-34ee27bef98a/jfcnekmenjickfihkniaoaklehjmdhdb/edit

---

## Store Listing Copy

### Extension name

Mobile View & Responsive Tester

### Short description (132 chars max)

Test websites across phones, tablets, laptops, and desktops with synchronized previews, design comparison, and captures.

### Detailed description

Mobile View & Responsive Tester is a local-first responsive-development and QA workspace. Keep it beside your editor to see frontend changes across phones, tablets, laptops, and desktop screens, then turn layout problems into exportable findings and visual evidence.

Click the extension icon or use the Chrome context menu to open the current website inside realistic device frames. The responsive device viewer appears over the current tab, so you can check mobile view and desktop breakpoints in one workspace and return to the page when you close it.

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
- No account required.
- No backend service.
- No analytics, telemetry, or remote logging.
- Screenshots, recordings, URLs, annotations, designs, and settings are never sent to a backend.
- Preferences, presets, recents, custom devices, design references, and UI state are saved locally in Chrome storage.

### Screenshot order and captions

Use current UI captures at 1280×800 or 640×400. Keep text overlays short and readable.

1. **Compare responsive views side by side** — `screenshot-01-overview.jpg`.
2. **Test the workspace in light and dark themes** — `screenshot-02-responsive-workspace.jpg`.
3. **Open the current page on a physical device** — `screenshot-03-physical-device.jpg`.

Do not reuse screenshots from the previous sidebar or URL-bar design; outdated images can reduce listing clarity and conversion.

### Category

Developer Tools

### Language

English

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
2. Run `npm run build && npm run zip` and confirm the zip builds cleanly.
3. Open the Chrome Web Store Developer Dashboard and select the extension item.
4. Verify the Store listing, Privacy tab, and support fields are complete.
5. Upload the generated `.output/multi-device-viewer-<version>-chrome.zip` package manually.
6. Review the package warnings and submit it for review from the dashboard.
