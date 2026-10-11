// Artwork stays in ignored internal/artwork/. Builds need the raster mockups;
// authoring commands also need editable drawings and raw captures.
import { access, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const privateArtworkDirectory = fileURLToPath(new URL("../internal/artwork/", import.meta.url));

export const privateArtworkPath = (...parts) => join(privateArtworkDirectory, ...parts);

export async function requirePrivateArtwork(...parts) {
  const path = privateArtworkPath(...parts);
  try { await access(path); }
  catch {
    throw new Error(`Private artwork input is unavailable: ${parts.join("/")}. `
      + "Restore the owner's artwork sources into ignored internal/artwork/. "
      + "Builds need private mockup exports; authoring also needs originals.");
  }
  return path;
}

export async function privateArtworkFolder(...parts) {
  const path = privateArtworkPath(...parts);
  await mkdir(path, { recursive: true, mode: 0o700 });
  return path;
}
