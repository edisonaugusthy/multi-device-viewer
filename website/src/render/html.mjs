import { url } from "../config.mjs";
// Small helpers shared by every page template.
export const esc = (value) => String(value ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Fill {name} placeholders. Values are escaped unless passed as { raw }. */
export const fill = (text, vars = {}) => esc(text).replace(/\{(\w+)\}/g, (match, key) => {
  if (!(key in vars)) return match;
  const value = vars[key];
  return value && typeof value === "object" && "raw" in value ? value.raw : esc(value);
});

/** Translator for one locale with English fallback for any missing key. */
export function translator(messages, fallback) {
  const lookup = (source, key) => key.split(".").reduce((node, part) => node?.[part], source);
  return (key, vars) => fill(lookup(messages, key) ?? lookup(fallback, key) ?? key, vars);
}

export const plain = (html) => html.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

const starPath = "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z";
const star = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${starPath}"/></svg>`;

/** Five stars, the amber row clipped to the rating. Decorative unless a label is given. */
export function stars(rating = 5, { size = 15, gap = 2, label, live = false } = {}) {
  const fill = Math.max(0, Math.min(100, (rating / 5) * 100));
  const row = `<span>${star.repeat(5)}</span>`;
  const a11y = label ? `role="img" aria-label="${esc(label)}"` : `aria-hidden="true"`;
  return `<span class="stars" ${a11y}${live ? " data-stars" : ""} style="--size:${size}px;--gap:${gap}px;--fill:${fill.toFixed(1)}%">${row}<span class="stars-fill">${star.repeat(5)}</span></span>`;
}

export const starIcon = (size = 16, color = "#D97706") =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" aria-hidden="true"><path d="${starPath}"/></svg>`;

/** Display the raster export; editable logo paths stay in private storage. */
export const logo = (_id, size = 34) => `<img src="${url("icons/icon-128.png")}" width="${size}" height="${size}" alt="" aria-hidden="true">`;

const stroke = (size, paths, width = 2) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const icons = {
  github: (s = 20) => stroke(s, '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>'),
  download: (s = 20) => stroke(s, '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', 2.2),
  shield: (s = 26) => stroke(s, '<path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>'),
  globe: (s = 18) => stroke(s, '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
};

export const dateLabel = (iso, lang, options = { year: "numeric", month: "long", day: "numeric" }) =>
  iso ? new Intl.DateTimeFormat(lang, { ...options, timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z")) : "";

export const number = (value, lang, options) => new Intl.NumberFormat(lang, options).format(value);
