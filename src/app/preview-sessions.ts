import { PREVIEW_RULE_BASE, previewHost, previewRule } from "../domain/simulator/preview-rules";

/** Session rules survive worker suspension; the browser clears them on restart/update. */
export function createPreviewSessions() {
  let queue: Promise<unknown> = Promise.resolve();
  const serial = <T>(work: () => Promise<T>) => {
    const result = queue.then(work); queue = result.catch(() => undefined); return result;
  };
  const ownRules = async () => (await chrome.declarativeNetRequest.getSessionRules()).filter(rule => rule.id >= PREVIEW_RULE_BASE);
  return {
    /** Let this card's host be framed, without disturbing other live workspace/gallery cards.
     * Read rules from Chrome on every change so worker suspension loses no state.
     */
    prepare: (tabId: number, url: string) => serial(async () => {
      const domain = previewHost(url);
      const rules = await ownRules();
      const own = rules.filter(rule => rule.condition.tabIds?.includes(tabId));
      const embedding = own.filter(rule => !rule.condition.urlFilter);
      const domains = [...new Set(embedding.flatMap(rule => rule.condition.requestDomains ?? []))];
      // Device headers now come from the debugger; an open viewer from an older version drops its per-device rules.
      const legacy = own.filter(rule => rule.condition.urlFilter).map(rule => rule.id);
      if (domains.includes(domain) && embedding.length === 1 && !legacy.length) return;
      if (!domains.includes(domain) && domains.length >= 32) throw new Error("Close and reopen Mobile View before previewing more sites.");
      let id = embedding[0]?.id ?? PREVIEW_RULE_BASE;
      const used = new Set(rules.map(rule => rule.id));
      if (!embedding.length) while (used.has(id)) id++;
      await chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: [...embedding.map(rule => rule.id), ...legacy],
        addRules: [previewRule(id, tabId, [...domains, domain])],
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
