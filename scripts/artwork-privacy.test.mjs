import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import { test } from "node:test";
import { outgoingHistoryLeaks, workingTreeLeaks } from "./check-artwork-privacy.mjs";

test("public copies of private mockups, logo masters and raw captures are detected", () => {
  const cwd = mkdtempSync(join(tmpdir(), "mdv-artwork-files-"));
  try {
    execFileSync("git", ["init", "--quiet"], { cwd });
    const files = ["public/icons/icon.svg", "store-assets/source/captures/website/workspace.png", "public/mockups/device.webp", "website/public/frames/device.webp"];
    mkdirSync(join(cwd, "public/icons"), { recursive: true });
    mkdirSync(join(cwd, "store-assets/source/captures/website"), { recursive: true });
    mkdirSync(join(cwd, "public/mockups"), { recursive: true });
    mkdirSync(join(cwd, "website/public/frames"), { recursive: true });
    writeFileSync(join(cwd, ".gitignore"), files.join("\n") + "\n");
    for (const file of files) writeFileSync(join(cwd, file), "private master");
    assert.deepEqual(workingTreeLeaks(cwd).sort(), files.sort());
  } finally { rmSync(cwd, { recursive: true, force: true }); }
});

test("a later deletion cannot hide a private master from an outgoing push", () => {
  const cwd = mkdtempSync(join(tmpdir(), "mdv-artwork-privacy-"));
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
  try {
    git("init", "--quiet");
    git("config", "user.name", "Privacy test");
    git("config", "user.email", "test@example.invalid");
    git("commit", "--quiet", "--allow-empty", "-m", "Public base");
    const base = git("rev-parse", "HEAD");
    mkdirSync(join(cwd, "scripts/device-frames"), { recursive: true });
    const file = "scripts/device-frames/device-art.mjs";
    writeFileSync(join(cwd, file), "private drawing");
    writeFileSync(join(cwd, ".gitignore"), file + "\n");
    assert.deepEqual(workingTreeLeaks(cwd), [file]);
    git("add", "--force", file);
    git("commit", "--quiet", "-m", "Private input");
    git("rm", "--quiet", file);
    git("commit", "--quiet", "-m", "Remove input");
    assert.deepEqual(workingTreeLeaks(cwd), []);
    const head = git("rev-parse", "HEAD");
    assert.deepEqual(outgoingHistoryLeaks(cwd, head, base), [file]);
    assert.deepEqual(outgoingHistoryLeaks(cwd, head, head), []);
    assert.deepEqual(outgoingHistoryLeaks(cwd, "0".repeat(40), head), []);
  } finally { rmSync(cwd, { recursive: true, force: true }); }
});

test("internal originals are allowed locally but rejected when force-added or pushed", () => {
  const cwd = mkdtempSync(join(tmpdir(), "mdv-internal-artwork-"));
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
  try {
    git("init", "--quiet");
    git("config", "user.name", "Privacy test");
    git("config", "user.email", "test@example.invalid");
    writeFileSync(join(cwd, ".gitignore"), "internal/\n");
    git("add", ".gitignore");
    git("commit", "--quiet", "-m", "Ignore internal sources");
    const base = git("rev-parse", "HEAD");
    const file = "internal/artwork/scripts/device-frames/device-art.mjs";
    mkdirSync(join(cwd, "internal/artwork/scripts/device-frames"), { recursive: true });
    writeFileSync(join(cwd, file), "private drawing");
    assert.equal(git("check-ignore", file), file);
    assert.deepEqual(workingTreeLeaks(cwd), []);
    git("add", "--force", file);
    assert.deepEqual(workingTreeLeaks(cwd), [file]);
    git("commit", "--quiet", "-m", "Accidental force-add");
    git("rm", "--quiet", file);
    git("commit", "--quiet", "-m", "Remove private file");
    assert.deepEqual(workingTreeLeaks(cwd), []);
    const leaks = outgoingHistoryLeaks(cwd, git("rev-parse", "HEAD"), base);
    assert.ok(leaks.includes(file));
    assert.ok(leaks.every((path) => path.startsWith("internal/")));
  } finally { rmSync(cwd, { recursive: true, force: true }); }
});
