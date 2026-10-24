import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupPreviewRequestConstructor } from "./preview-request-constructor";
import { previewRequestName, tagPreviewRequest } from "../domain/simulator/preview-request";

const NativeRequest = Request;
const urlDescriptor = Object.getOwnPropertyDescriptor(NativeRequest.prototype, "url")!;
const constructorDescriptor = Object.getOwnPropertyDescriptor(NativeRequest.prototype, "constructor")!;
const name = "mdv-preview-phone";
const url = "https://example.test/api?signature=a%2Bb#/route:~:text=hello";
describe("native Request uploads with device headers", () => {
  beforeEach(() => vi.stubGlobal("window", { Request: NativeRequest }));
  afterEach(() => {
    Object.defineProperty(NativeRequest.prototype, "url", urlDescriptor);
    Object.defineProperty(NativeRequest.prototype, "constructor", constructorDescriptor);
    vi.unstubAllGlobals();
  });
  const setup = () => setupPreviewRequestConstructor(name, value => tagPreviewRequest(value, name));
  it("tags the internal URL without exposing the marker or consuming the body", async () => {
    const hook = setup();
    const request = new window.Request(url, { method: "POST", body: "unchanged bytes", keepalive: true, credentials: "include" });
    expect(request.url).toBe(url);
    expect(previewRequestName(hook.rawUrl(request)!)).toBe(name);
    expect(request.bodyUsed).toBe(false);
    expect(request.keepalive).toBe(true);
    expect(request.credentials).toBe("include");
    expect(await request.text()).toBe("unchanged bytes");
    expect(request.bodyUsed).toBe(true);
    await expect(request.text()).rejects.toThrow();
  });
  it("retains native clone and inherited Request behavior", async () => {
    const hook = setup();
    const original = new window.Request(url, { method: "POST", body: "clone bytes" });
    const clone = original.clone();
    const derived = new window.Request(original, { headers: { "x-test": "retained" } });
    expect(original.bodyUsed).toBe(true);
    for (const request of [clone, derived]) {
      expect(request.url).toBe(url);
      expect(request instanceof window.Request).toBe(true);
      expect(request.constructor).toBe(window.Request);
      expect(previewRequestName(hook.rawUrl(request)!)).toBe(name);
      expect(await request.text()).toBe("clone bytes");
    }
    expect(derived.headers.get("x-test")).toBe("retained");
  });
  it("keeps multipart boundaries, filenames and duplicate fields consistent", async () => {
    setup();
    const data = new FormData();
    data.append("field", "one"); data.append("field", "two");
    data.append("file", new File(["contents"], "example.txt", { type: "text/plain" }));
    const request = new window.Request(url, { method: "POST", body: data });
    const decoded = await request.formData();
    expect(decoded.getAll("field")).toEqual(["one", "two"]);
    expect((decoded.get("file") as File).name).toBe("example.txt");
    expect(await (decoded.get("file") as File).text()).toBe("contents");
  });
  it("keeps abort signals and native streaming bodies, without buffering", () => {
    const hook = setup();
    const abort = new AbortController();
    const stream = new ReadableStream<Uint8Array>();
    const request = new window.Request(url, { method: "POST", body: stream, duplex: "half", signal: abort.signal } as RequestInit);
    expect(request.body).toBe(stream);
    expect(stream.locked).toBe(false);
    expect(request.bodyUsed).toBe(false);
    expect(previewRequestName(hook.rawUrl(request)!)).toBe(name);
    abort.abort("test reason");
    expect(request.signal.aborted).toBe(true);
    expect(request.signal.reason).toBe("test reason");
  });
  it("preserves subclassing and leaves pre-existing bodies for the native fallback", async () => {
    const foreign = new NativeRequest(url, { method: "POST", body: "pre-existing body" });
    const hook = setup();
    class AppRequest extends window.Request {}
    const own = new AppRequest(url, { method: "POST", body: "own body" });
    expect(own instanceof AppRequest).toBe(true);
    expect(own.constructor).toBe(AppRequest);
    expect(previewRequestName(hook.rawUrl(own)!)).toBe(name);
    const inherited = new window.Request(foreign);
    expect(previewRequestName(hook.rawUrl(inherited)!)).toBeUndefined();
    expect(await inherited.text()).toBe("pre-existing body");
  });
});
