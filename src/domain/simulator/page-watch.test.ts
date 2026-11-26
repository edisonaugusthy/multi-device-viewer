import { describe, expect, it } from "vitest";
import { createPageWatch, pageResources, type WatchRequest } from "./page-watch";

type Source<T> = T | (() => T);
interface File { body: Source<string>; etag?: Source<string>; modified?: string; status?: number }
const longAgo = "Thu, 01 Jan 2026 00:00:00 GMT";
/** A site whose files can be rewritten between checks, and every request made to it. */
function server(files: Record<string, File>) {
  const requests: string[] = [];
  const value = <T,>(source: Source<T> | undefined) => typeof source === "function" ? (source as () => T)() : source;
  const request: WatchRequest = async (url, { etag: sentEtag, modified: sentModified }) => {
    const { pathname, search } = new URL(url);
    requests.push(pathname + search);
    const file = files[pathname];
    if (!file) return { status: 404, etag: null, modified: null, text: async () => "Not found" };
    const etag = value(file.etag) ?? null;
    const unchanged = (etag !== null && sentEtag === etag) || (file.modified !== undefined && sentModified === file.modified);
    if (file.status !== undefined) return { status: file.status, etag: null, modified: null, text: async () => value(file.body)! };
    return { status: unchanged ? 304 : 200, etag, modified: file.modified ?? null, text: async () => value(file.body)! };
  };
  return { request, requests, files, asked: (path: string) => requests.filter(url => url === path).length };
}
const page = "http://localhost:3000/";
const html = '<link rel="stylesheet" href="/site.css"><script src="app.js"></script>';
/** A static site: every file is on disk with a date. */
const built = () => server({ "/": { body: html, modified: longAgo }, "/site.css": { body: "a{}", etag: '"1"' }, "/app.js": { body: "one()" } });
const checks = async (watch: ReturnType<typeof createPageWatch>, pages: string[], count: number) => {
  const results: boolean[] = [];
  for (let check = 0; check < count; check++) results.push(await watch.check(pages));
  return results;
};

describe("the files a page names", () => {
  it("lists its own stylesheets and scripts once, resolved against the page or its base", () => {
    expect(pageResources(`<link rel="stylesheet" href="css/site.css?v=1&amp;m=2">
      <LINK href='/print.css' rel='alternate stylesheet'><link rel="icon" href="/favicon.ico"><link rel=stylesheet href=plain.css>
      <script src="/app.js#part"></script><script src="/app.js"></script><script>inline()</script>
      <!-- <script src="/commented.js"></script> -->
      <script src="https://cdn.example.com/lib.js"></script><script type="module" src="./main.js"></script>`, "http://localhost:3000/docs/page.html"))
      .toEqual(["http://localhost:3000/docs/css/site.css?v=1&m=2", "http://localhost:3000/print.css", "http://localhost:3000/docs/plain.css",
        "http://localhost:3000/app.js", "http://localhost:3000/docs/main.js"]);
    expect(pageResources('<base href="/assets/"><script src="app.js"></script>', page)).toEqual(["http://localhost:3000/assets/app.js"]);
  });
  it("reads attributes the way a browser does", () => {
    expect(pageResources(`<link rel="stylesheet"href="/tight.css"><script/src="/slash.js"></script>
      <link title="x href=/wrong.css" rel="stylesheet" href="/titled.css"><script data-note="a > b" src="/after-angle.js"></script>
      <script data-src="/lazy.js" src="/real.js"></script><link rel="stylesheet" href="/q.css?a=1&#38;b=2">
      <link-card href="/card.css" rel="stylesheet"></link-card><link rel="mystylesheet" href="/other.css">
      <script
        src="/multiline.js"
        defer></script><link rel=stylesheet href=/bare.css?v=1><script title=Bob's src=/apostrophe.js></script>`, page).map(url => url.slice(page.length - 1)))
      .toEqual(["/tight.css", "/slash.js", "/titled.css", "/after-angle.js", "/real.js", "/q.css?a=1&b=2", "/multiline.js", "/bare.css?v=1", "/apostrophe.js"]);
  });
  it("stops at forty files and at a comment that never ends", () => {
    const many = Array.from({ length: 60 }, (_, index) => `<script src="/chunk-${index}.js"></script>`).join("");
    expect(pageResources(many, page)).toHaveLength(40);
    expect(pageResources(`<script src="/a.js"></script><!-- <script src="/b.js"></script>`, page)).toEqual(["http://localhost:3000/a.js"]);
    expect(pageResources(`<script src="/a.js"></script><link rel="stylesheet" href='/never-closed.css <script src="/b.js"></script>`, page)).toEqual(["http://localhost:3000/a.js"]);
    // Unusual pages are still read in one pass.
    const started = performance.now();
    for (const piece of ["<!--", "<script ", `<link title="a" href='`]) pageResources(piece.repeat(100_000), page);
    expect(performance.now() - started).toBeLessThan(1000);
  });
});

