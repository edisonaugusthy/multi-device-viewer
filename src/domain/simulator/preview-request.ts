/** Chrome hides fragment directives from location/hash, and never sends them to the server.
 * Keep the site's hash route and any text directive intact. DNR can still match the
 * request URL, including this directive, before Chrome strips it for the page.
 */
import { PREVIEW_FRAME_NAME } from "./preview-identity";
export { PREVIEW_FRAME_NAME };
const PREFIX = "mdv-device=";
/** A document's marker may also carry the device for the page's scripts (see identityToken). */
const IDENTITY = "mdv-id=";
const ours = (part: string) => part.startsWith(PREFIX) || part.startsWith(IDENTITY);

export function tagPreviewRequest(value: string, name: string, base?: string, identity?: string): string {
  if (!PREVIEW_FRAME_NAME.test(name)) return value;
  try {
    const url = new URL(value, base);
    if (!/^https?:$/.test(url.protocol)) return value;
    const [hash, ...tail] = url.hash.slice(1).split(":~:");
    const directives = tail.join(":~:").split("&").filter(part => part && !ours(part));
    const own = identity && /^[\w-]+$/.test(identity) ? `${PREFIX}${name}&${IDENTITY}${identity}&` : `${PREFIX}${name}&`;
    url.hash = `${hash}:~:${own}${directives.join("&")}`;
    return url.href;
  } catch { return value; }
}

/** The identity token on a tagged document URL, if it carries one. */
export function previewRequestIdentity(value: string): string | undefined {
  try {
    const directive = new URL(value).hash.split(":~:")[1];
    const token = directive?.split("&").find(part => part.startsWith(IDENTITY))?.slice(IDENTITY.length);
    return token && /^[\w-]+$/.test(token) ? token : undefined;
  } catch { return undefined; }
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
  const directives = tail.join(":~:").split("&").filter(part => part && !ours(part));
  url.hash = directives.length ? `${hash}:~:${directives.join("&")}` : hash;
  return url.href;
}
