# Search visibility baseline and next review

Baseline date: 25 July 2026  
Source: Google Search Console Performance export supplied by the project owner  
Filter: Web search, last three months

## Observed baseline

| Signal | Value |
|---|---:|
| Clicks | 0 |
| Impressions | 5 |
| Average position | 23.4 |
| Pages receiving impressions | 1 |
| Mobile impressions | 0 |

The only reported query was `firefox mobile`, with three impressions at an
average position of 23. The homepage received all five impressions. Countries
represented were the Philippines, Netherlands, and Vietnam.

This sample is too small for meaningful CTR or ranking conclusions. The first
priority is broader crawling and indexing across useful, intent-specific pages.

## Implemented discovery surface

- `/guides/index.html`
- `/guides/responsive-design-checker.html`
- `/guides/chrome-mobile-view-extension.html`
- `/guides/firefox-mobile-view.html`
- `/guides/device-viewport-sizes.html`
- Existing mobile-view and responsive-release guides

Every indexable page is listed in `sitemap.xml`, uses a matching canonical URL,
and receives an internal link. The site build validates those conditions
automatically. GitHub Pages deployment also verifies that the published sitemap
returns XML after release.

## Actions after deployment

1. Submit or resubmit
   `https://edisonaugusthy.github.io/multi-device-viewer/sitemap.xml` in Search
   Console.
2. Inspect the guides hub and each new guide URL, then request indexing where
   Search Console permits it.
3. Confirm the sitemap status changes to Success and that the discovered-page
   count matches the published sitemap.
4. Review performance after 28 days using unfiltered Web search data.

## Next measurement

Track these query groups separately:

- `mobile view`, `website mobile view`, `mobile view extension`
- `responsive tester`, `responsive design checker`, `website responsive tester`
- `device emulator`, `mobile simulator`, `device viewport sizes`
- `firefox mobile`, `firefox mobile view`, `firefox responsive design mode`

Judge early progress by indexed pages and impressions by landing page. Only
optimize CTR after a page has enough impressions for its title and description
performance to be interpretable.
