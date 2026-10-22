import type { PreviewIdentity } from "../domain/simulator/preview-identity";
import { describeHeaders, identityHeaders, PREVIEW_RULE_BASE, previewHost, previewRule } from "../domain/simulator/preview-rules";

/** Session rules survive worker suspension; the browser clears them on restart/update. */
export function createPreviewSessions() {
  let queue: Promise<unknown> = Promise.resolve();
  const serial = <T>(work: () => Promise<T>) => {
    const result = queue.then(work); queue = result.catch(() => undefined); return result;
  };
  const ownRules = async () => (await chrome.declarativeNetRequest.getSessionRules()).filter(rule => rule.id >= PREVIEW_RULE_BASE);
  return {
    /**
     * Lets the tab frame a site, and makes its preview frames identify as the
     * given device's browser. An absent identity keeps the tab's current one;
     * null returns to the browser's own.
     */
    prepare: (tabId: number, url: string, identity?: PreviewIdentity | null) => serial(async () => {
      const domain = previewHost(url);
      const rules = await ownRules();
      const existing = rules.find(rule => rule.condition.tabIds?.includes(tabId));
      const domains = existing?.condition.requestDomains ?? [];
      const known = domains.includes(domain);
      const requestHeaders = identity === undefined ? existing?.action.requestHeaders : identity ? identityHeaders(identity) : undefined;
      if (known && describeHeaders(requestHeaders) === describeHeaders(existing?.action.requestHeaders)) return;
      if (!known && domains.length >= 32) throw new Error("Close and reopen Mobile View before previewing more sites.");
      const used = new Set(rules.map(rule => rule.id));
      let id = existing?.id ?? PREVIEW_RULE_BASE;
      if (!existing) while (used.has(id)) id++;
      await chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: existing ? [id] : [], addRules: [previewRule(id, tabId, known ? domains : [...domains, domain], requestHeaders)],
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
