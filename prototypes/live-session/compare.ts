import type { LiveSessionShot } from "../../src/domain/simulator/live-session";
const form = document.querySelector<HTMLFormElement>("#controls")!;
const start = document.querySelector<HTMLButtonElement>("#start")!;
const stop = document.querySelector<HTMLButtonElement>("#stop")!;
const status = document.querySelector<HTMLElement>("#status")!;
const results = document.querySelector<HTMLElement>("#results")!;
const tabId = Number(new URLSearchParams(location.search).get("tab"));
let running = false;
stop.onclick = () => { status.textContent = "Stopping and restoring the source viewport…"; void chrome.runtime.sendMessage({ type: "LIVE_STOP" }); };
window.addEventListener("pagehide", () => { if (running) void chrome.runtime.sendMessage({ type: "LIVE_STOP" }); });
form.onsubmit = async event => {
  event.preventDefault(); if (running) return;
  running = true; start.disabled = true; stop.disabled = false; results.replaceChildren();
  status.textContent = "Comparing the live document…";
  try {
    const widths = document.querySelector<HTMLInputElement>("#widths")!.value.split(",").map(v => Number(v.trim()));
    const height = Number(document.querySelector<HTMLInputElement>("#height")!.value);
    const response = await chrome.runtime.sendMessage({ type: "LIVE_RUN", tabId, widths, height });
    if (response.error) throw new Error(String(response.error).replace(/^Error:\s*/, ""));
    for (const shot of response.shots as LiveSessionShot[]) {
      const figure = document.createElement("figure"), caption = document.createElement("figcaption"), image = document.createElement("img"), link = document.createElement("a");
      caption.textContent = `${shot.width} × ${shot.height}`;
      link.textContent = "Download PNG"; link.href = shot.dataUrl; link.download = `mobile-view-live-${shot.width}x${shot.height}.png`;
      caption.append(link); image.src = shot.dataUrl; image.alt = `Current session at ${shot.width} CSS pixels`;
      figure.append(caption, image); results.append(figure);
    }
    status.textContent = "Comparison ready. The source viewport and scroll position were restored.";
  } catch (error) { status.textContent = error instanceof Error ? error.message : String(error); }
  finally { running = false; start.disabled = false; stop.disabled = true; }
};
