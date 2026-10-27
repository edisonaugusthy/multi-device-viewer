// npm run build && npm run test:extension
// Real Chrome extension test: one existing login, three direct frames, each its
// own device through the extension's debugger: headers on documents, APIs,
// assets, workers, nested and cross-site frames, and navigator in the page's
// scripts, while the website's pages run unmodified. CDP below is test
// automation for the viewer's closed shadow root, never extension code.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const extension = fileURLToPath(new URL("../.output/chrome-mv3", import.meta.url));
const manifest = JSON.parse(await readFile(join(extension, "manifest.json"), "utf8"));
assert(manifest.permissions.includes("debugger") && !manifest.optional_permissions?.includes("debugger"), "debugger is a required permission");
const requests = [];
let apiOrigin;
let tracked = 0;
const handler = async (req, res) => {
  const body = await Array.fromAsync(req).then(chunks => Buffer.concat(chunks).toString());
  const path = new URL(req.url, "http://localhost").pathname;
  const seen = { url: req.url, method: req.method, body, contentType: req.headers["content-type"], ua: req.headers["user-agent"], cookie: req.headers.cookie ?? "", dest: req.headers["sec-fetch-dest"], custom: req.headers["x-probe"], mobile: req.headers["sec-ch-ua-mobile"], platform: req.headers["sec-ch-ua-platform"], model: req.headers["sec-ch-ua-model"], formFactors: req.headers["sec-ch-ua-form-factors"], language: req.headers["accept-language"], dpr: req.headers["sec-ch-dpr"] };
  requests.push(seen);
  const headers = { "cache-control": "no-store" };
  if (req.headers.origin) Object.assign(headers, { "access-control-allow-origin": req.headers.origin, "access-control-allow-credentials": "true", "access-control-allow-headers": "x-probe,content-type", "access-control-allow-methods": "GET,POST,OPTIONS" });
  if (req.method === "OPTIONS") { res.writeHead(204, headers); res.end(); return; }
  if (path.startsWith("/api")) { res.writeHead(200, { ...headers, "content-type": "application/json" }); res.end(JSON.stringify(seen)); return; }
  if (path === "/redirect" || path === "/redirect-hash") { res.writeHead(302, { ...headers, location: path === "/redirect" ? "/landed" : "/landed#/server-route" }); res.end(); return; }
  if (path === "/missing-api") { res.writeHead(404, { ...headers, "content-type": "application/json" }); res.end('{"error":"not here"}'); return; }
  if (path === "/problems") { res.writeHead(200, { ...headers, "content-type": "text/html" }); res.end('<!doctype html><title>Problems</title><h1>Problems</h1><script>fetch("/missing-api");setTimeout(()=>{throw new TypeError("smoke boom")},50);</script>'); return; }
  if (path === "/wide") { res.writeHead(200, { ...headers, "content-type": "text/html" }); res.end('<!doctype html><title>Wide</title><style>body{margin:0}.wide{width:900px;height:40px;background:#c33}.tall{height:2400px}</style><div class="wide"></div><div class="tall"></div>'); return; }
  if (path === "/tracked") { tracked++; res.writeHead(200, { ...headers, "content-type": "text/html" }); res.end(`<!doctype html><title>Tracked</title><style>body{margin:0;font-family:sans-serif}h1{font-size:${tracked % 2 ? 44 : 36}px;margin:20px}</style><h1 class="hero">Tracked page</h1><p>Body text</p>`); return; }
  if (path === "/nested") { res.writeHead(200, { ...headers, "content-type": "text/html" }); res.end('<!doctype html><title>Nested</title><img src="/asset.svg?nested">'); return; }
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
    // A 2× window, like most laptops: captures must still come out at each device's own pixel ratio.
    channel: "chromium", headless: true, viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2,
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
    const result = await frame.evaluate(async () => ({
      document: window.documentProbe, fetch: window.fetchProbe, xhr: window.xhrProbe, cross: await window.crossProbe, storage: window.storageProbe,
      ua: navigator.userAgent, platform: navigator.platform, touch: navigator.maxTouchPoints, hasUaData: "userAgentData" in navigator,
      uaData: navigator.userAgentData && { mobile: navigator.userAgentData.mobile, platform: navigator.userAgentData.platform, ...await navigator.userAgentData.getHighEntropyValues(["model", "formFactors"]) },
    }));
    for (const kind of ["document", "fetch", "xhr", "cross"]) { assert.match(result[kind].ua, pattern, `${id} ${kind} UA`); checkLogin(result[kind]); }
    assert.deepEqual(result.storage, { local: "logged-in", session: "logged-in", hash: "" });
    assert.match(result.ua, pattern, `${id} scripts see the device`);
    if (id === "pixel") {
      for (const kind of ["document", "fetch"]) { assert.equal(result[kind].mobile, "?1"); assert.equal(result[kind].platform, '"Android"'); assert.equal(result[kind].model, '"Pixel 8"'); assert.equal(result[kind].formFactors, '"Mobile"'); }
      assert.deepEqual(result.uaData, { mobile: true, platform: "Android", brands: result.uaData.brands, model: "Pixel 8", formFactors: ["Mobile"] });
      assert.equal(result.platform, "Linux armv81"); assert.equal(result.touch, 5);
    } else {
      assert.equal(result.fetch.mobile, undefined); assert.equal(result.fetch.platform, undefined); assert.equal(result.fetch.model, undefined);
      assert.equal(result.hasUaData, false, `${id} is Safari, without userAgentData`);
      assert.deepEqual([result.platform, result.touch], id === "phone" ? ["iPhone", 5] : ["MacIntel", 0]);
    }
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
  assert.equal(await page.evaluate(() => navigator.userAgent), browserAgent, "the page's own scripts keep the browser's identity");

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
    assert.match(result.fetch.ua, /iPhone/); assert.match(result.xhr.ua, /iPhone/); assert.match(await phone.evaluate(() => navigator.userAgent), /iPhone/);
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
  await visit(() => phone.evaluate(() => document.querySelector("#redirect-hash").click())); await checkPhone();
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
  assert.match(foreignPost.ua, /iPhone/, "foreign Requests get device headers"); assert.equal(foreignPost.body, "foreign body");
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
  assert.match(workerResult.ua, /iPhone/, "dedicated worker traffic gets device headers");
  assert.equal(await phone.evaluate(() => window.fetch.toString().includes("[native code]") && XMLHttpRequest.prototype.open.toString().includes("[native code]") && window.Request.toString().includes("[native code]") && history.pushState.toString().includes("[native code]")), true, "the website's fetch, XHR, Request and history stay native");
  const assets = requests.filter(r => r.url === "/asset.svg");
  assert.equal(assets[0].ua, browserAgent, "the page's own assets keep the browser's identity");
  for (const [id, , pattern] of devices) assert(assets.some(r => pattern.test(r.ua)), `${id} assets get device headers`);
  const nestedFrom = requests.length;
  await phone.evaluate(() => new Promise(resolve => { const frame = document.createElement("iframe"); frame.src = "/nested"; frame.onload = resolve; document.body.append(frame); }));
  for (let i = 0; i < 50 && !requests.slice(nestedFrom).some(r => r.url === "/asset.svg?nested"); i++) await page.waitForTimeout(100);
  const nested = requests.slice(nestedFrom).filter(r => r.url === "/nested" || r.url === "/asset.svg?nested");
  assert.equal(nested.length, 2); for (const r of nested) { assert.match(r.ua, /iPhone/, `nested frame ${r.url}`); checkLogin(r); }
  await phone.evaluate(async () => await fetch(new Request("/api-request-post", { method: "POST", body: "native fallback" })));
  await assertNoCoverageLabels();
  // Problems: the debugger reports this preview's script error and failed request to the viewer.
  const viewerNodes = async (predicate) => {
    const { root } = await cdp.send("DOM.getDocument", { depth: -1, pierce: true });
    const found = [];
    const walk = node => { if (predicate(node)) found.push(node); for (const child of [...node.children ?? [], ...node.shadowRoots ?? [], ...(node.contentDocument ? [node.contentDocument] : [])]) walk(child); };
    walk(root);
    return found;
  };
  const attr = (node, name) => { const a = node.attributes ?? []; const i = a.indexOf(name); return i >= 0 ? a[i + 1] : undefined; };
  const textOf = async node => (await cdp.send("Runtime.callFunctionOn", { objectId: (await cdp.send("DOM.resolveNode", { backendNodeId: node.backendNodeId })).object.objectId, functionDeclaration: "function () { return this.textContent; }", returnByValue: true })).result.value;
  const clickNode = async node => cdp.send("Runtime.callFunctionOn", { objectId: (await cdp.send("DOM.resolveNode", { backendNodeId: node.backendNodeId })).object.objectId, functionDeclaration: "function () { this.click(); }" });
  await Promise.all([phone.waitForNavigation(), phone.evaluate(() => location.assign("/problems"))]);
  let chips = [];
  for (let i = 0; i < 50 && chips.length === 0; i++) { await page.waitForTimeout(100); chips = await viewerNodes(node => attr(node, "data-problems-chip") !== undefined); }
  assert.equal(chips.length, 1, "only the phone shows a problems chip");
  // The error and the failed request can arrive one after the other.
  for (let i = 0; i < 30 && !/2 problems/.test(await textOf(chips[0])); i++) await page.waitForTimeout(100);
  assert.match(await textOf(chips[0]), /2 problems/);
  await clickNode(chips[0]);
  let panelText = "";
  for (let i = 0; i < 30 && !panelText.includes("smoke boom"); i++) { await page.waitForTimeout(100); const [panel] = await viewerNodes(node => attr(node, "data-problems-panel") !== undefined); panelText = panel ? await textOf(panel) : ""; }
  assert.match(panelText, /TypeError: smoke boom/, "script error listed");
  assert.match(panelText, /GET \/missing-api/, "failed request listed");
  assert.match(panelText, /404/);
  const [toggle] = await viewerNodes(node => attr(node, "data-problems-toggle") !== undefined);
  await clickNode(toggle);
  await visit(() => phone.evaluate(() => location.assign("/")));
  for (let i = 0; i < 30 && (await viewerNodes(node => attr(node, "data-problems-chip") !== undefined)).length; i++) await page.waitForTimeout(100);
  assert.equal((await viewerNodes(node => attr(node, "data-problems-chip") !== undefined)).length, 0, "a new page starts without problems");
  // Conditions: the page inside a preview sees the emulated color scheme and time zone; the header's × turns them off.
  const one = async (name, value) => { const [node] = await viewerNodes(n => attr(n, name) !== undefined && (value === undefined || attr(n, name) === value)); assert(node, `${name} ${value ?? ""}`); return node; };
  await clickNode(await one("data-conditions-toggle"));
  await clickNode(await one("data-preset", "dark"));
  const zone = await one("data-timezone");
  await cdp.send("Runtime.callFunctionOn", { objectId: (await cdp.send("DOM.resolveNode", { backendNodeId: zone.backendNodeId })).object.objectId,
    functionDeclaration: "function () { Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(this, 'Asia/Tokyo'); this.dispatchEvent(new Event('change', { bubbles: true })); }" });
  const seen = () => phone.evaluate(() => ({ dark: matchMedia("(prefers-color-scheme: dark)").matches, zone: Intl.DateTimeFormat().resolvedOptions().timeZone }));
  let conditionsSeen;
  for (let i = 0; i < 30; i++) { conditionsSeen = await seen(); if (conditionsSeen.dark && conditionsSeen.zone === "Asia/Tokyo") break; await page.waitForTimeout(100); }
  assert.deepEqual(conditionsSeen, { dark: true, zone: "Asia/Tokyo" }, "preview sees the conditions");
  assert.equal(attr(await one("data-conditions-toggle"), "data-conditions-on"), "", "the header icon shows conditions are on");
  const viewerTheme = async () => { const [shell] = await viewerNodes(n => (attr(n, "class") ?? "").includes("bg-stage")); return (attr(shell, "class") ?? "").split(" ").includes("dark") ? "dark" : "light"; };
  assert.equal(await viewerTheme(), "light", "the Dark condition darkens the previews, not the viewer");
  // Turn all off sits at the top of the open menu.
  await mkdir("output/playwright", { recursive: true });
  await page.screenshot({ path: "output/playwright/conditions-on.png" });
  await clickNode(await one("data-conditions-off"));
  for (let i = 0; i < 30; i++) { conditionsSeen = await seen(); if (!conditionsSeen.dark && conditionsSeen.zone !== "Asia/Tokyo") break; await page.waitForTimeout(100); }
  assert.equal(conditionsSeen.dark, false, "× turns the color scheme off");
  assert.notEqual(conditionsSeen.zone, "Asia/Tokyo", "× turns the time zone off");
  assert.equal(attr(await one("data-conditions-toggle"), "data-conditions-on"), undefined, "the header icon is plain again");
  await page.keyboard.press("Escape");
  // Language: one device asks for German and states its screen density; its scripts read the language too.
  const inSlot = async (slotId, name, text) => {
    const { root } = await cdp.send("DOM.getDocument", { depth: -1, pierce: true });
    const found = [];
    const walk = (node, inside) => {
      const here = inside || attr(node, "data-preview-slot-id") === slotId;
      if (here && attr(node, name) !== undefined) found.push(node);
      for (const child of [...node.children ?? [], ...node.shadowRoots ?? []]) walk(child, here);
    };
    walk(root, false);
    if (text === undefined) return found[0];
    for (const node of found) if ((await textOf(node)).includes(text)) return node;
    return undefined;
  };
  const radio = async (text) => {
    const nodes = await viewerNodes(node => node.nodeName === "BUTTON" && attr(node, "role") === "radio");
    for (const node of nodes) if ((await textOf(node)).includes(text)) return node;
  };
  await clickNode(await inSlot("phone", "data-language-toggle"));
  await Promise.all([phone.waitForNavigation(), clickNode(await radio("Deutsch"))]);
  await phone.waitForFunction(() => window.fetchProbe && window.xhrProbe);
  const german = await phone.evaluate(() => ({ document: window.documentProbe, fetch: window.fetchProbe, language: navigator.language, languages: navigator.languages }));
  assert.equal(german.document.language, "de-DE,de;q=0.9", "document asks for German");
  assert.equal(german.fetch.language, "de-DE,de;q=0.9", "fetch asks for German");
  assert.equal(german.document.dpr, "3", "screen density sent");
  assert.deepEqual([german.language, german.languages], ["de-DE", ["de-DE", "de"]]);
  assert.notEqual((await frameFor("pixel").evaluate(() => window.fetchProbe)).language, "de-DE,de;q=0.9", "other devices keep their language");
  await clickNode(await inSlot("phone", "data-language-chip"));
  await clickNode(await one("data-compare-identities"));
  let identityText = "";
  for (let i = 0; i < 20 && !identityText; i++) { await page.waitForTimeout(100); const [table] = await viewerNodes(node => attr(node, "data-identity-table") !== undefined); identityText = table ? await textOf(table) : ""; }
  assert.match(identityText, /Safari \d+/); assert.match(identityText, /de-DE/); assert.match(identityText, /Pixel 8/);
  await page.keyboard.press("Escape");
  await clickNode(await inSlot("phone", "data-language-toggle"));
  await Promise.all([phone.waitForNavigation(), clickNode(await radio("Browser"))]);
  await phone.waitForFunction(() => window.fetchProbe && window.xhrProbe);
  assert.notEqual((await phone.evaluate(() => window.documentProbe)).language, "de-DE,de;q=0.9", "back to the browser's language");
  // Download size: each preview's downloaded bytes and request count.
  await clickNode(await one("data-problems-toggle"));
  const [sizeTab] = await Promise.all([(async () => { for (const node of await viewerNodes(n => attr(n, "role") === "tab")) if ((await textOf(node)).includes("Download size")) return node; })()]);
  assert(sizeTab, "Download size tab");
  await clickNode(sizeTab);
  let sizeText = "";
  for (let i = 0; i < 20 && !/downloaded/.test(sizeText); i++) { await page.waitForTimeout(100); const [panel] = await viewerNodes(node => attr(node, "data-problems-panel") !== undefined); sizeText = panel ? await textOf(panel) : ""; }
  assert.match(sizeText, /[\d.,]+\s?(B|KB|MB) downloaded · \d+ requests?/, "download size per device");
  await clickNode(await one("data-problems-toggle"));
  // Layout check: the CSS rule behind the overflow, with its file and line, goes into the fix prompt.
  await Promise.all([phone.waitForNavigation(), phone.evaluate(() => location.assign("/wide"))]);
  await clickNode(await one("data-layout-check-toggle"));
  let causeText = "";
  for (let i = 0; i < 80 && !causeText; i++) { await page.waitForTimeout(100); const [cause] = await viewerNodes(node => attr(node, "data-layout-cause") !== undefined); causeText = cause ? await textOf(cause) : ""; }
  assert.match(causeText, /Caused by/); assert.match(causeText, /\.wide \{ width: 900px; \}/, "the rule that sets the width");
  await mkdir("output/playwright", { recursive: true });
  await page.screenshot({ path: "output/playwright/layout-cause.png" });
  await clickNode(await one("data-layout-fix"));
  let previewButton;
  for (let i = 0; i < 20 && !previewButton; i++) { await page.waitForTimeout(100); for (const node of await viewerNodes(n => n.nodeName === "BUTTON" && attr(n, "aria-expanded") === "false")) if ((await textOf(node)).trim() === "Preview") previewButton = node; }
  assert(previewButton, "fix prompt preview");
  await clickNode(previewButton);
  let promptText = "";
  for (let i = 0; i < 20 && !promptText.includes("Caused by"); i++) { await page.waitForTimeout(100); const [pre] = await viewerNodes(node => node.nodeName === "PRE"); promptText = pre ? await textOf(pre) : ""; }
  assert.match(promptText, /Caused by \.wide \{ width: 900px; \}/, "fix prompt names the rule");
  await page.keyboard.press("Escape");
  await clickNode(await one("data-layout-check-toggle"));
  // Captures: drawn at the device's pixel ratio through the debugger, the whole page stitched, every device zipped.
  await worker.evaluate(() => { globalThis.smokeDownloads = []; chrome.downloads.download = async options => { globalThis.smokeDownloads.push(options); return 1; }; });
  const nextDownload = async () => {
    for (let i = 0; i < 150; i++) { const [item] = await worker.evaluate(() => globalThis.smokeDownloads.splice(0)); if (item) return item; await page.waitForTimeout(100); }
    throw new Error("no download");
  };
  const pngSize = url => { const bytes = Buffer.from(url.split(",")[1], "base64"); return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }; };
  const phoneSize = await phone.evaluate(() => ({ width: innerWidth, height: innerHeight, page: document.documentElement.scrollHeight }));
  await clickNode(await one("data-capture-toggle"));
  await page.waitForTimeout(150);
  await page.screenshot({ path: "output/playwright/capture-menu.png" });
  await clickNode(await one("data-capture-visible"));
  const visible = await nextDownload();
  assert.match(visible.url, /^data:image\/png;base64,/); assert.match(visible.filename, /\.png$/);
  const visibleSize = pngSize(visible.url);
  assert(Math.abs(visibleSize.width - phoneSize.width * 3) <= 3 && Math.abs(visibleSize.height - phoneSize.height * 3) <= 3, `visible part at 3×: ${JSON.stringify(visibleSize)} for ${JSON.stringify(phoneSize)}`);
  await clickNode(await one("data-capture-toggle"));
  await clickNode(await one("data-capture-page"));
  const whole = pngSize((await nextDownload()).url);
  assert(Math.abs(whole.width - phoneSize.width * 3) <= 3 && Math.abs(whole.height - phoneSize.page * 3) <= 3, `whole page at 3×: ${JSON.stringify(whole)} for ${JSON.stringify(phoneSize)}`);
  assert.equal(await phone.evaluate(() => scrollY), 0, "the page is scrolled back after a whole-page capture");
  await clickNode(await one("data-capture-toggle"));
  await clickNode(await one("data-capture-all"));
  const zip = await nextDownload();
  assert.match(zip.url, /^data:application\/zip;base64,/); assert.match(zip.filename, /\.zip$/);
  const zipBytes = Buffer.from(zip.url.split(",")[1], "base64");
  const zipNames = []; for (let at = zipBytes.readUInt32LE(zipBytes.length - 22 + 16); zipBytes.readUInt32LE(at) === 0x02014b50; at += 46 + zipBytes.readUInt16LE(at + 28) + zipBytes.readUInt16LE(at + 30) + zipBytes.readUInt16LE(at + 32)) zipNames.push(zipBytes.toString("utf8", at + 46, at + 46 + zipBytes.readUInt16LE(at + 28)));
  assert.equal(zipBytes.readUInt16LE(zipBytes.length - 22 + 10), 3, `one picture per device in the zip: ${zipNames.join(", ")}`);
  // Track changes: the first load is watched, a reload that changes the page lists the change in CSS terms.
  await Promise.all([phone.waitForNavigation(), phone.evaluate(() => location.assign("/tracked"))]);
  // The switch lives in the camera menu; while it is on, the camera shows a dot.
  const captureMenuOpen = async () => (await viewerNodes(n => attr(n, "data-capture-menu") !== undefined)).length > 0;
  const flipTracking = async (shot) => {
    if (!await captureMenuOpen()) await clickNode(await one("data-capture-toggle"));
    let toggle;
    for (let i = 0; i < 20 && !toggle; i++) { [toggle] = await viewerNodes(n => attr(n, "role") === "switch" && attr(n, "aria-label") === "Track changes"); if (!toggle) await page.waitForTimeout(100); }
    assert(toggle, "Track changes switch in the capture menu");
    await clickNode(toggle);
    await page.waitForTimeout(100);
    if (shot) await page.screenshot({ path: shot });
    // Keys go to the focused preview, so close the menu with its own button.
    await clickNode(await one("data-capture-toggle"));
    for (let i = 0; i < 20 && await captureMenuOpen(); i++) await page.waitForTimeout(50);
  };

  await flipTracking("output/playwright/track-switch.png");
  assert.equal((await viewerNodes(n => attr(n, "data-track-dot") !== undefined)).length, 1, "the camera shows Track changes is on");
  const trackChip = async (want) => { for (let i = 0; i < 100; i++) { const node = await inSlot("phone", "data-track-chip"); if (node && want(attr(node, "data-track-chip"))) return node; await page.waitForTimeout(100); } throw new Error("track chip"); };
  await trackChip(value => value === "0");
  await Promise.all([phone.waitForNavigation(), phone.evaluate(() => location.reload())]);
  const changed = await trackChip(value => Number(value) > 0);
  assert.match(await textOf(changed), /changes?/);
  await page.screenshot({ path: "output/playwright/track-chips.png" });
  await clickNode(changed);
  let changesText = "";
  for (let i = 0; i < 20 && !changesText; i++) { await page.waitForTimeout(100); const [list] = await viewerNodes(node => attr(node, "data-track-changes") !== undefined); changesText = list ? await textOf(list) : ""; }
  assert.match(changesText, /h1\.hero/); assert.match(changesText, /Font size 44 → 36 px/, "the change in CSS terms");
  await page.screenshot({ path: "output/playwright/what-changed.png" });
  await clickNode(await one("data-track-pin"));
  await page.keyboard.press("Escape");
  await flipTracking();
  assert.equal((await viewerNodes(n => attr(n, "data-track-dot") !== undefined)).length, 0, "the dot goes away when Track changes is off");
  // Another site runs in its own process; the extension reaches it through a child session.
  const crossSite = apiOrigin.replace("127.0.0.1", "localhost");
  const crossFrom = requests.length;
  await phone.evaluate(url => location.assign(url + "/cross-site"), crossSite);
  for (let i = 0; i < 100 && !(["/asset.svg", "/api-xhr"].every(url => requests.slice(crossFrom).some(r => r.url === url))); i++) await page.waitForTimeout(100);
  assert((await cdp.send("Target.getTargets")).targetInfos.some(t => t.type === "iframe" && t.url.startsWith(crossSite)), "cross-site preview runs in its own process");
  const crossRequests = requests.slice(crossFrom).filter(r => ["/cross-site", "/asset.svg", "/api-fetch", "/api-xhr"].includes(r.url));
  assert.equal(crossRequests.length, 4, "cross-site preview loaded");
  for (const r of crossRequests) assert.match(r.ua, /iPhone/, `cross-site ${r.url}`);
  const crossFrame = previews().find(frame => frame.url().startsWith(crossSite));
  assert.match(await crossFrame.evaluate(() => navigator.userAgent), /iPhone/, "cross-site scripts see the device");
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
  assert.deepEqual(errors.filter(message => message !== "smoke boom"), [], "no page errors besides the one thrown on purpose");
  console.log("Extension smoke passed: 3 direct devices, shared Strict/Lax/partitioned login + storage, distinct document/fetch/XHR/cross-origin API headers, Request bodies/clones/multipart/credentials, script navigation, SPA/cancellation, links, forms, history/reloads, redirects, foreign Requests, assets, workers, nested and cross-site frames, full client hints and navigator per device through the debugger, problems, download size, conditions, per-device language, layout cause, captures at device pixel ratio (visible, whole page, .zip), track changes, native page APIs, no coverage labels, cleanup, standalone fallback.");
} finally {
  await context?.close();
  await Promise.all([new Promise(resolve => server.close(resolve)), new Promise(resolve => apiServer.close(resolve))]);
  await rm(profile, { recursive: true, force: true });
}
