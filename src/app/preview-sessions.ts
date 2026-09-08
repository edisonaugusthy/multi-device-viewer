import { PREVIEW_RULE_BASE, previewHost, previewRule } from "../domain/simulator/preview-rules";

/** Session rules survive worker suspension; the browser clears them on restart/update. */
export function createPreviewSessions() {
  let queue: Promise<unknown> = Promise.resolve();
  const serial = <T>(work: () => Promise<T>) => {
    const result = queue.then(work); queue = result.catch(() => undefined); return result;
  };
  const ownRules = async () => (await chrome.declarativeNetRequest.getSessionRules()).filter(rule => rule.id >= PREVIEW_RULE_BASE);
  return {
    prepare: (tabId: number, url: string) => serial(async () => {
      const domain = previewHost(url);
      const rules = await ownRules();
      const existing = rules.find(rule => rule.condition.tabIds?.includes(tabId));
      const domains = existing?.condition.requestDomains ?? [];
      if (domains.includes(domain)) return;
      if (domains.length >= 32) throw new Error("Close and reopen Mobile View before previewing more sites.");
      const used = new Set(rules.map(rule => rule.id));
      let id = existing?.id ?? PREVIEW_RULE_BASE;
      if (!existing) while (used.has(id)) id++;
      await chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: existing ? [id] : [], addRules: [previewRule(id, tabId, [...domains, domain])],
      });
    }),
    close: (tabId: number) => serial(async () => {
      const removeRuleIds = (await ownRules()).filter(rule => rule.condition.tabIds?.includes(tabId)).map(rule => rule.id);
      if (removeRuleIds.length) await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds });
    }),
    prune: () => serial(async () => {
      const tabs = new Set((await chrome.tabs.query({})).map(tab => tab.id));
      const removeRuleIds = (await ownRules()).filter(rule => !rule.condition.tabIds?.some(id => tabs.has(id))).map(rule => rule.id);
      if (removeRuleIds.length) await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds });
    }),
  };
}
