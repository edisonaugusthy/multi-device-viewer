import { site, url } from "../config.mjs";
import { esc, stars, starIcon, icons, dateLabel, number } from "./html.mjs";

const shot = (name, widths, alt, { bar = false, dark = false, sizes = "(min-width: 1312px) 1264px, calc(100vw - 48px)", tall = false } = {}) => {
  const srcset = widths.map((w) => `${url(`screenshots/${name}-${w}.webp`)} ${w}w`).join(", ");
  const max = widths[widths.length - 1];
  return `<figure class="shot${dark ? " shot-dark" : ""}">${bar ? '<div class="shot-bar" aria-hidden="true"><span></span><span></span><span></span></div>' : ""}<img src="${url(`screenshots/${name}-${widths.includes(1280) ? 1280 : max}.webp`)}" srcset="${srcset}" sizes="${sizes}" width="${tall ? 1920 : 1280}" height="${tall ? 1080 : 720}" alt="${alt}" loading="lazy" decoding="async"></figure>`;
};

/** Pick the strongest real reviews: five stars, written text, never the publisher's own. */
export function pickReviews(store, limit = 3) {
  return (store?.reviews ?? [])
    .filter((r) => r.rating === 5 && r.text && r.text.length >= 20 && r.author !== site.author)
    .sort((a, b) => b.helpful - a.helpful || b.text.length - a.text.length || (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, limit);
}

export function homeBody({ t, locale, store, devices }) {
  const lang = locale.lang;
  const hasRating = Number.isFinite(store?.rating);
  const rating = hasRating ? number(store.rating, lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "";
  const reviews = pickReviews(store);
  const deviceCount = number(site.deviceCount, lang);

  const stage = devices.map((d) => `
            <div class="device" data-device style="left:${d.left}px;bottom:${d.bottom}px;z-index:${d.z};width:${d.width}px;height:${d.height}px">
              <div class="device-scale" style="width:${d.frameW}px;height:${d.frameH}px;transform:scale(${d.scale})">
                <div class="device-screen" style="left:${d.screen.left}px;top:${d.screen.top}px;width:${d.screen.width}px;height:${d.screen.height}px;clip-path:${esc(d.screen.clip)}">
                  <iframe data-demo-frame src="${url(`demo/?top=${d.inset}`)}" width="${d.screen.width}" height="${d.screen.height}" title="${t("demo.frameTitle", { device: d.name })}" loading="eager"></iframe>
                </div>
                <img class="device-frame" src="${url(`frames/${d.id}.webp`)}" width="${d.frameW}" height="${d.frameH}" alt="" decoding="async">
              </div>
            </div>`).join("");

  const reviewCards = reviews.length ? reviews.map((r) => `
        <figure class="review">
          ${stars(5, { size: 16, label: t("reviews.stars", { rating: number(5, lang) }) })}
          <blockquote lang="en">${esc(r.text)}</blockquote>
          <figcaption><strong>${esc(r.author)}</strong><span>${esc(dateLabel(r.date, lang, { year: "numeric", month: "short", day: "numeric" }))} · ${t("reviews.source")}</span></figcaption>
        </figure>`).join("") : `<p class="review-empty">${t("reviews.empty")}</p>`;

  return `
<section class="hero" aria-labelledby="hero-title">
  ${hasRating ? `<a class="rating-chip" href="#reviews">${stars(store.rating, { size: 15, live: true })}<span>${t("hero.rating", { rating: { raw: `<strong data-store="rating">${rating}</strong>` } })}</span></a>` : ""}
  <h1 id="hero-title">${t("hero.title")}</h1>
  <p class="lede">${t("hero.lede")}</p>
  <div class="hero-actions">
    <a class="btn btn-primary btn-lg" href="${site.storeUrl}">${icons.download()}${t("hero.install")}</a>
    <a class="btn btn-ghost btn-lg" href="${site.reviewsUrl}">${starIcon(18)}${t("hero.review")}</a>
  </div>
</section>

<section class="stage-section" aria-label="${t("demo.label")}">
  <div class="stage">
    <div class="live-row"><span class="live-badge"><span class="pulse" aria-hidden="true"></span>${t("demo.badge")}</span></div>
    <div class="stage-view">
      <div class="stage-canvas" data-stage>
        <div class="stage-inner">${stage}
        </div>
      </div>
      <script>(()=>{const s=document.querySelector("[data-stage]"),v=s.parentElement,c=getComputedStyle(v),w=v.clientWidth-parseFloat(c.paddingLeft)-parseFloat(c.paddingRight),h=(innerHeight-s.getBoundingClientRect().top-parseFloat(c.paddingBottom)-24)/560;s.style.setProperty("--z",Math.min(1,w/1320,Math.max(h,.55)))})()</script>
    </div>
  </div>
</section>

<section class="facts" aria-label="${t("facts.label")}">
  <ul>
    <li><strong>${t("facts.devicesValue", { count: deviceCount })}</strong><span>${t("facts.devices")}</span></li>
    <li><strong>${t("facts.atOnceValue")}</strong><span>${t("facts.atOnce")}</span></li>
    <li><strong>${t("facts.syncValue")}</strong><span>${t("facts.sync")}</span></li>
    <li><strong>${t("facts.privateValue")}</strong><span>${t("facts.private")}</span></li>
  </ul>
</section>

<section id="tour" class="section" aria-labelledby="tour-workspace">
  <div class="section-head">
    <h2 id="tour-workspace" class="display">${t("tour.workspaceTitle")}</h2>
    <p>${t("tour.workspaceText", { count: deviceCount })}</p>
  </div>
  ${shot("workspace", [640, 1280], t("tour.workspaceAlt"), { bar: true })}
</section>

<section class="section" aria-labelledby="tour-sync">
  <div class="section-head">
    <h2 id="tour-sync" class="display">${t("tour.syncTitle")}</h2>
    <p>${t("tour.syncText")}</p>
  </div>
  ${shot("sync", [640, 1280], t("tour.syncAlt"))}
</section>

<section class="section" aria-labelledby="tour-all">
  <div class="section-head">
    <h2 id="tour-all" class="display">${t("tour.allTitle")}</h2>
    <p>${t("tour.allText")}</p>
  </div>
  ${shot("all-devices", [640, 1280, 1920], t("tour.allAlt"), { tall: true })}
</section>

<section class="compare" aria-labelledby="tour-design">
  <div class="compare-copy">
    <h2 id="tour-design" class="display">${t("tour.designTitle")}</h2>
    <p>${t("tour.designText")}</p>
    <div class="caught">
      <span class="caught-title">${t("tour.designCaught")}</span>
      <ul>
        <li><span class="dot" aria-hidden="true"></span><span><strong>${t("tour.designItem1")}</strong><span>${t("tour.designItem1Detail")}</span></span></li>
        <li><span class="dot" aria-hidden="true"></span><span><strong>${t("tour.designItem2")}</strong><span>${t("tour.designItem2Detail")}</span></span></li>
      </ul>
    </div>
  </div>
  ${shot("design-compare", [640, 1280], t("tour.designAlt"), { sizes: "(min-width: 1312px) 820px, calc(100vw - 48px)" })}
</section>

<section class="dark-band" aria-labelledby="tour-fix">
  <div class="section">
    <div class="section-head">
      <h2 id="tour-fix" class="display">${t("tour.fixTitle")}</h2>
      <p>${t("tour.fixText")}</p>
    </div>
    ${shot("fix-prompt", [640, 1280], t("tour.fixAlt"), { dark: true })}
    <ul class="chips">
      <li class="chips-label">${t("tour.alsoInside")}</li>
      <li>${t("tour.chipRecord")}</li><li>${t("tour.chipFocus")}</li><li>${t("tour.chipRotate")}</li><li>${t("tour.chipCustom")}</li><li>${t("tour.chipSets")}</li>
    </ul>
  </div>
</section>

<section id="reviews" class="reviews" aria-labelledby="reviews-title">
  <div class="rating-card">
    <h2 id="reviews-title">${t("reviews.title")}</h2>
    ${hasRating ? `<div class="score"><strong data-store="rating">${rating}</strong><span>${t("reviews.outOf")}</span></div>
    ${stars(store.rating, { size: 22, gap: 3, label: t("reviews.stars", { rating }), live: true })}
    <p class="summary">${t("reviews.summary", {
      count: { raw: `<span data-store="ratingCount">${number(store.ratingCount, lang)}</span>` },
      users: { raw: `<span data-store="users">${number(store.users ?? 0, lang)}</span>` },
    })}</p>` : ""}
    <div class="card-actions">
      <a class="btn btn-dark" href="${site.reviewsUrl}">${t("reviews.leave")}</a>
      <a class="link-strong" href="${site.reviewsUrl}">${t("reviews.readAll")} ↗</a>
    </div>
  </div>
  <div class="review-grid">${reviewCards}
  </div>
</section>

<section class="privacy-strip" aria-labelledby="privacy-title">
  <div class="strip">
    <div class="strip-title"><span class="strip-icon">${icons.shield()}</span><h2 id="privacy-title">${t("privacy.title")}</h2></div>
    <ul><li>${t("privacy.item1")}</li><li>${t("privacy.item2")}</li><li>${t("privacy.item3")}</li><li>${t("privacy.item4")}</li></ul>
    <a class="link-strong" href="${url("privacy/")}">${t("privacy.link")} →</a>
  </div>
</section>

<section id="faq" class="faq" aria-labelledby="faq-title">
  <h2 id="faq-title" class="display">${t("faq.title")}</h2>
  <div class="faq-list">
    ${[1, 2, 3, 4, 5].map((n) => `<details><summary>${t(`faq.q${n}`)}<span aria-hidden="true">+</span></summary><p>${t(`faq.a${n}`)}</p></details>`).join("\n    ")}
  </div>
</section>

<section class="closing" aria-labelledby="cta-title">
  <div class="cta-card">
    <div>
      <h2 id="cta-title" class="display">${t("cta.title")}</h2>
      <p>${t("cta.text")}</p>
    </div>
    <div class="cta-actions">
      <a class="btn btn-aqua btn-lg" href="${site.storeUrl}">${t("cta.install")}</a>
      <a class="btn btn-outline-dark btn-lg" href="${site.reviewsUrl}">${starIcon(18, "#F5A623")}${t("cta.review")}</a>
    </div>
  </div>
</section>`;
}
