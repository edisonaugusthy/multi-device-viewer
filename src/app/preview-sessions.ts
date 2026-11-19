import type { PreviewIdentities } from "../domain/simulator/preview-identity";
import type { BrowserBrands } from "../domain/simulator/preview-emulation";
import { describeHeaders, identityHeaders, PREVIEW_RULE_BASE, previewHost, previewRule, previewHeaderRule, ruleTabs } from "../domain/simulator/preview-rules";
import { previewRequestFilter } from "../domain/simulator/preview-request";

/** Session rules survive worker suspension; the browser clears them on restart/update. */
export function createPreviewSessions() {
  let queue: Promise<unknown> = Promise.resolve();
  const serial = <T>(work: () => Promise<T>) => {
    const result = queue.then(work); queue = result.catch(() => undefined); return result;
  };
  const ownRules = async () => (await chrome.declarativeNetRequest.getSessionRules()).filter(rule => rule.id >= PREVIEW_RULE_BASE);
  return {
    /** Merge this card's identity without disturbing other live workspace/gallery cards.
     * Read rules from Chrome on every change so worker suspension loses no state.
     * A rule's first tab is the website tab that owns it; `popOuts` are the windows
     * showing one of its devices on top of other apps, which need the same rules.
     */
    prepare: (tabId: number, url: string, identities: PreviewIdentities | undefined, browser: BrowserBrands, popOuts: number[] = []) => serial(async () => {
      const domain = previewHost(url);
      const tabs = ruleTabs([tabId, ...popOuts]);
      const sameTabs = (rule: chrome.declarativeNetRequest.Rule | undefined) => rule?.condition.tabIds?.join() === tabs.join();
      const rules = await ownRules();
      const own = rules.filter(rule => rule.condition.tabIds?.[0] === tabId);
      const domains = [...new Set(own.flatMap(rule => rule.condition.requestDomains ?? []))];
      const known = domains.includes(domain);
      if (!known && domains.length >= 32) throw new Error("Close and reopen Mobile View before previewing more sites.");
      const used = new Set(rules.map(rule => rule.id));
      const nextId = () => { let id = PREVIEW_RULE_BASE; while (used.has(id)) id++; used.add(id); return id; };
      const removeRuleIds: number[] = [];
      const addRules: chrome.declarativeNetRequest.Rule[] = [];
      const embedding = own.filter(rule => !rule.condition.urlFilter);
      const existingEmbedding = embedding[0];
      // Also replaces legacy split rules when an already-open viewer upgrades.
      if (!known || embedding.length !== 1 || existingEmbedding?.action.requestHeaders?.length || !sameTabs(existingEmbedding)) {
        removeRuleIds.push(...embedding.map(rule => rule.id));
        addRules.push(previewRule(existingEmbedding?.id ?? nextId(), tabs, [...domains, domain]));
      }
      const named = new Set(Object.keys(identities ?? {}).map(previewRequestFilter));
      for (const [name, identity] of Object.entries(identities ?? {})) {
        const existing = own.find(rule => rule.condition.urlFilter === previewRequestFilter(name));
        if (existing && identity && sameTabs(existing) && describeHeaders(identityHeaders(identity, browser)) === describeHeaders(existing.action.requestHeaders)) continue;
        if (existing) removeRuleIds.push(existing.id);
        if (identity) addRules.push(previewHeaderRule(existing?.id ?? nextId(), tabs, name, identity, browser));
      }
      // A pop-out opening or closing moves the other devices' rules with it.
      for (const rule of own) {
        if (!rule.condition.urlFilter || named.has(rule.condition.urlFilter) || sameTabs(rule)) continue;
        removeRuleIds.push(rule.id);
        addRules.push({ ...rule, condition: { ...rule.condition, tabIds: tabs } });
      }
      if (own.length - removeRuleIds.length + addRules.length > 301) throw new Error("Close and reopen Mobile View before adding more preview identities.");
      if (addRules.length || removeRuleIds.length) await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds, addRules });
    }),
    close: (tabId: number) => serial(async () => {
      // A closing pop-out owns no rules: its website tab's next preparation drops it.
      const removeRuleIds = (await ownRules()).filter(rule => rule.condition.tabIds?.[0] === tabId).map(rule => rule.id);
      if (removeRuleIds.length) await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds });
    }),
    prune: () => serial(async () => {
      const tabs = new Set((await chrome.tabs.query({})).map(tab => tab.id));
      const removeRuleIds = (await ownRules()).filter(rule => !tabs.has(rule.condition.tabIds?.[0])).map(rule => rule.id);
      if (removeRuleIds.length) await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds });
    }),
  };
}
