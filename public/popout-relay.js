// Runs in the always-on-top window that shows one device above other apps
// (src/app/popout.ts). A preview frame only trusts messages from its own
// parent, and the viewer's scripts run in the website tab, so viewer messages
// for a frame arrive here and are passed on from this window. Only the tab
// that opened this window is listened to.
(() => {
  const opener = window.opener;
  if (!opener || window.__mdvPopOutRelay) return;
  window.__mdvPopOutRelay = true;
  window.addEventListener("message", event => {
    const data = event.data;
    if (event.source !== opener || !data || data.type !== "MDV_POPOUT_RELAY" || typeof data.frame !== "string") return;
    for (const frame of document.querySelectorAll("iframe")) {
      if (frame.name === data.frame) frame.contentWindow?.postMessage(data.message, "*");
    }
  });
  opener.postMessage({ type: "MDV_POPOUT_RELAY_READY" }, "*");
})();