describe("watching a built site", () => {
  it("reports a rewritten file once it has stopped changing, and not again", async () => {
    const site = built();
    const watch = createPageWatch(site.request);
    expect(await checks(watch, [page, `${page}#section`], 2)).toEqual([false, false]);
    expect(site.requests.slice(0, 3)).toEqual(["/", "/site.css", "/app.js"]);
    expect(site.requests).toHaveLength(6);

    site.files["/site.css"].etag = '"2"';
    expect(await watch.check([page])).toBe(false);
    expect(watch.pending).toBe(true);
    // The build is still writing: wait for a check with nothing new.
    site.files["/app.js"].body = "two()";
    expect(await watch.check([page])).toBe(false);
    expect(await watch.check([page])).toBe(true);
    expect(watch.pending).toBe(false);
    expect(await watch.check([page])).toBe(false);
  });

  it("notices a page that changed, and one that now names a different file", async () => {
    const site = server({ "/": { body: '<h1>One</h1><script src="/app.1a.js"></script>', modified: longAgo }, "/app.1a.js": { body: "", etag: "a" }, "/app.2b.js": { body: "", etag: "b" } });
    const watch = createPageWatch(site.request);
    await watch.check([page]);
    Object.assign(site.files["/"], { body: '<h1>Two</h1><script src="/app.1a.js"></script>', modified: "Fri, 02 Jan 2026 00:00:00 GMT" });
    expect(await checks(watch, [page], 2)).toEqual([false, true]);
    Object.assign(site.files["/"], { body: '<h1>Two</h1><script src="/app.2b.js"></script>', modified: "Sat, 03 Jan 2026 00:00:00 GMT" });
    expect(await checks(watch, [page], 2)).toEqual([false, true]);
    expect(site.requests.at(-1)).toBe("/app.2b.js");
  });

  it("sees a second write within the same second", async () => {
    const written = Date.parse("Mon, 05 Jan 2026 10:00:00 GMT");
    let clock = written + 300;
    const site = server({ "/": { body: html, modified: longAgo }, "/site.css": { body: "a{}", modified: new Date(written).toUTCString() }, "/app.js": { body: "", etag: "1" } });
    const watch = createPageWatch(site.request, () => clock);
    await watch.check([page]);
    site.files["/site.css"].body = "b{}";
    expect(await checks(watch, [page], 2)).toEqual([false, true]);
    // Once the date is old enough to be trusted, the file is not downloaded again.
    clock = written + 5000;
    expect(await checks(watch, [page], 3)).toEqual([false, false, false]);
  });

  it("shows a page or a file that starts being served", async () => {
    const site = server({ "/": { body: '<script src="/app.9f.js"></script>', modified: longAgo } });
    const watch = createPageWatch(site.request);
    // The page was written before the script it names.
    expect(await checks(watch, [page, `${page}new`], 2)).toEqual([false, false]);
    site.files["/app.9f.js"] = { body: "", etag: "1" };
    expect(await checks(watch, [page, `${page}new`], 2)).toEqual([false, true]);
    site.files["/new"] = { body: "<h1>New</h1>", modified: longAgo };
    expect(await checks(watch, [page, `${page}new`], 2)).toEqual([false, true]);
    site.files["/new"].status = 500;
    expect(await checks(watch, [page, `${page}new`], 2)).toEqual([false, true]);
  });

  it("waits while the server is down, then reports what changed", async () => {
    const site = built();
    const down: WatchRequest = async () => { throw new TypeError("Failed to fetch"); };
    let up = true;
    const watch = createPageWatch((url, options) => up ? site.request(url, options) : down(url, options));
    await watch.check([page]);
    site.files["/site.css"].etag = '"2"';
    expect(await watch.check([page])).toBe(false);
    up = false;
    const asked = site.requests.length;
    expect(await checks(watch, [page], 3)).toEqual([false, false, false]);
    expect(watch.pending).toBe(true);
    expect(watch.down).toBe(true);
    // Its files are on the same server: they are not asked for until the page answers.
    expect(site.requests).toHaveLength(asked);
    up = true;
    expect(await watch.check([page])).toBe(true);
    expect(watch.down).toBe(false);
  });

  it("waits out a proxy whose server is restarting instead of showing its error page", async () => {
    const site = built();
    const watch = createPageWatch(site.request);
    await watch.check([page]);
    for (const status of [502, 503, 504]) {
      site.files["/"].status = status;
      expect(await checks(watch, [page], 2)).toEqual([false, false]);
    }
    delete site.files["/"].status;
    expect(await checks(watch, [page], 2)).toEqual([false, false]);
    // A page that is really broken or gone is shown.
    site.files["/"].status = 500;
    expect(await checks(watch, [page], 2)).toEqual([false, true]);
  });

  it("is not held back by a page it could never read", async () => {
    const site = built();
    const watch = createPageWatch(async (url, options) => {
      if (new URL(url).port === "4000") throw new TypeError("Failed to fetch");
      return site.request(url, options);
    });
    const pages = [page, "http://localhost:4000/other-origin"];
    await watch.check(pages);
    site.files["/site.css"].etag = '"2"';
    expect(await checks(watch, pages, 2)).toEqual([false, true]);
  });

  it("does not follow a redirect, and shows the page when the redirect ends", async () => {
    const site = server({ "/": { body: "", status: 0 }, "/site.css": { body: "a{}", etag: "1" }, "/app.js": { body: "" } });
    const watch = createPageWatch(site.request);
    expect(await checks(watch, [page], 2)).toEqual([false, false]);
    expect(site.requests).toEqual(["/", "/"]);
    site.files["/"] = { body: html, modified: longAgo };
    expect(await checks(watch, [page], 2)).toEqual([false, true]);
  });

  it("asks once for a file two pages share", async () => {
    const site = server({ "/": { body: html, modified: longAgo }, "/about": { body: html, modified: longAgo }, "/site.css": { body: "a{}", etag: "1" }, "/app.js": { body: "", etag: "1" } });
    const watch = createPageWatch(site.request);
    await watch.check([page, `${page}about`]);
    expect(site.asked("/site.css")).toBe(1);
    site.files["/site.css"].etag = "2";
    expect(await checks(watch, [page, `${page}about`], 2)).toEqual([false, true]);
  });

  it("starts fresh on a page it has not seen, and never asks a public site", async () => {
    const site = server({ "/": { body: html, modified: longAgo }, "/other": { body: "<h1>Other</h1>", modified: longAgo }, "/site.css": { body: "a{}" }, "/app.js": { body: "" } });
    const watch = createPageWatch(site.request);
    await watch.check([page]);
    expect(await checks(watch, [`${page}other`, "https://example.com/"], 2)).toEqual([false, false]);
    expect(site.requests.some(url => url.includes("example.com"))).toBe(false);
    // Back on the first page: what it was like before is forgotten, so nothing is reported.
    site.files["/site.css"].body = "b{}";
    expect(await checks(watch, [page], 2)).toEqual([false, false]);
  });
});

