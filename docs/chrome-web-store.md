# Chrome Web Store Release Guide

This repo is configured for a manual GitHub Actions release to the Chrome Web Store item:

- Extension ID: `jfcnekmenjickfihkniaoaklehjmdhdb`
- Publisher ID: `45e2a939-d058-4406-91fc-34ee27bef98a`
- Dev Console: https://chrome.google.com/webstore/devconsole/45e2a939-d058-4406-91fc-34ee27bef98a/jfcnekmenjickfihkniaoaklehjmdhdb/edit

## Store Listing Copy

### Extension name

Multi Device Viewer

### Short description

Preview and compare websites across local device viewports with screenshots, annotations, and realistic mockups.

### Detailed description

Multi Device Viewer is a local-first responsive testing tool for Chrome. Open any website in a dedicated simulator tab, preview it across popular phones, tablets, laptops, desktops, watches, and TVs, then capture screenshots or annotate findings without sending your work to a remote service.

Use it to:

- Compare up to four device previews side by side.
- Switch orientation, zoom, fit mode, and reload per device.
- Browse a built-in catalog of real device viewport profiles.
- Save favorites, recents, and custom viewport sizes locally.
- Export screenshots and review them on an annotation board.
- Use packaged transparent device mockups for cleaner presentation captures.

Privacy-first by design:

- No account required.
- No backend service.
- No analytics or telemetry.
- No remote storage of screenshots, URLs, annotations, or settings.
- Data is stored locally in Chrome storage on your device.

### Category

Developer Tools

### Language

English

## Privacy Tab Answers

Use these answers if the extension behavior remains local-only.

- Single purpose: Responsive website preview, screenshot, and annotation across multiple device viewport profiles.
- Data usage certification: The extension does not sell, transfer, or use user data outside the single purpose.
- Personally identifiable information: Not collected.
- Health information: Not collected.
- Financial and payment information: Not collected.
- Authentication information: Not collected.
- Personal communications: Not collected.
- Location: Not collected.
- Web history: Not collected.
- User activity: The extension processes the active tab URL only when the user opens the simulator, and does not transmit it to a backend.
- Website content: The extension renders user-selected pages locally for preview and screenshot export; content is not transmitted to a backend.

## Permission Justifications

- `activeTab`: Lets the extension open the current tab URL in the simulator after the user clicks the extension action.
- `tabs`: Reads the active tab URL/title and opens the simulator tab.
- `storage`: Saves local preferences such as favorites, recent devices, and custom viewport settings.
- `downloads`: Saves screenshot exports to the user's device.
- `<all_urls>` host permission: Allows the simulator to preview user-selected websites across device frames.

## GitHub Secrets

Create these repository or environment secrets in GitHub:

- `CHROME_CLIENT_ID`
- `CHROME_CLIENT_SECRET`
- `CHROME_REFRESH_TOKEN`

Recommended: create a GitHub environment named `chrome-web-store`, add these secrets there, and add required reviewers so releases are manually approved before upload.

## Google Cloud Setup

1. Open Google Cloud Console and create or select a project.
2. Enable the `Chrome Web Store API`.
3. Configure the OAuth consent screen.
4. Create an OAuth Client ID with application type `Web application`.
5. Add this authorized redirect URI: `https://developers.google.com/oauthplayground`.
6. Copy the client ID and client secret into GitHub secrets.

## Refresh Token Setup

1. Open https://developers.google.com/oauthplayground.
2. Open settings and enable `Use your own OAuth credentials`.
3. Enter your OAuth client ID and client secret.
4. In scopes, enter `https://www.googleapis.com/auth/chromewebstore`.
5. Authorize using the Google account that owns or can manage the Chrome Web Store item.
6. Exchange the authorization code for tokens.
7. Copy the refresh token into the GitHub secret `CHROME_REFRESH_TOKEN`.

## First Release Checklist

1. In `wxt.config.ts`, bump `manifest.version` for every release after the first upload.
2. Push the workflow and code changes to GitHub.
3. In the Chrome Web Store Developer Dashboard, complete the Store listing tab.
4. Complete the Privacy tab using the answers above.
5. Set visibility, distribution, support, and pricing fields.
6. In GitHub, open Actions > Chrome Web Store Release > Run workflow.
7. Keep `submit_for_review` enabled to upload and submit for review, or disable it for upload-only testing.

The workflow is manual only. It does not run on push or pull requests.

## Official Reference

- Chrome Web Store API guide: https://developer.chrome.com/docs/webstore/using-api
- Chrome Web Store API v2 reference: https://developer.chrome.com/docs/webstore/api/reference/rest
