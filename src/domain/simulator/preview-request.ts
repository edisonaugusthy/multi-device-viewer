/** Chrome hides fragment directives from location/hash, and never sends them to the server.
 * Keep the site's hash route and any text directive intact. DNR can still match the
 * request URL, including this directive, before Chrome strips it for the page.
 */
export const PREVIEW_FRAME_NAME = /^mdv-(?:mobile-)?preview-[\w-]{1,160}$/;
const PREFIX = "mdv-device=";

export function tagPreviewRequest(value: string, name: string, base?: string): string {
  if (!PREVIEW_FRAME_NAME.test(name)) return value;
  try {
    const url = new URL(value, base);
    if (!/^https?:$/.test(url.protocol)) return value;
    const [hash, ...tail] = url.hash.slice(1).split(":~:");
    const directives = tail.join(":~:").split("&").filter(part => part && !part.startsWith(PREFIX));
    url.hash = `${hash}:~:${PREFIX}${name}&${directives.join("&")}`;
    return url.href;
  } catch { return value; }
}

export function previewRequestName(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol)) return undefined;
    const directive = url.hash.split(":~:")[1];
    const name = directive?.split("&").find(part => part.startsWith(PREFIX))?.slice(PREFIX.length);
    return name && PREVIEW_FRAME_NAME.test(name) ? name : undefined;
  } catch { return undefined; }
}

export const previewRequestFilter = (name: string) => `#*:~:${PREFIX}${name}&`;

/** Hide only our transport marker from public Request/navigation URL getters. */
export function untagPreviewRequest(value: string): string {
  if (!previewRequestName(value)) return value;
  const url = new URL(value);
  const [hash, ...tail] = url.hash.slice(1).split(":~:");
  const directives = tail.join(":~:").split("&").filter(part => part && !part.startsWith(PREFIX));
  url.hash = directives.length ? `${hash}:~:${directives.join("&")}` : hash;
  return url.href;
}
