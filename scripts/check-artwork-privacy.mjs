// Allow ignored internal authoring files, but reject public copies and Git-tracked
// originals, including outgoing history where a later commit deleted them.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const isPrivateArtworkPath = (path) => /^(?:scripts\/device-frames\/(?:device-art\.mjs|frames\.json)$|(?:public|website\/public)\/icons\/[^/]+\.svg$|store-assets\/source\/(?:store-listing-assets\.html$|captures\/)|public\/mockups\/|website\/public\/frames\/|private-artwork\/|internal\/)/.test(path);

const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });

export function workingTreeLeaks(cwd) {
  const files = ["scripts/device-frames/device-art.mjs", "scripts/device-frames/frames.json", "store-assets/source/store-listing-assets.html"];
  for (const directory of ["public/mockups", "website/public/frames", "public/icons", "website/public/icons", "store-assets/source/captures", "private-artwork"]) {
    if (existsSync(resolve(cwd, directory))) {
      for (const entry of readdirSync(resolve(cwd, directory), { recursive: true, withFileTypes: true })) {
        if (!entry.isDirectory()) {
          const parent = entry.parentPath ?? entry.path;
          files.push(resolve(parent, entry.name).slice(resolve(cwd).length + 1).replaceAll("\\", "/"));
        }
      }
    }
  }
  const publicCopies = files.filter((path) => isPrivateArtworkPath(path) && existsSync(resolve(cwd, path)));
  const trackedOriginals = git(cwd, ["ls-files", "-z"]).split("\0").filter(isPrivateArtworkPath);
  return [...new Set([...publicCopies, ...trackedOriginals])];
}

export function outgoingHistoryLeaks(cwd, localSha, remoteSha, remoteName) {
  if (/^0+$/.test(localSha)) return [];
  const range = [localSha];
  if (!/^0+$/.test(remoteSha)) range.push(`^${remoteSha}`);
  else if (remoteName) range.push("--not", `--remotes=${remoteName}`);
  return [...new Set(git(cwd, ["rev-list", "--objects", ...range]).trim().split("\n")
    .map((line) => line.slice(line.indexOf(" ") + 1)).filter(isPrivateArtworkPath))];
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const cwd = fileURLToPath(new URL("../", import.meta.url));
  const leaks = workingTreeLeaks(cwd);
  if (process.argv[2] === "--pre-push") {
    for (const line of readFileSync(0, "utf8").trim().split("\n").filter(Boolean)) {
      const [, localSha, , remoteSha] = line.split(/\s+/);
      leaks.push(...outgoingHistoryLeaks(cwd, localSha, remoteSha, process.argv[3]));
    }
  }
  if (leaks.length) {
    console.error("Private artwork found in the working tree or outgoing Git history:");
    console.error([...new Set(leaks)].map((path) => `  ${path}`).join("\n"));
    console.error("Keep originals in ignored internal/artwork/, out of the Git index and public asset folders. Remove them from unpublished history before pushing; deleting only the latest copy is insufficient.");
    process.exit(1);
  }
  console.log("Artwork privacy check passed.");
}
