import type { PreviewIdentities } from "../domain/simulator/preview-identity";
import { describeHeaders, identityHeaders, PREVIEW_RULE_BASE, previewHost, previewRule, previewRuleKind, type PreviewFrameKind } from "../domain/simulator/preview-rules";

const KINDS: readonly PreviewFrameKind[] = ["wrapped", "direct"];

/** Session rules survive worker suspension; the browser clears them on restart/update. */
export function createPreviewSessions(extensionId: string) {
  let queue: Promise<unknown> = Promise.resolve();
  const serial = <T>(work: () => Promise<T>) => {
    const result = queue.then(work); queue = result.catch(() => undefined); return result;
  };
  const ownRules = async () => (await chrome.declarativeNetRequest.getSessionRules()).filter(rule => rule.id >= PREVIEW_RULE_BASE);
  return {
    /**
     * Lets the tab frame a site, and makes each kind of preview frame in it
     * identify as the given device's browser. Absent identities keep the
     * tab's current ones; null returns a kind to the browser's own.
     */
    prepare: (tabId: number, url: string, identities?: PreviewIdentities | null) => serial(async () => {
      const domain = previewHost(url);
      const rules = await ownRules();
      const own = rules.filter(rule => rule.condition.tabIds?.includes(tabId));
      const domains = [...new Set(own.flatMap(rule => rule.condition.requestDomains ?? []))];
      const known = domains.includes(domain);
      if (!known && domains.length >= 32) throw new Error("Close and reopen Mobile View before previewing more sites.");
      const used = new Set(rules.map(rule => rule.id));
      const nextId = () => { let id = PREVIEW_RULE_BASE; while (used.has(id)) id++; used.add(id); return id; };
      const removeRuleIds: number[] = [];
      const addRules: chrome.declarativeNetRequest.Rule[] = [];
      for (const kind of KINDS) {
        const existing = own.find(rule => previewRuleKind(rule) === kind);
        const identity = identities === null ? null : identities?.[kind];
        const requestHeaders = identity === undefined ? existing?.action.requestHeaders : identity ? identityHeaders(identity) : undefined;
        if (existing && known && describeHeaders(requestHeaders) === describeHeaders(existing.action.requestHeaders)) continue;
        if (existing) removeRuleIds.push(existing.id);
        addRules.push(previewRule(existing?.id ?? nextId(), tabId, known ? domains : [...domains, domain], { kind, extensionId }, requestHeaders));
      }
      if (addRules.length) await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds, addRules });
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
