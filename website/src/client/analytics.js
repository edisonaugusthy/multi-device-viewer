const panel = document.querySelector("[data-analytics-id]");

// Avoid measuring previews, embedded demos, and builds served on a different origin.
if (panel && window.top === window && location.origin === new URL(panel.dataset.canonical).origin) {
  setupAnalytics(panel);
}

function setupAnalytics(panel) {
  const { analyticsId, canonical, siteBase } = panel.dataset;
  const preferenceKey = `mv-analytics:${siteBase}`;
  const disabledKey = `ga-disable-${analyticsId}`;
  const settings = document.querySelector('button[aria-controls="analytics-settings"]');
  const heading = panel.querySelector("h2");
  let started = false;
  let openedFromSettings = false;

  function readPreference() {
    try { return localStorage.getItem(preferenceKey); } catch { return null; }
  }

  function showPanel(show) {
    panel.hidden = !show;
    settings.setAttribute("aria-expanded", String(show));
  }

  function stopAnalytics() {
    window[disabledKey] = true;
    for (const name of ["_ga", `_ga_${analyticsId.slice(2)}`]) {
      document.cookie = `${name}=; Max-Age=0; Path=${siteBase}; Secure; SameSite=Lax`;
    }
  }

  function startAnalytics() {
    window[disabledKey] = false;
    if (started) return;
    started = true;

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    const denied = {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    };
    gtag("consent", "default", denied);
    gtag("consent", "update", { analytics_storage: "granted" });
    gtag("js", new Date());
    gtag("config", analyticsId, {
      page_location: canonical,
      page_referrer: document.referrer ? new URL(document.referrer).origin : "",
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_domain: "none",
      cookie_path: siteBase,
      cookie_expires: 90 * 24 * 60 * 60,
    });

    const tag = document.createElement("script");
    tag.async = true;
    tag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsId)}`;
    document.head.append(tag);
  }

  function applyPreference(choice) {
    if (choice === "granted") startAnalytics();
    else stopAnalytics();
    showPanel(choice !== "granted" && choice !== "denied");
  }

  settings.hidden = false;
  settings.addEventListener("click", () => {
    openedFromSettings = true;
    showPanel(true);
    heading.focus();
  });

  panel.addEventListener("click", (event) => {
    const choice = event.target.closest("[data-analytics-choice]")?.dataset.analyticsChoice;
    if (!choice) return;
    try { localStorage.setItem(preferenceKey, choice); } catch {}
    applyPreference(choice);
    if (openedFromSettings) settings.focus();
    openedFromSettings = false;
  });
  panel.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !openedFromSettings) return;
    showPanel(false);
    settings.focus();
    openedFromSettings = false;
  });
  window.addEventListener("storage", (event) => {
    if (event.storageArea === localStorage && (event.key === preferenceKey || event.key === null)) {
      applyPreference(readPreference());
    }
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) applyPreference(readPreference());
  });
  applyPreference(readPreference());
}
