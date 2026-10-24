// npm run build && npm run test:extension
// Real Chrome extension test: one existing login, three direct frames, per-device
// document/API headers and an honest partial-coverage disclosure. CDP below is
// only test automation for the viewer's closed shadow root, never extension code.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const extension = fileURLToPath(new URL("../.output/chrome-mv3", import.meta.url));
const manifest = JSON.parse(await readFile(join(extension, "manifest.json"), "utf8"));
assert(![...manifest.permissions ?? [], ...manifest.optional_permissions ?? []].includes("debugger"));
const requests = [];
let apiOrigin;
const handler = async (req, res) => {
  const body = await Array.fromAsync(req).then(chunks => Buffer.concat(chunks).toString());
  const path = new URL(req.url, "http://localhost").pathname;
  const seen = { url: req.url, method: req.method, body, contentType: req.headers["content-type"], ua: req.headers["user-agent"], cookie: req.headers.cookie ?? "", dest: req.headers["sec-fetch-dest"], custom: req.headers["x-probe"], mobile: req.headers["sec-ch-ua-mobile"], platform: req.headers["sec-ch-ua-platform"] };
  requests.push(seen);
  const headers = { "cache-control": "no-store" };
  if (req.headers.origin) Object.assign(headers, { "access-control-allow-origin": req.headers.origin, "access-control-allow-credentials": "true", "access-control-allow-headers": "x-probe,content-type", "access-control-allow-methods": "GET,POST,OPTIONS" });
  if (req.method === "OPTIONS") { res.writeHead(204, headers); res.end(); return; }
  if (path.startsWith("/api")) { res.writeHead(200, { ...headers, "content-type": "application/json" }); res.end(JSON.stringify(seen)); return; }
  if (path === "/redirect" || path === "/redirect-hash") { res.writeHead(302, { ...headers, location: path === "/redirect" ? "/landed" : "/landed#/server-route" }); res.end(); return; }
  if (path === "/asset.svg") { res.writeHead(200, { ...headers, "content-type": "image/svg+xml" }); res.end('<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"/>'); return; }
  if (path === "/worker.js") { res.writeHead(200, { ...headers, "content-type": "text/javascript" }); res.end('fetch("/api-worker").then(r=>r.json()).then(r=>postMessage(r));'); return; }
  if (path === "/seed") headers["set-cookie"] = ["mdvStrict=logged-in; HttpOnly; SameSite=Strict; Path=/", "mdvLax=logged-in; HttpOnly; SameSite=Lax; Path=/", "mdvNone=logged-in; HttpOnly; SameSite=None; Secure; Path=/", "mdvPartitioned=logged-in; HttpOnly; SameSite=None; Secure; Partitioned; Path=/"];
  res.writeHead(200, { ...headers, "content-type": "text/html" });
  res.end(`<!doctype html><title>Shared session fixture</title><h1>Shared session fixture</h1>
    <a href="/linked#/route">Link</a><a id="redirect" href="/redirect">Redirect</a><a id="redirect-hash" href="/redirect-hash">Redirect replacing hash</a>
    <form action="/form-get" method="get"><input name="query" value="hello world"><button>Search</button></form>
    <form id="post" action="/form-post" method="post"><input name="payload" value="keep me"><button name="save" value="yes">Save</button></form>
    <img src="/asset.svg"><script>
    ${path === "/seed" ? 'localStorage.setItem("mdv-probe","logged-in");sessionStorage.setItem("mdv-probe","logged-in");' : ''}
    window.documentProbe=${JSON.stringify(seen)};
    window.storageProbe={local:localStorage.getItem("mdv-probe"),session:sessionStorage.getItem("mdv-probe"),hash:location.hash};
    fetch("/api-fetch").then(r=>r.json()).then(r=>window.fetchProbe=r);
    const xhr=new XMLHttpRequest();xhr.open("GET","/api-xhr");xhr.onload=()=>window.xhrProbe=JSON.parse(xhr.responseText);xhr.send();
    window.crossProbe=fetch(${JSON.stringify(apiOrigin + "/api-cross")},{credentials:"include"}).then(r=>r.json());
    </script>`);
};
const server = createServer(handler), apiServer = createServer(handler);
await Promise.all([new Promise(resolve => server.listen(0, "127.0.0.1", resolve)), new Promise(resolve => apiServer.listen(0, "127.0.0.1", resolve))]);
const origin = `http://127.0.0.1:${server.address().port}`;
apiOrigin = `http://127.0.0.1:${apiServer.address().port}`;
const pageUrl = origin + "/seed";
const profile = await mkdtemp(join(tmpdir(), "mdv-smoke-"));
let context;
try {
  context = await chromium.launchPersistentContext(profile, {
    channel: "chromium", headless: true, viewport: { width: 1440, height: 1000 },
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });
  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent("serviceworker");
  const extensionOrigin = worker.url().split("/").slice(0, 3).join("/");
  const errors = [];
  const page = await context.newPage();
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(pageUrl);
  await page.waitForFunction(() => window.fetchProbe && window.xhrProbe);
  const browserAgent = await page.evaluate(() => navigator.userAgent);
  const devices = [["phone", "apple-iphone-18-pro-2026", /iPhone/], ["pixel", "google-pixel-8", /Android.*Mobile/], ["mac", "apple-macbook-pro-14-m5-2025", /Macintosh.*Version\/.*Safari/]];
  await worker.evaluate(async ({ url, devices }) => {
    const slot = ([id, deviceId]) => ({ id, deviceId, url, orientation: "portrait", zoom: 0.58, zoomMode: "fit", reloadToken: 0, showFrame: true });
    await chrome.storage.local.set({ mdvLastSeenTour: "0.4.0", mdvLastSeenReleaseVersion: chrome.runtime.getManifest().version, mdvSimulatorSession: { slots: devices.map(slot), activeSlotId: "phone", display: { scrollSync: false, navigationSync: false, darkMode: false, previewStyle: "device" } } });
    const [tab] = await chrome.tabs.query({ url });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content-scripts/content.js"] });
    const reply = await chrome.tabs.sendMessage(tab.id, { type: "OPEN_SIMULATOR", url, sourceTabId: tab.id });
    if (!reply?.ok) throw new Error(`Viewer did not open: ${reply?.error ?? "no reply"}`);
  }, { url: pageUrl, devices: devices.map(([id, device]) => [id, device]) });
  await page.locator("#multi-device-viewer-overlay").waitFor({ state: "attached" });
  const previews = () => page.frames().filter(frame => frame !== page.mainFrame() && /mdv-(?:mobile-)?preview-/.test(frame.name()));
  await page.waitForFunction(() => document.querySelector("#multi-device-viewer-overlay") != null);
  for (let i = 0; i < 100 && previews().filter(frame => frame.url().startsWith(origin)).length < 3; i++) await page.waitForTimeout(100);
  assert.equal(previews().length, 3, "three side-by-side frames");
  assert.equal(context.pages().length, 2, "no device tabs (only browser's initial blank tab and source tab)");
  const checkLogin = result => { for (const name of ["mdvStrict", "mdvLax", "mdvNone", "mdvPartitioned"]) assert(result.cookie.includes(`${name}=logged-in`), `${name} missing on ${result.url}`); };
  const frameFor = id => previews().find(frame => frame.name().endsWith(`-${id}`));
  for (const [id, , pattern] of devices) {
    const frame = frameFor(id);
    assert.equal(frame.parentFrame(), page.mainFrame(), "direct frame shares top-level site context");
    await frame.waitForFunction(() => window.fetchProbe && window.xhrProbe);
    const result = await frame.evaluate(async () => ({ document: window.documentProbe, fetch: window.fetchProbe, xhr: window.xhrProbe, cross: await window.crossProbe, storage: window.storageProbe, ua: navigator.userAgent }));
    for (const kind of ["document", "fetch", "xhr", "cross"]) { assert.match(result[kind].ua, pattern, `${id} ${kind} UA`); checkLogin(result[kind]); }
    assert.deepEqual(result.storage, { local: "logged-in", session: "logged-in", hash: "" });
    assert.equal(result.ua, browserAgent, "JS identity remains honest Chrome");
    if (id === "pixel") { assert.equal(result.fetch.mobile, "?1"); assert.equal(result.fetch.platform, '"Android"'); }
    else { assert.equal(result.fetch.mobile, undefined); assert.equal(result.fetch.platform, undefined); }
    const post = await frame.evaluate(async () => {
      return await (await fetch("/api-post", { method: "POST", body: "preserve body", headers: { "x-probe": "retained" }, credentials: "include" })).json();
    });
    assert.match(post.ua, pattern); checkLogin(post); assert.equal(post.method, "POST"); assert.equal(post.body, "preserve body"); assert.equal(post.custom, "retained");
    const requestBodies = await frame.evaluate(async () => {
      const text = new Request("/api-request-body", { method: "POST", body: "original bytes", credentials: "include", headers: { "x-probe": "kept" }, keepalive: true });
      const clone = text.clone();
      const publicUrls = [text.url, clone.url];
      const original = await (await fetch(text)).json();
      const copied = await (await fetch(clone, { headers: { "x-probe": "override" } })).json();
      const form = new FormData(); form.append("field", "one"); form.append("field", "two"); form.append("file", new File(["file bytes"], "probe.txt", { type: "text/plain" }));
      const formRequest = new Request("/api-request-form", { method: "POST", body: form });
      const multipart = await (await fetch(new Request(formRequest))).json();
      const omitted = await (await fetch(new Request("/api-request-omit", { method: "POST", body: new Blob(["blob bytes"]), credentials: "omit" }))).json();
      return { original, copied, multipart, omitted, publicUrls, used: text.bodyUsed && clone.bodyUsed && formRequest.bodyUsed, instance: text instanceof Request && text.constructor === Request };
    });
    for (const result of [requestBodies.original, requestBodies.copied, requestBodies.multipart, requestBodies.omitted]) assert.match(result.ua, pattern);
    checkLogin(requestBodies.original); checkLogin(requestBodies.multipart);
    assert.equal(requestBodies.original.body, "original bytes"); assert.equal(requestBodies.original.custom, "kept");
    assert.equal(requestBodies.copied.body, "original bytes"); assert.equal(requestBodies.copied.custom, "override");
    assert(requestBodies.used && requestBodies.instance);
    assert(requestBodies.publicUrls.every(url => url === origin + "/api-request-body"), "Request URLs hide transport markers, including clones");
    const boundary = requestBodies.multipart.contentType.split("boundary=")[1];
    assert(requestBodies.multipart.body.includes(`--${boundary}`) && requestBodies.multipart.body.includes("file bytes") && requestBodies.multipart.body.includes('name="field"'));
    assert.equal(requestBodies.omitted.body, "blob bytes"); assert.equal(requestBodies.omitted.cookie, "");

  }
  assert.equal((await page.evaluate(() => window.fetchProbe)).ua, browserAgent, "top-level API identity unchanged");

  // Device previews no longer render the extra header-coverage disclosure.
  const cdp = await context.newCDPSession(page);
  const assertNoCoverageLabels = async () => {
    const { root } = await cdp.send("DOM.getDocument", { depth: -1, pierce: true });
    const nodes = [];
    const walk = node => { if (node.attributes?.includes("data-header-coverage")) nodes.push(node.backendNodeId); for (const child of [...node.children ?? [], ...node.shadowRoots ?? []]) walk(child); };
    walk(root);
    assert.equal(nodes.length, 0, "no extra header-coverage labels on device previews");
  };
  await assertNoCoverageLabels();
  const clickViewerReload = async () => {
    const { root } = await cdp.send("DOM.getDocument", { depth: -1, pierce: true });
    let button;
    const walk = (node, phone = false) => {
      const attrs = node.attributes ?? [];
      const here = phone || (attrs.includes("data-preview-slot-id") && attrs[attrs.indexOf("data-preview-slot-id") + 1] === "phone");
      if (here && node.nodeName === "BUTTON" && attrs.includes("aria-label") && attrs[attrs.indexOf("aria-label") + 1] === "Reload preview") button = node.backendNodeId;
      for (const child of [...node.children ?? [], ...node.shadowRoots ?? []]) walk(child, here);
    };
    walk(root); assert(button, "viewer reload button");
    const { object } = await cdp.send("DOM.resolveNode", { backendNodeId: button });
    await cdp.send("Runtime.callFunctionOn", { objectId: object.objectId, functionDeclaration: "function () { this.click(); }" });
  };
  let phone = frameFor("phone");
  const visit = async action => { await Promise.all([phone.waitForNavigation(), action()]); await phone.waitForFunction(() => window.fetchProbe && window.xhrProbe); };
  const checkPhone = async (documentTagged = true) => {
    const result = await phone.evaluate(() => ({ document: window.documentProbe, fetch: window.fetchProbe, xhr: window.xhrProbe, hash: location.hash }));
    checkLogin(result.document); checkLogin(result.fetch);
    assert.match(result.fetch.ua, /iPhone/); assert.match(result.xhr.ua, /iPhone/);
    assert(documentTagged ? /iPhone/.test(result.document.ua) : result.document.ua === browserAgent, "document header coverage");
    return result;
  };
  await visit(() => phone.evaluate(() => document.querySelector("a").click()));
  assert.equal((await checkPhone()).hash, "#/route", "hash routes are preserved");
  await visit(() => phone.evaluate(() => location.reload())); await checkPhone();
  await visit(() => phone.evaluate(() => document.querySelector("form").requestSubmit()));
  assert.equal((await checkPhone()).document.url, "/form-get?query=hello+world");
  await visit(() => phone.evaluate(() => document.querySelector("#post").requestSubmit(document.querySelector("#post button"))));
  const formPost = (await checkPhone()).document;
  assert.equal(formPost.method, "POST"); assert.equal(formPost.body, "payload=keep+me&save=yes");
  assert.equal(requests.filter(r => r.url === "/form-post").length, 1, "POST never replayed");
  await visit(() => phone.evaluate(() => document.querySelector("#redirect").click())); await checkPhone();
  await visit(() => phone.evaluate(() => document.querySelector("#redirect-hash").click())); await checkPhone(false);
  await visit(() => phone.evaluate(() => { location.href = "/script-navigation"; })); await checkPhone();
  assert.equal(requests.filter(r => r.url === "/script-navigation").length, 1, "script navigation never replayed");
  await visit(() => phone.evaluate(() => location.assign("/script-assign#/route"))); assert.equal((await checkPhone()).hash, "#/route");
  const historyBefore = await phone.evaluate(() => history.length);
  await visit(() => phone.evaluate(() => location.replace("/script-replace"))); await checkPhone();
  assert.equal(await phone.evaluate(() => history.length), historyBefore, "replace navigation does not add history");
  await visit(() => phone.evaluate(() => { location.assign("/superseded"); location.assign("/winner"); })); await checkPhone();
  assert(!requests.some(r => r.url === "/superseded"), "only the last queued navigation runs");
  await visit(() => phone.evaluate(() => { navigation.navigate("/navigation-document", { state: { retained: 42 }, history: "replace" }); })); await checkPhone();
  // Native Navigation API state is intentionally ignored for cross-document navigation.
  assert.equal(await phone.evaluate(() => navigation.currentEntry.getState()), undefined);
  const spa = await phone.evaluate(async () => {
    const seen = [];
    const router = event => {
      if (!new URL(event.destination.url).pathname.startsWith("/spa-")) return;
      seen.push({ url: event.destination.url, info: event.info });
      event.intercept({ handler: async () => {} });
    };
    navigation.addEventListener("navigate", router);
    const result = navigation.navigate("/spa-api#/dashboard", { state: { retained: 42 }, info: "kept" });
    await Promise.all([result.committed, result.finished]);
    const state = navigation.currentEntry.getState();
    const locationNavigation = new Promise(resolve => navigation.addEventListener("navigatesuccess", resolve, { once: true }));
    location.assign("/spa-location#/settings");
    await locationNavigation;
    navigation.removeEventListener("navigate", router);
    const current = location.href;
    navigation.onnavigate = event => { if (event.destination.url.endsWith("/cancelled")) event.preventDefault(); };
    location.assign("/cancelled");
    await Promise.resolve();
    navigation.onnavigate = null;
    const unchanged = location.href === current;
    let invalid;
    try { const failed = navigation.navigate("https://["); await Promise.all([failed.committed, failed.finished]); } catch (error) { invalid = error.name; }
    return { seen, state, current, unchanged, invalid };
  });
  assert.equal(spa.state.retained, 42); assert.equal(spa.seen[0].info, "kept");
  assert.equal(spa.seen[0].url, origin + "/spa-api#/dashboard");
  assert.equal(spa.current, origin + "/spa-location#/settings"); assert(spa.unchanged); assert.equal(spa.invalid, "SyntaxError");
  assert(!requests.some(r => ["/spa-api", "/spa-location", "/cancelled"].includes(r.url)), "SPA routing and cancelled navigation never become document requests");

  await visit(() => phone.evaluate(url => location.assign(url + "/cross-document"), apiOrigin)); await checkPhone();
  await visit(() => phone.evaluate(url => location.replace(url + "/returned"), origin)); await checkPhone();
  const requestPost = await phone.evaluate(async () => await (await fetch(new Request("/api-request-post", { method: "POST", body: "native Request body" }))).json());
  assert.match(requestPost.ua, /iPhone/); assert.equal(requestPost.body, "native Request body");
  const foreignPost = await phone.evaluate(async () => await (await fetch(new parent.Request(new URL("/api-foreign", location.href), { method: "POST", body: "foreign body" }))).json());
  assert.equal(foreignPost.ua, browserAgent); assert.equal(foreignPost.body, "foreign body");
  await assertNoCoverageLabels();
  const abort = await phone.evaluate(async () => { const controller = new AbortController(); controller.abort(); try { await fetch("/api-aborted", { signal: controller.signal }); return "sent"; } catch (error) { return error.name; } });
  assert.equal(abort, "AbortError"); assert(!requests.some(r => r.url === "/api-aborted"));
  const changedHistory = await phone.evaluate(() => {
    history.pushState({ push: true }, "", "/history-push#/spa");
    const push = { href: location.href, state: history.state };
    history.replaceState({ probe: true }, "", "/history-route#/spa");
    return { push, href: location.href, state: history.state };
  });
  assert.equal(changedHistory.push.href, origin + "/history-push#/spa"); assert(changedHistory.push.state.push);
  assert.equal(changedHistory.href, origin + "/history-route#/spa"); assert(changedHistory.state.probe);
  await visit(() => phone.evaluate(() => location.reload())); await checkPhone();
  const beforeReload = requests.length;
  await clickViewerReload();
  for (let i = 0; i < 100 && !requests.slice(beforeReload).some(r => r.dest === "iframe"); i++) await page.waitForTimeout(100);
  phone = frameFor("phone");
  await phone.waitForFunction(() => window.fetchProbe && window.xhrProbe);
  await checkPhone();
  assert.equal(requests.slice(beforeReload).filter(r => r.dest === "iframe").length, 1, "viewer reload waits for header rules and fetches once");
  const getRequest = await phone.evaluate(async () => await (await fetch(new Request("/api-request-get"))).json());
  assert.match(getRequest.ua, /iPhone/);
  const xhrPost = await phone.evaluate(() => new Promise(resolve => { const xhr = new XMLHttpRequest(); xhr.open("POST", "/api-xhr-post"); xhr.onload = () => resolve(JSON.parse(xhr.responseText)); xhr.send("xhr body"); }));
  assert.match(xhrPost.ua, /iPhone/); assert.equal(xhrPost.body, "xhr body");
  await phone.evaluate(() => localStorage.setItem("mdv-shared-update", "fresh"));
  assert.equal(await frameFor("pixel").evaluate(() => localStorage.getItem("mdv-shared-update")), "fresh");
  const workerResult = await phone.evaluate(() => new Promise(resolve => { const worker = new Worker("/worker.js"); worker.onmessage = event => { resolve(event.data); worker.terminate(); }; }));
  assert.equal(workerResult.ua, browserAgent, "worker traffic is explicitly uncovered");
  assert(requests.filter(r => r.url === "/asset.svg").every(r => r.ua === browserAgent), "native assets remain uncovered");
  await phone.evaluate(async () => await fetch(new Request("/api-request-post", { method: "POST", body: "native fallback" })));
  await assertNoCoverageLabels();
  await mkdir("output/playwright", { recursive: true });
  await page.screenshot({ path: "output/playwright/shared-session-headers.png" });

  await worker.evaluate(async url => { const [tab] = await chrome.tabs.query({ url }); await chrome.tabs.sendMessage(tab.id, { type: "OPEN_SIMULATOR", url, sourceTabId: tab.id }); }, pageUrl);
  await page.locator("#multi-device-viewer-overlay").waitFor({ state: "detached" });
  const remaining = await worker.evaluate(async url => { const [tab] = await chrome.tabs.query({ url }); return (await chrome.declarativeNetRequest.getSessionRules()).filter(rule => rule.condition.tabIds?.includes(tab.id)); }, pageUrl);
  assert.deepEqual(remaining, [], "closing viewer removes its rules");
  // Standalone simulator is still usable, but cannot promise the website tab's session.
  const simulator = await context.newPage();
  await simulator.goto(`${extensionOrigin}/simulator.html?url=${encodeURIComponent(pageUrl)}`);
  await simulator.locator("[data-preview-slot-id]").first().waitFor();
  assert.equal(await simulator.locator("[data-header-coverage]").count(), 0);
  assert.deepEqual(errors, []);
  console.log("Extension smoke passed: 3 direct devices, shared Strict/Lax/partitioned login + storage, distinct document/fetch/XHR/cross-origin API headers, Request bodies/clones/multipart/credentials, script navigation, SPA/cancellation, links, forms, history/reloads, redirects, uncovered foreign Requests/assets/workers, no coverage labels, cleanup, standalone fallback; no debugger permission.");
} finally {
  await context?.close();
  await Promise.all([new Promise(resolve => server.close(resolve)), new Promise(resolve => apiServer.close(resolve))]);
  await rm(profile, { recursive: true, force: true });
}
