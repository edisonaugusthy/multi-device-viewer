import { site, url } from "../config.mjs";
import { esc, dateLabel } from "./html.mjs";

const slugify = (text) => text.toLowerCase().replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const toc = (label, items) => `<nav class="toc" aria-label="${esc(label)}">
      <span class="toc-label">${esc(label)}</span>
      ${items.map(([id, text]) => `<a href="#${id}">${text}</a>`).join("\n      ")}
    </nav>`;

const breadcrumb = (items) => `<nav class="breadcrumb" aria-label="Breadcrumb"><ol>${items.map(([href, label], i) =>
  i === items.length - 1 ? `<li aria-current="page">${esc(label)}</li>` : `<li><a href="${href}">${esc(label)}</a></li><li aria-hidden="true">/</li>`).join("")}</ol></nav>`;

/** Split a content file into its JSON front matter and HTML body. */
export function parseContent(source) {
  const match = source.match(/^<script type="application\/json">\s*([\s\S]*?)\s*<\/script>\s*/);
  const meta = match ? JSON.parse(match[1]) : {};
  let body = match ? source.slice(match[0].length) : source;
  const [main, related = ""] = body.split("<!-- related -->");
  return { meta, body: links(main.trim()), related: links(related.trim()) };
}

// "@/guides/x/" → site path; tables get a scroll box on narrow screens.
const links = (html) => html.replace(/href="@\/([^"]*)"/g, (_, path) => `href="${url(path)}"`)
  .replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, "</table></div>");

/** Wrap each h2 and what follows it in a <section> with an id; return sections for the TOC. */
function sectionize(html) {
  const parts = html.split(/(?=<h2>)/);
  const intro = parts[0].startsWith("<h2>") ? "" : parts.shift();
  const sections = parts.map((part) => {
    const heading = part.match(/<h2>([\s\S]*?)<\/h2>/)[1].trim();
    const id = slugify(heading);
    return { id, heading, html: `<section id="${id}">\n${part.trim()}\n</section>` };
  });
  return { intro, sections };
}

const words = (html) => html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;

export const installAside = () => `<aside class="inline-cta" aria-label="Try it in Mobile View">
  <div><strong>See your page on every screen at once</strong><span>Open it in up to four real device frames side by side, free in Chrome.</span></div>
  <a class="btn" href="${site.storeUrl}">Add to Chrome</a>
</aside>`;

export function guideBody({ meta, body, related }, guides) {
  const { intro, sections } = sectionize(body);
  const minutes = Math.max(2, Math.round(words(body) / 220));
  const withCta = sections.map((s, i) => (i === 1 ? s.html + "\n" + installAside() : s.html)).join("\n");
  const index = guides.findIndex((g) => g.meta.slug === meta.slug);
  const next = [1, 2].map((step) => guides[(index + step) % guides.length]);
  return `<div class="doc doc-guide">
  <div class="doc-head">
    ${breadcrumb([[url(), "Home"], [url("guides/"), "Guides"], ["", meta.cardTitle || meta.h1]])}
    <span class="eyebrow">${esc(meta.eyebrow)}</span>
    <h1>${esc(meta.h1)}</h1>
    <p class="doc-lede">${esc(meta.lead)}</p>
    <p class="doc-meta">Updated <time datetime="${meta.dateModified}">${dateLabel(meta.dateModified, "en")}</time> · ${minutes} min read</p>
  </div>
  ${toc("In this guide", sections.map((s) => [s.id, s.heading]))}
  <article>
    <div class="prose">
      ${intro}
      ${withCta}
    </div>
    <nav class="related" aria-label="Related guides">
      <span class="toc-label">Related guides</span>
      ${related ? `<div class="prose">${related}</div>` : ""}
      <div class="card-grid">
        ${next.map((g) => `<a class="card" href="${url(`guides/${g.meta.slug}/`)}"><strong>${esc(g.meta.cardTitle)}</strong><span>${esc(g.meta.cardText)}</span></a>`).join("\n        ")}
      </div>
    </nav>
  </article>
</div>`;
}

