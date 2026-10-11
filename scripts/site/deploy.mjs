// Publishes the built site (dist-site/) to the gh-pages branch of origin as a
// single fresh commit. The site is built on the owner's machine because it
// needs the private device frames; GitHub Pages serves the gh-pages branch.
//
//   npm run deploy:site
import { execFileSync } from "node:child_process";
import { cp, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const site = join(root, "dist-site");
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }).trim();

const files = await readdir(site, { recursive: true }).catch(() => []);
if (!files.includes("index.html")) throw new Error("dist-site/ has no index.html. Run npm run build:site first.");
// The site may show rendered frames, never their sources or internal notes.
const leaked = files.filter((file) => /(?:^|\/)(?:internal|private-artwork)(?:\/|$)|device-art\.mjs$|frames\.json$|\.svg\.src$/.test(file));
if (leaked.length) throw new Error(`dist-site/ contains private files: ${leaked.join(", ")}`);

const remote = git(root, "remote", "get-url", "origin");
const source = git(root, "rev-parse", "--short", "HEAD");
const work = await mkdtemp(join(tmpdir(), "mdv-site-"));
try {
  await cp(site, work, { recursive: true });
  // Serve files as they are; Jekyll would skip paths that start with "_".
  await writeFile(join(work, ".nojekyll"), "");
  git(work, "init", "--quiet", "--initial-branch=gh-pages");
  git(work, "add", "--all");
  git(work, "commit", "--quiet", "--message", `Publish site from ${source}`);
  execFileSync("git", ["push", "--force", remote, "gh-pages"], { cwd: work, stdio: "inherit" });
  console.log("Published dist-site/ to gh-pages. GitHub Pages must serve the gh-pages branch (root).");
} finally {
  await rm(work, { recursive: true, force: true });
}
