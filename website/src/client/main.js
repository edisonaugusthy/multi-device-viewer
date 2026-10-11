// Mobile View website: language choice, live device demo and fresh Chrome Web Store numbers.

// A language picked from the menu is remembered, so the English homepage stops
// redirecting to the device language (see the <head> script on that page).
document.addEventListener("click", (event) => {
  const choice = event.target.closest?.("[data-lang-choice]");
  if (choice) try { localStorage.setItem("mv-lang", choice.dataset.langChoice === "en" ? "" : choice.dataset.langChoice); } catch {}
  const menu = document.querySelector("[data-lang-menu][open]");
  if (menu && !menu.contains(event.target)) menu.open = false;
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") document.querySelector("[data-lang-menu][open]")?.removeAttribute("open");
});

// The stage is composed at 1320 × 560 and scaled to the space available.
// It also fits the screen height under the hero, so the whole stage shows on a
// laptop without scrolling (never smaller than 55% for the sake of legibility).
const stage = document.querySelector("[data-stage]");
if (stage) {
  const view = stage.parentElement;
  const fit = () => {
    const style = getComputedStyle(view);
    const width = view.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const top = stage.getBoundingClientRect().top + scrollY;
    const height = (innerHeight - top - parseFloat(style.paddingBottom) - 24) / 560;
    stage.style.setProperty("--z", String(Math.min(1, width / 1320, Math.max(height, 0.55))));
  };
  new ResizeObserver(fit).observe(view);
  addEventListener("resize", fit);
  fit();
}

// Synced scroll and navigation across the demo devices, like the extension:
// scroll one screen and the others follow; follow a link and every screen goes there.
const frames = [...document.querySelectorAll("[data-demo-frame]")];
const wired = new WeakSet();
let lead = null;
let release = 0;
let autoplay = 0; // requestAnimationFrame id while the intro scroll runs

const scroller = (frame) => frame.contentDocument?.scrollingElement;

function follow(source) {
  if (autoplay || (lead && lead !== source)) return;
  lead = source;
  const from = scroller(source);
  if (!from) return;
  const ratio = from.scrollTop / Math.max(1, from.scrollHeight - from.clientHeight);
  for (const frame of frames) {
    const to = frame !== source && scroller(frame);
    if (to) to.scrollTop = ratio * (to.scrollHeight - to.clientHeight);
  }
  clearTimeout(release);
  release = setTimeout(() => { lead = null; }, 150);
}

function navigate(source) {
  const hash = source.contentWindow.location.hash;
  for (const frame of frames) {
    if (frame !== source && frame.contentWindow && frame.contentWindow.location.hash !== hash) frame.contentWindow.location.hash = hash;
  }
}

function wire(frame) {
  const win = frame.contentWindow;
  if (!win || wired.has(win)) return;
  try {
    win.addEventListener("scroll", () => follow(frame), { passive: true });
    win.addEventListener("hashchange", () => navigate(frame));
    for (const type of ["pointerdown", "wheel", "touchstart", "keydown"]) win.addEventListener(type, stopIntro, { passive: true });
    wired.add(win);
  } catch { /* not same-origin: leave that screen independent */ }
}

for (const frame of frames) {
  frame.addEventListener("load", () => wire(frame));
  if (frame.contentDocument?.readyState === "complete") wire(frame);
}

// Intro: once the stage is on screen, every device scrolls down together and back,
// showing that the screens are live and in sync. Any touch, wheel or key stops it.
let introDone = false;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const steps = [
  { to: 0.55, ms: 2600 },
  { to: 0.55, ms: 900 },
  { to: 0, ms: 2000 },
];

function setAll(ratio) {
  for (const frame of frames) {
    const el = scroller(frame);
    if (el) el.scrollTop = ratio * (el.scrollHeight - el.clientHeight);
  }
}

function stopIntro() {
  introDone = true;
  if (autoplay) cancelAnimationFrame(autoplay);
  autoplay = 0;
}

function playIntro() {
  if (introDone) return;
  introDone = true;
  let index = 0;
  let from = 0;
  let start = performance.now();
  const tick = (now) => {
    const step = steps[index];
    const t = Math.min(1, (now - start) / step.ms);
    setAll(from + (step.to - from) * ease(t));
    if (t < 1) { autoplay = requestAnimationFrame(tick); return; }
    from = step.to;
    start = now;
    index += 1;
    if (index < steps.length) autoplay = requestAnimationFrame(tick);
    else autoplay = 0;
  };
  autoplay = requestAnimationFrame(tick);
}

if (stage && frames.length && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  for (const type of ["pointerdown", "wheel", "touchstart"]) stage.addEventListener(type, stopIntro, { passive: true });
  const loaded = Promise.all(frames.map((frame) => frame.contentDocument?.readyState === "complete"
    ? Promise.resolve()
    : new Promise((resolve) => frame.addEventListener("load", resolve, { once: true }))));
  const visible = new Promise((resolve) => {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.intersectionRatio >= 0.5)) { observer.disconnect(); resolve(); }
    }, { threshold: [0, 0.5] });
    observer.observe(stage);
  });
  Promise.all([loaded, visible]).then(() => setTimeout(playIntro, 700));
}

// Store numbers are rendered at build time; refresh them from the latest
// data/store.json so a cached page still shows today's rating.
const live = document.querySelectorAll("[data-store]");
if (live.length) {
  const lang = document.documentElement.lang || "en";
  fetch(new URL("../data/store.json", import.meta.url), { cache: "no-cache" })
    .then((response) => (response.ok ? response.json() : null))
    .then((store) => {
      if (!store || !Number.isFinite(store.rating)) return;
      const format = {
        rating: (v) => new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v),
        ratingCount: (v) => new Intl.NumberFormat(lang).format(v),
        users: (v) => new Intl.NumberFormat(lang).format(v),
      };
      for (const node of live) {
        const key = node.dataset.store;
        if (Number.isFinite(store[key])) node.textContent = format[key](store[key]);
      }
      const fill = `${Math.max(0, Math.min(100, (store.rating / 5) * 100)).toFixed(1)}%`;
      for (const stars of document.querySelectorAll("[data-stars]")) stars.style.setProperty("--fill", fill);
    })
    .catch(() => {});
}
