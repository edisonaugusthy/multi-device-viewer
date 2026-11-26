import { describe, expect, it } from "vitest";
import { isLocalDevelopmentHost, isLocalDevelopmentUrl } from "./local-site";

describe("local development addresses", () => {
  it("accepts this computer, private networks and reserved test names", () => {
    for (const url of ["http://localhost:3000/a", "http://LOCALHOST./", "https://app.localhost/", "http://127.0.0.1:8080", "http://127.1/", "http://[::1]:5173/", "http://0.0.0.0:8000",
      "http://192.168.1.20/", "http://10.0.0.5:3000", "http://172.16.4.1", "http://172.31.255.1", "http://printer.local", "https://shop.test/cart"]) {
      expect(isLocalDevelopmentUrl(url), url).toBe(true);
    }
    expect(isLocalDevelopmentHost("[::1]")).toBe(true);
  });
  it("leaves public sites, cloud metadata addresses and other schemes alone", () => {
    for (const url of ["https://example.com", "https://localhost.example.com", "http://172.32.0.1", "http://8.8.8.8", "http://192.169.1.1", "http://169.254.169.254/latest",
      "https://test", "https://mylocal", "file:///tmp/index.html", "chrome://settings", "not a url"]) {
      expect(isLocalDevelopmentUrl(url), url).toBe(false);
    }
  });
});