export function guidesIndexBody({ meta, body }, guides) {
  return `<div class="doc doc-guide">
  <div class="doc-head">
    ${breadcrumb([[url(), "Home"], ["", "Guides"]])}
    <span class="eyebrow">${esc(meta.eyebrow)}</span>
    <h1>${esc(meta.h1)}</h1>
    <p class="doc-lede">${esc(meta.lead)}</p>
  </div>
  <div class="guide-cards">
    ${guides.map((g) => `<a class="card" href="${url(`guides/${g.meta.slug}/`)}"><span class="card-kicker">${esc(g.meta.eyebrow)}</span><strong>${esc(g.meta.cardTitle)}</strong><span>${esc(g.meta.cardText)}</span></a>`).join("\n    ")}
  </div>
  <article class="prose" style="flex-basis:100%;max-width:760px">
    ${body}
    ${installAside()}
  </article>
</div>`;
}

export function changelogBody({ meta, body }) {
  const { sections } = sectionize(body);
  return `<div class="doc">
  ${toc("Releases", sections.map((s) => [s.id, s.heading.split(/\s+[—-]\s+/)[0]]))}
  <article>
    <span class="eyebrow">Product updates</span>
    <h1>Changelog</h1>
    <p class="doc-lede">${meta.lead}</p>
    <div class="prose">
      ${sections.map((s) => s.html).join("\n")}
    </div>
  </article>
</div>`;
}

const docSection = (id, title, paragraphs) => `<section id="${id}"><h2>${title}</h2>${paragraphs.map((p) => `<p>${p}</p>`).join("")}</section>`;

export const privacy = {
  path: "privacy/",
  title: "Privacy Policy | Mobile View",
  description: "Mobile View works locally: no account, analytics, telemetry or backend. Your URLs, screenshots, recordings and prompts stay on your device.",
  updated: "2026-10-10",
  body() {
    const sections = [
      ["local", "What stays on your device", ["Workspace settings and preferences are kept in the browser's local extension storage. Screenshots, recordings and prompts are created only when you ask for them. Data leaves the extension only when you copy, download, open or share it yourself."]],
      ["permissions", "Browser permissions", ["Tab and scripting access let the extension open the page you chose inside the workspace. Storage keeps your preferences and saved sets. Download and capture access are used only for exports, screenshots and recordings you request."]],
      ["previews", "Websites inside previews", [
        "Same-site previews use the source page's browser storage without copying sign-in credentials. Each preview is a new document, so unsaved edits and in-memory state stay in the original page.",
        "Temporary frame-header rules apply only to sites you selected during a session, in its tab, and are removed when the viewer closes or the source page navigates. Other tabs are not affected.",
        "Pages shown in previews make their normal network requests to the sites and services they already use. Those requests are covered by those sites' own privacy policies.",
      ]],
      ["third", "Third-party services", ["Neither the extension nor this website contains analytics, advertising, session recording or a hosted AI SDK. The fix-prompt feature writes text locally and copies it only when you press the copy button. The rating and reviews shown on this website are read from the public Chrome Web Store listing when the site is built; your browser only loads them from this website."]],
      ["verify", "Check it yourself", [`You don't have to take this on trust. The extension's code, permissions and storage behavior are all in the <a href="${site.repo}">public source repository</a>.`]],
      ["changes", "Changes and contact", [`If this policy changes, the date at the top changes with it and the change is recorded in the public repository. Questions, privacy reports and corrections go to the <a href="${site.issues}">public issue tracker</a>.`]],
    ];
    return `<div class="doc">
  ${toc("On this page", [["short", "The short version"], ...sections.map(([id, title]) => [id, title])])}
  <article>
    <span class="eyebrow">Privacy policy</span>
    <h1>Privacy, without the fine-print fog.</h1>
    <p class="doc-meta">Last updated <time datetime="${this.updated}">${dateLabel(this.updated, "en")}</time></p>
    <p class="doc-lede">Mobile View is built to work locally. It has no accounts, advertising, extension telemetry, remote application backend, website analytics or session recording.</p>
    <section id="short" class="summary-box"><h2>The short version</h2><p class="prose-p">Your page URLs, workspace, screenshots, recordings, annotations, saved device sets, design references and fix prompts stay on your device. Nothing is uploaded to us automatically.</p></section>
    <div class="prose">${sections.map(([id, title, ps]) => docSection(id, title, ps)).join("\n")}</div>
  </article>
</div>`;
  },
};

