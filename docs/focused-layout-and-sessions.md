# Focus layout, session reuse and website appearance

Implemented locally on 7 September 2026 for Mobile View 0.2.5.

## Default behavior

The viewer opens on the existing website document. Its previews use the website's URL and normal browser session context. Users do not select a separate login mode or copy credentials. Saved devices and appearance are restored before any preview loads.

Installed Chrome checks used a local website with a server-issued **HttpOnly, SameSite=Strict** login cookie. All three previews were signed in without a second login. Local storage and session storage were also available, and signing out produced three signed-out previews. The original source document and its unsaved draft survived opening and closing the viewer.

Each preview is a new document on first opening or explicit reload. The source page's unsaved fields and JavaScript-only state are not cloned into it. Once a preview is loaded, switching Device/Free, entering or exiting View only, or changing light/dark preserves that preview's document and draft. Site-specific SSO, authentication held only in memory, and sites that restrict embedding still need individual checks. The user's affected website has not yet been identified. [Chrome storage and cookie context](https://developer.chrome.com/docs/extensions/develop/concepts/storage-and-cookies).

## Interface

The selected baseline is the earlier **Tools panel with all sections visible**, before the section dropdown was added. The toolbar retains Tools, View only, add and screenshot on the left; Device/Free is centered; scroll sync, navigation sync, Reload all, theme and close remain on the right. Toolbar controls use compact heights and existing translations.

Tools opens on the left over the canvas. Quick device sets, Devices, Custom viewports, Saved sets, Session tools and Flow recorder return in their previous order, with their previous text. Saved sets retains its original Manage action and named rows. Screenshot and annotate and Start a new check are removed from Tools. Screenshot annotation remains available in the main toolbar and per-device menu. Section navigation and the saved/custom list dropdowns have been removed. The panel may scroll when its complete contents exceed the window; controls are not removed or hidden behind new categories to eliminate scrolling.

Per-device controls retain the earlier Tools-layout arrangement: device selector and dimensions, followed by the labeled viewport options menu and a directly accessible remove button at the top-right of each removable column. The last remaining viewport retains its existing removal protection. The category buttons in the device picker are restored in their original order. Picker rows are compact again, with the original text, size information and favorite button positions. Search normalization, deduplication, keyboard navigation, Escape focus restoration and window-fit positioning remain.

The device picker now has clearer borders, more readable metadata, and distinct selected, hover and keyboard-focus states in light and dark mode. Category buttons support arrow keys and Home/End without changing their order or labels; clearing search keeps focus in the input. Checks covered all three picker anchors at 1280×720, 760×480 and 375×360, plus search, favorites and focus navigation. TypeScript and targeted Chromium regression tests passed. [Light picker](../output/playwright/device-picker-style/light.png) · [Dark picker](../output/playwright/device-picker-style/dark.png) · [Small-window picker](../output/playwright/device-picker-style/compact.png).

Device/Free changes do not recreate preview documents. **View only** hides the toolbar, device controls, Tools, design-reference panel and resize handles while websites remain interactive. Its return control is on the left and fades until hovered or focused. Escape restores controls, including from installed-extension previews.

The session, native website dark mode, feedback, device geometry and keyboard fixes remain. Classic mode has not been reintroduced as a separate option. Historical archives under `output/baselines/before-focused-layout/` and source snapshots under `output/baselines/before-control-restoration/` remain available. Store artwork should be refreshed before upload to match the final chosen layout.

Browser checks verified the restored Tools actions and category buttons, unchanged button text, centered Device/Free switch, and preview document continuity. [Restored workspace](../output/playwright/restored-controls/workspace.png) · [Restored picker](../output/playwright/restored-controls/picker.png).

## Keyboards

See the [latest keyboard review](keyboard-review.md) for the foldable fix, field navigation and locale-aware input behavior.

