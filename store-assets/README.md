# Store assets

Promotional images, screenshots and listing copy for the Chrome Web Store. Screenshots are captured from the real simulator UI with a fictional local demo site (`source/demo.html`); they contain no customer data or remote content.

The final images are covered by the [Artwork License](../ARTWORK-LICENSE.txt), which requires prior written permission for reuse except for the normal application uses specified there. Application code and listing text remain under the [MIT License](../LICENSE). The tools, layouts and raw captures used to produce these assets are private and are not part of this repository.

| Path | Contents |
|---|---|
| `webstore-upload/` | Final promo tiles (440 × 280, 1400 × 560) and 1280 × 800 screenshots; localized sets under `localized/` |
| `listings/locales.json` | Source of truth for the store name, summary, description, and the five screenshot headlines and subtitles in every language |
| `listings/upload/<locale>/` | Generated description and metadata for each store language |
| `source/demo.html` | MIT-licensed fictional demo used for captures |
| `../public/icons/` | Exported PNG app icons |
