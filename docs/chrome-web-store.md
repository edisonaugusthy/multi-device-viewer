# Chrome Web Store Release Guide

- Extension ID: `jfcnekmenjickfihkniaoaklehjmdhdb`
- Publisher ID: `45e2a939-d058-4406-91fc-34ee27bef98a`
- Dev Console: https://chrome.google.com/webstore/devconsole/45e2a939-d058-4406-91fc-34ee27bef98a/jfcnekmenjickfihkniaoaklehjmdhdb/edit

---

## Store Listing Copy

### Extension name

Mobile View & Responsive Tester

### Short description (132 chars max)

Test responsive websites in mobile view across phones, tablets, laptops, and desktops. Compare devices and copy issues to AI.

### Detailed description

Mobile View & Responsive Tester helps developers test responsive websites across phones, tablets, laptops, and desktop screens. Open it on the current page to compare up to four device viewports side by side without switching between Chrome DevTools presets.

Click the extension icon or use the Chrome context menu to open the current website inside realistic device frames. The responsive device viewer appears over the current tab, so you can check mobile view and desktop breakpoints in one workspace and return to the page when you close it.

**Responsive website and mobile view testing**
- Compare up to four device previews side by side in resizable panels.
- Test phone, tablet, laptop, and desktop layouts at realistic viewport sizes.
- Switch device, orientation, zoom level, and reload state independently.
- Synchronize scrolling across previews when checking long pages.
- Create custom viewport sizes for project-specific breakpoints.

**Realistic device previews**
- Preview iPhone, Android, iPad, tablet, MacBook, laptop, and desktop layouts.
- Use device frames with platform-appropriate status and browser chrome.
- See viewport dimensions and resize comparison panels directly.

**One-click comparison sets**
- Open Phone + Tablet, iOS + Android, or Mobile + Tablet + Laptop comparisons from the toolbar.
- Save named device sets for repeated responsive QA.
- Reuse custom device configurations from local Chrome storage.

**Screenshots and annotations**
- Capture the complete multi-device comparison.
- Annotate with pen, rectangle, arrow, text, and crop tools.
- Copy the result to the clipboard or download it locally.

**Generate a responsive fix prompt**
- Describe the expected and actual behavior once.
- Automatically include the optional selector, device names, viewport sizes, orientation, and page URL.
- Copy a structured fix prompt to Codex, Copilot, Cursor, Claude, or another coding tool.
- Nothing is uploaded; the handoff uses your local clipboard.

**Compare a reference with the live website**
- Place a previous screenshot or approved design on the left.
- Keep the current website interactive in the device previews on the right.
- Import local design references for each viewport, compare them beside or over the live page, manually align overlays, and mark feedback locally.
- Reference images stay on the device and are discarded when the comparison closes.

**Privacy-first by design**
- No account required.
- No backend service.
- No analytics, telemetry, or remote logging.
- Screenshots, URLs, annotations, and settings never leave your browser.
- Preferences, presets, recents, custom devices, and UI state are saved locally in Chrome storage.

### Screenshot order and captions

Use current UI captures at 1280×800 or 640×400. Keep text overlays short and readable.

1. **Compare responsive mobile, tablet, and laptop views side by side** — show the Mobile + Tablet + Laptop device set.
2. **Switch device presets quickly from the compact header** — show one-click preset controls and the visible device toolbar.
3. **Pick exact devices from the improved selector** — show the searchable device selector and multi-device workspace.

Do not reuse screenshots from the previous sidebar or URL-bar design; outdated images can reduce listing clarity and conversion.

### Category

Developer Tools

### Language

English

---

## Privacy Tab Answers

**Single purpose**
Responsive website preview, preset-based device comparison, synchronized scrolling, and screenshot annotation across multiple device viewport profiles, operating as an overlay on the current tab.

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
| `debugger` | Temporarily apply device metrics for individual viewport captures, then detach and restore the page. |
| `offscreen` | Process user-initiated tab recording in Chrome's required offscreen document. |
| `tabCapture` | Capture the selected source tab only after the user starts recording. |

---

## GitHub Secrets

Create these in your repository or in a GitHub environment named `chrome-web-store`:

- `CHROME_CLIENT_ID`
- `CHROME_CLIENT_SECRET`
- `CHROME_REFRESH_TOKEN`

Adding required reviewers to the `chrome-web-store` environment is recommended so uploads need manual approval.

---

## Google Cloud Setup

1. Open Google Cloud Console and create or select a project.
2. Enable the **Chrome Web Store API**.
3. Configure the OAuth consent screen.
4. Create an OAuth Client ID — application type: **Web application**.
5. Add authorized redirect URI: `https://developers.google.com/oauthplayground`
6. Copy the client ID and client secret into the GitHub secrets above.

---

## Refresh Token Setup

1. Open https://developers.google.com/oauthplayground
2. Open settings → enable **Use your own OAuth credentials**.
3. Enter your OAuth client ID and client secret.
4. In the scopes field enter: `https://www.googleapis.com/auth/chromewebstore`
5. Authorize with the Google account that owns the Chrome Web Store item.
6. Exchange the authorization code for tokens.
7. Copy the refresh token into the `CHROME_REFRESH_TOKEN` GitHub secret.

---

## Release Checklist

1. Bump `manifest.version` in `wxt.config.ts`.
2. Run `npm run build && npm run zip` and confirm the zip builds cleanly.
3. Push changes to GitHub.
4. In the Chrome Web Store Developer Dashboard, verify the Store listing, Privacy tab, and support fields are complete.
5. In GitHub → Actions → **Chrome Web Store Release** → **Run workflow**.
6. Leave `submit_for_review` enabled to upload and submit, or disable for upload-only testing.

The workflow is manual only and does not trigger on push or pull requests.

---

## References

- Chrome Web Store API guide: https://developer.chrome.com/docs/webstore/using-api
- Chrome Web Store API v2 reference: https://developer.chrome.com/docs/webstore/api/reference/rest