The simulated docked keyboard now has separate text, symbols, number, decimal, telephone, email and URL layouts. Decimal has one decimal key; the symbols switch exposes punctuation. Email, URL and password fields do not start capitalized. Tablet text layouts include a number row, tablet number pads have a bounded width, and short landscape screens retain space for the focused field. `inputmode="none"` and native date/time picker fields suppress the simulated keyboard; non-iOS/Android devices do not receive a fake Android keyboard. Escape dismisses an active keyboard.

These are responsive-testing approximations, not native operating-system keyboards. Floating/split iPad keyboards, configurable Android IMEs, prediction engines and arbitrary language keyboard layouts are not emulated. Native keyboard geometry varies: [Apple iPad keyboard modes](https://support.apple.com/en-gb/guide/ipad/ipad02663f08/ipados), [Android IME insets](https://developer.android.com/develop/ui/views/layout/sw-keyboard).

## Dark mode

The selected device appearance now sets the iframe's native `color-scheme`. Websites receive the matching `prefers-color-scheme` CSS preference and JavaScript media-query change events, including the saved appearance on first load. The extension does not invert images, rewrite the website's theme classes, or change its stored theme preference. Websites that have no dark theme, or explicitly choose their own appearance, may keep their existing colors. The original source page's appearance remains unchanged. [Native embedded color schemes](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-color-scheme#embedded_elements).

## Verification

Navigation and scroll sync have a separate [reliability report and reproducible browser audits](navigation-scroll-sync.md), covering reloads, SPA/history navigation, cross-origin pages, nested and RTL scrolling, immediate source switching, new viewports and layout clamping.

| Check | Result |
|---|---|
| TypeScript and unit suite | Passed; 307 tests across 18 files |
| Browser regression suite | Chromium checks passed |
| Installed Chrome session fixture | Three signed-in and three signed-out previews matched the source session; cookie stayed HttpOnly |
| Preview continuity | Document tokens and an unsaved preview draft survived view, layout and appearance switches |
| Original page | Document token, unsaved source draft and page background survived viewer close |
| Native website themes | CSS colors and JavaScript media queries updated in Chrome |
| Saved dark appearance | All three previews detected dark on first load; exactly three preview document requests |
| Classic migration | Old layout preference opens the current interface; no Classic control remains |
| Narrow windows and menus | No toolbar overflow or overlap at 480, 640, 760, 1024 and 1280 CSS pixels; fourth-device selector stayed inside the window |
| Focus navigation | Escape dismissed Tools and returned keyboard focus; eight consecutive close/reopen cycles each produced one viewer |

Earlier session and theme evidence is in `output/playwright/focused-layout/`: `session-theme-results.json`, `initial-theme-check.json`, `final-ui-checks.json` and screenshots.

- [Current workspace](../output/playwright/view-only/workspace.png)
- [View only with devices](../output/playwright/view-only/device-only.png)
- [View only without devices](../output/playwright/view-only/free-only.png)
- [Phone and tablet keyboards](../output/playwright/view-only/keyboards.png)
- [Earlier native dark-mode check](../output/playwright/focused-layout/device-dark.png)

The Chrome screenshots come from an isolated installed-extension QA build; the shipped build retains its closed shadow root. These checks do not establish universal SSO compatibility or native Safari fidelity.

Current View-only and keyboard evidence is in `output/playwright/view-only/`. Installed Chrome checks cover iPhone 17 Pro, iPad Pro 13-inch (M4) and Galaxy Tab S11 Ultra: email typing, punctuation, decimal and telephone input, inputmode suppression, and focused-field visibility. View-only hides all three types of workspace controls and retains document tokens.

Additional installed Chrome checks covered iPhone SE (1st generation) in landscape, Pixel 10a in portrait and landscape, and iPad Pro 13-inch (M4) in landscape. Focused notes stayed inside the resized viewport; Escape dismissed the keyboard. See `keyboard-sizes.json`. Keyboards on devices with a physical Home button omit the gesture home indicator.
