import { PREVIEW_FRAME_NAME, type PreviewIdentities, type PreviewIdentity } from "../domain/simulator/preview-identity";
import { identityHeaders, identityScript, type BrowserBrands } from "../domain/simulator/preview-emulation";
import { conditionCommands, DEFAULT_CONDITIONS, type Conditions } from "../domain/simulator/preview-conditions";
import {
  addDownload, addProblem, consoleProblem, emptyDiagnostics, exceptionProblem, requestProblem,
  type ExceptionDetails, type PreviewDiagnostics,
} from "../domain/simulator/preview-diagnostics";
import { pickLayoutCause, type LayoutCause, type MatchedStyles, type StyleSheetInfo } from "../domain/layout-check/layout-cause";

/**
 * Each preview as its own device, through Chrome's debugging protocol, while
 * the viewer is open. Every request the tab makes pauses on its way out, and
 * one made by a preview frame, or by a frame inside one, takes that device's
 * User-Agent and client hints: documents, fetch and XHR, images, scripts,
 * styles, nested frames, workers and redirects alike. A script added to every
 * new document gives the same frames the device in navigator. The website's
 * pages are not modified otherwise, and previews stay frames of its own tab,
 * so cookies, storage and the login are still the tab's. A preview that
 * crosses to another site runs in a process of its own; Chrome holds it until
 * its auto-attached child session is watched the same way.
 */
export interface DebuggerTarget { tabId: number; sessionId?: string }
/** The slice of chrome.debugger the previews use, so tests can stand in for it. */
export interface DebuggerApi {
  attach(tabId: number): Promise<void>;
  detach(tabId: number): Promise<void>;
  send(target: DebuggerTarget, method: string, params?: object): Promise<unknown>;
  onEvent(listener: (source: DebuggerTarget, method: string, params?: object) => void): void;
  onDetach(listener: (source: DebuggerTarget, reason: string) => void): void;
  /** Tabs some debugger holds, ours included, as Chrome lists them. */
  attachedTabs(): Promise<number[]>;
}

interface Frame { parentId?: string; preview?: string }
interface FrameTree { frame: { id: string; parentId?: string; name?: string }; childFrames?: FrameTree[] }
interface RequestPaused { requestId: string; request: { url: string; headers: Record<string, string> }; frameId?: string; resourceType?: string }
interface AttachedTarget { sessionId: string; targetInfo: { type: string }; waitingForDebugger: boolean }
interface RequestInfo { frameId?: string; url: string; method: string; type?: string; documentUrl?: string; status?: number; statusText?: string; mimeType?: string; problemKey?: string }
interface DomNode { nodeId: number; frameId?: string; contentDocument?: DomNode; children?: DomNode[]; shadowRoots?: DomNode[] }
interface TabState {
  /** Every frame seen in any of the tab's sessions; frame ids are unique across processes. */
  frames: Map<string, Frame>;
  refreshing: Map<string, Promise<void>>;
  /** The navigator script each watched session runs in new documents, by session ("" for the tab itself). */
  scripts: Map<string, string | undefined>;
  /** Each watched session's top frame: a child session's is the preview, or the frame inside one, it runs. */
  roots: Map<string, string>;
  /** Page script contexts by session and id, to the frame they run in. */
  contexts: Map<string, string>;
  requests: Map<string, RequestInfo>;
  /** Problems and download size by preview frame name, since that preview's page loaded. */
  diagnostics: Map<string, PreviewDiagnostics>;
  styleSheets: Map<string, StyleSheetInfo>;
}

export type DiagnosticsByPreview = Record<string, PreviewDiagnostics>;
export interface CaptureClip { x: number; y: number; width: number; height: number }
/** Text responses of failed requests are kept to show what the server said; larger ones are not read. */
const RESPONSE_PREVIEW_TYPES = /json|text|xml|javascript|problem/i;
const DIAGNOSTICS_DELAY_MS = 400;

/**
 * The request's headers with the device's in place of the browser's own.
 * The paused request lists a Cookie header for display only; sent back, it
 * would replace the cookies Chrome attaches itself and lose partitioned ones,
 * so cookies are always left to Chrome.
 */
