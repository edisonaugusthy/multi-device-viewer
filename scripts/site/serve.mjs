// Serve dist-site/ the way GitHub Pages does: clean URLs, folder index.html, 404.html.
//   node scripts/site/serve.mjs [port]
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { site } from "../../website/src/config.mjs";

const root = "dist-site";
const port = Number(process.argv[2] ?? process.env.PORT ?? 4321);
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json" };

async function resolve(pathname) {
  const file = normalize(join(root, decodeURIComponent(pathname))).replace(/\/$/, "");
  if (!file.startsWith(root)) return null;
  const info = await stat(file).catch(() => null);
  if (info?.isDirectory()) return (await stat(join(file, "index.html")).catch(() => null)) ? join(file, "index.html") : null;
  if (info?.isFile()) return file;
  return (await stat(file + ".html").catch(() => null)) ? file + ".html" : null;
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  if (!pathname.startsWith(site.base)) { res.writeHead(302, { location: site.base }); return res.end(); }
  const rel = "/" + pathname.slice(site.base.length);
  if (rel !== "/" && !rel.endsWith("/") && !extname(rel) && (await stat(join(root, rel)).catch(() => null))?.isDirectory()) {
    res.writeHead(301, { location: pathname + "/" }); return res.end();
  }
  const file = await resolve(rel);
  const body = await readFile(file ?? join(root, "404.html"));
  res.writeHead(file ? 200 : 404, { "content-type": types[extname(file ?? ".html")] ?? "application/octet-stream", "cache-control": "no-cache" });
  res.end(body);
}).listen(port, () => console.log(`Site: http://localhost:${port}${site.base}`));
