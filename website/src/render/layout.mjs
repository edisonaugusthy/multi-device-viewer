import { site, url, abs, locales } from "../config.mjs";
import { esc, logo, icons, starIcon } from "./html.mjs";

// Device-language detection for the English (x-default) homepage. Runs in <head>
// before paint: the first visit goes to the homepage in the visitor's language;
// a language the visitor picks themselves is remembered and always wins.
// Crawlers are left alone so every language stays indexable through hreflang.
function languageRedirect() {
  const paths = Object.fromEntries(locales.map((l) => [l.lang.toLowerCase(), l.path]));
  const aliases = {
    pt: "pt-br/", nb: "no/", nn: "no/", tl: "fil/", zh: "zh-cn/", "zh-hans": "zh-cn/", "zh-sg": "zh-cn/",
    "zh-hant": "zh-tw/", "zh-hk": "zh-tw/", "zh-mo": "zh-tw/", iw: "he/", in: "id/",
  };
  const homes = { ...paths, ...aliases };
  return `<script>(function(){try{var b=${JSON.stringify(url())},h=${JSON.stringify(homes)},s=localStorage.getItem("mv-lang");if(/bot|crawl|spider|slurp|lighthouse|headless/i.test(navigator.userAgent))return;if(s!==null){if(s&&h[s]!==undefined&&h[s])location.replace(b+h[s]);return}var L=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||"en"];for(var i=0;i<L.length;i++){var l=String(L[i]).toLowerCase(),p=l.split("-")[0];if(p==="en")return;var m=h[l];if(m===undefined&&p==="es"&&l!=="es"&&l!=="es-es")m=h["es-419"];if(m===undefined&&(l==="pt-pt"||l==="pt-ao"||l==="pt-mz"))m=h["pt-pt"];if(m===undefined)m=h[p];if(m){location.replace(b+m);return}}}catch(e){}})()</script>`;
}

// Scripts where tight Latin letter-spacing hurts legibility or breaks joining.
const wideScripts = new Set(["am", "ar", "bn", "fa", "gu", "he", "hi", "ja", "kn", "ko", "ml", "mr", "ta", "te", "th", "zh_CN", "zh_TW"]);

/**
 * One complete HTML document.
 * page: { locale, t, path, title, description, ogTitle, ogType, ogImageAlt, alternates, jsonLd, body, current, robots, home }
 */
export function layout(page, assets) {
  const { locale, t } = page;
  const canonical = abs(page.path);
  const homePath = locale.path;
  const alternates = page.alternates ?? [];
  const jsonLd = page.jsonLd ? `<script type="application/ld+json">${JSON.stringify(page.jsonLd).replace(/</g, "\\u003c")}</script>` : "";
  const ogLocale = locale.lang.replace("-", "_");
  return `<!doctype html>
<html lang="${locale.lang}" dir="${locale.dir}" data-script="${wideScripts.has(locale.id) ? "wide" : "latin"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${page.home && locale.path === "" ? languageRedirect() : ""}
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
${page.robots ? `<meta name="robots" content="${page.robots}">` : ""}
<link rel="canonical" href="${canonical}">
${alternates.map((a) => `<link rel="alternate" hreflang="${a.hreflang}" href="${a.href}">`).join("\n")}
<meta name="theme-color" content="#F7F7F4">
<meta name="color-scheme" content="light">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:type" content="${page.ogType ?? "website"}">
<meta property="og:title" content="${esc(page.ogTitle ?? page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="${ogLocale}">
<meta property="og:image" content="${abs("og.png")}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(page.ogImageAlt ?? site.fullName)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(page.ogTitle ?? page.title)}">
<meta name="twitter:description" content="${esc(page.description)}">
<meta name="twitter:image" content="${abs("og.png")}">
<meta name="google-site-verification" content="htTwPty3Iq08Xc3GtR8nX_t78rbN5BL1MX1WuAU8Zmc">
<link rel="icon" href="${url("icons/icon-32.png")}" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="${url("icons/icon-128.png")}">
<link rel="manifest" href="${url("site.webmanifest")}">
<link rel="preload" href="${url("fonts/geist-latin-wght-normal.woff2")}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${assets.css}">
${page.home ? `<link rel="preload" href="${url("data/store.json")}" as="fetch" crossorigin>` : ""}
${jsonLd}
<script type="module" src="${assets.js}"></script>
</head>
<body>
<a class="skip" href="#main">${t("nav.skip")}</a>
${header(page, homePath)}
<main id="main">
${page.body}
</main>
${footer(page, homePath)}
</body>
</html>
`;
}