export function deviceRequestHeaders(headers: Record<string, string>, identity: PreviewIdentity, browser: BrowserBrands): Array<{ name: string; value: string }> {
  const device = identityHeaders(identity, browser);
  const replaced = (name: string) => name.toLowerCase() === "cookie" || name.toLowerCase() in device;
  return [
    ...Object.entries(headers).filter(([name]) => !replaced(name)).map(([name, value]) => ({ name, value })),
    ...Object.entries(device).flatMap(([name, value]) => value === null ? [] : [{ name, value }]),
  ];
}

export interface PreviewDebuggerEvents {
  /** A tab whose debugger went away while its viewer is open, such as by the debugging bar's Cancel. */
  onLost?: (tabId: number) => void;
  /** A tab's problems and download sizes changed. */
  onDiagnostics?: (tabId: number, previews: DiagnosticsByPreview) => void;
}

export function createPreviewDebugger(api: DebuggerApi, browserBrands: Promise<BrowserBrands>, events: PreviewDebuggerEvents = {}) {
  const tabs = new Map<number, TabState>();
  /** Conditions by tab, kept while a tab cannot attach so a later attach applies them. */
  const conditions = new Map<number, Conditions>();
  const diagnosticsTimers = new Map<number, ReturnType<typeof setTimeout>>();
  /** Identities by frame name, kept while a tab cannot attach so a later attach still has them. */
  const identities = new Map<number, Map<string, PreviewIdentity>>();
  /** Tabs whose debugging bar was cancelled stay off until their viewer closes. */
  const declined = new Set<number>();
  let browser: BrowserBrands | undefined;
  let queue: Promise<unknown> = Promise.resolve();
  const serial = <T>(work: () => Promise<T>) => {
    const result = queue.then(work); queue = result.catch(() => undefined); return result;
  };
  const quiet = <T>(work: Promise<T>): Promise<T | undefined> => work.catch(() => undefined);
  const sessionKey = (target: DebuggerTarget) => target.sessionId ?? "";

  const record = (state: TabState, tree: FrameTree) => {
    const { id, parentId, name } = tree.frame;
    const frame = state.frames.get(id) ?? {};
    if (parentId) frame.parentId = parentId;
    // A page may rename its own window; the frame keeps the preview it was given.
    if (name && PREVIEW_FRAME_NAME.test(name)) frame.preview = name;
    state.frames.set(id, frame);
    for (const child of tree.childFrames ?? []) record(state, child);
  };
  const refresh = (state: TabState, target: DebuggerTarget) => {
    const key = sessionKey(target);
    let pending = state.refreshing.get(key);
    if (!pending) {
      pending = (async () => {
        const { frameTree } = await api.send(target, "Page.getFrameTree") as { frameTree: FrameTree };
        state.roots.set(key, frameTree.frame.id);
        record(state, frameTree);
      })().finally(() => state.refreshing.delete(key));
      state.refreshing.set(key, pending);
    }
    return pending;
  };
  /** The preview a frame belongs to, by its frame name: a named frame directly under the page, or one of its descendants. */
  const previewFor = (state: TabState, frameId: string | undefined): { name: string; frameId: string } | undefined => {
    for (let id: string | undefined = frameId, depth = 0; id && depth < 32; depth++) {
      const frame = state.frames.get(id);
      if (!frame) return undefined;
      const parent = frame.parentId ? state.frames.get(frame.parentId) : undefined;
      if (frame.preview && parent && !parent.parentId) return { name: frame.preview, frameId: id };
      id = frame.parentId;
    }
    return undefined;
  };
  const identityFor = (tabId: number, state: TabState, frameId: string) => {
    const preview = previewFor(state, frameId);
    return preview ? identities.get(tabId)?.get(preview.name) : undefined;
  };

  const publishDiagnostics = (tabId: number) => {
    if (!events.onDiagnostics || diagnosticsTimers.has(tabId)) return;
    diagnosticsTimers.set(tabId, setTimeout(() => {
      diagnosticsTimers.delete(tabId);
      const state = tabs.get(tabId);
      if (state) events.onDiagnostics?.(tabId, Object.fromEntries(state.diagnostics));
    }, DIAGNOSTICS_DELAY_MS));
  };
  const diagnosticsFor = (tabId: number, state: TabState, frameId: string | undefined) => {
    const preview = previewFor(state, frameId);
    if (!preview) return undefined;
    let diagnostics = state.diagnostics.get(preview.name);
    if (!diagnostics) state.diagnostics.set(preview.name, diagnostics = emptyDiagnostics());
    publishDiagnostics(tabId);
    return diagnostics;
  };
  const applyConditions = async (tabId: number, target: DebuggerTarget) => {
    for (const command of conditionCommands(conditions.get(tabId) ?? DEFAULT_CONDITIONS)) await quiet(api.send(target, command.method, command.params));
  };
  /** Replace a session's navigator script with one for the tab's current identities; documents loaded from now on run it. */
  const install = async (tabId: number, state: TabState, target: DebuggerTarget) => {
    const previous = state.scripts.get(sessionKey(target));
    if (previous) await quiet(api.send(target, "Page.removeScriptToEvaluateOnNewDocument", { identifier: previous }));
    const source = identityScript(Object.fromEntries(identities.get(tabId) ?? []), browser!);
    const { identifier } = await api.send(target, "Page.addScriptToEvaluateOnNewDocument", { source }) as { identifier: string };
    state.scripts.set(sessionKey(target), identifier);
  };
  const watch = async (tabId: number, state: TabState, target: DebuggerTarget) => {
    await api.send(target, "Fetch.enable", { patterns: [{ urlPattern: "*", requestStage: "Request" }] });
    await api.send(target, "Page.enable");
    // Script errors and requests for the Problems panel; the buffer only needs failed responses' first lines.
    await quiet(api.send(target, "Runtime.enable"));
    await quiet(api.send(target, "Network.enable", { maxTotalBufferSize: 5_000_000, maxResourceBufferSize: 500_000 }));
    await applyConditions(tabId, target);
    await install(tabId, state, target);
    await refresh(state, target);
    // A preview that moves to another site's process, or a frame inside one, pauses until it is watched too.
    await api.send(target, "Target.setAutoAttach", { autoAttach: true, waitForDebuggerOnStart: true, flatten: true });
  };

  const paused = async (target: DebuggerTarget, { requestId, request, frameId, resourceType }: RequestPaused) => {
    let headers: Array<{ name: string; value: string }> | undefined;
    try {
      const state = tabs.get(target.tabId);
      if (state && frameId && browser) {
        const frame = state.frames.get(frameId);
        // A new frame, or one navigating under a name the viewer just gave it, is read from the frame tree first.
        if (!frame || (resourceType === "Document" && frame.parentId)) await refresh(state, target);
        const preview = resourceType === "Document" ? previewFor(state, frameId) : undefined;
        if (preview?.frameId === frameId) { state.diagnostics.set(preview.name, emptyDiagnostics()); publishDiagnostics(target.tabId); }
        const identity = identityFor(target.tabId, state, frameId);
        if (identity) headers = deviceRequestHeaders(request.headers, identity, browser);
      }
    } catch { /* The request leaves as the browser made it. */ }
    // Every paused request continues, or the page would wait on it forever.
    await quiet(api.send(target, "Fetch.continueRequest", headers ? { requestId, headers } : { requestId }));
  };

  const observe = (source: DebuggerTarget, state: TabState, method: string, params: Record<string, unknown>) => {
    const key = sessionKey(source);
    switch (method) {
      case "Runtime.executionContextCreated": {
        const context = params.context as { id: number; auxData?: { frameId?: string; isDefault?: boolean } };
        // Only the page's own world: the extension's scripts run in worlds of their own.
        if (context.auxData?.frameId && context.auxData.isDefault) state.contexts.set(`${key}:${context.id}`, context.auxData.frameId);
        return;
      }
      case "Page.frameDetached": {
        // A frame moving to its own process ("swap") lives on in a child session.
        if (params.reason === "swap") return;
        const gone = new Set([params.frameId as string]);
        for (const [id, frame] of state.frames) if (frame.parentId && gone.has(frame.parentId)) gone.add(id);
        for (const id of gone) state.frames.delete(id);
        return;
      }
      case "Runtime.executionContextDestroyed": state.contexts.delete(`${key}:${params.executionContextId as number}`); return;
      case "Runtime.executionContextsCleared": for (const id of [...state.contexts.keys()]) if (id.startsWith(`${key}:`)) state.contexts.delete(id); return;
      case "Runtime.exceptionThrown": {
        const details = params.exceptionDetails as ExceptionDetails & { executionContextId?: number };
        const diagnostics = diagnosticsFor(source.tabId, state, state.contexts.get(`${key}:${details.executionContextId}`));
        if (diagnostics) addProblem(diagnostics, exceptionProblem(details));
        return;
      }
      case "Runtime.consoleAPICalled": {
        const level = params.type === "error" || params.type === "assert" ? "error" : params.type === "warning" ? "warning" : undefined;
        if (!level) return;
        const diagnostics = diagnosticsFor(source.tabId, state, state.contexts.get(`${key}:${params.executionContextId as number}`));
        const frame = (params.stackTrace as { callFrames?: Array<{ url?: string; lineNumber?: number }> } | undefined)?.callFrames?.[0];
        if (diagnostics) addProblem(diagnostics, consoleProblem(level, (params.args as []) ?? [], frame));
        return;
      }
      case "Network.requestWillBeSent": {
        const request = params.request as { url: string; method: string };
        if (!/^https?:/.test(request.url)) return;
        state.requests.set(`${key}:${params.requestId as string}`, {
          frameId: params.frameId as string | undefined, url: request.url, method: request.method,
          type: params.type as string | undefined, documentUrl: params.documentURL as string | undefined,
        });
        return;
      }
      case "Network.responseReceived": {
        const info = state.requests.get(`${key}:${params.requestId as string}`);
        const response = params.response as { status: number; statusText?: string; mimeType?: string };
        if (!info) return;
        Object.assign(info, { status: response.status, statusText: response.statusText, mimeType: response.mimeType });
        if (response.status < 400) return;
        const diagnostics = diagnosticsFor(source.tabId, state, info.frameId);
        if (!diagnostics) return;
        const problem = requestProblem(info.method, info.url, info.documentUrl, { status: response.status, statusText: response.statusText });
        info.problemKey = problem.key;
        addProblem(diagnostics, problem);
        return;
      }
      case "Network.loadingFinished": {
        const id = `${key}:${params.requestId as string}`;
        const info = state.requests.get(id);
        state.requests.delete(id);
        if (!info) return;
        const diagnostics = diagnosticsFor(source.tabId, state, info.frameId);
        if (!diagnostics) return;
        addDownload(diagnostics, info.url, info.type, params.encodedDataLength as number);
        if (info.problemKey && info.mimeType && RESPONSE_PREVIEW_TYPES.test(info.mimeType)) {
          void quiet(api.send(source, "Network.getResponseBody", { requestId: params.requestId }) as Promise<{ body: string; base64Encoded: boolean }>).then(result => {
            const problem = diagnostics.problems.find(item => item.key === info.problemKey);
            if (problem && typeof result?.body === "string" && !result.base64Encoded) { problem.response = result.body.slice(0, 300); publishDiagnostics(source.tabId); }
          });
        }
        return;
      }
      case "Network.loadingFailed": {
        const id = `${key}:${params.requestId as string}`;
        const info = state.requests.get(id);
        state.requests.delete(id);
        if (!info || params.canceled) return;
        const diagnostics = diagnosticsFor(source.tabId, state, info.frameId);
        const reason = (params.blockedReason as string | undefined) ?? (params.errorText as string | undefined);
        if (diagnostics) addProblem(diagnostics, requestProblem(info.method, info.url, info.documentUrl, { errorText: reason }));
        return;
      }
      case "CSS.styleSheetAdded": {
        const header = params.header as { styleSheetId: string; sourceURL?: string; startLine?: number; isInline?: boolean };
        state.styleSheets.set(`${key}:${header.styleSheetId}`, { sourceURL: header.sourceURL, startLine: header.startLine, isInline: header.isInline });
        return;
      }
    }
  };

  api.onEvent((source, method, params) => {
    if (method === "Fetch.requestPaused") { void paused(source, params as RequestPaused); return; }
    const state = tabs.get(source.tabId);
    if (state && params && !method.startsWith("Target.")) { observe(source, state, method, params as Record<string, unknown>); return; }
    if (method === "Target.detachedFromTarget") {
      const sessionId = (params as { sessionId: string }).sessionId;
      state?.scripts.delete(sessionId);
      state?.roots.delete(sessionId);
      return;
    }
    if (method !== "Target.attachedToTarget") return;
    const { sessionId, targetInfo, waitingForDebugger } = params as AttachedTarget;
    const child = { tabId: source.tabId, sessionId };
    void (async () => {
      if (state && targetInfo.type === "iframe") await quiet(watch(source.tabId, state, child));
      if (waitingForDebugger) await quiet(api.send(child, "Runtime.runIfWaitingForDebugger"));
    })();
  });
  api.onDetach((source, reason) => {
    if (source.sessionId || !tabs.delete(source.tabId)) return;
    if (reason === "canceled_by_user") declined.add(source.tabId);
    if (reason !== "target_closed") events.onLost?.(source.tabId);
  });

  const attach = async (tabId: number) => {
    if (tabs.has(tabId) || declined.has(tabId)) return;
    const state: TabState = {
      frames: new Map(), refreshing: new Map(), scripts: new Map(), roots: new Map(),
      contexts: new Map(), requests: new Map(), diagnostics: new Map(), styleSheets: new Map(),
    };
    tabs.set(tabId, state);
    try {
      // A worker that restarted while attached still holds the tab; another debugger's session refuses the detach.
      await api.attach(tabId).catch(async () => { await api.detach(tabId); await api.attach(tabId); });
      await watch(tabId, state, { tabId });
    } catch {
      tabs.delete(tabId);
      await quiet(api.detach(tabId));
    }
  };

  return {
    /** Attach to the viewer's tab and merge its frames' identities; null returns a frame to the browser's own. True while attached. */
    prepare: (tabId: number, frames?: PreviewIdentities) => serial(async () => {
      browser ??= await browserBrands;
      const known = identities.get(tabId) ?? new Map<string, PreviewIdentity>();
      const before = JSON.stringify([...known]);
      for (const [name, identity] of Object.entries(frames ?? {})) {
        if (identity) known.set(name, identity); else known.delete(name);
      }
      identities.set(tabId, known);
      const state = tabs.get(tabId);
      // The viewer loads the frame after this answer, so its document already runs the new script.
      if (state && JSON.stringify([...known]) !== before) {
        for (const session of [...state.scripts.keys()]) await quiet(install(tabId, state, { tabId, sessionId: session || undefined }));
      }
      await attach(tabId);
      return tabs.has(tabId);
    }),
    close: (tabId: number) => serial(async () => {
      identities.delete(tabId);
      conditions.delete(tabId);
      declined.delete(tabId);
      clearTimeout(diagnosticsTimers.get(tabId));
      diagnosticsTimers.delete(tabId);
      if (tabs.delete(tabId)) await quiet(api.detach(tabId));
    }),
    /** Apply conditions to every session of the tab, and to sessions attached later. True while attached. */
    setConditions: (tabId: number, next: Conditions) => serial(async () => {
      conditions.set(tabId, next);
      const state = tabs.get(tabId);
      if (!state) return false;
      for (const session of [...state.scripts.keys()]) await applyConditions(tabId, { tabId, sessionId: session || undefined });
      return true;
    }),
    attached: (tabId: number) => tabs.has(tabId),
    /** The tab's problems and download sizes as they stand. */
    diagnostics: (tabId: number): DiagnosticsByPreview | undefined => {
      const state = tabs.get(tabId);
      return state ? Object.fromEntries(state.diagnostics) : undefined;
    },
    /**
     * A PNG of part of the tab, at `clip.scale` times its CSS size: a preview's
     * screen at its device's pixel ratio, drawn again rather than enlarged, and
     * whether or not the window shows all of it. With `still`, animations pause for the capture.
     * `beyond` lays the page out past the window for the capture; only needed when the area extends past it.
     */
    capture: async (tabId: number, clip: CaptureClip & { scale: number }, still = false, beyond = true) => {
      if (!tabs.has(tabId)) throw new Error("The debugger is not attached to this tab.");
      const target = { tabId };
      if (still) { await quiet(api.send(target, "Animation.enable")); await quiet(api.send(target, "Animation.setPlaybackRate", { playbackRate: 0 })); }
      try {
        const { data } = await api.send(target, "Page.captureScreenshot", { format: "png", clip, fromSurface: true, captureBeyondViewport: beyond }) as { data: string };
        return `data:image/png;base64,${data}`;
      } finally {
        if (still) await quiet(api.send(target, "Animation.setPlaybackRate", { playbackRate: 1 }));
      }
    },
    /** The CSS rule behind a layout problem: the element `selector` finds inside the preview frame named `frameName`. */
    layoutCause: async (tabId: number, frameName: string, selector: string): Promise<LayoutCause | null> => {
      const state = tabs.get(tabId);
      if (!state) return null;
      // The newest frame with that name: a recreated preview leaves its old frame behind until it is detached.
      const frameId = [...state.frames].reverse().find(([id, frame]) => frame.preview === frameName && previewFor(state, id)?.frameId === id)?.[0];
      if (!frameId) return null;
      // A preview on another site runs in a child session, whose document is the preview's own.
      const session = [...state.roots].find(([key, root]) => key && root === frameId)?.[0] ?? "";
      const target = { tabId, sessionId: session || undefined };
      await api.send(target, "DOM.enable");
      try {
        await api.send(target, "CSS.enable");
        const { root } = await api.send(target, "DOM.getDocument", { depth: -1, pierce: true }) as { root: DomNode };
        const find = (node: DomNode): DomNode | undefined => {
          if (node.frameId === frameId && node.contentDocument) return node.contentDocument;
          for (const child of [...node.children ?? [], ...node.shadowRoots ?? []]) { const found = find(child); if (found) return found; }
          return undefined;
        };
        const document = session ? root : find(root);
        if (!document) return null;
        const { nodeId } = await api.send(target, "DOM.querySelector", { nodeId: document.nodeId, selector }) as { nodeId: number };
        if (!nodeId) return null;
        const matched = await api.send(target, "CSS.getMatchedStylesForNode", { nodeId }) as MatchedStyles;
        return pickLayoutCause(matched, id => state.styleSheets.get(`${session}:${id}`));
      } finally {
        await quiet(api.send(target, "CSS.disable"));
        await quiet(api.send(target, "DOM.disable"));
      }
    },
    /** A new worker holds no sessions, so any left from the last one are released rather than left pausing requests. */
    prune: () => serial(async () => {
      for (const tabId of await api.attachedTabs()) if (!tabs.has(tabId)) await quiet(api.detach(tabId));
    }),
  };
}

export function chromeDebuggerApi(): DebuggerApi {
  const target = (source: chrome.debugger.Debuggee & { sessionId?: string }): DebuggerTarget => ({ tabId: source.tabId ?? -1, sessionId: source.sessionId });
  return {
    attach: (tabId) => chrome.debugger.attach({ tabId }, "1.3"),
    detach: (tabId) => chrome.debugger.detach({ tabId }),
    send: (target, method, params) => chrome.debugger.sendCommand(target, method, params as Record<string, unknown> | undefined),
    onEvent: (listener) => chrome.debugger.onEvent.addListener((source, method, params) => listener(target(source), method, params)),
    onDetach: (listener) => chrome.debugger.onDetach.addListener((source, reason) => listener(target(source), reason)),
    attachedTabs: async () => (await chrome.debugger.getTargets()).flatMap(info => info.attached && typeof info.tabId === "number" ? [info.tabId] : []),
  };
}
