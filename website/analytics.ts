import * as amplitude from "@amplitude/unified";

const AMPLITUDE_API_KEY = "bfd62ffe2af530cd0ab355ab423174c3";

type AnalyticsWindow = Window & {
  __mobileViewAmplitudeInit?: Promise<void>;
  __mobileViewAmplitudeTrackingBound?: boolean;
};

function pageContext() {
  return {
    page_path: window.location.pathname,
    page_title: document.title,
  };
}

function linkPlacement(link: HTMLAnchorElement): string {
  if (link.closest(".site-nav")) return "header";
  if (link.closest(".hero")) return "hero";
  if (link.closest(".trust-section")) return "trust";
  if (link.closest(".features-section")) return "features";
  if (link.closest(".workflow")) return "workflow";
  if (link.closest(".faq")) return "faq";
  if (link.closest(".final-cta")) return "final_cta";
  if (link.closest(".site-footer")) return "footer";
  return "content";
}

function eventForLink(link: HTMLAnchorElement): string | undefined {
  const destination = new URL(link.href, window.location.href);
  if (destination.hostname === "chromewebstore.google.com") return "Chrome Web Store Clicked";
  if (destination.hostname === "github.com" && destination.pathname.endsWith("/issues")) return "Issue Tracker Clicked";
  if (destination.hostname === "github.com") return "Source Code Clicked";
  if (destination.pathname.endsWith("/privacy.html")) return "Privacy Policy Clicked";
  if (destination.pathname.endsWith("/guides/responsive-testing.html")) return "Responsive Guide Clicked";
  if (destination.pathname.endsWith("/changelog.html")) return "Changelog Clicked";
  return undefined;
}

function bindExplicitTracking() {
  const analyticsWindow = window as AnalyticsWindow;
  if (analyticsWindow.__mobileViewAmplitudeTrackingBound) return;
  analyticsWindow.__mobileViewAmplitudeTrackingBound = true;

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest<HTMLAnchorElement>("a[href]");
    if (!link) return;
    const eventName = eventForLink(link);
    if (!eventName) return;

    amplitude.track(eventName, {
      ...pageContext(),
      placement: linkPlacement(link),
      link_text: link.textContent?.trim().replace(/\s+/g, " ").slice(0, 100) || undefined,
    });
  });

  document.querySelectorAll<HTMLDetailsElement>("details").forEach((details) => {
    details.addEventListener("toggle", () => {
      if (!details.open) return;
      amplitude.track("FAQ Opened", {
        ...pageContext(),
        question: details.querySelector("summary")?.textContent?.replace("+", "").trim().slice(0, 160),
      });
    });
  });
}

function initializeAmplitude() {
  const analyticsWindow = window as AnalyticsWindow;
  if (!analyticsWindow.__mobileViewAmplitudeInit) {
    analyticsWindow.__mobileViewAmplitudeInit = amplitude.initAll(AMPLITUDE_API_KEY, {
      analytics: { autocapture: true },
      sessionReplay: { sampleRate: 1 },
    });
  }

  void analyticsWindow.__mobileViewAmplitudeInit.then(bindExplicitTracking);
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  initializeAmplitude();
}
