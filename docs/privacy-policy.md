# Mobile View & Responsive Tester — Privacy Policy

Last updated: July 12, 2026

## Overview

Mobile View & Responsive Tester is a local-first Chrome extension for previewing websites across device viewport profiles and capturing responsive testing screenshots. All processing happens in your browser. No data is sent to a remote service.

## Data Collection

Mobile View & Responsive Tester does **not** collect, track, sell, transfer, or share any user data with third parties.

The extension has no backend, no analytics, no telemetry, no remote logging, and no advertising trackers.

## Data Stored Locally

The extension uses Chrome's local storage (`chrome.storage`) to persist preferences on your own device. This may include:

- Selected device profiles and slot layout.
- Favorite and recently used devices.
- Saved layout presets and imported preset JSON.
- Custom viewport dimensions.
- Extension UI state (sidebar open/closed, zoom levels, etc.).
- Local usage counters and dismissed review prompts.

No storage data is transmitted outside your device.

## Website Access

When you activate the extension from the toolbar or Chrome context menu, it injects an overlay iframe into the current tab so you can preview that page across device viewports. The URL of the active tab is used only to load the page inside the simulator frames. It is not transmitted to any external server.

The extension uses declarative network rules (`declarativeNetRequest`) to remove `X-Frame-Options` and `Content-Security-Policy` headers on sub-frame requests so previewed pages can load inside the simulator. These rules execute entirely within Chrome and do not send data anywhere.

## Screenshots and Annotations

Screenshots are captured locally using Chrome's `tabs.captureVisibleTab` API and processed entirely in the browser. Annotations are drawn on a local canvas. Exports are saved to your device via Chrome's `downloads` API only when you explicitly choose to download them. Nothing is uploaded.

## Design References

When you drop, paste, or choose a design reference, the image is read into browser memory and displayed beside or over the corresponding live device preview. It is not uploaded, transmitted, or automatically saved. References are discarded when the viewer session closes. If you choose **Mark feedback**, the existing local annotation tools apply.

## Presets and Imports

Saved device presets are stored locally in Chrome storage. If you import a preset JSON file, the file is read in your browser and merged into local storage. Preset files are not uploaded or transmitted.

## Clipboard

When you copy an annotated screenshot, the image data is written to your system clipboard via the `navigator.clipboard` API. The data stays on your device.

When you use Generate AI fix prompt, the extension locally formats the page URL, active device names, viewport sizes, orientation, optional selector, and the text you entered. Page text is not collected. The prompt is not stored or transmitted. It leaves the extension only when you explicitly copy it to your system clipboard.

## Remote Code

Mobile View & Responsive Tester does not execute remotely hosted JavaScript or WebAssembly. All extension code ships with the packaged extension.

## Permissions Summary

| Permission | Purpose |
|---|---|
| `contextMenus` | Add a local Chrome menu shortcut for opening the current tab in the simulator. |
| `scripting` | Run the content script that injects and manages the overlay iframe. |
| `tabs` | Read the active tab URL and title; capture visible tab screenshots. |
| `declarativeNetRequest` | Strip `X-Frame-Options` and `CSP` headers on sub-frame requests so previewed pages load inside the simulator. |
| `storage` | Save local preferences, presets, favorites, layout, review-prompt state, and usage counters to Chrome's local storage. |
| `downloads` | Save exported screenshots to the user's device. |
| `debugger` | Temporarily apply device metrics while capturing an individual viewport, then immediately detach and restore the page. |
| `offscreen` | Run local tab-recording processing in Chrome's required offscreen document. |
| `tabCapture` | Capture the selected source tab when the user explicitly starts recording. |

The extension also requests access to HTTP and HTTPS pages because the simulator must inject its local overlay and load the selected page in device preview frames. This access is used only after installation for the extension's stated responsive-testing purpose and does not transmit browsing activity.

The green `ON` toolbar badge is local browser UI state. It records or transmits nothing and is cleared when the simulator overlay closes.

Keyboard shortcuts are declared through Chrome's `commands` manifest key, which does not add an API permission. The previously declared `activeTab` and `commands` permission entries were removed after the permission audit because the existing content-script and host-access configuration already covers the user-initiated overlay workflow.

## Changes to This Policy

If the data practices described here change in a meaningful way, the "Last updated" date above will be revised and an updated policy will be published.

## Contact

For privacy questions or to report an issue, open a ticket at:

https://github.com/edisonaugusthy/multi-device-viewer/issues
