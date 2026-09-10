# Device validation — Mobile View 0.2.5

105 existing presets were retained. All 188 supported orientation cases passed the source-component browser check: no unequal scaling above 0.1%, no fixed-footer control overlap, and no header paint over the page. Maximum measured scaling error was 0.000019%. These are browser geometry results, **not physical-device certification**. The machine-readable list is [device-test-matrix.json](device-test-matrix.json).

## Changes to test first

| Preset | Previous logical screen | Updated logical screen | Reference |
|---|---:|---:|---|
| iPhone 14 Pro | 390 × 844 | 393 × 852 | [Apple](https://support.apple.com/en-gb/111849) |
| iPhone 14 Pro Max | 428 × 928 | 430 × 932 | [Apple](https://support.apple.com/en-us/111846) |
| iPhone 17 Pro | 402 × 873 | 402 × 874 | [Apple](https://support.apple.com/en-mide/125090) |
| iPhone 12 mini | 360 × 780 | 375 × 812 | [Playwright device reference](https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/server/deviceDescriptorsSource.json); downsampled panel, physical/Display Zoom confirmation required |
| iPad mini 6 | 768 × 1024 | 744 × 1133 | [Apple](https://support.apple.com/en-us/111886) |

Both iPad mini 6 and iPad mini (A17 Pro) now use a modern outline without a Home button. The outline is original vector artwork, not a manufacturer photo; its bezel and corner-radius measurements remain provisional. See [asset provenance](device-asset-sources.md).

The shared fitting logic now scales the page uniformly inside each artwork opening. It uses small centered margins where the artwork aspect ratio differs from the logical screen. It does not distort the website to fit a picture. All image-backed models receive this change, including the 18 that previously exceeded the scaling threshold.

29 compatible iPhone presets default to an iOS 26 presentation. The version and Compact / Bottom / Top Safari layout can be selected per viewport. iPhone 5, first-generation SE, X and XR retain their catalog generation. All six iPads use their own tab/address geometry with Tabs / Compact tabs choices. Android browser controls, keyboards and landscape sizing share the content-rectangle calculation. Browser bars and the keyboard reserve space for fixed page actions.

Page colors come from current visible edges, including supported modern CSS colors and ancestor opacity. A scrolled-away header no longer continues tinting the top. Status icon contrast uses the sampled surface. The iPhone header also covers the small artwork fitting margin without painting into page content. Gradients, photographs, backdrop blending and animated native Liquid Glass are not pixel-equivalent simulations.

## Physical Safari procedure

No physical iPhone or iPad was connected for this run. Start with iPhone 14 Pro / Pro Max, 17 Pro, 12 mini, 17e / 16e (notch), Air (island), SE (legacy), iPad mini 6 / A17 Pro, iPad Pro 13 and iPad Air 13; then use the complete list below. iPhone X / XR validate legacy layouts only.

Use [real-device-probe.html](../scripts/device-audit/real-device-probe.html) on a development server reachable from the device. It supports `?fit=auto` and `?fit=cover` and shows/exportable viewport measurements. Record the exact OS build, Safari layout, Display Zoom, page zoom, text size and orientation with each capture. A desktop preview cannot supply these native measurements.

1. On an actual supported iPhone, select each Safari layout in Settings → Apps → Safari. On iPad, repeat with its tab layout options. Use [Apple's layout guide](https://support.apple.com/guide/iphone/change-the-layout-ipha9ffea1a3/26/ios/26) as the UI reference.
2. Capture the initial, scrolled/collapsed, upward-scroll/expanded and rotation states in both orientations. Repeat with `fit=auto` and `fit=cover`, light/dark page surfaces, sticky and non-sticky headers, opaque/translucent backgrounds, and a fixed bottom action.
3. Focus text, email and number inputs. Compare the visible page, fixed footer and keyboard in portrait and landscape, then blur and rotate again. Record `innerWidth/Height`, `visualViewport` dimensions/offset, screen size, DPR and CSS safe-area values from the probe.
4. Confirm that the notch/island stays inside the hardware mask, status icons remain readable, and browser controls never cover the fixed action in the extension. Native Safari may intentionally overlay controls; record that as a native behavior rather than forcing the fixture to match a guessed constant.
5. Attach the native screenshot and JSON for each case, then calibrate the browser constants or frame metadata where the difference matters. Preserve measured logical dimensions instead of changing them to fit the artwork.

The extension uses the host Chrome rendering engine. It does not emulate Safari's engine, the preset's true DPR, iOS font rendering, `env(safe-area-inset-*)`, all `svh/dvh` behavior or Display Zoom. `viewport-fit=cover` deliberately exposes the full landscape width; the website's native CSS safe-area behavior needs real Safari testing. Apple's guidance and [WebKit's safe-area explanation](https://webkit.org/blog/7929/designing-websites-for-iphone-x/) are references, not evidence of an attached device.

## Reproduce the local geometry audit

Run `npm run build`, `npm run build:device-audit`, then `python3 scripts/device-audit/serve.py`. Open `http://127.0.0.1:5190/?all` and click **Measure 188 cases**. The harness renders the real `DeviceFrame` component, loads local frame art, and measures fixed actions against browser control rectangles. The JSON appears on the page. The recorded run is in `output/playwright/device-audit/results.json`.

## Exact retest list

Every row below passed the local geometry check. Native validation is outstanding for every row. P = portrait, L = landscape. Screen dimensions are logical CSS screen sizes before the browser UI reservation, not the resulting page-content height.

| Device / exact preset ID | Logical screen | DPR metadata | Orientations | iOS 26 presentation |
|---|---:|---:|---|---|
| Self-service Kiosk<br>`self-service-kiosk` | 1080 × 1920 | 1 | P | — |
| Sonoff Nspanel Pro<br>`sonoff-nspanel-pro` | 480 × 480 | 1 | P | — |
| Apple Studio Display XDR 27-inch<br>`apple-studio-display-xdr-27-2026` | 2560 × 1440 | 2 | P | — |
| iMac 24 inch<br>`imac-24-2021` | 2048 × 1152 | 2 | P | — |
| Apple MacBook Air 13 inch<br>`macbook-air-2020-13` | 1280 × 800 | 2 | P | — |
| Apple MacBook Neo 13-inch<br>`apple-macbook-neo-13-2026` | 1204 × 753 | 2 | P | — |
| Apple MacBook Pro 14-inch (M5)<br>`apple-macbook-pro-14-m5-2025` | 1512 × 982 | 2 | P | — |
| Apple MacBook Pro 16 inch<br>`macbook-pro-16-2021` | 1728 × 1085 | 2 | P | — |
| Dell Latitude 14 3420<br>`dell-latitude-14-3420` | 1440 × 809 | 1 | P | — |
| Microsoft Surface Laptop 13.8-inch (8th Edition)<br>`microsoft-surface-laptop-8-13-8-2026` | 1152 × 768 | 2 | P | — |
| Modern Laptop 15 inch<br>`modern-laptop-15` | 1440 × 900 | 1 | P | — |
| Apple iPhone 11<br>`apple-iphone-11` | 414 × 896 | 2 | P / L | Available |
| Apple iPhone 11 Pro<br>`apple-iphone-11-pro` | 375 × 812 | 3 | P / L | Available |
| Apple iPhone 11 Pro Max<br>`apple-iphone-11-pro-max` | 414 × 896 | 3 | P / L | Available |
| Apple iPhone 12<br>`apple-iphone-12` | 390 × 844 | 3 | P / L | Available |
| Apple iPhone 12 Mini<br>`apple-iphone-12-mini` | 375 × 812 | 3 | P / L | Available |
| Apple iPhone 12 Pro<br>`apple-iphone-12-pro` | 390 × 844 | 3 | P / L | Available |
| Apple iPhone 12 Pro Max<br>`apple-iphone-12-pro-max` | 428 × 926 | 3 | P / L | Available |
| Apple iPhone 13<br>`apple-iphone-13-2021` | 390 × 844 | 3 | P / L | Available |
| Apple iPhone 13 Mini<br>`apple-iphone-13-mini` | 375 × 812 | 3 | P / L | Available |
| Apple iPhone 13 Pro<br>`apple-iphone-13-pro-2021` | 390 × 844 | 3 | P / L | Available |
| Apple iPhone 13 Pro Max<br>`apple-iphone-13-pro-max-2021` | 428 × 926 | 3 | P / L | Available |
| Apple iPhone 14<br>`apple-iphone-14` | 390 × 844 | 3 | P / L | Available |
| Apple iPhone 14 Plus<br>`apple-iphone-14-max-2022` | 428 × 926 | 3 | P / L | Available |
| Apple iPhone 14 Pro<br>`apple-iphone-14-pro-2022` | 393 × 852 | 3 | P / L | Available |
| Apple iPhone 14 Pro Max<br>`apple-iphone-14-pro-max-2022` | 430 × 932 | 3 | P / L | Available |
| Apple iPhone 15<br>`apple-iphone-15` | 393 × 852 | 3 | P / L | Available |
| Apple iPhone 15 Plus<br>`apple-iphone-15-plus-2023` | 430 × 932 | 3 | P / L | Available |
| Apple iPhone 15 Pro<br>`apple-iphone-15-pro-2023` | 393 × 852 | 3 | P / L | Available |
| Apple iPhone 15 Pro Max<br>`apple-iphone-15-pro-max-2023` | 430 × 932 | 3 | P / L | Available |
| Apple iPhone 16<br>`apple-iphone-16-2024` | 393 × 852 | 3 | P / L | Available |
| Apple iPhone 16 Plus<br>`apple-iphone-16-plus-2024` | 430 × 932 | 3 | P / L | Available |
| Apple iPhone 16 Pro<br>`apple-iphone-16-pro-2024` | 402 × 874 | 3 | P / L | Available |
| Apple iPhone 16 Pro Max (2024)<br>`apple-iphone-16-pro-max-2024` | 440 × 956 | 3 | P / L | Available |
| Apple iPhone 16e<br>`apple-iphone-16e-2025` | 390 × 844 | 3 | P / L | Available |
| Apple iPhone 17<br>`apple-iphone-17-2025` | 402 × 874 | 3 | P / L | Available |
| Apple iPhone 17 Pro<br>`apple-iphone-17-pro-2025` | 402 × 874 | 3 | P / L | Available |
| Apple iPhone 17 Pro Max (2025)<br>`apple-iphone-17-pro-max-2025` | 440 × 956 | 3 | P / L | Available |
| Apple iPhone 17e<br>`apple-iphone-17e-2026` | 390 × 844 | 3 | P / L | Available |
| Apple iPhone 5<br>`apple-iphone-5` | 320 × 568 | 2 | P / L | — |
| Apple iPhone Air (2025)<br>`apple-iphone-air-2025` | 420 × 912 | 3 | P / L | Available |
| Apple iPhone SE (1st generation)<br>`apple-iphone-se-2018` | 320 × 568 | 2 | P / L | — |
| Apple iPhone X<br>`apple-iphone-x` | 375 × 812 | 3 | P / L | — |
| Apple iPhone XR<br>`apple-iphone-xr` | 414 × 896 | 2 | P / L | — |
| Google Pixel 10<br>`google-pixel-10-2026` | 412 × 924 | 2.625 | P / L | — |
| Google Pixel 10 Pro<br>`google-pixel-10-pro-2026` | 410 × 912 | 3.125 | P / L | — |
| Google Pixel 10 Pro Fold<br>`google-pixel-10-pro-fold-2026` | 412 × 901 | 2.625 | P / L | — |
| Google Pixel 10 Pro XL<br>`google-pixel-10-pro-xl-2025` | 448 × 997 | 3 | P / L | — |
| Google Pixel 10a<br>`google-pixel-10a-2026` | 412 × 924 | 2.625 | P / L | — |
| Google Pixel 11<br>`google-pixel-11-2026` | 412 × 924 | 2.625 | P / L | — |
| Google Pixel 11 Pro<br>`google-pixel-11-pro-2026` | 410 × 914 | 3.125 | P / L | — |
| Google Pixel 11 Pro Fold<br>`google-pixel-11-pro-fold-2026` | 791 × 823 | 2.625 | P / L | — |
| Google Pixel 11 Pro XL<br>`google-pixel-11-pro-xl-2026` | 448 × 997 | 3 | P / L | — |
| Google Pixel 5<br>`google-pixel-5` | 393 × 851 | 3 | P / L | — |
| Google Pixel 6 Pro<br>`google-pixel-6-pro` | 412 × 892 | 3.5 | P / L | — |
| Google Pixel 8<br>`google-pixel-8` | 412 × 916 | 2.625 | P / L | — |
| Huawei P30 Pro<br>`huawei-p30-pro` | 360 × 780 | 3 | P / L | — |
| Infinix Hot 70<br>`infinix-hot-70-2026` | 360 × 788 | 2 | P / L | — |
| Motorola Edge 60 Pro<br>`motorola-edge-60-pro-2025` | 407 × 904 | 3 | P / L | — |
| Motorola Razr 70 Ultra<br>`motorola-razr-70-ultra-2026` | 412 × 1008 | 3 | P / L | — |
| Non-branded Android Smartphone<br>`non-branded-android-smartphone` | 360 × 800 | 3 | P / L | — |
| OPPO Find X3 Pro<br>`oppo-find-x3-pro` | 360 × 804 | 4 | P / L | — |
| OnePlus Nord 2<br>`oneplus-nord-2` | 412 × 915 | 2.625 | P / L | — |
| Samsung Galaxy A12<br>`samsung-galaxy-a12-2021` | 360 × 800 | 2 | P / L | — |
| Samsung Galaxy A17<br>`samsung-galaxy-a17-2025` | 412 × 892 | 2.625 | P / L | — |
| Samsung Galaxy A27 5G<br>`samsung-galaxy-a27-5g-2026` | 360 × 780 | 3 | P | — |
| Samsung Galaxy Note20 Ultra<br>`samsung-galaxy-note20-ultra` | 412 × 883 | 3 | P / L | — |
| Samsung Galaxy S20<br>`samsung-galaxy-s20` | 360 × 800 | 3 | P / L | — |
| Samsung Galaxy S21 Ultra<br>`samsung-galaxy-s21-ultra` | 360 × 800 | 4 | P / L | — |
| Samsung Galaxy S22<br>`samsung-galaxy-s22-2022` | 360 × 780 | 3 | P / L | — |
| Samsung Galaxy S22 Plus<br>`samsung-galaxy-s22-plus-2022` | 360 × 780 | 3 | P / L | — |
| Samsung Galaxy S22 Ultra<br>`samsung-galaxy-s22-ultra-2022` | 360 × 772 | 4 | P / L | — |
| Samsung Galaxy S24<br>`samsung-galaxy-s24` | 360 × 780 | 3 | P / L | — |
| Samsung Galaxy S24 Ultra<br>`samsung-galaxy-s24-ultra` | 384 × 832 | 3.75 | P / L | — |
| Samsung Galaxy S26<br>`samsung-galaxy-s26-2026` | 360 × 780 | 3 | P / L | — |
| Samsung Galaxy S26 Ultra<br>`samsung-galaxy-s26-ultra-2026` | 412 × 891 | 4 | P / L | — |
| Samsung Galaxy S26+<br>`samsung-galaxy-s26-plus-2026` | 384 × 832 | 3.75 | P / L | — |
| Samsung Galaxy XCover7 Pro<br>`samsung-galaxy-xcover7-pro-2025` | 360 × 803 | 3 | P / L | — |
| Samsung Galaxy Z Flip3<br>`samsung-galaxy-z-flip3-2021` | 360 × 880 | 3 | P / L | — |
| Samsung Galaxy Z Flip7<br>`samsung-galaxy-z-flip7-2025` | 360 × 840 | 3 | P / L | — |
| Samsung Galaxy Z Flip8 (folded)<br>`samsung-galaxy-z-flip8-folded-2026` | 316 × 349 | 3 | P | — |
| Samsung Galaxy Z Flip8 (unfolded)<br>`samsung-galaxy-z-flip8-unfolded-2026` | 360 × 840 | 3 | P | — |
| Samsung Galaxy Z Fold 2<br>`samsung-galaxy-z-fold-2` | 884 × 1104 | 2.5 | P / L | — |
| Samsung Galaxy Z Fold7 (unfolded)<br>`samsung-galaxy-z-fold7-unfolded-2025` | 874 × 787 | 2.5 | P | — |
| Samsung Galaxy Z Fold8 (folded)<br>`samsung-galaxy-z-fold8-folded-2026` | 416 × 657 | 3 | P | — |
| Samsung Galaxy Z Fold8 (unfolded)<br>`samsung-galaxy-z-fold8-unfolded-2026` | 979 × 739 | 2.5 | P | — |
| Samsung Galaxy Z Fold8 Ultra (folded)<br>`samsung-galaxy-z-fold8-ultra-folded-2026` | 360 × 840 | 3 | P | — |
| Samsung Galaxy Z Fold8 Ultra (unfolded)<br>`samsung-galaxy-z-fold8-ultra-unfolded-2026` | 902 × 1002 | 2.5 | P | — |
| Xiaomi 12<br>`xiaomi-12-2022` | 360 × 800 | 3 | P / L | — |
| Xiaomi MI 11i<br>`xiaomi-mi-11i` | 360 × 800 | 3 | P / L | — |
| Zebra MC330<br>`zebra-mc330` | 480 × 800 | 1 | P / L | — |
| Zebra TC58<br>`zebra-tc58-2022` | 412 × 823 | 2.625 | P / L | — |
| Zebra TC78<br>`zebra-tc78` | 412 × 818 | 2 | P / L | — |
| Apple iPad Air 13-inch (M4)<br>`apple-ipad-air-13-m4-2026` | 1024 × 1366 | 2 | P / L | Available |
| Apple iPad Air 4<br>`apple-ipad-air-4` | 820 × 1180 | 2 | P / L | Available |
| Apple iPad Mini (6th Gen)<br>`apple-ipad-mini-6` | 744 × 1133 | 2 | P / L | Available |
| Apple iPad Pro 11<br>`apple-ipad-pro-11-2018` | 834 × 1194 | 2 | P / L | Available |
| Apple iPad Pro 13-inch (M4)<br>`apple-ipad-pro-13-m4-2024` | 1032 × 1376 | 2 | P / L | Available |
| Apple iPad mini (A17 Pro)<br>`apple-ipad-mini-a17-pro-2024` | 744 × 1133 | 2 | P / L | Available |
| Microsoft Surface Duo<br>`microsoft-surface-duo` | 1114 × 705 | 2 | P | — |
| Panasonic Toughbook S1<br>`panasonic-toughbook-s1-2021` | 533 × 853 | 1.5 | P / L | — |
| Samsung Galaxy Tab S11 Ultra<br>`samsung-galaxy-tab-s11-ultra-2025` | 924 × 1480 | 2 | P / L | — |
| Samsung Galaxy Tab S7<br>`samsung-galaxy-tab-s7` | 800 × 1280 | 2 | P / L | — |
| Samsung Smart TV Neo QLED 4K 55 inch<br>`samsung-neo-qled-4k-55` | 1920 × 1080 | 2 | P | — |
| Apple Watch Series 6 (40mm)<br>`apple-watch-series-6-40` | 162 × 197 | 2 | P | — |
