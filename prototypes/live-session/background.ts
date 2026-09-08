import { captureLiveSession } from "../../src/domain/simulator/live-session";
const jobs = new Map<number, { owner: number; cancelled: boolean }>();
chrome.action.onClicked.addListener(tab => {
  if (typeof tab.id === "number" && /^https?:\/\//.test(tab.url ?? "")) void chrome.tabs.create({ url: chrome.runtime.getURL(`compare.html?tab=${tab.id}`) });
});
chrome.debugger.onDetach.addListener(source => { const job = source.tabId === undefined ? undefined : jobs.get(source.tabId); if (job) job.cancelled = true; });
chrome.tabs.onRemoved.addListener(id => { for (const [target, job] of jobs) if (target === id || job.owner === id) job.cancelled = true; });
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (!sender.url?.startsWith(chrome.runtime.getURL("compare.html")) || typeof sender.tab?.id !== "number") return;
  if (message?.type === "LIVE_STOP") { for (const job of jobs.values()) if (job.owner === sender.tab.id) job.cancelled = true; respond({ ok: true }); return; }
  if (message?.type !== "LIVE_RUN" || !Number.isInteger(message.tabId)) return;
  if (jobs.has(message.tabId)) { respond({ error: "This tab already has a comparison running." }); return; }
  const job = { owner: sender.tab.id, cancelled: false }; jobs.set(message.tabId, job);
  const target = { tabId: message.tabId };
  void (async () => {
    const tab = (await chrome.debugger.getTargets()).find(target => target.tabId === message.tabId);
    if (!/^https?:\/\//.test(tab?.url ?? "")) throw new Error("Choose a normal website tab.");
    return captureLiveSession({
      attach: () => chrome.debugger.attach(target, "1.3"),
      detach: () => chrome.debugger.detach(target),
      command: (method, params) => chrome.debugger.sendCommand(target, method, params),
      settle: () => new Promise(resolve => setTimeout(resolve, 500)),
      cancelled: () => job.cancelled,
    }, message.widths, message.height);
  })().then(shots => respond({ shots })).catch(error => respond({ error: String(error) })).finally(() => jobs.delete(message.tabId));
  return true;
});
