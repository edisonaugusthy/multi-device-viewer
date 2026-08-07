# Chrome Web Store Featured badge readiness

The Featured badge is awarded after a manual Chrome Web Store review. It cannot
be guaranteed or purchased. This checklist tracks the requirements that the
project can control and the final actions that must be completed in the Chrome
Web Store Developer Dashboard.

Official references:

- [Featured badge and nomination eligibility](https://developer.chrome.com/docs/webstore/discovery#featured-badge)
- [Chrome Web Store best practices](https://developer.chrome.com/docs/webstore/best-practices)
- [Creating a high-quality listing](https://developer.chrome.com/docs/webstore/best-listing)
- [Image requirements](https://developer.chrome.com/docs/webstore/images)
- [Use the narrowest necessary permissions](https://developer.chrome.com/docs/webstore/program-policies/permissions)

## Repository readiness

- [x] Manifest V3 is used.
- [x] Executable code is packaged with the extension; no remote code is used.
- [x] The product has a clear responsive-testing purpose and meaningful utility.
- [x] Core features are available without an account, payment, or credentials.
- [x] User data is processed locally with no analytics, telemetry, advertising,
  remote logging, or application backend.
- [x] The privacy policy and Store privacy answers describe the actual behavior
  and permissions.
- [x] First-run onboarding explains the workflow and can be skipped.
- [x] English is the default language, with localized extension metadata and
  Store copy for additional languages.
- [x] The 128px icon, 1280x800 screenshots, 440x280 small promo tile, and
  1400x560 marquee asset are present and checked in CI.
- [x] Unit, browser, locale, package, and Store-asset validation run in CI.
- [x] The Store description is detailed, accurate, and avoids unsupported
  hardware-emulation claims and keyword lists.

## Manual release and dashboard checks

Complete these immediately before nominating the extension:

- [ ] Publish the latest validated package publicly and confirm its review has
  completed successfully.
- [ ] Confirm there are no active or unresolved policy violations.
- [ ] Confirm publisher identity verification and 2-Step Verification are
  complete. The separate Established Publisher badge depends on publisher
  verification and a sustained positive policy record.
- [ ] Copy the current listing text from `chrome-web-store.md` and
  `chrome-web-store-listing-copy.md` into the dashboard.
- [ ] Set the category to **Developer Tools**.
- [ ] Upload the current icon, all screenshots, the small promotional image,
  and the marquee image. Confirm both promotional images are approved, not
  pending or rejected.
- [ ] Fill in the official website, privacy-policy URL, and support URL. Test
  every link while signed out.
- [ ] Make the Privacy tab match the extension and privacy policy exactly,
  especially local processing of URLs, website content, screenshots,
  recordings, design references, and settings.
- [ ] Re-check every permission justification. Broad HTTP/HTTPS host access,
  `tabs`, `scripting`, and the subframe header rules are core to the product,
  but are likely to receive close manual review.
- [ ] Test install, first launch, core preview, onboarding, capture, recording,
  design comparison, and uninstall on current stable Chrome. Also smoke-test a
  clean profile and at least one additional OS or network condition.
- [ ] Review recent ratings, support requests, crashes, install-to-uninstall
  behavior, and fix recurring issues before nomination. Chrome considers user
  ratings and usage signals in discovery.
- [ ] Consider adding two more current screenshots. Google recommends using the
  maximum five when each image demonstrates a distinct, real capability; do
  not add filler or outdated UI.

## Nomination

Once every applicable item above is complete, use
[Chrome Web Store One Stop Support](https://support.google.com/chrome_webstore/contact/one_stop_support)
and select the Featured badge nomination option if it is available for the
publisher account.

Nomination eligibility currently requires that the item:

- is an extension owned by the nominating publisher;
- supports English;
- is published and public;
- has no active policy violations; and
- exposes its core features without additional credentials or payment.

In the nomination, keep the case concise: explain the user need, the extension's
distinct responsive-testing workflow, local-first privacy model, polished
onboarding, current platform APIs, and how the listing accurately demonstrates
the real product. Do not claim that the badge or featuring is guaranteed.