function languageMenu({ t, locale }) {
  return `<details class="lang-menu" data-lang-menu>
        <summary aria-label="${t("footer.language")}: ${esc(locale.name)}">${icons.globe()}<span class="label">${esc(locale.name)}</span></summary>
        <ul>${locales.map((l) => `<li><a href="${url(l.path)}" hreflang="${l.hreflang}" lang="${l.lang}" data-lang-choice="${l.lang.toLowerCase()}"${l.id === locale.id ? ' aria-current="true"' : ""}>${esc(l.name)}</a></li>`).join("")}</ul>
      </details>`;
}

function header({ t, current, locale }, homePath) {
  const home = url(homePath);
  const navLink = (href, label, key) => `<a href="${href}"${current === key ? ' aria-current="page"' : ""}>${label}</a>`;
  return `<header class="site-header">
  <div class="inner">
    <a class="brand" href="${home}" aria-label="${t("nav.home")}">${logo("hdr")}<span>Mobile View</span></a>
    <nav class="main-nav" aria-label="${t("nav.main")}">
      ${navLink(home + "#tour", t("nav.tour"))}
      ${navLink(home + "#reviews", t("nav.reviews"))}
      ${navLink(home + "#faq", t("nav.faq"))}
      ${navLink(url("guides/"), t("nav.guides"), "guides")}
      ${navLink(url("privacy/"), t("nav.privacy"), "privacy")}
    </nav>
    <div class="header-actions">
      ${languageMenu({ t, locale })}
      <a class="icon-btn" href="${site.repo}" aria-label="${t("nav.github")}">${icons.github()}</a>
      <a class="btn btn-ghost" href="${site.reviewsUrl}">${starIcon(16)}<span class="label">${t("nav.leaveReview")}</span></a>
      <a class="btn btn-primary" href="${site.storeUrl}">${t("nav.addToChrome")}</a>
    </div>
  </div>
</header>`;
}

function footer({ t, locale }, homePath) {
  const home = url(homePath);
  const year = new Date().getUTCFullYear();
  const languages = locales.map((l) =>
    `<li><a href="${url(l.path)}" hreflang="${l.hreflang}" lang="${l.lang}" data-lang-choice="${l.lang.toLowerCase()}"${l.id === locale.id ? ' aria-current="true"' : ""}>${esc(l.name)}</a></li>`).join("");
  return `<footer class="site-footer">
  <div class="inner">
    <div class="footer-top">
      <div class="footer-brand">
        <a class="brand" href="${home}" aria-label="${t("nav.home")}">${logo("ftr")}<span>Mobile View</span></a>
        <p>${t("footer.blurb")}</p>
        <a class="btn btn-primary" href="${site.storeUrl}">${t("nav.addToChrome")}</a>
      </div>
      <nav class="footer-col" aria-label="${t("footer.product")}">
        <h2>${t("footer.product")}</h2>
        <a href="${home}#tour">${t("footer.tour")}</a>
        <a href="${home}#reviews">${t("footer.reviews")}</a>
        <a href="${url("changelog/")}">${t("footer.changelog")}</a>
        <a href="${site.storeUrl}">${t("footer.store")}</a>
      </nav>
      <nav class="footer-col wide" aria-label="${t("footer.guides")}">
        <h2>${t("footer.guides")}</h2>
        <a href="${url("guides/device-viewport-sizes/")}" lang="en">Device viewport sizes</a>
        <a href="${url("guides/responsive-design-checker/")}" lang="en">Responsive design checker</a>
        <a href="${url("guides/responsive-website-testing/")}" lang="en">Responsive website testing</a>
        <a href="${url("guides/")}">${t("footer.allGuides")}</a>
      </nav>
      <nav class="footer-col" aria-label="${t("footer.project")}">
        <h2>${t("footer.project")}</h2>
        <a href="${site.repo}">${t("footer.source")}</a>
        <a href="${site.issues}">${t("footer.issue")}</a>
        <a href="${url("privacy/")}">${t("footer.privacy")}</a>
        <a href="${url("terms/")}">${t("footer.terms")}</a>
      </nav>
    </div>
    <details class="languages">
      <summary>${icons.globe()}${t("footer.language")}: ${esc(locale.name)}</summary>
      <ul>${languages}</ul>
    </details>
    <div class="footer-bottom">
      <span>${t("footer.copyright", { year })}</span>
      <span>${t("footer.trademarks")}</span>
    </div>
  </div>
</footer>`;
}
