# Firefox Add-ons release checklist

The Firefox target is a Manifest V3 WebExtension for Firefox 140 and newer.

## Build and validate

```bash
npm ci
npm run compile
npm test
npm run build:firefox
npm run zip:firefox
npm run validate:firefox-zip -- .output/multi-device-viewer-0.2.0-firefox.zip
```

Firefox packaging produces:

- `.output/multi-device-viewer-0.2.0-firefox.zip` — add-on submitted to addons.mozilla.org.
- `.output/multi-device-viewer-0.2.0-sources.zip` — matching source submitted for reviewer reproduction.
- `.output/firefox-mv3/` — unpacked development build.

## Manifest requirements

- Keep the stable Gecko ID `multi-device-viewer@edisonaugusthy.dev` unchanged after publication.
- Keep `browser_specific_settings.gecko.data_collection_permissions.required` set to `none` while the extension transmits no user or technical data.
- Do not add Chrome-only `offscreen` or `tabCapture` permissions to the Firefox target.
- Keep Firefox desktop at version 140 or newer and Firefox for Android at version 142 or newer while using Firefox's built-in data-consent declaration.

## Manual review

1. Load `.output/firefox-mv3/manifest.json` from `about:debugging#/runtime/this-firefox`.
2. Test toolbar and page context-menu launch, iframe previews, device switching, rotation, sync, keyboard input, screenshots, downloads, storage restoration, and the native recording picker.
3. Confirm the add-on zip and source zip were generated from the same clean checkout.
4. Upload the Firefox zip and source zip to addons.mozilla.org and complete the privacy declaration with no data collection.

Reviewer build instructions are in `SOURCE_CODE_REVIEW.md` and are included in the source archive.
