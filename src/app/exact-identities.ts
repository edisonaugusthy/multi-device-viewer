import type { ExactIdentities, IdentityPlatform, PreviewIdentity } from "../domain/simulator/preview-identity";

/**
 * Exact device identities: one browser identity per preview frame, set
 * through Chrome's debugging protocol. Every preview then loads inside the
 * extension's wrapper frame (preview-frame.html), which makes each page frame
 * a debugging target of its own. The wrapper's frame name says which
 * identity the viewer gave it. A frame's first request takes its parent's
 * override (Chrome pauses a new frame only once that request is answered),
 * so the wrapper carries the identity for the page frame's first request
 * and the page frame carries it for everything after, its own frames
 * included. This needs the optional "debugger" permission and shows Chrome's
 * debugging bar while attached.
 */
export interface DebuggerTarget { tabId: number; sessionId?: string }
/** The slice of chrome.debugger the sessions use, so tests can stand in for it. */
export interface DebuggerApi {
  attach(tabId: number): Promise<void>;
  detach(tabId: number): Promise<void>;
  send(target: DebuggerTarget, method: string, params?: object): Promise<unknown>;
  onEvent(listener: (source: DebuggerTarget, method: string, params?: object) => void): void;
  onDetach(listener: (source: DebuggerTarget, reason: string) => void): void;
}
export interface Brand { brand: string; version: string }

interface TargetInfo { targetId: string; type: string; url: string; parentId?: string }
interface FrameTree { frame: { id: string; name?: string }; childFrames?: FrameTree[] }
interface AttachedTarget { sessionId: string; targetInfo: TargetInfo; waitingForDebugger: boolean }
interface TabState {
  frames: ExactIdentities;
  /** Every attached target's session, with the target it belongs to and the parent it sits in. */
  sessions: Map<string, { targetId: string; parentId?: string }>;
  /** Wrapper frames by target, with the frame name the viewer gave them. */
  wrappers: Map<string, string>;
  /** The identity each page frame target was given; frames inside it inherit it. */
  identities: Map<string, PreviewIdentity>;
}

const NAVIGATOR_PLATFORM: Record<IdentityPlatform, string> = {
  iOS: "iPhone", macOS: "MacIntel", Android: "Linux armv81", Windows: "Win32", "Chrome OS": "Linux x86_64", Linux: "Linux x86_64",
};

/** Chrome's own brands, so a Chrome identity's hints stay truthful; a browser without hints sends an empty list. */
export function identityOverride(identity: PreviewIdentity, brands: Brand[]) {
  return {
    userAgent: identity.userAgent,
    platform: NAVIGATOR_PLATFORM[identity.platform],
    userAgentMetadata: {
      brands: identity.hints ? brands : [],
      fullVersionList: identity.hints ? brands : [],
      platform: identity.platform,
      platformVersion: "",
      architecture: "",
      model: "",
      mobile: identity.mobile,
    },
  };
}