export const terms = {
  path: "terms/",
  title: "Terms of Use | Mobile View",
  description: "Plain terms for Mobile View, the free MIT-licensed Chrome extension for responsive testing: license, acceptable use, trademarks and warranty.",
  updated: "2026-10-11",
  body() {
    const sections = [
      ["t1", "1. Using Mobile View", ["Mobile View is a free tool for previewing web pages at different screen sizes. It runs in your browser and needs no account. It is a development aid and does not replace testing on physical devices."]],
      ["t2", "2. License", [`The extension's source code is released under the <a href="${site.repo}/blob/main/LICENSE">MIT license</a>. You may use, copy, change and share it under that license. If these terms and the MIT license ever disagree about the code, the license wins. Device frame images, logos and promotional images have a separate <a href="${url("ARTWORK-LICENSE.txt")}">artwork license</a>. Reuse requires prior written permission, except for normal use of Mobile View and sharing captures of your own work as described in that license.`]],
      ["t3", "3. Acceptable use", ["Use Mobile View only on pages you are allowed to access. Don't use it to get around a site's security, sign-in or access controls, or to break the law."]],
      ["t4", "4. Websites you preview", ["Pages shown in previews belong to their owners and are covered by their own terms and privacy policies. Mobile View doesn't control their content and isn't responsible for it."]],
      ["t5", "5. Device names and trademarks", ["Device frames are original drawings based on published dimensions. Device names are used only to describe screen sizes. iPhone, iPad, Mac and Apple Watch are trademarks of Apple Inc.; Galaxy is a trademark of Samsung Electronics; Pixel is a trademark of Google LLC. Mobile View is not affiliated with or endorsed by these companies."]],
      ["t6", "6. No warranty", ["Mobile View is provided \"as is\", without warranty of any kind. A preview may differ from how a page looks on a real device or another browser."]],
      ["t7", "7. Limitation of liability", ["To the extent the law allows, the authors are not liable for any claim, damages or other liability arising from the use of Mobile View."]],
      ["t8", "8. Changes and contact", [`If these terms change, the date at the top changes too. Questions go to the <a href="${site.issues}">public issue tracker</a>. How we handle data is described in the <a href="${url("privacy/")}">privacy policy</a>.`]],
    ];
    return `<div class="doc">
  ${toc("On this page", sections.map(([id, title]) => [id, title]))}
  <article>
    <span class="eyebrow">Terms of use</span>
    <h1>Plain terms for a free tool.</h1>
    <p class="doc-meta">Effective <time datetime="${this.updated}">${dateLabel(this.updated, "en")}</time></p>
    <p class="doc-lede">These terms cover the Mobile View Chrome extension and this website. By installing the extension or using the site, you agree to them.</p>
    <div class="prose">${sections.map(([id, title, ps]) => docSection(id, title, ps)).join("\n")}</div>
  </article>
</div>`;
  },
};

export const notFoundBody = () => `<div class="not-found">
  <span class="code">404</span>
  <h1>This page took a different route.</h1>
  <p>The page you were looking for has moved or never existed. Try the homepage or the guides.</p>
  <div class="hero-actions">
    <a class="btn btn-primary btn-lg" href="${url()}">Go to the homepage</a>
    <a class="btn btn-ghost btn-lg" href="${url("guides/")}">Browse guides</a>
  </div>
</div>`;
