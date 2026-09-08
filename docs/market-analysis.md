# Mobile View market analysis and rollout

Baseline: 7 September 2026. The [Notion ranking report](https://app.notion.com/p/3d361a941e8381e488b0e4cd75455d46) supplied ten competitors. The complete public-listing audit retrieved 182 advertised competitor locale pages plus one English fallback, and all 55 of our locale pages: 238 successful reads. Full competitor text was used as private research input; the new Mobile View descriptions are original. This work does not establish keyword search volume or a causal conversion lift.

## Opportunity and changes delivered

Our live page advertised 55 locales but served only 16 distinct long descriptions: 32 non-English locales received the exact English body; Catalan received Spanish and Marathi received Hindi. Package metadata and long descriptions in the store dashboard are separate publication surfaces. Completing that publication pipeline is a clearer opportunity than simply making every description longer.

The updated [55-locale master](../store-assets/listings/locales.json) now explains equivalent supported workflows: up to four device views, custom viewports, synchronized scrolling/supported interactions/navigation, saved device sets, capture and annotation, local design comparison, and fix-prompt export. The established English title is retained. Relevant simulator, responsive-testing and multi-device terms appear naturally in useful feature explanations. There are 51 distinct bodies across 55 locale records; shared English regional copy and neutral Spanish regional copy are intentional. Native-language review remains recommended. The UI supports 16 languages; the metadata count must not be advertised as 55 translated interfaces.

The launch artwork demonstrates those workflows with actual extension captures from a fictional local Orbit website. The small promo title is **Mobile. Tablet. Desktop.** The marquee title is **Find layout issues before you ship.** Three screenshot stories show the comparison workspace, synchronized scrolling and actionable annotation. Eight language variants are available.

## Competitor comparison

Advertised features below are publisher positioning claims, not a full hands-on competitor certification. Locale and distinct-body counts describe the audit snapshot, not guaranteed current values.

| Product | Advertised locales | Distinct description bodies | Positioning lesson |
|---|---:|---:|---|
| [Responsive Viewer](https://chromewebstore.google.com/detail/inmopeiepgfljkpkidclfgbgbmfcennb?hl=en) | 1 | 1 | Lead with the side-by-side workflow; length alone is not an advantage. |
| [Mobile Simulator](https://chromewebstore.google.com/detail/ckejmhbmlajgoklhgbapkiccekfoccmk?hl=en) | 52 | 52 | Connect simulator intent to recognizable devices and client demonstrations. |
| [Phone Simulator](https://chromewebstore.google.com/detail/hahdnalbjglbhcnjdkjhdkmhjkkgjkcd?hl=en) | 53 | 51 | Explain setup steps and supported use cases clearly. |
| [Mobile View Preview](https://chromewebstore.google.com/detail/hocbjiaeeijekejepphjihbpogikmofh?hl=en) | 52 | 52 | State the in-tab desktop/mobile comparison workflow immediately. |
| [Responsive Toolkit](https://chromewebstore.google.com/detail/pahjcficmhfgjkdcdadnacjdiinpilmd?hl=en) | 1 | 1 | Give saved workspaces and reusable configurations a practical purpose. |
| [Mobile View Fast](https://chromewebstore.google.com/detail/clepmakjkiihmfoepipckkafafdepjne?hl=en) | 1 | 1 | Make localhost and live development easy to understand. |
| [Mobile View Tester](https://chromewebstore.google.com/detail/lkndpmbcjincdjeddabmkokchnlhgmbi?hl=en) | 19 | 19 | Connect device coverage with design and QA tasks. |
| [MSIM](https://chromewebstore.google.com/detail/peipdddkaeomnfdenmkddkapeemjomnb?hl=en) | 1 | 1 | Make synchronized scrolling and custom breakpoints visible. |
| [Mobile View Switcher](https://chromewebstore.google.com/detail/bmhfelbhbkeoldaiphchjibggnoodpcj?hl=en) | 1 | 1 | A simple activation promise is effective; user-agent switching is a different workflow. |
| [Device Simulator](https://chromewebstore.google.com/detail/iacpblbgooifgclhbdcaonebhoadpmgj?hl=en) | 1 | 1 | Link multi-device preview to everyday development and QA. |

The historical Notion cohort uses 12 **English queries** across 55 display locales. It does not represent 55 countries or native-language demand. On September 6, “multi device viewer” had full coverage and median position 2; “device emulator” had full coverage and median 3; “mobile simulator” appeared in only 5/55 display locales. Preserve the strong queries while testing the weak intent. These are the supplied report's historical observations, not new rank measurements.

Google describes discovery using relevance, listing quality, ratings, usage and install/uninstall signals. Additional keywords alone cannot guarantee better rankings. Avoid unrelated terms, repeated keyword lists and unprovable superiority claims. [Store discovery](https://developer.chrome.com/docs/webstore/discovery), [keyword policy guidance](https://developer.chrome.com/docs/webstore/spam-faq/).

## One feature to lead the next experiment

**Live Session Check: compare the page you are already using across breakpoints without an extension-triggered reload, then export clear evidence.** This directly addresses an authenticated dashboard or an unsaved form that ordinary new iframes cannot reproduce faithfully. It provides a reason to return beyond a catalog of device pictures.

The separate working [prototype](../prototypes/live-session/README.md) captures the original document at 393, 768 and 1280 CSS pixels and restores its normal viewport and scroll. It preserves the dummy signed-in page, live document token and unsaved draft in the verified browser fixture. A Stop action also restores state. The comparison images are captured results, not simultaneous live copies. Chrome's debugger permission and inability to restore another tool's pre-existing emulation require explicit product decisions before public integration.

This is a positioning hypothesis, not a claim of being unique: [Polypane](https://polypane.app/docs/session-management/) offers shared/separate sessions, and [Responsively](https://responsively.app/) offers synchronized previews and capture. Mobile View's proposed advantage is a quick workflow inside an existing browser session, with local evidence and no service account. Validate that promise with a small group of frontend developers and QA users using their normal test accounts. Do not spend the next release on a large bundle of unrelated features.

## Publication and measurement

1. Complete the priority [device checks](device-validation.md), run normal same-site and cross-site SSO journeys, and review the most-used locale copy with native speakers. Keep source screenshots and the published listing's old assets for rollback.
2. Upload the local extension release and all 55 descriptions to the matching store locales. The upload folder includes correct `storeLocale` and `screenshotLocale` mappings. Use the three screenshots in each supported image locale and English assets for the remaining locales.
3. Run `node scripts/verify-live-store-locales.mjs jfcnekmenjickfihkniaoaklehjmdhdb` after publication. Store the timestamp and matching title/summary/body results. The pre-publication tool check returned 22 readable old listings and 33 HTTP 503 responses; those errors are unresolved public-fetch results, not evidence of missing translations. Avoid calling a release complete while public locale verification is incomplete.
4. Record the exact upload/review/served-live times. Keep the English-summary and image experiments separable where traffic permits, with at least two comparable 14-day windows; extend observation when traffic is too low. Use owner-visible listing visitors, installs/conversion and uninstall trends. No account analytics or conversion figures were available in this implementation.
5. Preserve the existing English-query cohort. Add a separate, small native-query cohort for each priority locale. Example hypotheses: German “Handy Simulator” / “responsive Website testen”, Spanish “simulador móvil” / “diseño responsive”, Japanese “スマホ表示” / “レスポンシブテスト”, Chinese “手机模拟器” / “响应式测试”. These are relevant concepts, not search-volume estimates.
6. Publish a short real-product demonstration and a practical guide that starts from an authenticated dashboard, compares widths and produces useful issue evidence. Show the limits honestly. Prefer useful examples and accurate comparisons over many thin localization pages. Request genuine reviews after value is demonstrated; preserve opt-outs and avoid repeated interruptions.

The extension remains local-first. No remote behavioral analytics were introduced. For feature research, use direct user feedback or a deliberately designed opt-in diagnostic export. Judge the next feature by whether users complete a real comparison and return to it, not by a larger advertised device count.

Audit provenance: the source collection and hashes remain in the review workspace at `mdv-review/locale-audit.json`; the downloaded competitor v4.19.1 source was inspected read-only to understand its architecture. No competitor executable code or artwork was copied into this release.
