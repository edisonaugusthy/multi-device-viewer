# Navigation and scroll sync reliability

Implemented locally for Mobile View 0.2.5 on 7 September 2026. Toolbar positions, labels and saved sync preferences are unchanged.

## Changes

- Navigation tracks the last observed page URL instead of comparing against the original iframe URL. Returning home, repeated back/forward visits, hashes and SPA routes can sync again.
- The bridge observes URL changes every 150 ms, with immediate checks for hash/history traversal and page restoration. It leaves the website's History methods intact. Patching those methods in a content script does not reliably observe the website's JavaScript because Chrome uses an [isolated execution world](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts).
- Each bridge announces its document identity. A follower acknowledges its new document without rebroadcasting that load, and ignores messages from its outgoing document while navigation is pending. Non-HTTP(S) navigation payloads are rejected.
- READY and iframe load both restore the latest enabled settings. This covers late bridge injection, reloads and new viewports; no off/on retoggle is required. A new document requests a targeted scroll-position snapshot from another viewport.
- Observed URLs are tracked without changing iframe src or recreating live documents. Added and duplicated viewports, device presets, individual reloads and Reload all use the current page URL instead of the original launch URL.
- Root and nested scroll containers are queued independently, so two containers moving in the same animation frame both reach peers. Scrolling remains based on equal CSS-pixel movement, with an absolute snapshot when joining sync.
- Actual applied positions suppress scroll echoes. The previous 120 ms global suppression timer is removed, so another viewport can immediately become the source. Fractional remote destinations are retained across follower-to-source transitions to avoid cumulative rounding drift at scaled viewport boundaries.
- Layout clamping at a resized container's boundary is not rebroadcast as user movement. Horizontal scrolling includes RTL containers. Missing or invalid selectors are ignored; they do not scroll an unrelated container.
- Disabled bridges reject incoming scroll commands, and disabled scroll events keep their baselines current. Enabling does not resample away the first user movement. Different page URLs do not exchange scroll commands.
- Forwarded interaction commands retain their command type. Links are owned by navigation sync rather than also being replayed as clicks, preventing duplicate link loads when both switches are enabled. Modified link clicks are not copied into other viewports.

The production bridge is in `src/app/preview-bridge.ts`, imported by the extension entrypoint. The browser fixture imports the same module rather than implementing a mock sync bridge.

## Verification

The reproducible browser audits are in `scripts/sync-audit/`. Evidence is saved under `output/playwright/sync-audit/`.

All four audits passed in the installed Chrome extension with the production bridge. [Installed Chrome results](../output/playwright/sync-audit/installed-chrome.json). TypeScript passed, all 316 unit tests passed, and the Chromium regression suite passed.

Chrome release ZIPs were rebuilt and passed package validation. Their closed shadow roots and existing permission boundaries were verified in the packaged content scripts and manifests.

The audits cover:

- SPA pushState/replaceState from each viewport, return to the initial URL, full navigation, hashes, back/forward, repeated visits and navigation off/on.
- A real link click with both switches enabled, asserting exactly one new document per viewport.
- Horizontal and vertical movement, simultaneous nested containers, rapid alternating sources, unequal page ends and reversing direction without feedback drift.
- Scroll off/on, source and follower reloads, Reload all after navigating, wheel and PageDown input, device selection, Device/Free, View only, adding/removing a viewport, and preserved document identities during view changes.
- Cross-origin navigation from 127.0.0.1 to localhost and back, bridge reconnection and scroll sync on the other origin.
- RTL nested scrolling, layout clamping without moving peers, first movement after clamping, different-page isolation, disabled commands and malformed selectors/numbers.

Unit regression coverage for navigation observations is in `src/domain/simulator/navigation-sync.test.ts`. The existing browser regression suite also checks the surrounding interface, capture, flow replay and reload behavior.

## Boundaries

This is browser-preview synchronization, not a clone of a website's JavaScript heap or native Safari. URL synchronization cannot reproduce routing state that exists only in memory at an unchanged URL. Browser scheduling can delay checks in background tabs. Sites still control their own authentication, redirects, embedding restrictions and navigation side effects. Canvas-based virtual scrolling, closed website shadow trees and device-specific DOM containers without matching selectors need site-specific support. The bridge ignores missing targets rather than scrolling the wrong element.

The installed Chrome audit uses a separate QA copy with an open shadow root for automation. Release packages retain a closed shadow root and do not add debugger permissions or global static header rules.

## Full verification follow-up
