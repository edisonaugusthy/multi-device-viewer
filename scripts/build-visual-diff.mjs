import wabt from "wabt";
import { readFile, writeFile, mkdir } from "node:fs/promises";

const toolkit = await wabt();
const source = new URL("../src/domain/visual-regression/pixel-diff.wat", import.meta.url);
const module = toolkit.parseWat("pixel-diff.wat", await readFile(source, "utf8"), { simd: true, bulk_memory: true, multi_value: true });
try {
  module.resolveNames();
  module.validate();
  const { buffer } = module.toBinary({ write_debug_names: false });
  const destination = new URL("../public/wasm/pixel-diff.wasm", import.meta.url);
  await mkdir(new URL(".", destination), { recursive: true });
  await writeFile(destination, buffer);
  console.log(`Built pixel-diff.wasm (${buffer.length} bytes)`);
} finally { module.destroy(); }