describe("watching a page the server writes for each request", () => {
  it("does not take its changing content for a build, but follows the files it names", async () => {
    let visits = 0;
    // A token in the page, and an ETag made from that content, as an application server sends.
    const site = server({ "/": { body: () => `${html}<input name="token" value="${++visits}"><p>${visits % 3 ? "cart: 1" : "cart: 2"}</p>`, etag: () => `W/"${visits}"` }, "/site.css": { body: "a{}" }, "/app.js": { body: "" } });
    const watch = createPageWatch(site.request);
    expect(await checks(watch, [page], 30)).not.toContain(true);
    expect(watch.pending).toBe(false);
    // The page itself is asked for seldom; its files on every check.
    expect(site.asked("/")).toBe(3);
    expect(site.asked("/site.css")).toBe(30);
    site.files["/site.css"].body = "b{}";
    expect(await checks(watch, [page], 2)).toEqual([false, true]);
  });

  it("asks seldom for a page whose ETag stays the same too", async () => {
    const site = server({ "/": { body: html, etag: 'W/"same"' }, "/site.css": { body: "a{}", etag: "1" }, "/app.js": { body: "", etag: "1" } });
    const watch = createPageWatch(site.request);
    await checks(watch, [page], 40);
    expect(site.asked("/")).toBe(4);
  });

  it("keeps files apart that differ only by their query, and follows each", async () => {
    let style = "a";
    const site = server({ "/": { body: '<link rel="stylesheet" href="/css.php?f=a"><link rel="stylesheet" href="/css.php?f=b"><script src="/?bundle"></script>' }, "/css.php": { body: () => style } });
    const sent: string[] = [];
    const watch = createPageWatch(async (url, options) => {
      sent.push(url.slice(page.length - 1));
      const { search } = new URL(url);
      // Only the second stylesheet is rebuilt.
      return search === "?f=b" ? { status: 200, etag: null, modified: null, text: async () => style } : site.request(url, options);
    });
    await watch.check([page]);
    expect(sent).toEqual(["/", "/css.php?f=a", "/css.php?f=b", "/?bundle"]);
    style = "b";
    expect(await checks(watch, [page], 2)).toEqual([false, true]);
  });

  it("looks at the page at once when a file it named is gone, and finds the new one", async () => {
    const site = server({ "/": { body: '<script src="/app.1a.js"></script>' }, "/app.1a.js": { body: "", etag: "a" } });
    const watch = createPageWatch(site.request);
    await checks(watch, [page], 2);
    delete site.files["/app.1a.js"];
    Object.assign(site.files, { "/": { body: '<script src="/app.2b.js"></script>' }, "/app.2b.js": { body: "", etag: "b" } });
    expect(await checks(watch, [page], 3)).toEqual([false, false, true]);
    expect(site.requests.at(-1)).toBe("/app.2b.js");
  });

  it("follows a file whose address carries a new timestamp on every request", async () => {
    let visits = 0;
    const site = server({ "/": { body: () => `<link rel="stylesheet" href="/site.css?t=${++visits}">` }, "/site.css": { body: "a{}", etag: "1" } });
    const watch = createPageWatch(site.request);
    expect(await checks(watch, [page], 25)).not.toContain(true);
    site.files["/site.css"].etag = "2";
    expect(await checks(watch, [page], 2)).toEqual([false, true]);
  });

  it("shows it when it stops or starts answering", async () => {
    const site = server({ "/": { body: html }, "/site.css": { body: "a{}" }, "/app.js": { body: "" } });
    const watch = createPageWatch(site.request);
    await watch.check([page]);
    site.files["/"].status = 500;
    expect(await checks(watch, [page], 11)).toEqual([...Array(9).fill(false), false, true]);
    delete site.files["/"].status;
    expect(await checks(watch, [page], 2)).toEqual([false, true]);
  });
});

