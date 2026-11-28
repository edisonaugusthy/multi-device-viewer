const { analyticsId, siteBase } = document.documentElement.dataset;
const canonical = document.querySelector('link[rel="canonical"]')?.href;

// Avoid measuring previews, embedded demos, and builds served on a different origin.
if (analyticsId && canonical && window.top === window && location.origin === new URL(canonical).origin) {
  setupAnalytics();
}

function setupAnalytics() {
  const preferenceKey = `mv-analytics:${siteBase}`;
  const disabledKey = `ga-disable-${analyticsId}`;
  const settings = document.querySelector("[data-analytics-settings]");
  const buttons = settings?.querySelectorAll("[data-analytics-choice]") ?? [];
  let started = false;

  function readPreference() {
    try {
      if (localStorage.getItem(preferenceKey) === "denied") return "denied";
    } catch {}
    return "granted";
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
    gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
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
    if (choice === "denied") stopAnalytics();
    else startAnalytics();
    for (const button of buttons) {
      button.setAttribute("aria-pressed", String(button.dataset.analyticsChoice === choice));
    }
  }

  for (const button of buttons) {
    button.addEventListener("click", () => {
      const { analyticsChoice } = button.dataset;
      try { localStorage.setItem(preferenceKey, analyticsChoice); } catch {}
      applyPreference(analyticsChoice);
    });
  }
  if (settings) settings.hidden = false;
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
