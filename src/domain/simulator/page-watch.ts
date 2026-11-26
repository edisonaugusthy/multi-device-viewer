/** Notices when a local site was rebuilt, so its previews can reload.
 * It asks for each page and the stylesheets and scripts that page names. A
 * file is compared by what the server says about it (ETag, Last-Modified) or,
 * without those, by its content. A page counts by its own content only when
 * it is a file on disk (it has a Last-Modified date): a page the server writes
 * for each request also changes with a cart, a login or a clock, so that kind
 * is followed through the files it names and whether it answers at all.
 * Only local development addresses are ever asked.
 */
import { isLocalDevelopmentUrl } from "./local-site";

export interface WatchResponse {
  /** 0 when there is none to read, such as a redirect, which is not followed. */
  status: number;
  etag: string | null;
  modified: string | null;
  text: () => Promise<string>;
  /** Called when the body is not needed, so it is not downloaded. */
  discard?: () => void;
}
export type WatchRequest = (url: string, options: { page: boolean; etag?: string; modified?: string }) => Promise<WatchResponse>;

const MAX_RESOURCES = 40;
/** A date this new can stay the same through another write: the content is compared too. */
const RECENT_MS = 2000;
/** A file that differs on this many checks in a row changes on every request, not by a build. */
const RESTLESS_CHECKS = 5;
/** Unchanged checks after which such a file is believed again, and shown. */
const TRUST_CHECKS = 10;
/** A page the server writes for each request is asked for this seldom. */
const WRITTEN_PAGE_EVERY = 10;
/** A file read in full is asked for less often the larger it is: one check skipped per this many characters. */
const BODY_PER_CHECK = 250_000;
const MOST_SKIPPED_CHECKS = 10;

const withoutHash = (value: string) => { const url = new URL(value); url.hash = ""; return url.href; };
/** One file under any query: a version or a timestamp added to its address is still that file.
 * Files a page tells apart by query alone (`css.php?f=a`, `css.php?f=b`) stay separate.
 */
function fileKeys(resources: string[]): string[] {
  const paths = resources.map(resource => { const url = new URL(resource); return url.origin + url.pathname; });
  return resources.map((resource, index) => `file ${paths.indexOf(paths[index]) === paths.lastIndexOf(paths[index]) ? paths[index] : resource}`);
}
/** A proxy with no server behind it yet: nothing is known, and nothing is shown. */
const NOT_READY = new Set([502, 503, 504]);

function withoutComments(html: string): string {
  let text = "";
  for (let from = 0; ;) {
    const start = html.indexOf("<!--", from);
    if (start < 0) return text + html.slice(from);
    text += html.slice(from, start);
    const end = html.indexOf("-->", start + 4);
    if (end < 0) return text;
    from = end + 3;
  }
}

const decode = (value: string) => value.replace(/&(?:amp|#38|#x26);/gi, "&");

function attributes(source: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const [, name, double, single, bare] of source.matchAll(/([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>][^\s>]*)))?/g)) {
    if (!found.has(name.toLowerCase())) found.set(name.toLowerCase(), decode(double ?? single ?? bare ?? ""));
  }
  return found;
}

/** Each link, script and base tag, read to its end in one pass: a quote opens a value only after "=". */
function tags(html: string) {
  const found: { name: string; attribute: Map<string, string> }[] = [];
  const opener = /<(link|script|base)(?=[\s/>])/gi;
  for (let match; (match = opener.exec(html));) {
    let index = opener.lastIndex, quote = "", value = false;
    for (; index < html.length; index++) {
      const char = html[index];
      if (quote) { if (char === quote) quote = ""; }
      else if (value && (char === '"' || char === "'")) quote = char;
      else if (char === ">") break;
      if (!/\s/.test(char)) value = char === "=";
    }
    // Never closed: the rest of the page is inside it.
    if (index >= html.length) break;
    found.push({ name: match[1].toLowerCase(), attribute: attributes(html.slice(opener.lastIndex, index)) });
    opener.lastIndex = index + 1;
  }
  return found;
}

/** The page's own stylesheets and scripts: what a build usually rewrites. */
export function pageResources(html: string, pageUrl: string): string[] {
  const all = tags(withoutComments(html));
  let base = pageUrl;
  try { base = new URL(all.find(tag => tag.name === "base" && tag.attribute.get("href"))?.attribute.get("href") ?? pageUrl, pageUrl).href; } catch { /* an unusual base: the page's own URL */ }
  const origin = new URL(pageUrl).origin;
  const found = new Set<string>();
  for (const { name, attribute } of all) {
    if (name === "base" || (name === "link" && !/(?:^|\s)stylesheet(?:\s|$)/i.test(attribute.get("rel") ?? ""))) continue;
    const value = attribute.get(name === "link" ? "href" : "src");
    if (!value) continue;
    try {
      const url = new URL(value, base);
      if (url.origin === origin) found.add(withoutHash(url.href));
    } catch { /* not a URL */ }
    if (found.size >= MAX_RESOURCES) break;
  }
  return [...found];
}

function hash(text: string): string {
  let value = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) value = Math.imul(value ^ text.charCodeAt(index), 0x01000193);
  return `${text.length}:${value >>> 0}`;
}

interface Seen {
  /** What the server says about the file, or that it did not serve it. */
  stamp: string;
  /** Its content, when that was read. */
  content?: string;
  etag?: string;
  modified?: string;
  /** Whether the next request may be answered "not modified". */
  conditional: boolean;
  /** A page: the files it names, and what each is known by. */
  resources: string[];
  keys: string[];
  /** A page is compared by its own content (0) or, written for each request, by the files it names (1). */
  base: number;
  /** Steps past `base` it was moved for changing by itself; at 2 it is not compared. */
  demoted: number;
  /** Checks in a row on which it differed, and on which it did not. */
  streak: number;
  calm: number;
  /** Checks to skip before asking again. */
  wait: number;
}
type Result = "same" | "changed" | "unknown";

