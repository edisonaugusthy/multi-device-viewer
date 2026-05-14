# Chrome Web Store Release Guide

- Extension ID: `jfcnekmenjickfihkniaoaklehjmdhdb`
- Publisher ID: `45e2a939-d058-4406-91fc-34ee27bef98a`
- Dev Console: https://chrome.google.com/webstore/devconsole/45e2a939-d058-4406-91fc-34ee27bef98a/jfcnekmenjickfihkniaoaklehjmdhdb/edit

---

## Store Listing Copy

### Extension name

Multi Device Viewer

### Short description (132 chars max)

Preview any page across real device viewports in a full-screen overlay — no new tab, no login, no backend.

### Detailed description

Multi Device Viewer opens a full-screen simulator overlay on the page you are already on. Click the extension icon, and the current site immediately appears inside realistic device frames without navigating away or opening a new tab. Close the overlay and the page is exactly as you left it.

**Preview across devices**
- Compare up to four device viewports side by side in resizable panels.
- Choose from a built-in catalog of phones, tablets, laptops, desktops, watches, and TVs.
- Switch orientation, zoom, fit mode, and reload each panel independently.
- Save favorites, browse recents, or create a custom viewport size.

**Realistic device shells**
- Accurate frame profiles for every device category.
- Phone, tablet, laptop, desktop, and watch shell renderings.

**Capture & Annotate**
- One click in the sidebar captures the entire simulator view as-is.
- Built-in annotation editor: pen, rectangle, arrow, text, and crop tools.
- Eight-color palette, three stroke widths, font size picker.
- Crop bakes your annotations into a trimmed canvas.
- Copy to clipboard or download — everything stays on your machine.

**Privacy-first by design**
- No account required.
- No backend service.
- No analytics, telemetry, or remote logging.
- Screenshots, URLs, annotations, and settings never leave your browser.
- Preferences saved locally in Chrome storage.

### Category

Developer Tools

### Language

English

---

## Privacy Tab Answers

**Single purpose**
Responsive website preview and screenshot annotation across multiple device viewport profiles, operating as an overlay on the current tab.

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
| `activeTab` | Inject the simulator overlay into the current tab when the user clicks the extension action. |
| `scripting` | Execute the content script that creates and manages the full-screen overlay iframe. |
| `tabs` | Read the active tab URL and title to load the page in the simulator; capture visible tab screenshots. |
| `declarativeNetRequest` / `declarativeNetRequestWithHostAccess` | Remove `X-Frame-Options` and `Content-Security-Policy` response headers on sub-frame requests so that pages can load inside the simulator iframe. Rules execute entirely within Chrome; no data is transmitted. |
| `storage` | Persist local preferences: selected devices, favorites, recents, custom viewport sizes, and UI state. |
| `downloads` | Save exported screenshots to the user's chosen download location. |
| `debugger` | Available for advanced per-viewport screenshot emulation. Not used in the default capture flow. |

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
