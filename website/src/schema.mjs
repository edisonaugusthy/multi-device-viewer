// Structured data (schema.org JSON-LD) for each page type.
// No aggregateRating or Review markup: the ratings come from the Chrome Web Store,
// and Google's review-snippet rules forbid marking up reviews collected elsewhere.
import { site, abs, url, locales } from "./config.mjs";
import { plain } from "./render/html.mjs";

const author = { "@type": "Person", "@id": abs("#author"), name: site.author, url: site.authorUrl };

const website = {
  "@type": "WebSite",
  "@id": abs("#website"),
  url: abs(),
  name: site.name,
  alternateName: site.fullName,
  inLanguage: locales.map((l) => l.lang),
  publisher: { "@id": abs("#author") },
};

const screenshots = ["workspace-1280", "sync-1280", "all-devices-1920", "design-compare-1280", "fix-prompt-1280"]
  .map((name) => abs(`screenshots/${name}.webp`));

function software({ t, locale, store }) {
  return {
    "@type": "SoftwareApplication",
    "@id": abs("#software"),
    name: site.fullName,
    alternateName: site.name,
    applicationCategory: "DeveloperApplication",
    applicationSubCategory: "Responsive web design testing",
    operatingSystem: "Windows, macOS, Linux, ChromeOS",
    browserRequirements: "Requires Google Chrome on desktop",
    description: plain(t("meta.description")),
    url: abs(locale.path),
    downloadUrl: site.storeUrl,
    installUrl: site.storeUrl,
    softwareVersion: store?.version ?? site.version,
    ...(store?.updated ? { dateModified: store.updated } : {}),
    image: abs("icons/icon-128.png"),
    screenshot: screenshots,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD", availability: "https://schema.org/InStock" },
    isAccessibleForFree: true,
    license: site.license,
    codeRepository: site.repo,
    author: { "@id": abs("#author") },
    featureList: [
      "Up to four real device frames side by side",
      `${site.deviceCount} device profiles: phones, foldables, tablets, laptops, desktops and watches`,
      "Synchronized scrolling, clicks and navigation",
      "Design comparison side by side or overlaid",
      "Annotated screenshots and AI coding fix prompts",
      "Record and replay user flows",
      "Works on localhost",
    ],
  };
}

export function homeSchema({ t, locale, store }) {
  const pageUrl = abs(locale.path);
  return {
    "@context": "https://schema.org",
    "@graph": [
      author,
      website,
      software({ t, locale, store }),
      {
        "@type": "WebPage",
        "@id": pageUrl + "#webpage",
        url: pageUrl,
        name: plain(t("meta.title")),
        description: plain(t("meta.description")),
        inLanguage: locale.lang,
        isPartOf: { "@id": abs("#website") },
        about: { "@id": abs("#software") },
        primaryImageOfPage: { "@type": "ImageObject", url: screenshots[0], width: 1280, height: 720 },
      },
      {
        "@type": "FAQPage",
        "@id": pageUrl + "#faq",
        inLanguage: locale.lang,
        mainEntity: [1, 2, 3, 4, 5].map((n) => ({
          "@type": "Question",
          name: plain(t(`faq.q${n}`)),
          acceptedAnswer: { "@type": "Answer", text: plain(t(`faq.a${n}`)) },
        })),
      },
    ],
  };
}

const breadcrumbs = (items) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: abs(path) })),
});

export function articleSchema(meta) {
  const path = `guides/${meta.slug}/`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": abs(path) + "#article",
        headline: meta.headline || meta.h1,
        description: meta.description,
        datePublished: meta.datePublished,
        dateModified: meta.dateModified,
        inLanguage: "en",
        author,
        publisher: author,
        image: abs("og.png"),
        mainEntityOfPage: abs(path),
        isPartOf: { "@id": abs("#website") },
        about: { "@id": abs("#software") },
      },
      breadcrumbs([["Home", ""], ["Guides", "guides/"], [meta.cardTitle || meta.h1, path]]),
    ],
  };
}

export function guidesIndexSchema(meta, guides) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": abs("guides/") + "#webpage",
        url: abs("guides/"),
        name: meta.title,
        description: meta.description,
        inLanguage: "en",
        isPartOf: { "@id": abs("#website") },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: guides.map((g, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`guides/${g.meta.slug}/`), name: g.meta.cardTitle })),
        },
      },
      breadcrumbs([["Home", ""], ["Guides", "guides/"]]),
    ],
  };
}

export function pageSchema({ path, title, description, name, updated }) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": abs(path) + "#webpage",
        url: abs(path),
        name: title,
        description,
        inLanguage: "en",
        ...(updated ? { dateModified: updated } : {}),
        isPartOf: { "@id": abs("#website") },
      },
      breadcrumbs([["Home", ""], [name, path]]),
    ],
  };
}

export { url };