describe("a file that changes on every request", () => {
  it("stops being counted, while other files are still followed", async () => {
    let asked = 0;
    const site = server({ "/": { body: html, modified: longAgo }, "/site.css": { body: "a{}", etag: () => `"${asked++}"` }, "/app.js": { body: "", etag: "1" } });
    const watch = createPageWatch(site.request);
    expect(await checks(watch, [page], 40)).not.toContain(true);
    expect(watch.pending).toBe(false);
    site.files["/app.js"].etag = "2";
    expect(await checks(watch, [page], 2)).toEqual([false, true]);
  });

  it("is believed again once it has rested, and the build it was writing is shown", async () => {
    let writes = 0;
    const site = server({ "/": { body: html, modified: longAgo }, "/site.css": { body: "a{}", etag: () => `"${writes}"` }, "/app.js": { body: "", etag: "1" } });
    const watch = createPageWatch(site.request);
    await watch.check([page]);
    // A large file written slowly: different on six checks in a row.
    for (let check = 0; check < 6; check++) { writes++; expect(await watch.check([page])).toBe(false); }
    expect(watch.pending).toBe(false);
    const results = await checks(watch, [page], 12);
    expect(results.filter(Boolean)).toHaveLength(1);
    // And the next build is seen as usual.
    writes++;
    expect(await checks(watch, [page], 2)).toEqual([false, true]);
  });

  it("shows every save, however quickly one follows another", async () => {
    const site = built();
    const watch = createPageWatch(site.request);
    await watch.check([page]);
    // Autosave while typing: a build every second check, forty times.
    for (let save = 2; save < 42; save++) {
      site.files["/site.css"].etag = `"${save}"`;
      expect(await checks(watch, [page], 2), `save ${save}`).toEqual([false, true]);
    }
    // And slower saves, with a rest between.
    for (let save = 42; save < 50; save++) {
      site.files["/app.js"].body = `build(${save})`;
      expect(await checks(watch, [page], 8).then(results => results.filter(Boolean)), `save ${save}`).toHaveLength(1);
    }
  });
});

describe("large files without a date", () => {
  it("are downloaded less often the larger they are", async () => {
    const site = server({ "/": { body: html, modified: longAgo }, "/site.css": { body: "a{}" }, "/app.js": { body: "x".repeat(1_000_000) } });
    const watch = createPageWatch(site.request);
    await checks(watch, [page], 10);
    expect(site.asked("/site.css")).toBe(10);
    expect(site.asked("/app.js")).toBe(2);
    site.files["/app.js"].body = "y".repeat(1_000_000);
    const before = site.asked("/app.js");
    const results = await checks(watch, [page], 6);
    // Once it has changed it is read again on the very next check, so a half-written file is not shown.
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(site.asked("/app.js") - before).toBe(2);
  });
});
