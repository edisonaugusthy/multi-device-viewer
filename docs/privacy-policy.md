# Multi Device Viewer — Privacy Policy

Last updated: May 14, 2026

## Overview

Multi Device Viewer is a local-first Chrome extension for previewing websites across device viewport profiles and capturing responsive testing screenshots. All processing happens in your browser. No data is sent to a remote service.

## Data Collection

Multi Device Viewer does **not** collect, sell, transfer, or share any user data with third parties.

The extension has no backend, no analytics, no telemetry, no remote logging, and no advertising trackers.

## Data Stored Locally

The extension uses Chrome's local storage (`chrome.storage`) to persist preferences on your own device. This may include:

- Selected device profiles and slot layout.
- Favorite and recently used devices.
- Custom viewport dimensions.
- Extension UI state (sidebar open/closed, zoom levels, etc.).

No storage data is transmitted outside your device.

## Website Access

When you activate the extension, it injects an overlay iframe into the current tab so you can preview that page across device viewports. The URL of the active tab is used only to load the page inside the simulator frames. It is not transmitted to any external server.

The extension uses declarative network rules (`declarativeNetRequest`) to remove `X-Frame-Options` and `Content-Security-Policy` headers on sub-frame requests so previewed pages can load inside the simulator. These rules execute entirely within Chrome and do not send data anywhere.

## Screenshots and Annotations

Screenshots are captured locally using Chrome's `tabs.captureVisibleTab` API and processed entirely in the browser. Annotations are drawn on a local canvas. Exports are saved to your device via Chrome's `downloads` API only when you explicitly choose to download them. Nothing is uploaded.

## Clipboard

When you copy an annotated screenshot, the image data is written to your system clipboard via the `navigator.clipboard` API. The data stays on your device.

## Remote Code

Multi Device Viewer does not execute remotely hosted JavaScript or WebAssembly. All extension code ships with the packaged extension.

## Permissions Summary

| Permission | Purpose |
|---|---|
| `activeTab` | Inject the simulator overlay into the current tab when the extension icon is clicked. |
| `scripting` | Run the content script that injects and manages the overlay iframe. |
| `tabs` | Read the active tab URL and title; capture visible tab screenshots. |
| `declarativeNetRequest` / `declarativeNetRequestWithHostAccess` | Strip `X-Frame-Options` and `CSP` headers on sub-frame requests so previewed pages load inside the simulator. |
| `storage` | Save local preferences (devices, favorites, layout) to Chrome's local storage. |
| `downloads` | Save exported screenshots to the user's device. |
| `debugger` | Available for advanced viewport emulation; not used in the default capture flow. |

## Changes to This Policy

If the data practices described here change in a meaningful way, the "Last updated" date above will be revised and an updated policy will be published.

## Contact

For privacy questions or to report an issue, open a ticket at:

https://github.com/edisonaugusthy/multi-device-viewer/issues