export function createExactIdentities(api: DebuggerApi, wrapperUrl: string, brands: Brand[], onLost: (tabId: number) => void) {
  const tabs = new Map<number, TabState>();
  const quiet = <T,>(work: Promise<T>): Promise<T | undefined> => work.catch(() => undefined);
  const wrapperName = (url: string) => {
    if (!url.startsWith(wrapperUrl)) return undefined;
    try { return new URL(url).searchParams.get("name") ?? undefined; } catch { return undefined; }
  };
  const autoAttach = (target: DebuggerTarget) => api.send(target, "Target.setAutoAttach", { autoAttach: true, waitForDebuggerOnStart: true, flatten: true });
  // A wrapper attaches before it has a URL, but the tab's frame tree already
  // knows the name the viewer gave its frame element.
  const frameNameOf = async (tabId: number, targetId: string) => {
    const { frameTree } = await api.send({ tabId }, "Page.getFrameTree") as { frameTree: FrameTree };
    const stack = [frameTree];
    for (let tree = stack.pop(); tree; tree = stack.pop()) {
      if (tree.frame.id === targetId) return tree.frame.name;
      stack.push(...tree.childFrames ?? []);
    }
    return undefined;
  };
  const override = async (target: DebuggerTarget, identity: PreviewIdentity) => {
    await quiet(api.send(target, "Emulation.setUserAgentOverride", identityOverride(identity, brands)));
    if (identity.mobile) await quiet(api.send(target, "Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 }));
  };

  // The debugger API exists only once its optional permission is granted, so
  // its events are listened to on the first request for exact identities.
  let listening = false;
  const listen = () => {
    if (listening) return;
    listening = true;
    api.onEvent((source, method, params) => {
      const state = tabs.get(source.tabId);
      if (method === "Target.detachedFromTarget") {
        const { sessionId } = params as { sessionId: string };
        const target = state?.sessions.get(sessionId);
        if (!state || !target) return;
        state.sessions.delete(sessionId);
        state.wrappers.delete(target.targetId);
        state.identities.delete(target.targetId);
        return;
      }
      if (method === "Target.targetInfoChanged") {
        const { targetInfo } = params as { targetInfo: TargetInfo };
        const name = wrapperName(targetInfo.url);
        if (state && name && state.frames[name] && !state.wrappers.has(targetInfo.targetId)) {
          state.wrappers.set(targetInfo.targetId, name);
          const session = [...state.sessions].find(([, entry]) => entry.targetId === targetInfo.targetId)?.[0];
          if (session) void override({ tabId: source.tabId, sessionId: session }, state.frames[name]);
        }
        return;
      }
      if (method !== "Target.attachedToTarget") return;
      const { sessionId, targetInfo, waitingForDebugger } = params as AttachedTarget;
      const target = { tabId: source.tabId, sessionId };
      const resume = () => { if (waitingForDebugger) void quiet(api.send(target, "Runtime.runIfWaitingForDebugger")); };
      void (async () => {
        if (!state || (targetInfo.type !== "iframe" && targetInfo.type !== "page")) return resume();
        const parentId = targetInfo.parentId ?? (source.sessionId ? state.sessions.get(source.sessionId)?.targetId : undefined);
        state.sessions.set(sessionId, { targetId: targetInfo.targetId, parentId });
        // The page frame under a wrapper gets that frame's identity; frames inside it inherit theirs.
        const wrapper = parentId ? state.wrappers.get(parentId) : undefined;
        let identity = wrapper ? state.frames[wrapper] : parentId ? state.identities.get(parentId) : undefined;
        if (!identity) {
          // A wrapper of the viewer's own: its frame name says which identity its page gets.
          const name = wrapperName(targetInfo.url) ?? await quiet(frameNameOf(source.tabId, targetInfo.targetId));
          if (name && state.frames[name]) { state.wrappers.set(targetInfo.targetId, name); identity = state.frames[name]; }
        }
        if (identity) {
          state.identities.set(targetInfo.targetId, identity);
          await override(target, identity);
        }
        // Every frame may hold a wrapper's page or a page's own frames, so each one watches its children.
        await quiet(autoAttach(target));
        resume();
      })();
    });
    api.onDetach((source) => {
      if (source.sessionId || !tabs.has(source.tabId)) return;
      tabs.delete(source.tabId);
      onLost(source.tabId);
    });
  };

  return {
    /** Gives the tab's frames their identities, attaching first if needed. False when the debugger cannot be attached (DevTools open, say). */
    async update(tabId: number, frames: ExactIdentities): Promise<boolean> {
      const state = tabs.get(tabId);
      if (state) { state.frames = frames; return true; }
      try {
        listen();
        await api.attach(tabId);
      } catch { return false; }
      tabs.set(tabId, { frames, sessions: new Map(), wrappers: new Map(), identities: new Map() });
      try {
        await autoAttach({ tabId });
      } catch {
        tabs.delete(tabId);
        await quiet(api.detach(tabId));
        return false;
      }
      return true;
    },
    attached: (tabId: number) => tabs.has(tabId),
    async close(tabId: number) {
      if (!tabs.delete(tabId)) return;
      await quiet(api.detach(tabId));
    },
  };
}

/** chrome.debugger as the sessions see it; absent until the optional permission is granted, so looked up at each use. */
export function chromeDebuggerApi(): DebuggerApi {
  const debuggerApi = () => {
    if (!chrome.debugger) throw new Error("The debugger permission is not granted.");
    return chrome.debugger;
  };
  return {
    attach: (tabId) => debuggerApi().attach({ tabId }, "1.3"),
    detach: (tabId) => debuggerApi().detach({ tabId }),
    send: (target, method, params) => debuggerApi().sendCommand(target, method, params as Record<string, unknown> | undefined),
    onEvent: (listener) => debuggerApi().onEvent.addListener((source, method, params) => listener({ tabId: source.tabId ?? -1, sessionId: source.sessionId }, method, params)),
    onDetach: (listener) => debuggerApi().onDetach.addListener((source, reason) => listener({ tabId: source.tabId ?? -1, sessionId: (source as chrome.debugger.DebuggerSession).sessionId }, reason)),
  };
}
