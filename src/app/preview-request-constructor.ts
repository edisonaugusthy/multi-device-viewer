import { previewRequestName, untagPreviewRequest } from "../domain/simulator/preview-request";

/** Tag before Chrome creates a body, rather than reconstructing a body stream
 * at fetch time. Native Request cloning, multipart encoding, bodyUsed, aborts,
 * keepalive and streaming behavior then remain the browser's responsibility.
 */
export function setupPreviewRequestConstructor(name: string, tag: (url: string) => string) {
  const NativeRequest = window.Request;
  const descriptor = Object.getOwnPropertyDescriptor(NativeRequest.prototype, "url")!;
  const requestUrl = descriptor.get!;
  const requestBody = Object.getOwnPropertyDescriptor(NativeRequest.prototype, "body")!.get!;
  const rawUrl = (input: unknown): string | undefined => {
    try { return requestUrl.call(input); } catch { return undefined; }
  };
  const TaggedRequest = new Proxy(NativeRequest, {
    construct(target, args, newTarget) {
      if (!args.length) return Reflect.construct(target, args, newTarget);
      const url = rawUrl(args[0]);
      if (url === undefined) {
        args[0] = tag(String(args[0]));
      } else if (previewRequestName(url) !== name && requestBody.call(args[0]) === null) {
        // A foreign GET Request has no upload to disturb. Let the native
        // constructor merge init only once, after retargeting the empty body.
        args[0] = new NativeRequest(tag(url), args[0]);
      }
      // Own Requests already carry the marker, including native clones.
      // Foreign body-bearing Requests stay native and get the coverage notice.
      return Reflect.construct(target, args, newTarget);
    },
  });
  Object.defineProperty(NativeRequest.prototype, "url", {
    ...descriptor,
    get() { return untagPreviewRequest(requestUrl.call(this)); },
  });
  Object.defineProperty(NativeRequest.prototype, "constructor", { ...Object.getOwnPropertyDescriptor(NativeRequest.prototype, "constructor"), value: TaggedRequest });
  window.Request = TaggedRequest;
  return { rawUrl, hasBody: (request: Request) => requestBody.call(request) !== null, active: () => window.Request === TaggedRequest };
}
