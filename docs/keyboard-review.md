# Keyboard review — 7 September 2026

The shared iOS and Android keyboards now adapt to phones, tablets and wide unfolded phones. Desktop, TV and watch presets do not receive a simulated mobile keyboard. These are browser-based approximations of docked keyboards, not native operating-system emulation.

## Improvements

- Wide unfolded phones use tablet spacing and a number row. Ordinary landscape phones keep phone spacing.
- Explicit `inputmode` wins over the input type: for example, a telephone field requesting numeric input gets a number pad. [Input-mode behavior](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode).
- Decimal keys use the field's locale (`1,5` in German, for example). Native number inputs receive the normalized period separator required for their value.
- iOS Previous/Next arrows are functional. Navigation skips hidden, disabled, read-only and explicitly untabbable fields, respects positive tab order and stops at the end without submitting the form.
- Text areas honor explicit Done/Next/Previous hints. [Enter-key hints](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/enterkeyhint).
- Moving between fields resets the symbols layer and initial Shift state. Password fields have no shortcut suggestions. The static fake word predictions have been replaced with punctuation shortcuts for ordinary text fields.
- The Fold7 center crease no longer cuts a noninteractive strip through the page. Centered inputs and keyboard keys can be clicked; its camera cutout remains.
- Earlier improvements remain: short-screen height caps, tablet numeric-pad width limits, one decimal key, separate symbols/phone layouts, inputmode-none/date-picker suppression, focused-field scrolling and Escape dismissal. Devices with physical Home buttons omit the gesture indicator.

## Verification

Installed Chrome checks exercised iPhone 17 Pro, iPad Pro 13-inch (M4) and Galaxy Z Fold7 (unfolded): numeric overrides, locale decimal entry, password appearance, field-mode reset and textarea Done. Previous/Next was checked on the two iOS presets. Fold7 inputs were clicked at their center, including the formerly blocked crease.

Prior installed-extension checks also covered Pixel 10a portrait/landscape, iPhone SE (1st generation) landscape and Galaxy Tab S11 Ultra. Those checked typing and focused-field visibility; they are not a claim that every preset or physical device has been tested.

- [Light keyboard comparison](../output/playwright/keyboard-refinement/keyboards-light.png)
- [Dark keyboard comparison](../output/playwright/keyboard-refinement/keyboards-dark.png)
- [Latest browser evidence](../output/playwright/keyboard-refinement/results.json)
- [Earlier short-screen evidence](../output/playwright/view-only/keyboard-sizes.json)

Floating/split keyboards, custom Android IMEs, native prediction engines and arbitrary language key arrangements are not emulated. Website-specific input behavior can still differ from a real mobile browser; final mobile QA should include physical devices.
