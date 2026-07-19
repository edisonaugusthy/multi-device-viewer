# Mobile View & Responsive Tester — Privacy Policy

Last updated: July 15, 2026

## Summary

Mobile View & Responsive Tester is a local-first Chrome and Firefox extension. It does not operate a backend and does not collect, sell, transfer, or share user data. It contains no analytics, telemetry, advertising trackers, remote logging, or behavioral tracking.

Websites, URLs, designs, screenshots, recordings, annotations, prompts, and preferences remain on the user's device unless the user explicitly copies, downloads, or shares an exported result through another application.

## Information processed locally

The extension processes the active tab URL so it can open that page in responsive preview frames. It also renders the website locally inside those frames. This information is not sent to the extension developer or any third-party service.

When the user explicitly chooses a feature, the extension may locally process:

- The active page URL and selected device viewport information.
- A screenshot of the active responsive viewport or full workspace.
- A recording of the selected source tab.
- Design-reference images selected, pasted, or dropped by the user.
- Annotation marks and locally entered prompt text.
- Imported device-set JSON files.
- QR handoff URLs and AI fix-prompt text entered by the user.

## Data stored on the device

Browser-local extension storage is used to preserve the working experience. Stored information may include:

- Selected devices, order, orientation, zoom, and viewport layout.
- Active viewport and interface state.
- Favorite and recently used devices.
- Custom viewports and saved device sets.
- Scroll-sync and theme preferences.
- Design-reference images, overlay positions, opacity, and panel size.
- Welcome and release-note state, local use count, and other dismissed notices.
- Navigation-sync and recording-interface state.

This data is stored only in the user's browser profile. The extension does not synchronize it through an application account or transmit it to a backend.

Users can remove this data by deleting saved items in the extension, clearing the extension's site/storage data, or uninstalling the extension.

## Screenshots, annotations, and clipboard

Screenshots are captured locally with Chrome's visible-tab capture capability and cropped or annotated in the browser. The extension writes an image to the system clipboard only when the user chooses **Copy**, and saves a file only when the user chooses **Download**.

No screenshot or annotation is uploaded automatically.

## Tab recording

Recording begins only after the user selects **Record source tab**. Chrome's tab-capture and offscreen-document capabilities process the recording locally. The completed WebM file is downloaded to the user's device. The extension does not upload or retain a remote copy.

## Design references

Design files are read locally and displayed beside or over a live viewport. References may be stored in browser-local extension storage so the workspace can resume. They are never uploaded by the extension. Removing the reference, clearing extension storage, or uninstalling the extension removes the locally retained copy.

## AI fix prompts

The extension formats the user's description with the page URL and selected viewport context. It does not inspect page text for this feature, contact an AI provider, or submit the prompt. The text leaves the extension only when the user explicitly copies and pastes it elsewhere.

## Website access and frame-header rules

HTTP and HTTPS page access is required because the extension runs the local overlay on the selected page and loads that page in responsive subframes.

Declarative network rules remove `X-Frame-Options` and `Content-Security-Policy` response headers from subframe requests so pages can load in the responsive viewer. The rules run locally in the browser. They do not redirect requests, inspect response bodies, or send network activity to the extension developer.

## Permissions

| Permission | Why it is required |
|---|---|
| `contextMenus` | Adds the local shortcut for opening the current page in Responsive Tester. |
| `declarativeNetRequest` | Applies the packaged subframe-header rules needed for responsive previews. |
| `downloads` | Saves screenshots and completed recordings after an explicit user action. |
| `offscreen` | Runs Chrome's local recording pipeline in an offscreen extension document. |
| `scripting` | Injects the packaged overlay script into a page that was already open when the extension was installed or reloaded. |
| `storage` | Stores local preferences, workspace state, designs, custom devices, saved sets, and notice state. |
| `tabCapture` | Records the selected source tab only after the user starts recording. |
| `tabs` | Reads the selected tab URL, communicates with the overlay, manages the viewer tab fallback, and captures the visible workspace. |
| HTTP/HTTPS host access | Allows the packaged content script and responsive preview workflow to operate on user-selected web pages and local development servers. |

The extension does not request the `debugger` permission and does not declare background keyboard commands.

## Remote code

The extension does not execute remotely hosted JavaScript or WebAssembly. All executable code ships inside the extension package.

## Policy changes

If these practices change materially, this document and its last-updated date will be revised before release.

## Contact

Privacy questions and issues can be opened at:

https://github.com/edisonaugusthy/multi-device-viewer/issues
