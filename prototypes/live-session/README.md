# Mobile View Lab — Live Session Check

A separate Chrome prototype: resize the **original live document** to selected widths, capture each state, and restore its normal viewport and scroll. The comparison images are snapshots; only the original page is live. No screenshots, cookies, tokens or notes are uploaded.

Build with `npm run build:live-session-prototype`. The unpacked lab extension is written to `output/live-session-prototype/`. Install it only in a test profile for evaluation. Open a normal website tab, close the Mobile View overlay and DevTools, then click the lab action. Choose one to four widths (320–1920 CSS px) and a height (320–1600), and select **Compare current session**. Stop cancels and restores the source; closing the comparison tab also cancels its job.

This lab requires Chrome's `debugger` permission. It is absent from the main production manifests and ZIPs. The approved plan deliberately separates prototype evaluation from the later decision to ship that permission. Chrome uses its own rendering engine, with `mobile: false` and DPR 1 for these responsive comparisons; it does not reproduce mobile Safari behavior.

The real-browser check captured 393 × 900, 768 × 900 and 1280 × 900 from a dummy signed-in page. The same document token, unsaved textarea, 210px scroll position and original 1200 × 737 viewport survived the run. The Stop path also restores the original state. Unit tests cover capture failures, cancellation, navigation and attachment refusal.

Existing emulation settings from other tools cannot be reconstructed by the available protocol. In a Playwright browser configured with a 1440 × 960 override, clearing metrics returned the tab to the physical browser viewport instead. This is an explicit prototype limitation: evaluate it in an ordinary browser window without another emulation session. Responsive websites may themselves reset application state when breakpoints change; this prototype prevents extension-triggered reloads, not arbitrary site behavior. DevTools, managed policies and inaccessible pages may interrupt attachment. Restoration failures are reported as errors, not success.

Before production: validate DevTools detach and managed-browser behavior with representative users, agree on the install-permission disclosure and privacy wording, add accessible/localized workflow polish, and decide how to connect the captures to the existing annotation and fix-prompt tools. These integrations are future product work, not advertised as already shipped.

References: [Chrome debugger lifecycle](https://developer.chrome.com/docs/extensions/reference/api/debugger), [device metrics](https://chromedevtools.github.io/devtools-protocol/tot/Emulation/#method-setDeviceMetricsOverride).
