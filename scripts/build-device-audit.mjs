import { build } from 'esbuild';
import { mkdir, copyFile, readdir } from 'node:fs/promises';

const output = 'output/playwright/device-audit';
await mkdir(output, { recursive: true });
await build({ entryPoints: ['scripts/device-audit/harness.tsx'], outfile: `${output}/bundle.js`, bundle: true, format: 'iife', platform: 'browser', define: { 'process.env.NODE_ENV': '"production"' }, loader: { '.css': 'empty' } });
for (const name of ['index.html', 'probe.html', 'glass.html']) await copyFile(`scripts/device-audit/${name}`, `${output}/${name}`);
const assets = '.output/chrome-mv3/assets';
const stylesheet = (await readdir(assets)).find(name => /^SimulatorApp.*\.css$/.test(name));
if (!stylesheet) throw new Error('Build the extension first: npm run build');
await copyFile(`${assets}/${stylesheet}`, `${output}/style.css`);
console.log('Device audit built. Run python3 scripts/device-audit/serve.py, open http://127.0.0.1:5190/?all and click Measure.');