const served = (file: Seen) => !file.stamp.startsWith("status:");
function differs(before: Seen, after: Seen, level: number, page: boolean): boolean {
  if (level === 0) return before.stamp !== after.stamp || (before.content !== undefined && after.content !== undefined && before.content !== after.content);
  // Whether it is served at all, and which files it names.
  if (level === 1 && page) return (served(before) ? before.keys.join("\n") : before.stamp) !== (served(after) ? after.keys.join("\n") : after.stamp);
  return false;
}

export function createPageWatch(request: WatchRequest, now: () => number = Date.now) {
  const seen = new Map<string, Seen>();
  const changed = new Set<string>();

  async function read(key: string, url: string, page: boolean): Promise<Result> {
    const before = seen.get(key);
    let after: Seen;
    try {
      const response = await request(url, { page, ...(before?.conditional && { etag: before.etag, modified: before.modified }) });
      const ok = response.status >= 200 && response.status <= 299;
      const etag = response.etag ?? undefined, modified = response.modified ?? undefined;
      const recent = !etag && modified !== undefined && Math.abs(now() - Date.parse(modified)) < RECENT_MS;
      const needed = ok && (page || !(etag || modified) || recent);
      const body = needed ? await response.text() : undefined;
      if (!needed) response.discard?.();
      if (NOT_READY.has(response.status) || (response.status === 304 && !before)) return "unknown";
      if (response.status === 304 && before) {
        after = { ...before, wait: page && before.base === 1 ? WRITTEN_PAGE_EVERY - 1 : 0 };
      } else {
        const resources = page && body !== undefined ? pageResources(body, url) : [];
        const base = !page ? 0 : ok ? (modified ? 0 : 1) : before?.base ?? 0;
        after = {
          stamp: ok ? `${etag ?? ""}\n${modified ?? ""}` : `status:${response.status}`, content: body === undefined ? undefined : hash(body),
          etag, modified, conditional: ok && Boolean(etag || modified) && !recent,
          resources, keys: fileKeys(resources), base,
          demoted: before?.demoted ?? 0, streak: before?.streak ?? 0, calm: before?.calm ?? 0,
          wait: Math.max(page && ok && base === 1 ? WRITTEN_PAGE_EVERY - 1 : 0, recent ? 0 : Math.min(MOST_SKIPPED_CHECKS, Math.floor((body?.length ?? 0) / BODY_PER_CHECK))),
        };
      }
    } catch { return "unknown"; }
    seen.set(key, after);
    // The first answer is where watching starts.
    if (!before) return "same";
    after.calm = differs(before, after, after.base, page) ? 0 : before.calm + 1;
    if (!differs(before, after, after.base + after.demoted, page)) {
      after.streak = 0;
      if (!after.demoted || after.calm < TRUST_CHECKS) return "same";
      // It has settled: it was a long build after all, and is shown now.
      after.demoted = 0;
      return "changed";
    }
    if (++after.streak >= RESTLESS_CHECKS) {
      // A token or a new date on every request is not a build.
      Object.assign(after, { demoted: after.demoted + 1, streak: 0 });
      changed.delete(key);
      return "same";
    }
    // Asked again on the next check, however large, to see that it has stopped changing.
    after.wait = 0;
    return "changed";
  }

  let down = false;
  return {
    /** Whether a change was seen and is waiting for the files to stop changing. */
    get pending() { return changed.size > 0; },
    /** Whether no page answered on the last check: the server is not running. */
    get down() { return down; },
    /**
     * Checks the pages once. Resolves true when files changed and have now
     * stayed the same for one check, so a build still writing is not shown half done.
     */
    async check(pages: string[]): Promise<boolean> {
      const targets = [...new Set(pages.filter(isLocalDevelopmentUrl).map(withoutHash))];
      const reads = new Map<string, Promise<Result>>();
      const visit = (key: string, url: string, page: boolean) => {
        let result = reads.get(key);
        if (!result) {
          const known = seen.get(key);
          if (known && known.wait > 0) { known.wait--; result = Promise.resolve("same"); }
          else result = read(key, url, page);
          reads.set(key, result);
        }
        return result;
      };
      let reachable = true, answered = 0;
      await Promise.all(targets.map(async target => {
        const known = seen.has(target);
        const page = seen.get(target);
        if (await visit(target, target, true) === "unknown") {
          // A page that never answered (a wrong address) does not hold the others back.
          if (known) reachable = false;
          // Its files are on the same server: kept, and not asked for until it answers.
          page?.keys.forEach(key => reads.set(key, reads.get(key) ?? Promise.resolve("same")));
          return;
        }
        answered++;
        const now = seen.get(target);
        const results = await Promise.all((now?.resources ?? []).map((resource, index) => visit(now!.keys[index], resource, false)));
        // A file it names changed or went away: see at once whether it names others now.
        if (now && results.includes("changed")) now.wait = 0;
      }));
      down = targets.length > 0 && answered === 0;
      let moving = false;
      for (const [key, result] of reads) if (await result === "changed") { changed.add(key); moving = true; }
      for (const key of [...seen.keys()]) if (!reads.has(key)) { seen.delete(key); changed.delete(key); }
      if (moving || !reachable || !changed.size) return false;
      changed.clear();
      return true;
    },
  };
}
