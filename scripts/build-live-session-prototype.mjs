import { build } from "esbuild";
import { mkdir, copyFile, writeFile } from "node:fs/promises";
const outdir = "output/live-session-prototype";
await mkdir(outdir, { recursive: true });
await build({ entryPoints: ["prototypes/live-session/background.ts", "prototypes/live-session/compare.ts"], bundle: true, outdir, format: "iife", target: "chrome140" });
for (const file of ["compare.html", "compare.css"]) await copyFile(`prototypes/live-session/${file}`, `${outdir}/${file}`);
await writeFile(`${outdir}/manifest.json`, JSON.stringify({ manifest_version: 3, name: "Mobile View Lab — Live Session Check", version: "0.1.0", description: "Local experimental comparison of the current live document at multiple widths.", permissions: ["debugger", "activeTab"], background: { service_worker: "background.js" }, action: { default_title: "Compare this live session" } }, null, 2) + "\n");
console.log(`Isolated prototype built in ${outdir}; debugger is absent from production manifests.`);
